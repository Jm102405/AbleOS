// routes/deal-intake.js
// Machine endpoint. n8n posts one email here and it becomes a draft deal.
//
// POST /api/deal-intake
//
// There is no user session behind this call, so it authenticates with a
// shared secret in a header. It can only ever create drafts - a deal cannot
// reach Raj's board from here without a person confirming it first.

import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";
import { extractDeal } from "../lib/extractDeal.js";

const MAX_EXCERPT = 2000;

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

/**
 * Constant-time compare. A plain === leaks the secret one character at a
 * time to anyone patient enough to measure the response.
 */
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

/** Postgres numerics reject NaN and Infinity, so filter them out here. */
function num(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ error: "Method not allowed" });
    }

    if (!secretMatches(req.headers["x-intake-secret"])) {
        ;
        // Deliberately vague. Don't tell a prober whether the header was
        // missing, malformed or simply wrong.
        return res.status(401).json({ error: "Not authorised" });
    }

    const messageId = clean(req.body?.messageId, 200);
    const subject = clean(req.body?.subject, 300);

    if (!messageId) {
        return res.status(400).json({ error: "messageId is required" });
    }

    try {
        const supabase = getClient();

        const receivedAt = req.body?.receivedAt
            ? new Date(req.body.receivedAt)
            : new Date();

        // Seen this email before? Skip the model call entirely - re-running a
        // backfill shouldn't cost money to re-read the same messages.
        const { data: existing } = await supabase
            .from("pipeline_deals")
            .select("id")
            .eq("email_message_id", messageId)
            .maybeSingle();

        if (existing) {
            return res.status(200).json({ ok: true, duplicate: true });
        }

        const from = clean(req.body?.from, 300);
        const body = clean(req.body?.body, MAX_EXCERPT);

        // Ask Claude what this is. A null means the call failed - we still
        // store the email, just unfilled, so an outage never loses a deal.
        const read = await extractDeal({ from, subject, body });

        // Confidently not a deal? File it rather than putting it in front of
        // Raj. The row stays, so the same email can't come back and you can
        // audit what the model binned.
        const autoDismissed =
            read && read.is_deal === false && (read.confidence ?? 0) >= 0.8;

        const { data, error } = await supabase
            .from("pipeline_deals")
            .insert({
                name:
                    clean(read?.deal_name, 200) || subject || "Untitled deal from email",
                address: clean(read?.address, 300),
                source: clean(read?.source, 100),
                notes: clean(read?.notes, 2000),
                purchase_price: num(read?.purchase_price),
                monthly_cash_flow: num(read?.monthly_cash_flow),
                dscr: num(read?.dscr),
                extracted: read ?? null,
                stage: "docs_submitted",
                origin: "email",
                email_message_id: messageId,
                email_from: from,
                email_subject: subject,
                email_received_at: Number.isNaN(receivedAt.getTime())
                    ? new Date().toISOString()
                    : receivedAt.toISOString(),
                email_excerpt: body,
                confirmed: false,
                dismissed_at: autoDismissed ? new Date().toISOString() : null,
                dismissed_by: autoDismissed ? "claude" : null,
            })
            .select("id")
            .single();

        if (error) {
            // 23505 is a unique violation - n8n replayed an email we already have.
            // That's success as far as the caller is concerned.
            if (error.code === "23505") {
                return res.status(200).json({ ok: true, duplicate: true });
            }
            throw new Error(error.message);
        }

        return res.status(201).json({
            ok: true,
            id: data.id,
            isDeal: read?.is_deal ?? null,
            dismissed: Boolean(autoDismissed),
        });
    } catch (err) {
        console.error("deal-intake error:", err);
        return res.status(500).json({ error: "Could not record the email" });
    }
}