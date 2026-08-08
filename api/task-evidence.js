// api/task-evidence.js
// Proof-of-completion files for daily tasks, stored in the private
// "task-evidence" Supabase Storage bucket.
//
// POST   /api/task-evidence   mint a signed upload URL
// PATCH  /api/task-evidence   record a file after the browser uploaded it
// GET    /api/task-evidence?taskId=   signed download URLs, short lived
// DELETE /api/task-evidence   remove a file
//
// The browser never holds the secret key. It receives a one-shot signed URL
// scoped to a single path, so it cannot write anywhere else in the bucket.

import { createClient } from "@supabase/supabase-js";
import { requireUser } from "../lib/apiAuth.js";

const BUCKET = "task-evidence";
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_FILES_PER_TASK = 10;
const DOWNLOAD_TTL_SECONDS = 600;

/**
 * Mirrors the allowlist on the bucket itself. Checked here too so a bad
 * request fails with a clear message instead of a storage error, and so the
 * extension we choose is never taken from the user's filename.
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
    const trimmed = value.trim().slice(0, 120);
    const cleaned = trimmed.replace(/[^A-Za-z0-9._ -]/g, "");
    return cleaned || "attachment";
}

async function loadTask(supabase, id) {
    const { data, error } = await supabase
        .from("daily_tasks")
        .select("id, owner_cockpit")
        .eq("id", id)
        .single();

    if (error && error.code !== "PGRST116") throw error;
    return data ?? null;
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

        /* ---- READ: signed download URLs ---- */
        if (req.method === "GET") {
            const taskId = String(req.query?.taskId || "").trim();
            if (!taskId) return res.status(400).json({ error: "taskId is required" });

            const task = await loadTask(supabase, taskId);
            if (!task) return res.status(404).json({ error: "Task not found" });

            // The owner, or Raj watching over it.
            if (task.owner_cockpit !== profile.cockpit && profile.cockpit !== "raj") {
                return res.status(403).json({ error: "Not your task" });
            }

            const { data: rows, error } = await supabase
                .from("daily_task_files")
                .select("*")
                .eq("task_id", taskId)
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

        /* ---- MINT an upload URL ---- */
        if (req.method === "POST") {
            const taskId = String(req.body?.taskId || "").trim();
            const mimeType = String(req.body?.mimeType || "").trim();
            const sizeBytes = Number(req.body?.sizeBytes);

            if (!taskId) return res.status(400).json({ error: "taskId is required" });

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

            const task = await loadTask(supabase, taskId);
            if (!task) return res.status(404).json({ error: "Task not found" });
            if (task.owner_cockpit !== profile.cockpit) {
                return res.status(403).json({ error: "Not your task" });
            }

            const { count, error: countError } = await supabase
                .from("daily_task_files")
                .select("id", { count: "exact", head: true })
                .eq("task_id", taskId);

            if (countError) throw countError;
            if ((count ?? 0) >= MAX_FILES_PER_TASK) {
                return res
                    .status(400)
                    .json({ error: `Up to ${MAX_FILES_PER_TASK} files per task` });
            }

            // Path is built server side. The user's filename never touches it.
            const path = `${task.owner_cockpit}/${taskId}/${crypto.randomUUID()}.${extension}`;

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
            const taskId = String(req.body?.taskId || "").trim();
            const path = String(req.body?.path || "").trim();
            const mimeType = String(req.body?.mimeType || "").trim();
            const sizeBytes = Number(req.body?.sizeBytes);

            if (!taskId || !path) {
                return res.status(400).json({ error: "taskId and path are required" });
            }
            if (!MIME_EXTENSIONS[mimeType]) {
                return res.status(400).json({ error: "Unsupported file type" });
            }

            const task = await loadTask(supabase, taskId);
            if (!task) return res.status(404).json({ error: "Task not found" });
            if (task.owner_cockpit !== profile.cockpit) {
                return res.status(403).json({ error: "Not your task" });
            }

            // The path must be the one we issued for this task and this owner.
            if (!path.startsWith(`${task.owner_cockpit}/${taskId}/`)) {
                return res.status(400).json({ error: "Path does not match the task" });
            }

            const { data, error } = await supabase
                .from("daily_task_files")
                .insert({
                    task_id: taskId,
                    storage_path: path,
                    file_name: safeDisplayName(req.body?.fileName),
                    mime_type: mimeType,
                    size_bytes: Number.isFinite(sizeBytes) ? sizeBytes : 0,
                    uploaded_by: profile.cockpit,
                })
                .select("id, task_id, file_name, mime_type, size_bytes, created_at")
                .single();

            if (error) throw error;

            return res.status(201).json({ file: data });
        }

        /* ---- DELETE ---- */
        if (req.method === "DELETE") {
            const fileId = String(req.body?.fileId || req.query?.fileId || "").trim();
            if (!fileId) return res.status(400).json({ error: "fileId is required" });

            const { data: row, error: findError } = await supabase
                .from("daily_task_files")
                .select("id, task_id, storage_path")
                .eq("id", fileId)
                .single();

            if (findError && findError.code !== "PGRST116") throw findError;
            if (!row) return res.status(404).json({ error: "File not found" });

            const task = await loadTask(supabase, row.task_id);
            if (!task || task.owner_cockpit !== profile.cockpit) {
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

        res.setHeader("Allow", "GET, POST, PATCH, DELETE");
        return res.status(405).json({ error: "Method not allowed" });
    } catch (err) {
        console.error("task-evidence error:", err);
        return res
            .status(500)
            .json({ error: err.message || "Unknown server error" });
    }
}