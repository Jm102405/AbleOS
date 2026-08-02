// DESTRUCTIVE. Empties every rehab stage Drive folder and clears the matching
// Notion fields, so the whole photo/approval flow starts from scratch.
// The 40 folders themselves are kept - only their contents go.
//
// Run: node --env-file=.env.development.local server/reset-all.mjs --confirm

import { Client } from "@notionhq/client";
import { JWT } from "google-auth-library";
import { SIDE_A, SIDE_B } from "../api/drive-upload-url.js";

const REHAB_DATABASE_ID = "39f97b1c96b680dd9a77d8d83da4793c";

if (!process.argv.includes("--confirm")) {
    console.log("This permanently deletes every uploaded photo.");
    console.log("Re-run with --confirm if you're sure.");
    process.exit(1);
}

/* ---------- Google Drive ---------- */

const creds = JSON.parse(
    Buffer.from(process.env.GOOGLE_SA_KEY_B64, "base64").toString("utf8"),
);

const jwt = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/drive"],
    subject: process.env.GOOGLE_IMPERSONATE_EMAIL,
});

const { token } = await jwt.getAccessToken();

async function driveRequest(url, options = {}) {
    const res = await fetch(url, {
        ...options,
        headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) },
    });
    if (!res.ok && res.status !== 204) {
        throw new Error(`${res.status} ${await res.text()}`);
    }
    return res.status === 204 ? null : res.json();
}

async function emptyFolder(label, folderId) {
    const query = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
    const list = await driveRequest(
        `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&pageSize=1000`,
    );

    const files = list?.files ?? [];
    for (const file of files) {
        await driveRequest(
            `https://www.googleapis.com/drive/v3/files/${file.id}`,
            { method: "DELETE" },
        );
    }

    if (files.length) console.log(`  ${label}: deleted ${files.length}`);
    return files.length;
}

console.log("Emptying Drive folders...\n");

let deleted = 0;
for (const [side, map] of [["Side A", SIDE_A], ["Side B", SIDE_B]]) {
    for (const [stage, folderId] of Object.entries(map)) {
        deleted += await emptyFolder(`${side} / ${stage}`, folderId);
    }
}
console.log(`\nDeleted ${deleted} files.\n`);

/* ---------- Notion ---------- */

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const db = await notion.databases.retrieve({ database_id: REHAB_DATABASE_ID });
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

console.log(`Clearing ${rows.length} Notion rows...`);

let done = 0;
for (const page of rows) {
    await notion.pages.update({
        page_id: page.id,
        properties: {
            "Photo Uploaded": { checkbox: false },
            "Drive Photo Link": { url: null },
            "Work Done": { checkbox: false },
            "Jeremiah Approved": { checkbox: false },
            "Karen Approved": { checkbox: false },
            "Raj Approved": { checkbox: false },
            "Draw Released": { checkbox: false },
            "Notes / Flags": { rich_text: [] },
            Status: { select: { name: "Not Started" } },
        },
    });
    done++;
    if (done % 10 === 0) console.log(`  ${done}/${rows.length}`);
}

console.log(`\nReset ${done} rows. Reload the cockpits to see a clean slate.`);