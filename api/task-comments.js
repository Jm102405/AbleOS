// api/task-comments.js
//
// GET  /api/task-comments?taskId=...   messages on one task
// GET  /api/task-comments?counts=1     { [taskId]: count } for visible tasks
// POST /api/task-comments              { taskId, body }
//
// Only the task's assignee or its creator can read or post. Author identity is
// taken from the verified session, never from the request.

import { createClient } from "@supabase/supabase-js";
import { requireUser } from "../lib/apiAuth.js";
import { sendPush } from "../lib/sendPush.js";

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

/** Tasks this cockpit is a party to - either assigned or created. */
async function visibleTaskIds(supabase, cockpit) {
    const { data, error } = await supabase
        .from("tasks")
        .select("id")
        .or(`assigned_to.eq.${cockpit},created_by.eq.${cockpit}`);

    if (error) throw error;
    return (data ?? []).map((row) => row.id);
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

        /* ---- COUNTS for the task list ---- */
        if (req.method === "GET" && req.query?.counts) {
            const ids = await visibleTaskIds(supabase, profile.cockpit);
            if (!ids.length) return res.status(200).json({ counts: {} });

            const { data, error } = await supabase
                .from("task_comments")
                .select("task_id")
                .in("task_id", ids);

            if (error) throw error;

            const counts = {};
            for (const row of data ?? []) {
                counts[row.task_id] = (counts[row.task_id] || 0) + 1;
            }

            return res.status(200).json({ counts });
        }

        /* ---- ONE THREAD ---- */
        if (req.method === "GET") {
            const taskId = req.query?.taskId;
            if (!taskId) return res.status(400).json({ error: "taskId is required" });

            const { data: task, error: taskError } = await supabase
                .from("tasks")
                .select("assigned_to, created_by")
                .eq("id", taskId)
                .single();

            if (taskError && taskError.code !== "PGRST116") throw taskError;
            if (!task) return res.status(404).json({ error: "Task not found" });

            if (
                task.assigned_to !== profile.cockpit &&
                task.created_by !== profile.cockpit
            ) {
                return res.status(403).json({ error: "Not your conversation" });
            }

            const { data, error } = await supabase
                .from("task_comments")
                .select("*")
                .eq("task_id", taskId)
                .order("created_at", { ascending: true })
                .limit(500);

            if (error) throw error;

            return res.status(200).json({ comments: data ?? [] });
        }

        /* ---- POST a message ---- */
        if (req.method === "POST") {
            const { taskId, body } = req.body || {};

            if (!taskId) return res.status(400).json({ error: "taskId is required" });

            const text = typeof body === "string" ? body.trim() : "";
            if (!text) return res.status(400).json({ error: "Message is empty" });
            if (text.length > 2000) {
                return res.status(400).json({ error: "Message is too long" });
            }

            const { data: task, error: taskError } = await supabase
                .from("tasks")
                .select("id, title, assigned_to, created_by")
                .eq("id", taskId)
                .single();

            if (taskError && taskError.code !== "PGRST116") throw taskError;
            if (!task) return res.status(404).json({ error: "Task not found" });

            if (
                task.assigned_to !== profile.cockpit &&
                task.created_by !== profile.cockpit
            ) {
                return res.status(403).json({ error: "Not your conversation" });
            }

            const { data, error } = await supabase
                .from("task_comments")
                .insert({
                    task_id: taskId,
                    author_cockpit: profile.cockpit,
                    author_name: profile.full_name,
                    body: text,
                })
                .select()
                .single();

            if (error) throw error;

            // Tell the other party, whichever side that is.
            const other =
                profile.cockpit === task.assigned_to ? task.created_by : task.assigned_to;

            if (other && other !== profile.cockpit) {
                const { error: notifyError } = await supabase
                    .from("notifications")
                    .insert({
                        recipient: other,
                        type: "task_comment",
                        title: `${profile.full_name} commented on ${task.title}`,
                        body: text.slice(0, 140),
                        link: `/${other}`,
                    });

                if (notifyError) {
                    console.error("Failed to create notification:", notifyError);
                }

                await sendPush(other, {
                    title: `${profile.full_name}: ${task.title}`,
                    body: text.slice(0, 140),
                    url: `/${other}`,
                    // Same tag per task, so a burst of messages replaces rather than stacks.
                    tag: `task-${taskId}`,
                });
            }

            return res.status(201).json({ comment: data });
        }

        res.setHeader("Allow", "GET, POST");
        return res.status(405).json({ error: "Method not allowed" });
    } catch (err) {
        console.error("task-comments error:", err);
        return res
            .status(500)
            .json({ error: err.message || "Unknown server error" });
    }
}