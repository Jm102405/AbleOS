import { Client } from "@notionhq/client";

const DEALS_DB = "3a397b1c96b680e8af62f3a34a5c6a02";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const db = await notion.databases.retrieve({ database_id: DEALS_DB });
const dataSourceId = db.data_sources[0].id;

const ds = await notion.dataSources.retrieve({ data_source_id: dataSourceId });

console.log("\n=== PROPERTIES ===\n");

for (const [name, prop] of Object.entries(ds.properties)) {
    let options = "";
    if (prop.type === "select") {
        options = " -> " + prop.select.options.map((o) => o.name).join(" | ");
    }
    if (prop.type === "status") {
        options = " -> " + prop.status.options.map((o) => o.name).join(" | ");
    }
    if (prop.type === "multi_select") {
        options = " -> " + prop.multi_select.options.map((o) => o.name).join(" | ");
    }
    console.log(`${name}  [${prop.type}]${options}`);
}

const page = await notion.dataSources.query({
    data_source_id: dataSourceId,
    page_size: 3,
});

console.log("\n=== TOTAL FETCHED ===", page.results.length);
console.log("\n=== FIRST DEAL ===\n");
console.log(JSON.stringify(page.results[0]?.properties, null, 2));