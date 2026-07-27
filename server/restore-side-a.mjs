// One-off: recreates the three missing Side A / Phase 1 rows by cloning the
// equivalent Side B rows, so every property matches the existing schema.
// Run: node --env-file=.env.development.local server/restore-side-a.mjs

import { Client } from "@notionhq/client";

const DATABASE_ID = "39f97b1c96b680dd9a77d8d83da4793c";
const MISSING = ["Framing", "Wiring", "Mini Split Rough-In"];

const notion = new Client({ auth: process.env.NOTION_API_KEY });

function textOf(prop) {
    if (!prop) return "";
    if (prop.type === "select") return prop.select?.name ?? "";
    if (prop.type === "rich_text") return prop.rich_text?.[0]?.plain_text ?? "";
    if (prop.type === "title") return prop.title?.[0]?.plain_text ?? "";
    return "";
}

const db = await notion.databases.retrieve({ database_id: DATABASE_ID });
const dataSourceId = db.data_sources[0].id;

const rows = [];
let cursor;
do {
    const res = await notion.dataSources.query({
        data_source_id: dataSourceId,
        start_cursor: cursor,
        page_size: 100,
    });
    rows.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
} while (cursor);

for (const stageName of MISSING) {
    const template = rows.find(
        (p) =>
            textOf(p.properties["Side"]) === "Side B" &&
            textOf(p.properties["Phase"]) === "Phase 1" &&
            textOf(p.properties["Stage Name"]) === stageName,
    );

    if (!template) {
        console.log(`SKIP ${stageName} - no Side B template found`);
        continue;
    }

    const templateTitle = textOf(template.properties["Name"]);
    const newTitle = templateTitle
        ? templateTitle.replace(/Side B/gi, "Side A")
        : `Side A - ${stageName}`;

    const project = textOf(template.properties["Project"]);

    const properties = {
        Name: { title: [{ text: { content: newTitle } }] },
        Side: { select: { name: "Side A" } },
        Phase: { select: { name: "Phase 1" } },
        "Stage Name": { rich_text: [{ text: { content: stageName } }] },
        Status: { select: { name: "Not Started" } },
        "Work Done": { checkbox: false },
        "Photo Uploaded": { checkbox: false },
    };

    if (project) {
        properties.Project = { rich_text: [{ text: { content: project } }] };
    }

    const created = await notion.pages.create({
        parent: { data_source_id: dataSourceId },
        properties,
    });

    console.log(`Created "${newTitle}"  (${created.id})`);
}

console.log("\nDone. Re-run reset-stages.mjs to confirm Side A / Phase 1 has 5.");