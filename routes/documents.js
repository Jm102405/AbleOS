// routes/documents.js
// Every document Ellery is moving, from requested through to filed.
//
// GET   /api/documents          list, newest movement first
// POST  /api/documents          request a new document
// PATCH /api/documents          move a stage, or fill in details

import { createClient } from "@supabase/supabase-js";
import { requireUser } from "../lib/apiAuth.js";

const STAGES = [
    "requested",
    "draft",
    "internal_review",
    "out_for_signature",
    "executed",
    "filed",
    "cancelled",
];

/** Anyone here can see the list and request a document. */
const ALLOWED_COCKPITS = ["ellery", "raj", "dane", "rex"];

/** Only these can move a document along - the pipeline is Ellery's job. */
const CAN_MOVE = ["ellery", "raj", "dane"];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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

function date(value) {
    if (typeof value !== "string" || !DATE_RE.test(value.trim())) return null;
    return value.trim();
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
        return res.status(403).json({ error: "No access to documents" });
    }

    try {
        const supabase = getClient();

        /* ---- LIST ---- */
        if (req.method === "GET") {
            const { data, error } = await supabase
                .from("documents")
                .select("*")
                .order("stage_changed_at", { ascending: false })
                .limit(300);

            if (error) throw new Error(error.message);

            return res.status(200).json({ documents: data ?? [], stages: STAGES });
        }

        /* ---- REQUEST ONE ---- */
        if (req.method === "POST") {
            const dealName = clean(req.body?.dealName, 200);
            const docType = clean(req.body?.docType, 120);

            if (!dealName) {
                return res.status(400).json({ error: "A deal name is required" });
            }
            if (!docType) {
                return res
                    .status(400)
                    .json({ error: "What kind of document is it? e.g. LOI, PSA" });
            }

            const { data, error } = await supabase
                .from("documents")
                .insert({
                    deal_id: clean(req.body?.dealId, 64),
                    deal_name: dealName,
                    doc_type: docType,
                    stage: "requested",
                    due_on: date(req.body?.dueOn),
                    counterparty: clean(req.body?.counterparty, 200),
                    notes: clean(req.body?.notes, 2000),
                    // Both taken from the verified session, never the request body.
                    requested_by: profile.full_name,
                    created_by: profile.cockpit,
                })
                .select()
                .single();

            if (error) throw new Error(error.message);

            return res.status(201).json({ document: data });
        }

        /* ---- MOVE OR EDIT ---- */
        if (req.method === "PATCH") {
            const id = clean(req.body?.id, 64);
            if (!id) return res.status(400).json({ error: "id is required" });

            const patch = { updated_at: new Date().toISOString() };

            if (req.body?.stage !== undefined) {
                if (!CAN_MOVE.includes(profile.cockpit)) {
                    return res
                        .status(403)
                        .json({ error: "Only Ellery can move a document along" });
                }
                if (!STAGES.includes(req.body.stage)) {
                    return res.status(400).json({ error: "Unknown stage" });
                }
                patch.stage = req.body.stage;
                patch.stage_changed_at = new Date().toISOString();
            }

            if (req.body?.dueOn !== undefined) patch.due_on = date(req.body.dueOn);
            if (req.body?.counterparty !== undefined) {
                patch.counterparty = clean(req.body.counterparty, 200);
            }
            if (req.body?.fileUrl !== undefined) {
                patch.file_url = clean(req.body.fileUrl, 600);
            }
            if (req.body?.notes !== undefined) {
                patch.notes = clean(req.body.notes, 2000);
            }

            const { data, error } = await supabase
                .from("documents")
                .update(patch)
                .eq("id", id)
                .select()
                .single();

            if (error && error.code !== "PGRST116") throw new Error(error.message);
            if (!data) return res.status(404).json({ error: "Document not found" });

            return res.status(200).json({ document: data });
        }

        res.setHeader("Allow", "GET, POST, PATCH");
        return res.status(405).json({ error: "Method not allowed" });
    } catch (err) {
        console.error("documents error:", err);
        return res.status(500).json({ error: "Could not load documents" });
    }
}