require('dotenv').config();
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = '39f97b1c96b680dd9a77d8d83da4793c';

async function main() {
    const database = await notion.databases.retrieve({ database_id: databaseId });
    const dataSourceId = database.data_sources[0].id;

    let rows = [];
    let cursor = undefined;
    let hasMore = true;

    while (hasMore) {
        const response = await notion.dataSources.query({
            data_source_id: dataSourceId,
            start_cursor: cursor,
        });
        for (const page of response.results) {
            const props = page.properties;
            rows.push({
                id: page.id,
                side: props['Side']?.select?.name || '(none)',
                phase: props['Phase']?.select?.name || '(none)',
                stageName: props['Stage Name']?.rich_text?.[0]?.plain_text || '(empty)',
            });
        }
        hasMore = response.has_more;
        cursor = response.next_cursor || undefined;
    }

    console.log(`Total rows: ${rows.length}\n`);
    const sideA = rows.filter((r) => r.side === 'Side A');
    const sideB = rows.filter((r) => r.side === 'Side B');
    const other = rows.filter((r) => r.side !== 'Side A' && r.side !== 'Side B');

    console.log(`--- Side A (${sideA.length}) ---`);
    sideA.forEach((r) => console.log(`  [${r.phase}] ${r.stageName}`));
    console.log(`\n--- Side B (${sideB.length}) ---`);
    sideB.forEach((r) => console.log(`  [${r.phase}] ${r.stageName}`));
    if (other.length) {
        console.log(`\n--- Other/no side (${other.length}) ---`);
        other.forEach((r) => console.log(`  [${r.phase}] ${r.stageName}`));
    }
}

main().catch((err) => console.error('Error:', err));