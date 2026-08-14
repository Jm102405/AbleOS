// routes/subscriptions.js
// What Able Buys Homes pays for, and whether anything needs attention.
//
// GET   /api/subscriptions   list every service, worst state first
// PATCH /api/subscriptions   correct a status or add a note by hand

import { createClient } from "@supabase/supabase-js";
import { requireUser } from "../lib/apiAuth.js";

const STATUSES = [
    "active",
    "renewal_due",
    "payment_failed",
    "expired",
    "cancelled",
    "trial",
];

const ALLOWED_COCKPITS = ["dane", "raj"];

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

function clean(value, max) {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    return trimmed.slice(0, max);
}

export default async function handler(req, res) {
    let caller;
    try {
        caller = await requireUser(req);
    } catch (err) {
        return res
            .status(err?.status || 401)
            .json({ error: err?.message || "Not authorised" });
    }

    const { profile } = caller;

    if (!ALLOWED_COCKPITS.includes(profile.cockpit)) {
        return res.status(403).json({ error: "No access to subscriptions" });
    }

    try {
        const supabase = getClient();

        if (req.method === "GET") {
            const { data, error } = await supabase
                .from("subscriptions")
                .select("*")
                .order("updated_at", { ascending: false })
                .limit(300);

            if (error) throw new Error(error.message);

            return res.status(200).json({ subscriptions: data ?? [] });
        }

        if (req.method === "PATCH") {
            const id = clean(req.body?.id, 64);
            if (!id) return res.status(400).json({ error: "id is required" });

            const patch = { updated_at: new Date().toISOString() };

            if (req.body?.status !== undefined) {
                if (!STATUSES.includes(req.body.status)) {
                    return res.status(400).json({ error: "Unknown status" });
                }
                patch.status = req.body.status;
            }

            if (req.body?.notes !== undefined) {
                patch.notes = clean(req.body.notes, 1000);
            }

            const { data, error } = await supabase
                .from("subscriptions")
                .update(patch)
                .eq("id", id)
                .select()
                .single();

            if (error && error.code !== "PGRST116") throw new Error(error.message);
            if (!data) return res.status(404).json({ error: "Not found" });

            return res.status(200).json({ subscription: data });
        }

        res.setHeader("Allow", "GET, PATCH");
        return res.status(405).json({ error: "Method not allowed" });
    } catch (err) {
        console.error("subscriptions error:", err);
        return res.status(500).json({ error: "Could not load subscriptions" });
    }
}