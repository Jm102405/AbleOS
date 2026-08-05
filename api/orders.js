// api/orders.js
// Orders / approval requests, stored in Supabase.
// Every request must carry a valid Supabase session as a Bearer token.
// The caller's role comes from the profiles table, never from the request body.

import { createClient } from "@supabase/supabase-js";
import { requireUser, requireCockpit } from "../lib/apiAuth.js";
import { sendPush } from "../lib/sendPush.js";

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

        if (req.method === "GET") {
            requireCockpit(profile, ["raj", "dane"]);

            const { status } = req.query || {};

            let query = supabase
                .from("orders")
                .select("*")
                .order("created_at", { ascending: false });

            if (profile.cockpit === "dane") {
                query = query.eq("requested_by", profile.full_name);
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

        if (req.method === "POST") {
            requireCockpit(profile, ["dane"]);

            const { orderName, description, dateNeeded, priority, estimatedCost } =
                req.body || {};

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
                    requested_by: profile.full_name,
                })
                .select()
                .single();

            if (error) throw error;

            // Failing to notify shouldn't fail the order, so log rather than throw.
            const { error: notifyError } = await supabase.from("notifications").insert({
                recipient: "raj",
                type: "order_created",
                title: `New order from ${profile.full_name}`,
                body: data.order_name,
                link: `/raj?order=${data.id}`,
                order_id: data.id,
            });

            if (notifyError) {
                console.error("Failed to create notification:", notifyError);
            }

            await sendPush("raj", {
                title: `New order from ${profile.full_name}`,
                body: data.order_name,
                url: `/raj?order=${data.id}`,
            });

            return res.status(201).json({ order: data });
        }

        if (req.method === "PATCH") {
            requireCockpit(profile, ["raj"]);

            const { id, status } = req.body || {};

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
                    decided_by: profile.full_name,
                })
                .eq("id", id)
                .eq("status", "Pending")
                .select()
                .single();

            if (error && error.code !== "PGRST116") throw error;

            if (!data) {
                return res
                    .status(409)
                    .json({ error: "That order was already decided or doesn't exist" });
            }

            const { error: decideNotifyError } = await supabase
                .from("notifications")
                .insert({
                    // Only Dane can create orders, so he's always the requester.
                    recipient: "dane",
                    type: "order_decided",
                    title: `Order ${status.toLowerCase()} by ${profile.full_name}`,
                    body: data.order_name,
                    link: `/dane?order=${data.id}`,
                    order_id: data.id,
                });

            if (decideNotifyError) {
                console.error("Failed to create notification:", decideNotifyError);
            }

            await sendPush("dane", {
                title: `Order ${status.toLowerCase()} by ${profile.full_name}`,
                body: data.order_name,
                url: `/dane?order=${data.id}`,
            });
            return res.status(200).json({ order: data });
        }

        res.setHeader("Allow", "GET, POST, PATCH");
        return res.status(405).json({ error: "Method not allowed" });
    } catch (err) {
        if (err?.status) {
            return res.status(err.status).json({ error: err.message });
        }

        console.error("orders error:", err);
        return res.status(500).json({ error: err.message || "Unknown server error" });
    }
}