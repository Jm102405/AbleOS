// api/task-evidence.js
// Proof-of-completion files, stored in the private "task-evidence" bucket.
// A file belongs to exactly one parent: a daily task Dane created himself,
// or a task Raj assigned him.
//
// POST   /api/task-evidence   mint a signed upload URL
// PATCH  /api/task-evidence   record a file after the browser uploaded it
// GET    /api/task-evidence?taskId= or ?assignedTaskId=
// DELETE /api/task-evidence   remove a file
//
// The browser never holds the secret key. It receives a one-shot signed URL
// scoped to a single path, so it cannot write anywhere else in the bucket.

import { createClient } from "@supabase/supabase-js";
import { requireUser } from "../lib/apiAuth.js";
import { sendPush } from "../lib/sendPush.js";

const BUCKET = "task-evidence";
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_FILES_PER_TASK = 10;
const DOWNLOAD_TTL_SECONDS = 600;

/**
 * Mirrors the allowlist on the bucket itself. Checked here too so a bad
 * request fails with a clear message, and so the extension we store is never
 * taken from the user's filename.
 */
const MIME_EXTENSIONS = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
    "application/pdf": "pdf",
};

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

/** Kept only for display. The stored path never uses it. */
function safeDisplayName(value) {
    if (typeof value !== "string") return "attachment";
    const cleaned = value.trim().slice(0, 120).replace(/[^A-Za-z0-9._ -]/g, "");
    return cleaned || "attachment";
}

/**
 * Works out which task a request is about and who may touch it.
 * `uploader` is the single cockpit allowed to add or remove files.
 * `readers` may also view them. `notify` is told when a batch is submitted.
 */
