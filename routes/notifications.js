// api/notifications.js
//
// GET   /api/notifications?unreadOnly=true   list for the signed-in user
// PATCH /api/notifications                  { id } or { markAllRead: true }
//
// Recipient always comes from the verified session, so nobody can read or
// clear someone else's notifications by guessing an id.

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

    const { profile } = caller;

    try {
        const supabase = getClient();

        /* ---- LIST ---- */
        if (req.method === "GET") {
            const { unreadOnly } = req.query || {};

            let query = supabase
                .from("notifications")
                .select("*")
                .eq("recipient", profile.cockpit)
                .order("created_at", { ascending: false })
                .limit(30);

            if (unreadOnly === "true") {
                query = query.is("read_at", null);
            }

            const { data, error } = await query;
            if (error) throw error;

            // Counted separately so the badge stays correct despite the limit above.
            const { count, error: countError } = await supabase
                .from("notifications")
                .select("id", { count: "exact", head: true })
                .eq("recipient", profile.cockpit)
                .is("read_at", null);

            if (countError) throw countError;

            return res.status(200).json({
                notifications: data ?? [],
                unreadCount: count ?? 0,
            });
        }

        /* ---- MARK READ ---- */
        if (req.method === "PATCH") {
            const { id, markAllRead } = req.body || {};
            const now = new Date().toISOString();

            if (markAllRead) {
                const { error } = await supabase
                    .from("notifications")
                    .update({ read_at: now })
                    .eq("recipient", profile.cockpit)
                    .is("read_at", null);

                if (error) throw error;
                return res.status(200).json({ success: true });
            }

            if (!id) {
                return res.status(400).json({ error: "id or markAllRead is required" });
            }

            const { data, error } = await supabase
                .from("notifications")
                .update({ read_at: now })
                .eq("id", id)
                .eq("recipient", profile.cockpit)
                .select()
                .single();

            if (error && error.code !== "PGRST116") throw error;
            if (!data) {
                return res.status(404).json({ error: "Notification not found" });
            }

            return res.status(200).json({ notification: data });
        }

        res.setHeader("Allow", "GET, PATCH");
        return res.status(405).json({ error: "Method not allowed" });
    } catch (err) {
        console.error("notifications error:", err);
        return res
            .status(500)
            .json({ error: err.message || "Unknown server error" });
    }
}