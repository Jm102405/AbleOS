// routes/deal-files.js
// Documents a seller attached through the public form. The bucket is private,
// so links are minted on demand and expire.
import { createClient } from "@supabase/supabase-js";
import { requireUser } from "../lib/apiAuth.js";

const BUCKET = "deal-submissions";
const DOWNLOAD_TTL_SECONDS = 600;
const ALLOWED_COCKPITS = ["raj", "dane"];

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

export default async function handler(req, res) {
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return res.status(405).json({ error: "Method not allowed" });
    }

    const auth = await requireUser(req, res);
    if (!auth) return;
    const { profile } = auth;
    if (!ALLOWED_COCKPITS.includes(profile.cockpit)) {
        return res.status(403).json({ error: "Not your queue" });
    }

    const dealId = String(req.query?.deal_id || "").trim();
    if (!dealId) return res.status(400).json({ error: "deal_id is required" });

    try {
        const supabase = getClient();
        const { data: rows, error } = await supabase
            .from("deal_submission_files")
            .select("id, file_name, mime_type, size_bytes, storage_path, created_at")
            .eq("deal_id", dealId)
            .order("created_at", { ascending: true });
        if (error) throw error;

        const files = await Promise.all(
            (rows ?? []).map(async (row) => {
                const { data: signed } = await supabase.storage
                    .from(BUCKET)
                    .createSignedUrl(row.storage_path, DOWNLOAD_TTL_SECONDS);
                return {
                    id: row.id,
                    file_name: row.file_name,
                    mime_type: row.mime_type,
                    size_bytes: row.size_bytes,
                    url: signed?.signedUrl ?? null,
                };
            }),
        );

        return res.status(200).json({ files });
    } catch (err) {
        console.error("deal-files failed:", err);
        return res.status(500).json({ error: "Could not load the documents" });
    }
}