// routes/leads.js
// Leads board.
//
// GET   /api/leads   list every lead, newest first
// POST  /api/leads   create one
// PATCH /api/leads   move a lead to another stage
//
// Identity comes from the verified session, never the request body.

import { createClient } from "@supabase/supabase-js";
import { requireUser } from "../lib/apiAuth.js";

const STAGES = ["New", "Contacted", "Qualified", "Docs submitted", "Dead"];

/** Who can work leads. Colton, Zo and Jeremiah have no reason to. */
const ALLOWED = ["raj", "dane", "karen", "rex"];

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

function cleanText(value, max) {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed || trimmed.length > max) return null;
    return trimmed;
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

    if (!ALLOWED.includes(profile.cockpit)) {
        return res.status(403).json({ error: "No access to leads" });
    }

    try {
        const supabase = getClient();

        /* ---- LIST ---- */
        if (req.method === "GET") {
            const { data, error } = await supabase
                .from("leads")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(500);

            if (error) throw error;

            return res.status(200).json({ leads: data ?? [], stages: STAGES });
        }

        /* ---- CREATE ---- */
        if (req.method === "POST") {
            const name = cleanText(req.body?.name, 200);

            if (!name) {
                return res
                    .status(400)
                    .json({ error: "A name is required (max 200 characters)" });
            }

            const optional = (value, max) =>
                req.body?.[value] ? cleanText(req.body[value], max) : null;

            const { data, error } = await supabase
                .from("leads")
                .insert({
                    name,
                    phone: optional("phone", 40),
                    email: optional("email", 200),
                    address: optional("address", 300),
                    source: optional("source", 100),
                    notes: optional("notes", 2000),
                    stage: "New",
                    created_by: profile.full_name,
                })
                .select()
                .single();

            if (error) throw error;

            return res.status(201).json({ lead: data });
        }

        /* ---- MOVE ---- */
        if (req.method === "PATCH") {
            const id = cleanText(req.body?.id, 64);
            const stage = req.body?.stage;

            if (!id) return res.status(400).json({ error: "id is required" });
            if (!STAGES.includes(stage)) {
                return res
                    .status(400)
                    .json({ error: `stage must be one of ${STAGES.join(", ")}` });
            }

            const now = new Date().toISOString();

            const { data, error } = await supabase
                .from("leads")
                .update({ stage, stage_changed_at: now, updated_at: now })
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            if (!data) return res.status(404).json({ error: "Lead not found" });

            return res.status(200).json({ lead: data });
        }

        res.setHeader("Allow", "GET, POST, PATCH");
        return res.status(405).json({ error: "Method not allowed" });
    } catch (err) {
        console.error("leads error:", err);
        return res
            .status(500)
            .json({ error: err.message || "Unknown server error" });
    }
}