import { Client } from "@notionhq/client";

const DB = "39f97b1c96b680dd9a77d8d83da4793c";
const STAGE_NAME = "Before Teardown Photos";
const PHASE_NAME = "Phase 0 - Before Teardown";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

function plain(prop) {
    if (!prop) return "";
    if (prop.type === "title") return prop.title.map((t) => t.plain_text).join("");
    if (prop.type === "rich_text") {
        return prop.rich_text.map((t) => t.plain_text).join("");
    }
    if (prop.type === "select") return prop.select?.name ?? "";
    return "";
}

const db = await notion.databases.retrieve({ database_id: DB });
const dataSourceId = db.data_sources[0].id;

const ds = await notion.dataSources.retrieve({ data_source_id: dataSourceId });

const statusOptions = ds.properties["Status"]?.select?.options ?? [];
console.log(
    "Status options:",
    statusOptions.map((o) => o.name).join(" | ") || "(none)",
);

// Prefer a not-started style status, otherwise leave it blank.
const startStatus =
    statusOptions.find((o) => /not started|to do|pending|queued/i.test(o.name))
        ?.name ?? null;
console.log("Using status:", startStatus ?? "(blank)");

// Pull every row so we can find the Demo template for each side.
const rows = [];
let cursor;

do {
    const page = await notion.dataSources.query({
        data_source_id: dataSourceId,
        page_size: 100,
        start_cursor: cursor,
    });
    rows.push(...page.results);
    cursor = page.has_more ? page.next_cursor : undefined;
} while (cursor);

console.log("Rows in database:", rows.length);

// Safe to re-run. Never creates a duplicate.
const already = rows.filter(
    (r) => plain(r.properties["Stage Name"]) === STAGE_NAME,
);

if (already.length) {
    console.log(`"${STAGE_NAME}" already exists (${already.length} rows). Nothing to do.`);
    process.exit(0);
}

for (const side of ["Side A", "Side B"]) {
    const template = rows.find(
        (r) =>
            plain(r.properties["Stage Name"]) === "Demo" &&
            plain(r.properties["Side"]) === side,
    );

    if (!template) {
        console.error(`No Demo row found for ${side} - skipped.`);
        continue;
    }

    const t = template.properties;
    const templateName = plain(t["Name"]);
    const name = templateName.includes("Demo")
        ? templateName.replace("Demo", STAGE_NAME)
        : `${side} - ${STAGE_NAME}`;

    const properties = {
        Name: { title: [{ text: { content: name } }] },
        "Stage Name": { rich_text: [{ text: { content: STAGE_NAME } }] },
        Side: { select: { name: side } },
        Phase: { select: { name: PHASE_NAME } },
        // Ticked permanently - this stage goes straight to Raj.
        "Jeremiah Approved": { checkbox: true },
        "Karen Approved": { checkbox: true },
        "Raj Approved": { checkbox: false },
        "Photo Uploaded": { checkbox: false },
        "Work Done": { checkbox: false },
        "Draw Released": { checkbox: false },
    };

    const project = plain(t["Project"]);
    if (project) {
        properties["Project"] = { rich_text: [{ text: { content: project } }] };
    }

    if (startStatus) properties["Status"] = { select: { name: startStatus } };

    const created = await notion.pages.create({
        parent: { type: "data_source_id", data_source_id: dataSourceId },
        properties,
    });

    console.log(`Created ${side}: ${name} -> ${created.id}`);
}

console.log("Done.");