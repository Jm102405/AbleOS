const { Client } = require("@notionhq/client");

const notion = new Client({ auth: process.env.NOTION_API_KEY });

module.exports = async function handler(req, res) {
    // Only allow POST
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { notionPageId, driveUrl } = req.body;

    // Validate inputs
    if (!notionPageId || !driveUrl) {
        return res.status(400).json({ error: "Missing notionPageId or driveUrl" });
    }

    try {
        await notion.pages.update({
            page_id: notionPageId,
            properties: {
                "Drive Photo Link": {
                    url: driveUrl,
                },
                "Photo Uploaded": {
                    checkbox: true,
                },
            },
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Notion update failed:", error);
        return res.status(500).json({ error: "Failed to update Notion" });
    }
};