// api/daily-tasks.js
// Self-created daily tasks. Distinct from api/tasks.js, which is Raj
// assigning work to other people.
//
// GET    /api/daily-tasks?state=in_progress            list open tasks
// GET    /api/daily-tasks?state=completed&date=YYYY-MM-DD
// POST   /api/daily-tasks                              create (owned by caller)
// PATCH  /api/daily-tasks                              complete or reopen
//
// Ownership always comes from the verified session. Raj may read anyone's.

import { createClient } from "@supabase/supabase-js";
import { requireUser } from "../lib/apiAuth.js";
import { sendPush } from "../lib/sendPush.js";

/**
 * Days are grouped in one fixed timezone so Dane and Raj always agree which
 * day a task belongs to. Times are rendered in each viewer's own clock on the
 * client - only the bucketing is fixed.
 */
const BUSINESS_TZ = "America/Chicago";

const PRIORITIES = ["Urgent", "Not urgent"];
const STATES = ["draft", "in_progress", "completed"];
const OWNERS = ["dane", "karen", "jeremiah", "colton", "zo", "raj"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Who gets told about task activity. */
const WATCHER = "raj";

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

/** YYYY-MM-DD for "now" in the business timezone. */
function businessDate(date = new Date()) {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: BUSINESS_TZ,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);
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

        /* ---- LIST ---- */
        if (req.method === "GET") {
            // Only Raj may look at someone else's list.
            const requested = String(req.query?.owner || "").trim();
            const owner =
                profile.cockpit === "raj" && requested ? requested : profile.cockpit;

            if (!OWNERS.includes(owner)) {
                return res.status(400).json({ error: "Unknown owner" });
            }
            if (owner !== profile.cockpit && profile.cockpit !== "raj") {
                return res.status(403).json({ error: "Not your task list" });
            }

            const { state, date } = req.query || {};

            let query = supabase
                .from("daily_tasks")
                .select("*")
                .eq("owner_cockpit", owner)
                .limit(200);

            // Drafts are private to whoever wrote them. Raj sees started work only.
            if (owner !== profile.cockpit) {
                query = query.neq("state", "draft");
            }

            if (state) {
                if (!STATES.includes(state)) {
                    return res.status(400).json({ error: "Unknown state" });
                }
                query = query.eq("state", state);
            }

            if (date) {
                if (!DATE_RE.test(date)) {
                    return res.status(400).json({ error: "date must be YYYY-MM-DD" });
                }
                query = query.eq("completed_on", date);
            }

            query =
                state === "completed"
                    ? query.order("completed_at", { ascending: false })
                    : query.order("created_at", { ascending: false });

            const { data: tasks, error } = await query;
            if (error) throw error;

            // Attach evidence metadata. Signed URLs are minted separately, only
            // when someone actually opens a task.
            let files = [];
            if (tasks?.length) {
                const { data: fileRows, error: fileError } = await supabase
                    .from("daily_task_files")
                    .select("id, task_id, file_name, mime_type, size_bytes, created_at")
                    .in(
                        "task_id",
                        tasks.map((task) => task.id),
                    );

                if (fileError) throw fileError;
                files = fileRows ?? [];
            }

            const byTask = new Map();
            for (const file of files) {
                const list = byTask.get(file.task_id) ?? [];
                list.push(file);
                byTask.set(file.task_id, list);
            }

            // Counted separately so the KPI stays right regardless of any filter.
            const { count, error: countError } = await supabase
                .from("daily_tasks")
                .select("id", { count: "exact", head: true })
                .eq("owner_cockpit", owner)
                .eq("state", "in_progress");

            if (countError) throw countError;

            return res.status(200).json({
                tasks: (tasks ?? []).map((task) => ({
                    ...task,
                    files: byTask.get(task.id) ?? [],
                })),
                inProgressCount: count ?? 0,
                today: businessDate(),
            });
        }

        /* ---- CREATE ---- */
        if (req.method === "POST") {
            if (!OWNERS.includes(profile.cockpit)) {
                return res.status(403).json({ error: "No task list for this cockpit" });
            }

            const title = cleanText(req.body?.title, 200);
            if (!title) {
                return res
                    .status(400)
                    .json({ error: "Task name is required (max 200 characters)" });
            }

            const description = req.body?.description
                ? cleanText(req.body.description, 2000)
                : null;

            const isDraft = req.body?.state === "draft";
            const priority = req.body?.priority || "Not urgent";
            if (!PRIORITIES.includes(priority)) {
                return res
                    .status(400)
                    .json({ error: `priority must be one of ${PRIORITIES.join(", ")}` });
            }

            const { data, error } = await supabase
                .from("daily_tasks")
                .insert({
                    owner_cockpit: profile.cockpit,
                    title,
                    description,
                    priority,
                    state: isDraft ? "draft" : "in_progress",
                    created_on: businessDate(),
                })
                .select()
                .single();

            if (error) throw error;

            if (!isDraft && profile.cockpit !== WATCHER) {
                const link = `/${WATCHER}?danetask=${data.id}`;

                const { error: notifyError } = await supabase
                    .from("notifications")
                    .insert({
                        recipient: WATCHER,
                        type: "daily_task_created",
                        title: `${profile.full_name} created a new task`,
                        body: title,
                        link,
                    });

                if (notifyError) {
                    console.error("Failed to create notification:", notifyError);
                }

                await sendPush(WATCHER, {
                    title: `${profile.full_name} created a new task`,
                    body: title,
                    url: link,
                    // Same tag so a burst of new tasks collapses on the lock screen.
                    tag: "daily-tasks",
                });
            }

            return res.status(201).json({ task: { ...data, files: [] } });
        }

        /* ---- COMPLETE or REOPEN ---- */
        if (req.method === "PATCH") {
            const id = cleanText(req.body?.id, 64);
            const action = req.body?.action;

            if (!id) return res.status(400).json({ error: "id is required" });
            if (!["complete", "reopen", "publish"].includes(action)) {
                return res
                    .status(400)
                    .json({ error: "action must be complete, reopen or publish" });
            }

            const { data: existing, error: findError } = await supabase
                .from("daily_tasks")
                .select("*")
                .eq("id", id)
                .single();

            if (findError && findError.code !== "PGRST116") throw findError;
            if (!existing) return res.status(404).json({ error: "Task not found" });

            // Only the owner changes their own tasks. Raj acting as someone else
            // passes this because apiAuth swaps his cockpit.
            if (existing.owner_cockpit !== profile.cockpit) {
                return res.status(403).json({ error: "Not your task" });
            }

            if (action === "publish" && existing.state !== "draft") {
                return res.status(400).json({ error: "That task is not a draft" });
            }

            const now = new Date();
            const note = req.body?.note ? cleanText(req.body.note, 2000) : null;

            const patch =
                action === "complete"
                    ? {
                        state: "completed",
                        completed_at: now.toISOString(),
                        completed_on: businessDate(now),
                        completion_note: note,
                        updated_at: now.toISOString(),
                    }
                    : action === "publish"
                        ? {
                            // Starting a draft resets the clock - the work begins now,
                            // not whenever the note was first jotted down.
                            state: "in_progress",
                            created_at: now.toISOString(),
                            created_on: businessDate(now),
                            completed_at: null,
                            completed_on: null,
                            updated_at: now.toISOString(),
                        }
                        : {
                            state: "in_progress",
                            completed_at: null,
                            completed_on: null,
                            updated_at: now.toISOString(),
                        };

            const { data, error } = await supabase
                .from("daily_tasks")
                .update(patch)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;

            const notify =
                action === "complete"
                    ? {
                        type: "daily_task_done",
                        headline: `${profile.full_name} completed a task`,
                    }
                    : action === "publish"
                        ? {
                            type: "daily_task_created",
                            headline: `${profile.full_name} created a new task`,
                        }
                        : null;

            if (notify && profile.cockpit !== WATCHER) {
                const link = `/${WATCHER}?danetask=${id}`;

                const { error: notifyError } = await supabase
                    .from("notifications")
                    .insert({
                        recipient: WATCHER,
                        type: notify.type,
                        title: notify.headline,
                        body: existing.title,
                        link,
                    });

                if (notifyError) {
                    console.error("Failed to create notification:", notifyError);
                }

                await sendPush(WATCHER, {
                    title: notify.headline,
                    body: existing.title,
                    url: link,
                    tag: "daily-tasks",
                });
            }

            return res.status(200).json({ task: data });
        }

        res.setHeader("Allow", "GET, POST, PATCH");
        return res.status(405).json({ error: "Method not allowed" });
    } catch (err) {
        console.error("daily-tasks error:", err);
        return res
            .status(500)
            .json({ error: err.message || "Unknown server error" });
    }
}