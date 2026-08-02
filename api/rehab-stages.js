// api/rehab-stages.js
// Reads the Able Builds rehab checklist from Notion, including where each
// stage sits in the approval chain.
//
// GET /api/rehab-stages              both sides (Jeremiah, Karen, Raj)
// GET /api/rehab-stages?side=Side A  one side (crew leads)

import { Client } from "@notionhq/client";
import { requireUser } from "../lib/apiAuth.js";

const REHAB_DATABASE_ID = "39f97b1c96b680dd9a77d8d83da4793c";

// Crew leads only ever see their own side, whatever they ask for.
const LOCKED_SIDE = { colton: "Side A", zo: "Side B" };

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
        const requestedSide = req.query?.side;
        const lockedSide = LOCKED_SIDE[profile.cockpit];

        if (lockedSide && requestedSide && requestedSide !== lockedSide) {
            return res.status(403).json({ error: "You can only view your own side" });
        }

        const side = lockedSide || requestedSide || null;

        if (side && side !== "Side A" && side !== "Side B") {
            return res
                .status(400)
                .json({ error: 'side must be "Side A" or "Side B"' });
        }

        const notion = new Client({ auth: process.env.NOTION_API_KEY });

        const database = await notion.databases.retrieve({
            database_id: REHAB_DATABASE_ID,
        });
        const dataSourceId = database.data_sources[0].id;

        const stages = [];
        let cursor = undefined;
        let hasMore = true;

        while (hasMore) {
            const response = await notion.dataSources.query({
                data_source_id: dataSourceId,
                start_cursor: cursor,
                ...(side
                    ? { filter: { property: "Side", select: { equals: side } } }
                    : {}),
            });

            for (const page of response.results) {
                const props = page.properties;

                stages.push({
                    notionPageId: page.id,
                    stageName: props["Stage Name"]?.rich_text?.[0]?.plain_text || "",
                    side: props["Side"]?.select?.name || "",
                    phase: props["Phase"]?.select?.name || "",
                    status: props["Status"]?.select?.name || "Not Started",
                    workDone: props["Work Done"]?.checkbox || false,
                    photoUploaded: props["Photo Uploaded"]?.checkbox || false,
                    drivePhotoLink: props["Drive Photo Link"]?.url || null,
                    jeremiahApproved: props["Jeremiah Approved"]?.checkbox || false,
                    karenApproved: props["Karen Approved"]?.checkbox || false,
                    rajApproved: props["Raj Approved"]?.checkbox || false,
                    drawReleased: props["Draw Released"]?.checkbox || false,
                    notes: props["Notes / Flags"]?.rich_text?.[0]?.plain_text || "",
                });
            }

            hasMore = response.has_more;
            cursor = response.next_cursor || undefined;
        }

        return res.status(200).json({ stages });
    } catch (error) {
        console.error("Notion API error:", error);
        return res
            .status(500)
            .json({ error: "Failed to fetch rehab stages from Notion" });
    }
}