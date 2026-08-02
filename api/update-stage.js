// api/update-stage.js
// Saves the Drive folder link to a Notion rehab stage, ticks "Photo Uploaded",
// and puts the stage into Jeremiah's approval queue.

import { Client } from "@notionhq/client";
import { createClient } from "@supabase/supabase-js";
import { requireUser, requireCockpit } from "../lib/apiAuth.js";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

let cachedSupabase = null;

function getSupabase() {
    if (cachedSupabase) return cachedSupabase;
    cachedSupabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SECRET_KEY,
        { auth: { persistSession: false, autoRefreshToken: false } },
    );
    return cachedSupabase;
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    let caller;
    try {
        caller = await requireUser(req);
        requireCockpit(caller.profile, ["colton", "zo"]);
    } catch (err) {
        return res
            .status(err?.status || 401)
            .json({ error: err?.message || "Not authorised" });
    }

    const { notionPageId, driveUrl } = req.body || {};

    if (!notionPageId || !driveUrl) {
        return res.status(400).json({ error: "Missing notionPageId or driveUrl" });
    }

    if (!process.env.NOTION_API_KEY) {
        return res.status(500).json({ error: "NOTION_API_KEY is not set" });
    }

    try {
        await notion.pages.update({
            page_id: notionPageId,
            properties: {
                "Drive Photo Link": { url: driveUrl },
                "Photo Uploaded": { checkbox: true },
                // A re-upload after a decline starts the chain over.
                "Jeremiah Approved": { checkbox: false },
                "Karen Approved": { checkbox: false },
                "Raj Approved": { checkbox: false },
                Status: { select: { name: "In Progress" } },
            },
        });

        // Read back the stage details so the notification is specific.
        const page = await notion.pages.retrieve({ page_id: notionPageId });
        const props = page.properties;
        const stageName =
            props["Stage Name"]?.rich_text?.[0]?.plain_text || "A stage";
        const side = props["Side"]?.select?.name || "";
        const phase = props["Phase"]?.select?.name || "";

        const { error: notifyError } = await getSupabase()
            .from("notifications")
            .insert({
                recipient: "jeremiah",
                type: "stage_awaiting_you",
                title: `${stageName} needs your approval`,
                body: `${side} - ${phase} - photos from ${caller.profile.full_name}`,
                link: "/jeremiah",
            });

        if (notifyError) {
            console.error("Failed to create notification:", notifyError);
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Notion update failed:", error);
        return res.status(500).json({
            error: error?.message || "Failed to update Notion",
            code: error?.code,
        });
    }
}