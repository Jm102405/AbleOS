// api/tasks.js
//
// GET   /api/tasks            Raj sees what he assigned; staff see their own
// POST  /api/tasks            Raj assigns a task
// PATCH /api/tasks            assignee (or Raj) updates status
//
// Roles come from the verified session, never from the request body.

import { createClient } from "@supabase/supabase-js";
import { requireUser, requireCockpit } from "../lib/apiAuth.js";

const ASSIGNEES = ["dane", "karen", "jeremiah", "colton", "zo"];
const TYPES = ["Task", "Feature"];
const PRIORITIES = ["Low", "Normal", "Urgent"];
const STATUSES = ["Not started", "In progress", "Blocked", "Done"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_FLOW_STEPS = 12;

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

function optionalText(value, max) {
    if (value === undefined || value === null) return null;
    const trimmed = String(value).trim();
    if (!trimmed) return null;
    return trimmed.slice(0, max);
}

/** Keeps only well-formed { from, to, action } rows. */
function cleanFlowSteps(value) {
    if (!Array.isArray(value)) return [];

    return value
        .slice(0, MAX_FLOW_STEPS)
        .map((step) => ({
            from: optionalText(step?.from, 80) ?? "",
            to: optionalText(step?.to, 80) ?? "",
            action: optionalText(step?.action, 300) ?? "",
        }))
        .filter((step) => step.from || step.to || step.action);
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
            let query = supabase
                .from("tasks")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(100);

            if (profile.cockpit === "raj") {
                query = query.eq("created_by", "raj");
            } else {
                query = query.eq("assigned_to", profile.cockpit);
            }

            const { data, error } = await query;
            if (error) throw error;

            return res.status(200).json({ tasks: data ?? [] });
        }

        /* ---- CREATE ---- */
        if (req.method === "POST") {
            requireCockpit(profile, ["raj"]);

            const {
                assignedTo,
                taskType,
                title,
                description,
                definitionOfDone,
                referenceLink,
                flowSteps,
                flowNotes,
                priority,
                dueDate,
            } = req.body || {};

            if (!ASSIGNEES.includes(assignedTo)) {
                return res
                    .status(400)
                    .json({ error: `Assign to must be one of ${ASSIGNEES.join(", ")}` });
            }

            const type = taskType || "Task";
            if (!TYPES.includes(type)) {
                return res.status(400).json({ error: "Task type must be Task or Feature" });
            }

            const cleanTitle = cleanText(title, 200);
            if (!cleanTitle) {
                return res
                    .status(400)
                    .json({ error: "Title is required (max 200 characters)" });
            }

            const cleanDescription = cleanText(description, 5000);
            if (!cleanDescription) {
                return res
                    .status(400)
                    .json({ error: "Description is required (max 5000 characters)" });
            }

            const level = priority || "Normal";
            if (!PRIORITIES.includes(level)) {
                return res
                    .status(400)
                    .json({ error: `Priority must be one of ${PRIORITIES.join(", ")}` });
            }

            if (dueDate && !DATE_RE.test(String(dueDate))) {
                return res.status(400).json({ error: "Due date must be YYYY-MM-DD" });
            }

            const { data, error } = await supabase
                .from("tasks")
                .insert({
                    assigned_to: assignedTo,
                    created_by: profile.cockpit,
                    task_type: type,
                    title: cleanTitle,
                    description: cleanDescription,
                    definition_of_done: optionalText(definitionOfDone, 2000),
                    reference_link: optionalText(referenceLink, 500),
                    flow_steps: cleanFlowSteps(flowSteps),
                    flow_notes: optionalText(flowNotes, 2000),
                    priority: level,
                    due_date: dueDate || null,
                })
                .select()
                .single();

            if (error) throw error;

            const { error: notifyError } = await supabase.from("notifications").insert({
                recipient: assignedTo,
                type: "task_assigned",
                title: `New ${type.toLowerCase()} from ${profile.full_name}`,
                body: cleanTitle,
                link: `/${assignedTo}`,
            });

            if (notifyError) {
                console.error("Failed to create notification:", notifyError);
            }

            return res.status(201).json({ task: data });
        }

        /* ---- UPDATE STATUS ---- */
        if (req.method === "PATCH") {
            const { id, status } = req.body || {};

            if (!id) return res.status(400).json({ error: "id is required" });
            if (!STATUSES.includes(status)) {
                return res
                    .status(400)
                    .json({ error: `Status must be one of ${STATUSES.join(", ")}` });
            }

            const { data: existing, error: findError } = await supabase
                .from("tasks")
                .select("*")
                .eq("id", id)
                .single();

            if (findError && findError.code !== "PGRST116") throw findError;
            if (!existing) return res.status(404).json({ error: "Task not found" });

            const canUpdate =
                profile.cockpit === existing.assigned_to || profile.cockpit === "raj";

            if (!canUpdate) {
                return res
                    .status(403)
                    .json({ error: "You don't have permission to update this task" });
            }

            const now = new Date().toISOString();

            const { data, error } = await supabase
                .from("tasks")
                .update({
                    status,
                    updated_at: now,
                    completed_at: status === "Done" ? now : null,
                })
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;

            // Tell Raj when work lands, unless he changed it himself.
            if (status === "Done" && profile.cockpit !== "raj") {
                const { error: notifyError } = await supabase
                    .from("notifications")
                    .insert({
                        recipient: existing.created_by,
                        type: "task_done",
                        title: `${profile.full_name} finished a ${existing.task_type.toLowerCase()}`,
                        body: existing.title,
                        link: "/raj",
                    });

                if (notifyError) {
                    console.error("Failed to create notification:", notifyError);
                }
            }

            return res.status(200).json({ task: data });
        }

        res.setHeader("Allow", "GET, POST, PATCH");
        return res.status(405).json({ error: "Method not allowed" });
    } catch (err) {
        if (err?.status) return res.status(err.status).json({ error: err.message });
        console.error("tasks error:", err);
        return res.status(500).json({ error: err.message || "Unknown server error" });
    }
}