// api/orders.js
// Orders / approval requests, stored in Supabase.
//
// GET    /api/orders?status=Pending   → list orders (newest first)
// POST   /api/orders                  → create an order (Dane)
// PATCH  /api/orders                  → approve or decline (Raj)
//
// Uses the Supabase secret key, so this must stay server-side only.
// Row Level Security is on with no policies, meaning this endpoint is the
// only way in or out of the table.

import { createClient } from "@supabase/supabase-js";

const PRIORITIES = ["Low", "Normal", "Urgent"];
const STATUSES = ["Pending", "Approved", "Declined"];
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

function cleanText(value, max) {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed || trimmed.length > max) return null;
    return trimmed;
}

export default async function handler(req, res) {
    try {
        const supabase = getClient();

        /* ── LIST ───────────────────────────────────────────── */
        if (req.method === "GET") {
            const { status, requestedBy } = req.query || {};

            let query = supabase
                .from("orders")
                .select("*")
                .order("created_at", { ascending: false });

            if (requestedBy) {
                query = query.eq("requested_by", requestedBy);
            }

            if (status) {
                if (!STATUSES.includes(status)) {
                    return res
                        .status(400)
                        .json({ error: `status must be one of ${STATUSES.join(", ")}` });
                }
                query = query.eq("status", status);
            }

            const { data, error } = await query;
            if (error) throw error;

            return res.status(200).json({ orders: data ?? [] });
        }

        /* ── CREATE ─────────────────────────────────────────── */
        if (req.method === "POST") {
            const {
                orderName,
                description,
                dateNeeded,
                priority,
                estimatedCost,
                requestedBy,
            } = req.body || {};

            const name = cleanText(orderName, 200);
            if (!name) {
                return res
                    .status(400)
                    .json({ error: "Order name is required (max 200 characters)" });
            }

            const desc = cleanText(description, 2000);
            if (!desc) {
                return res
                    .status(400)
                    .json({ error: "Description is required (max 2000 characters)" });
            }

            if (!DATE_RE.test(String(dateNeeded || ""))) {
                return res
                    .status(400)
                    .json({ error: "Date needed must be a valid date (YYYY-MM-DD)" });
            }

            const level = priority || "Normal";
            if (!PRIORITIES.includes(level)) {
                return res
                    .status(400)
                    .json({ error: `Priority must be one of ${PRIORITIES.join(", ")}` });
            }

            // Optional — blank, null and undefined all mean "no cost".
            let cost = null;
            if (
                estimatedCost !== undefined &&
                estimatedCost !== null &&
                String(estimatedCost).trim() !== ""
            ) {
                const parsed = Number(estimatedCost);
                if (!Number.isFinite(parsed) || parsed < 0) {
                    return res
                        .status(400)
                        .json({ error: "Estimated cost must be a number of 0 or more" });
                }
                cost = parsed;
            }

            const { data, error } = await supabase
                .from("orders")
                .insert({
                    order_name: name,
                    description: desc,
                    date_needed: dateNeeded,
                    priority: level,
                    estimated_cost: cost,
                    requested_by: cleanText(requestedBy, 100) || "Dane",
                })
                .select()
                .single();

            if (error) throw error;

            return res.status(201).json({ order: data });
        }

        /* ── DECIDE ─────────────────────────────────────────── */
        if (req.method === "PATCH") {
            const { id, status, decidedBy } = req.body || {};

            if (!id) return res.status(400).json({ error: "id is required" });

            if (status !== "Approved" && status !== "Declined") {
                return res
                    .status(400)
                    .json({ error: "status must be Approved or Declined" });
            }

            const { data, error } = await supabase
                .from("orders")
                .update({
                    status,
                    decided_at: new Date().toISOString(),
                    decided_by: cleanText(decidedBy, 100) || "Rishi",
                })
                .eq("id", id)
                .eq("status", "Pending") // only a pending order can be decided
                .select()
                .single();

            if (error) throw error;
            if (!data) {
                return res
                    .status(409)
                    .json({ error: "That order was already decided or doesn't exist" });
            }

            return res.status(200).json({ order: data });
        }

        res.setHeader("Allow", "GET, POST, PATCH");
        return res.status(405).json({ error: "Method not allowed" });
    } catch (err) {
        console.error("orders error:", err);
        return res.status(500).json({ error: err.message || "Unknown server error" });
    }
}