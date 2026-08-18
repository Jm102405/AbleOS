// routes/deal-upload-url.js
// Public, unauthenticated. Mints a signed upload URL so a seller can attach
// documents before their deal row exists. Nothing here trusts the client:
// the path is server-generated, the extension comes from the MIME allowlist,
// and every issued path is recorded so submission can verify it.
import { createClient } from "@supabase/supabase-js";
import { createHash, randomUUID } from "node:crypto";

const BUCKET = "deal-submissions";
const MAX_BYTES = 15 * 1024 * 1024;
const MAX_FILES_PER_TOKEN = 10;
const RATE_LIMIT_PER_HOUR = 40; // generous: one submission can be 10 files
const UPLOAD_TTL_SECONDS = 600;

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

function hashIp(req) {
    const forwarded = req.headers["x-forwarded-for"];
    const ip = String(forwarded || "").split(",")[0].trim() || "unknown";
    const salt = process.env.DEAL_INTAKE_SECRET || "able-os";
    return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

/** Kept for display only. The stored path never uses it. */
function safeDisplayName(value) {
    if (typeof value !== "string") return "attachment";
    const cleaned = value.trim().slice(0, 120).replace(/[^A-Za-z0-9._ -]/g, "");
    return cleaned || "attachment";
}

function isUuid(value) {
    return (
        typeof value === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
    );
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ error: "Method not allowed" });
    }

    const mime = String(req.body?.mime_type || "");
    const ext = MIME_EXTENSIONS[mime];
    if (!ext) {
        return res.status(400).json({ error: "Only images and PDFs are accepted" });
    }

    const size = Number(req.body?.size_bytes);
    if (!Number.isFinite(size) || size <= 0 || size > MAX_BYTES) {
        return res.status(400).json({ error: "Files must be under 15 MB" });
    }

    // Reuse the caller's token across a multi-file submission, or start one.
    const token = isUuid(req.body?.token) ? req.body.token : randomUUID();

    try {
        const supabase = getClient();
        const ipHash = hashIp(req);

        const sinceIso = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { count: recent, error: rateError } = await supabase
            .from("deal_submission_files")
            .select("id", { count: "exact", head: true })
            .eq("submitter_ip_hash", ipHash)
            .gte("created_at", sinceIso);
        if (rateError) throw rateError;
        if ((recent ?? 0) >= RATE_LIMIT_PER_HOUR) {
            return res.status(429).json({ error: "Too many uploads. Try again later." });
        }

        const { count: forToken, error: countError } = await supabase
            .from("deal_submission_files")
            .select("id", { count: "exact", head: true })
            .eq("submission_token", token);
        if (countError) throw countError;
        if ((forToken ?? 0) >= MAX_FILES_PER_TOKEN) {
            return res
                .status(400)
                .json({ error: `Up to ${MAX_FILES_PER_TOKEN} files per submission` });
        }

        const path = `${token}/${randomUUID()}.${ext}`;
        const { data: signed, error: signError } = await supabase.storage
            .from(BUCKET)
            .createSignedUploadUrl(path, { expiresIn: UPLOAD_TTL_SECONDS });
        if (signError) throw signError;

        const { error: insertError } = await supabase
            .from("deal_submission_files")
            .insert({
                submission_token: token,
                storage_path: path,
                file_name: safeDisplayName(req.body?.file_name),
                mime_type: mime,
                size_bytes: Math.round(size),
                submitter_ip_hash: ipHash,
            });
        if (insertError) throw insertError;

        return res.status(200).json({
            token,
            path,
            signedUrl: signed.signedUrl,
            uploadToken: signed.token,
        });
    } catch (err) {
        console.error("deal-upload-url failed:", err);
        return res.status(500).json({ error: "Could not start the upload" });
    }
}