// One-off: clears Photo Uploaded and Drive Photo Link on every rehab stage,
// then prints how many rows exist per side and phase.
// Run: node --env-file=.env.development.local server/reset-stages.mjs

import { Client } from "@notionhq/client";

const DATABASE_ID = "39f97b1c96b680dd9a77d8d83da4793c"; // Able Builds - Rehab Stages

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

console.log(`Found ${rows.length} rows\n`);

const breakdown = {};
for (const page of rows) {
    const side = textOf(page.properties["Side"]) || "(no side)";
    const phase = textOf(page.properties["Phase"]) || "(no phase)";
    const key = `${side} / ${phase}`;
    breakdown[key] = breakdown[key] || [];
    breakdown[key].push(textOf(page.properties["Stage Name"]) || "(no name)");
}

for (const key of Object.keys(breakdown).sort()) {
    console.log(`${key}  (${breakdown[key].length})`);
    for (const name of breakdown[key]) console.log(`   - ${name}`);
}

console.log("\nResetting...");

let done = 0;
for (const page of rows) {
    await notion.pages.update({
        page_id: page.id,
        properties: {
            "Photo Uploaded": { checkbox: false },
            "Drive Photo Link": { url: null },
        },
    });
    done++;
    if (done % 10 === 0) console.log(`  ${done}/${rows.length}`);
}

console.log(`\nReset ${done} rows.`);