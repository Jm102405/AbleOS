require('dotenv').config();
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = '39f97b1c96b680dd9a77d8d83da4793c';

// Rows to KEEP + rename (old stage name -> new stage name)
const renames = {
    'Insulation': 'Insulation',
    'Drywall-Hang': 'Drywall',
    'Paint — Walls & Ceilings': 'Paint',
    'Paint—Walls & Ceilings': 'Paint', // Side B uses an em-dash variant
};

// Rows to ARCHIVE (send to Trash)
const toArchive = [
    'Drywall-Tape & Mud',
    'Drywall — Sand & Second Coat',
    'Drywall—Sand & Second Coat',
    'Primer Coat',
    'Closets & Built-Ins',
];

async function main() {
    const database = await notion.databases.retrieve({ database_id: databaseId });
    const dataSourceId = database.data_sources[0].id;

    let pages = [];
    let cursor = undefined;
    let hasMore = true;
    while (hasMore) {
        const response = await notion.dataSources.query({
            data_source_id: dataSourceId,
            start_cursor: cursor,
        });
        pages.push(...response.results);
        hasMore = response.has_more;
        cursor = response.next_cursor || undefined;
    }

    for (const page of pages) {
        const stageName = page.properties['Stage Name']?.rich_text?.[0]?.plain_text || '';

        if (toArchive.includes(stageName)) {
            await notion.pages.update({ page_id: page.id, archived: true });
            console.log(`Archived: ${stageName}`);
        } else if (renames[stageName] && renames[stageName] !== stageName) {
            const newName = renames[stageName];
            await notion.pages.update({
                page_id: page.id,
                properties: {
                    'Stage Name': { rich_text: [{ text: { content: newName } }] },
                },
            });
            console.log(`Renamed: "${stageName}" -> "${newName}"`);
        } else {
            console.log(`Kept as-is: ${stageName}`);
        }
    }

    console.log('\nDone.');
}

main().catch((err) => console.error('Error:', err));