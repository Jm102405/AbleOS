// routes/drive-folders.js
// The folder list behind Raj's Drive panel. Deep links only - deliberately not
// a file browser. A row with no url yet renders as "Coming soon".
import { createClient } from "@supabase/supabase-js";
import { requireUser } from "../lib/apiAuth.js";

/** Everyone who has a reason to open a property folder. */
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

    if (!ALLOWED_COCKPITS.includes(auth.profile.cockpit)) {
        return res.status(403).json({ error: "No access to the Drive panel" });
    }

    try {
        const supabase = getClient();

        const { data, error } = await supabase
            .from("drive_folders")
            .select("id, label, section, entity, path_hint, url, sort_order")
            .order("sort_order", { ascending: true });

        if (error) throw error;

        return res.status(200).json({ folders: data ?? [] });
    } catch (err) {
        console.error("drive-folders failed:", err);
        return res.status(500).json({ error: "Could not load the folder list" });
    }
}