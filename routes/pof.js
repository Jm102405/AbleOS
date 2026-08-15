// routes/pof.js
// The proof of funds desk. Cornelius is outside the company and sits on
// both sides of the table, so this endpoint is built as a keyhole: it
// returns a hand-listed set of fields for deals at one stage, and nothing
// else. Never spread a database row into the response here.
//
// GET   /api/pof   deals waiting on a letter
// PATCH /api/pof   set the details (Raj), or record the letter (Cornelius)

import { createClient } from "@supabase/supabase-js";
import { requireUser } from "../lib/apiAuth.js";

/** Everyone here can see the POF queue. */
const ALLOWED_COCKPITS = ["cornelius", "raj", "dane"];

/** Only these can set the amount, entity and close date. */
const CAN_SET_DETAILS = ["raj", "dane"];

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

function num(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function date(value) {
    if (typeof value !== "string" || !DATE_RE.test(value.trim())) return null;
    return value.trim();
}

/**
 * The whole security model of this file. Cash flow, DSCR, the email
 * excerpt and Claude's reasoning all stay behind - if Cornelius wants
 * more comfort, that's a phone call, not a screen.
 */
function forCornelius(row) {
    return {
        id: row.id,
        name: row.name,
        address: row.address,
        purchasePrice: row.purchase_price,
        pofAmount: row.pof_amount,
        buyerEntity: row.buyer_entity,
        targetCloseDate: row.target_close_date,
        pofLetterUrl: row.pof_letter_url,
        pofIssuedAt: row.pof_issued_at,
        pofIssuedBy: row.pof_issued_by,
        pofNotes: row.pof_notes,
        stageChangedAt: row.stage_changed_at,
    };
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
        return res.status(403).json({ error: "No access to proof of funds" });
    }

    try {
        const supabase = getClient();

        /* ---- THE QUEUE ---- */
        if (req.method === "GET") {
            const { data, error } = await supabase
                .from("pipeline_deals")
                .select("*")
                .eq("stage", "proof_of_funds")
                .eq("confirmed", true)
                .is("dismissed_at", null)
                .order("stage_changed_at", { ascending: true })
                .limit(100);

            if (error) throw new Error(error.message);

            return res.status(200).json({ deals: (data ?? []).map(forCornelius) });
        }

        if (req.method === "PATCH") {
            const id = clean(req.body?.id, 64);
            const action = req.body?.action;

            if (!id) return res.status(400).json({ error: "id is required" });

            const now = new Date().toISOString();

            /* ---- RAJ SETS WHAT CORNELIUS NEEDS ---- */
            if (action === "details") {
                if (!CAN_SET_DETAILS.includes(profile.cockpit)) {
                    return res
                        .status(403)
                        .json({ error: "Only Raj sets the POF details" });
                }

                const { data, error } = await supabase
                    .from("pipeline_deals")
                    .update({
                        pof_amount: num(req.body?.pofAmount),
                        buyer_entity: clean(req.body?.buyerEntity, 200),
                        target_close_date: date(req.body?.targetCloseDate),
                        updated_at: now,
                    })
                    .eq("id", id)
                    .select()
                    .single();

                if (error && error.code !== "PGRST116") throw new Error(error.message);
                if (!data) return res.status(404).json({ error: "Deal not found" });

                return res.status(200).json({ deal: forCornelius(data) });
            }

            /* ---- THE LETTER IS DONE ---- */
            if (action === "issued") {
                const { data, error } = await supabase
                    .from("pipeline_deals")
                    .update({
                        pof_letter_url: clean(req.body?.letterUrl, 600),
                        pof_notes: clean(req.body?.notes, 1000),
                        pof_issued_at: now,
                        pof_issued_by: profile.full_name,
                        updated_at: now,
                    })
                    .eq("id", id)
                    .eq("stage", "proof_of_funds")
                    .select()
                    .single();

                if (error && error.code !== "PGRST116") throw new Error(error.message);
                if (!data) {
                    return res
                        .status(409)
                        .json({ error: "That deal has moved on from proof of funds" });
                }

                // Note what is NOT here: the stage stays put. Recording a letter
                // is not the same as advancing the pipeline, and an outside party
                // should never be able to do the latter.
                return res.status(200).json({ deal: forCornelius(data) });
            }

            return res
                .status(400)
                .json({ error: "action must be details or issued" });
        }

        res.setHeader("Allow", "GET, PATCH");
        return res.status(405).json({ error: "Method not allowed" });
    } catch (err) {
        console.error("pof error:", err);
        return res.status(500).json({ error: "Could not load proof of funds" });
    }
}