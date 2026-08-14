// routes/subscription-intake.js
// Machine endpoint. n8n posts one email from able@ here and it updates
// the card for that service.
//
// POST /api/subscription-intake
//
// Unlike deals, subscriptions are stateful: the newest email is the truth.
// A receipt supersedes a renewal notice, a failed payment supersedes both.
// So incoming values win, and old ones only fill gaps.

import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";
import { extractSubscription } from "../lib/extractSubscription.js";

const MAX_EXCERPT = 2000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const STATUSES = [
    "active",
    "renewal_due",
    "payment_failed",
    "expired",
    "cancelled",
    "trial",
];

let cachedClient = null;

function getClient() {
    if (cachedClient) return cachedClient;

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;

    if (!url) throw new Error("SUPABASE_URL is not set");
    if (!key) throw new Error("SUPABASE_SECRET_KEY is not set");

    cachedClient = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
    });

    return cachedClient;
}

function secretMatches(supplied) {
    const expected = process.env.DEAL_INTAKE_SECRET;
    if (!expected || typeof supplied !== "string") return false;

    const a = Buffer.from(supplied);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;

    return timingSafeEqual(a, b);
}

function clean(value, max) {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    return trimmed.slice(0, max);
}

function num(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

/** Only accept a date the model actually read off the page. */
function date(value) {
    if (typeof value !== "string" || !DATE_RE.test(value.trim())) return null;
    const parsed = new Date(value.trim());
    return Number.isNaN(parsed.getTime()) ? null : value.trim();
}

/** One card per vendor. "Vercel Inc." and "vercel" are the same company. */
function vendorKeyFor(vendor) {
    if (typeof vendor !== "string") return null;

    const key = vendor
        .toLowerCase()
        .replace(/\b(inc|llc|ltd|limited|corp|corporation|com|io)\b/g, " ")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    return key.length >= 2 ? key : null;
}

/** The newer email wins; the old value only survives if there's no new one. */
function prefer(incoming, existing) {
    if (incoming !== null && incoming !== undefined && incoming !== "") {
        return incoming;
    }
    return existing;
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ error: "Method not allowed" });
    }

    if (!secretMatches(req.headers["x-intake-secret"])) {
        return res.status(401).json({ error: "Not authorised" });
    }

    const messageId = clean(req.body?.messageId, 200);
    const subject = clean(req.body?.subject, 300);

    if (!messageId) {
        return res.status(400).json({ error: "messageId is required" });
    }

    try {
        const supabase = getClient();

        /* ---- Already read? ---- */
        const { data: seen } = await supabase
            .from("subscription_messages")
            .select("subscription_id")
            .eq("message_id", messageId)
            .maybeSingle();

        if (seen) {
            return res.status(200).json({ ok: true, duplicate: true });
        }

        const from = clean(req.body?.from, 300);
        const body = clean(req.body?.body, MAX_EXCERPT);

        const receivedAt = req.body?.receivedAt
            ? new Date(req.body.receivedAt)
            : new Date();

        const receivedIso = Number.isNaN(receivedAt.getTime())
            ? new Date().toISOString()
            : receivedAt.toISOString();

        /* ---- What is it? ---- */
        const read = await extractSubscription({ from, subject, body });

        // Couldn't read it. Don't log the message id, so a later run retries.
        if (!read) {
            return res.status(200).json({ ok: true, unread: true });
        }

        const vendor = clean(read.vendor, 120);
        const vendorKey = vendorKeyFor(vendor);

        // Not a subscription email. Log it so we never pay to read it again,
        // but keep it out of the table - Dane only wants services here.
        if (read.is_subscription !== true || !vendor || !vendorKey) {
            await supabase
                .from("subscription_messages")
                .insert({ message_id: messageId, subscription_id: null });

            return res.status(200).json({ ok: true, ignored: true });
        }

        const status = STATUSES.includes(read.status) ? read.status : "active";
        const now = new Date().toISOString();

        const incoming = {
            plan: clean(read.plan, 120),
            amount: num(read.amount),
            currency: clean(read.currency, 8),
            billing_cycle: clean(read.billing_cycle, 20),
            renews_at: date(read.renews_at),
            last_paid_at: date(read.last_paid_at),
            invoice_url: clean(read.invoice_url, 600),
            notes: clean(read.notes, 1000),
        };

        /* ---- Update the card for this vendor, or create it ---- */
        // limit(1) rather than maybeSingle: if two emails for the same vendor
        // ever race and create two rows, maybeSingle errors and we would keep
        // creating more. This degrades quietly instead.
        const { data: matches } = await supabase
            .from("subscriptions")
            .select("*")
            .eq("vendor_key", vendorKey)
            .order("created_at", { ascending: true })
            .limit(1);

        const existing = matches?.[0] ?? null;

        if (existing) {
            const { error } = await supabase
                .from("subscriptions")
                .update({
                    vendor,
                    plan: prefer(incoming.plan, existing.plan),
                    amount: prefer(incoming.amount, existing.amount),
                    currency: prefer(incoming.currency, existing.currency),
                    billing_cycle: prefer(incoming.billing_cycle, existing.billing_cycle),
                    status,
                    renews_at: prefer(incoming.renews_at, existing.renews_at),
                    last_paid_at: prefer(incoming.last_paid_at, existing.last_paid_at),
                    invoice_url: prefer(incoming.invoice_url, existing.invoice_url),
                    notes: prefer(incoming.notes, existing.notes),
                    email_from: from,
                    email_subject: subject,
                    email_received_at: receivedIso,
                    email_excerpt: body,
                    email_count: (existing.email_count ?? 1) + 1,
                    extracted: read,
                    updated_at: now,
                })
                .eq("id", existing.id);

            if (error) throw new Error(error.message);

            await supabase
                .from("subscription_messages")
                .insert({ message_id: messageId, subscription_id: existing.id });

            return res
                .status(200)
                .json({ ok: true, id: existing.id, vendor, status, merged: true });
        }

        const { data: created, error } = await supabase
            .from("subscriptions")
            .insert({
                vendor,
                vendor_key: vendorKey,
                ...incoming,
                status,
                email_from: from,
                email_subject: subject,
                email_received_at: receivedIso,
                email_excerpt: body,
                email_count: 1,
                extracted: read,
            })
            .select("id")
            .single();

        // Another request created this vendor a moment ago. Not an error -
        // fold this email into whichever row won the race.
        if (error?.code === "23505") {
            const { data: winner } = await supabase
                .from("subscriptions")
                .select("id")
                .eq("vendor_key", vendorKey)
                .limit(1);

            const winnerId = winner?.[0]?.id ?? null;

            if (winnerId) {
                await supabase
                    .from("subscription_messages")
                    .insert({ message_id: messageId, subscription_id: winnerId });

                return res
                    .status(200)
                    .json({ ok: true, id: winnerId, vendor, status, merged: true });
            }
        }

        if (error) throw new Error(error.message);

        await supabase
            .from("subscription_messages")
            .insert({ message_id: messageId, subscription_id: created.id });

        return res.status(201).json({ ok: true, id: created.id, vendor, status });
    } catch (err) {
        console.error("subscription-intake error:", err);
        return res.status(500).json({ error: "Could not record the email" });
    }
}