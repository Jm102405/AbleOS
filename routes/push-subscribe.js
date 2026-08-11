// api/push-subscribe.js
//
// POST   /api/push-subscribe   save this device's push subscription
// DELETE /api/push-subscribe   remove it (user turned notifications off)
//
// Subscriptions are filed against the caller's OWN cockpit, never the one
// they might be viewing as an admin - otherwise Raj browsing Karen's
// dashboard would register his phone as hers.

import { createClient } from "@supabase/supabase-js";
import { requireUser } from "../lib/apiAuth.js";

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

export default async function handler(req, res) {
    let caller;
    try {
        caller = await requireUser(req);
    } catch (err) {
        return res
            .status(err?.status || 401)
            .json({ error: err?.message || "Not authorised" });
    }

    const { user, profile } = caller;
    const ownCockpit = profile.realCockpit || profile.cockpit;

    try {
        const supabase = getClient();

        /* ---- REGISTER ---- */
        if (req.method === "POST") {
            const { endpoint, keys, userAgent } = req.body || {};

            if (!endpoint || !keys?.p256dh || !keys?.auth) {
                return res
                    .status(400)
                    .json({ error: "endpoint and keys are required" });
            }

            const { error } = await supabase.from("push_subscriptions").upsert(
                {
                    user_id: user.id,
                    cockpit: ownCockpit,
                    endpoint,
                    p256dh: keys.p256dh,
                    auth: keys.auth,
                    user_agent: typeof userAgent === "string" ? userAgent.slice(0, 300) : null,
                    last_used_at: new Date().toISOString(),
                },
                { onConflict: "endpoint" },
            );

            if (error) throw error;

            return res.status(200).json({ success: true });
        }

        /* ---- UNREGISTER ---- */
        if (req.method === "DELETE") {
            const { endpoint } = req.body || {};
            if (!endpoint) {
                return res.status(400).json({ error: "endpoint is required" });
            }

            // Scoped to this user, so nobody can unsubscribe someone else's phone.
            const { error } = await supabase
                .from("push_subscriptions")
                .delete()
                .eq("endpoint", endpoint)
                .eq("user_id", user.id);

            if (error) throw error;

            return res.status(200).json({ success: true });
        }

        res.setHeader("Allow", "POST, DELETE");
        return res.status(405).json({ error: "Method not allowed" });
    } catch (err) {
        console.error("push-subscribe error:", err);
        return res
            .status(500)
            .json({ error: err.message || "Unknown server error" });
    }
}