// api/update-stage.js
// Saves the Drive photo link to a Notion rehab-stage page and ticks
// "Photo Uploaded".

import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
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
            },
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Notion update failed:", error);
        return res.status(500).json({
            error: error?.message || "Failed to update Notion",
            code: error?.code,
        });
    }
}