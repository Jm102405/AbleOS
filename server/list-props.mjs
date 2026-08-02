// Prints the real property names and types on the rehab stages database.
// Run: node --env-file=.env.development.local server/list-props.mjs

import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const db = await notion.databases.retrieve({
    database_id: "39f97b1c96b680dd9a77d8d83da4793c",
});

const dataSourceId = db.data_sources[0].id;
const ds = await notion.dataSources.retrieve({ data_source_id: dataSourceId });

for (const [name, prop] of Object.entries(ds.properties)) {
    console.log(`${JSON.stringify(name)}  ->  ${prop.type}`);
}