async function resolveParent(supabase, source) {
    const taskId = String(source?.taskId || "").trim();
    const assignedTaskId = String(source?.assignedTaskId || "").trim();

    if (taskId && assignedTaskId) return { error: "Pass only one task id" };
    if (!taskId && !assignedTaskId) {
        return { error: "taskId or assignedTaskId is required" };
    }

    if (taskId) {
        const { data, error } = await supabase
            .from("daily_tasks")
            .select("id, owner_cockpit, title")
            .eq("id", taskId)
            .single();

        if (error && error.code !== "PGRST116") throw error;
        if (!data) return { error: "Task not found", status: 404 };

        return {
            kind: "daily",
            id: data.id,
            column: "task_id",
            prefix: `${data.owner_cockpit}/${data.id}/`,
            uploader: data.owner_cockpit,
            readers: [data.owner_cockpit, "raj"],
            notify: "raj",
            linkParam: "danetask",
            title: data.title,
        };
    }

    const { data, error } = await supabase
        .from("tasks")
        .select("id, assigned_to, created_by, title")
        .eq("id", assignedTaskId)
        .single();

    if (error && error.code !== "PGRST116") throw error;
    if (!data) return { error: "Task not found", status: 404 };

    return {
        kind: "assigned",
        id: data.id,
        column: "assigned_task_id",
        prefix: `assigned/${data.id}/`,
        uploader: data.assigned_to,
        readers: [data.assigned_to, data.created_by, "raj"],
        notify: data.created_by,
        linkParam: "task",
        title: data.title,
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

    try {
        const supabase = getClient();
        const source = req.method === "GET" ? req.query : req.body;

        /* ---- DELETE resolves its parent from the file row ---- */
        if (req.method === "DELETE") {
            const fileId = String(req.body?.fileId || req.query?.fileId || "").trim();
            if (!fileId) return res.status(400).json({ error: "fileId is required" });

            const { data: row, error: findError } = await supabase
                .from("daily_task_files")
                .select("id, task_id, assigned_task_id, storage_path")
                .eq("id", fileId)
                .single();

            if (findError && findError.code !== "PGRST116") throw findError;
            if (!row) return res.status(404).json({ error: "File not found" });

            const parent = await resolveParent(supabase, {
                taskId: row.task_id,
                assignedTaskId: row.assigned_task_id,
            });

            if (parent.error) {
                return res.status(parent.status || 400).json({ error: parent.error });
            }
            if (parent.uploader !== profile.cockpit) {
                return res.status(403).json({ error: "Not your task" });
            }

            const { error: removeError } = await supabase.storage
                .from(BUCKET)
                .remove([row.storage_path]);

            if (removeError) {
                console.error("Could not remove from storage:", removeError);
            }

            const { error } = await supabase
                .from("daily_task_files")
                .delete()
                .eq("id", fileId);

            if (error) throw error;

            return res.status(200).json({ success: true });
        }

        const parent = await resolveParent(supabase, source);
        if (parent.error) {
            return res.status(parent.status || 400).json({ error: parent.error });
        }

        /* ---- READ: signed download URLs ---- */
        if (req.method === "GET") {
            if (!parent.readers.includes(profile.cockpit)) {
                return res.status(403).json({ error: "Not your task" });
            }

            const { data: rows, error } = await supabase
                .from("daily_task_files")
                .select("*")
                .eq(parent.column, parent.id)
                .order("created_at", { ascending: true });

            if (error) throw error;

            const files = [];
            for (const row of rows ?? []) {
                const { data: signed, error: signError } = await supabase.storage
                    .from(BUCKET)
                    .createSignedUrl(row.storage_path, DOWNLOAD_TTL_SECONDS);

                if (signError) {
                    console.error("Could not sign", row.storage_path, signError);
                    continue;
                }

                files.push({
                    id: row.id,
                    fileName: row.file_name,
                    mimeType: row.mime_type,
                    sizeBytes: row.size_bytes,
                    url: signed.signedUrl,
                });
            }

            return res.status(200).json({ files });
        }

        // Everything below writes, so only the uploader may proceed.
        if (parent.uploader !== profile.cockpit) {
            return res.status(403).json({ error: "Not your task" });
        }

        /* ---- MINT an upload URL ---- */
        if (req.method === "POST") {
            const mimeType = String(req.body?.mimeType || "").trim();
            const sizeBytes = Number(req.body?.sizeBytes);

            const extension = MIME_EXTENSIONS[mimeType];
            if (!extension) {
                return res
                    .status(400)
                    .json({ error: "Only images and PDF files are allowed" });
            }
            if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
                return res.status(400).json({ error: "sizeBytes is required" });
            }
            if (sizeBytes > MAX_BYTES) {
                return res.status(400).json({ error: "That file is over 10 MB" });
            }

            const { count, error: countError } = await supabase
                .from("daily_task_files")
                .select("id", { count: "exact", head: true })
                .eq(parent.column, parent.id);

            if (countError) throw countError;
            if ((count ?? 0) >= MAX_FILES_PER_TASK) {
                return res
                    .status(400)
                    .json({ error: `Up to ${MAX_FILES_PER_TASK} files per task` });
            }

            // Path is built server side. The user's filename never touches it.
            const path = `${parent.prefix}${crypto.randomUUID()}.${extension}`;

            const { data, error } = await supabase.storage
                .from(BUCKET)
                .createSignedUploadUrl(path);

            if (error) throw error;

            return res.status(200).json({
                path,
                token: data.token,
                signedUrl: data.signedUrl,
            });
        }

        /* ---- RECORD an uploaded file ---- */
        if (req.method === "PATCH") {
            const path = String(req.body?.path || "").trim();
            const mimeType = String(req.body?.mimeType || "").trim();
            const sizeBytes = Number(req.body?.sizeBytes);

            if (!path) return res.status(400).json({ error: "path is required" });
            if (!MIME_EXTENSIONS[mimeType]) {
                return res.status(400).json({ error: "Unsupported file type" });
            }

            // The path must be one we issued for this exact task.
            if (!path.startsWith(parent.prefix)) {
                return res.status(400).json({ error: "Path does not match the task" });
            }

            const { data, error } = await supabase
                .from("daily_task_files")
                .insert({
                    [parent.column]: parent.id,
                    storage_path: path,
                    file_name: safeDisplayName(req.body?.fileName),
                    mime_type: mimeType,
                    size_bytes: Number.isFinite(sizeBytes) ? sizeBytes : 0,
                    uploaded_by: profile.cockpit,
                })
                .select("id, file_name, mime_type, size_bytes, created_at")
                .single();

            if (error) throw error;

            // The client flags the last file of a batch, so submitting five photos
            // sends one notification rather than five.
            if (req.body?.notify === true && parent.notify !== profile.cockpit) {
                const link = `/${parent.notify}?${parent.linkParam}=${parent.id}`;

                const { error: notifyError } = await supabase
                    .from("notifications")
                    .insert({
                        recipient: parent.notify,
                        type: "task_proof_added",
                        title: `${profile.full_name} attached proof`,
                        body: parent.title,
                        link,
                    });

                if (notifyError) {
                    console.error("Failed to create notification:", notifyError);
                }

                await sendPush(parent.notify, {
                    title: `${profile.full_name} attached proof`,
                    body: parent.title,
                    url: link,
                    tag: "task-proof",
                });
            }

            return res.status(201).json({ file: data });
        }

        res.setHeader("Allow", "GET, POST, PATCH, DELETE");
        return res.status(405).json({ error: "Method not allowed" });
    } catch (err) {
        console.error("task-evidence error:", err);
        return res
            .status(500)
            .json({ error: err.message || "Unknown server error" });
    }
}