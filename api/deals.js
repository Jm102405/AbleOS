// api/deals.js
// Deal pipeline. Notion holds the deal identity (name, address, source),
// Supabase holds the workflow state (stage, when it moved, who moved it).
//
// GET    /api/deals    list deals with their current stage
// PATCH  /api/deals    move a deal to a different stage
//
// Every request must carry a valid Supabase session as a Bearer token.
// The caller's role comes from the profiles table, never from the request body.

import { Client } from "@notionhq/client";
import { createClient } from "@supabase/supabase-js";
import { requireUser } from "../lib/apiAuth.js";

const DEALS_DB = "3a397b1c96b680e8af62f3a34a5c6a02";

// Must stay identical to the check constraint on public.deal_stages.
const STAGES = [
    "intake",
    "underwriting",
    "awaiting_docs",
    "docs_complete",
    "final_review",
    "proof_of_funds",
    "awaiting_signatures",
    "under_contract",
    "post_contract",
    "closed",
    "dead",
    "find_a_buyer",
];

// Import residue, not live deals.
const EXCLUDED_CATEGORY = "Orphaned - source tab";

// "dane" is here so you can test the board. Tighten to ["raj"] before handover.
const ALLOWED_COCKPITS = ["raj", "dane"];

let cachedSupabase = null;
let cachedNotion = null;
let cachedDataSourceId = null;

function getSupabase() {
    if (cachedSupabase) return cachedSupabase;

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;

    if (!url) throw new Error("SUPABASE_URL is not set");
    if (!key) throw new Error("SUPABASE_SECRET_KEY is not set");

    cachedSupabase = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
    });

    return cachedSupabase;
}

function getNotion() {
    if (cachedNotion) return cachedNotion;
    if (!process.env.NOTION_API_KEY) throw new Error("NOTION_API_KEY is not set");
    cachedNotion = new Client({ auth: process.env.NOTION_API_KEY });
    return cachedNotion;
}

async function getDataSourceId() {
    if (cachedDataSourceId) return cachedDataSourceId;
    const notion = getNotion();
    const db = await notion.databases.retrieve({ database_id: DEALS_DB });
    cachedDataSourceId = db.data_sources[0].id;
    return cachedDataSourceId;
}

function plain(prop) {
    if (!prop) return "";
    if (prop.type === "title") return prop.title.map((t) => t.plain_text).join("");
    if (prop.type === "rich_text") {
        return prop.rich_text.map((t) => t.plain_text).join("");
    }
    if (prop.type === "select") return prop.select?.name ?? "";
    return "";
}

function daysBetween(iso) {
    if (!iso) return null;
    const ms = Date.now() - new Date(iso).getTime();
    return Math.max(0, Math.floor(ms / 86400000));
}

async function fetchNotionDeals() {
    const notion = getNotion();
    const dataSourceId = await getDataSourceId();

    const rows = [];
    let cursor;

    do {
        const page = await notion.dataSources.query({
            data_source_id: dataSourceId,
            page_size: 100,
            start_cursor: cursor,
        });
        rows.push(...page.results);
        cursor = page.has_more ? page.next_cursor : undefined;
    } while (cursor);

    return rows
        .map((row) => ({
            id: row.id,
            name: plain(row.properties["Deal Name"]) || "Untitled deal",
            address: plain(row.properties["Address"]),
            source: plain(row.properties["Deal Source"]) || "Unassigned",
            category: plain(row.properties["Category"]),
            notes: plain(row.properties["Notes"]),
        }))
        .filter((deal) => deal.category !== EXCLUDED_CATEGORY);
}

export default async function handler(req, res) {
    // ---- Authenticate before anything else ----
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
        return res.status(403).json({ error: "No access to the deal pipeline" });
    }

    try {
        const supabase = getSupabase();

        /* ---- LIST ---- */
        if (req.method === "GET") {
            const deals = await fetchNotionDeals();

            const { data: rows, error } = await supabase
                .from("deal_stages")
                .select("notion_page_id, stage, stage_changed_at, moved_by");

            if (error) throw new Error(error.message);

            const byId = new Map((rows ?? []).map((r) => [r.notion_page_id, r]));

            const merged = deals.map((deal) => {
                const state = byId.get(deal.id);
                return {
                    ...deal,
                    stage: state?.stage ?? "intake",
                    stageChangedAt: state?.stage_changed_at ?? null,
                    movedBy: state?.moved_by ?? null,
                    daysInStage: daysBetween(state?.stage_changed_at),
                };
            });

            return res.status(200).json({ deals: merged, stages: STAGES });
        }

        /* ---- MOVE ---- */
        if (req.method === "PATCH") {
            const id = typeof req.body?.id === "string" ? req.body.id.trim() : "";
            const stage =
                typeof req.body?.stage === "string" ? req.body.stage.trim() : "";

            if (!id || id.length > 64) {
                return res.status(400).json({ error: "A valid deal id is required" });
            }
            if (!STAGES.includes(stage)) {
                return res.status(400).json({ error: "Unknown stage" });
            }

            const now = new Date().toISOString();

            const { error } = await supabase.from("deal_stages").upsert(
                {
                    notion_page_id: id,
                    stage,
                    stage_changed_at: now,
                    moved_by: profile.cockpit,
                    updated_at: now,
                },
                { onConflict: "notion_page_id" },
            );

            if (error) throw new Error(error.message);

            return res.status(200).json({ ok: true, id, stage, stageChangedAt: now });
        }

        res.setHeader("Allow", "GET, PATCH");
        return res.status(405).json({ error: "Method not allowed" });
    } catch (err) {
        console.error("deals error:", err);
        return res.status(500).json({ error: "Could not load deals" });
    }
}