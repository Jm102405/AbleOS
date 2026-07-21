require('dotenv').config();
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = '39f97b1c96b680dd9a77d8d83da4793c';

async function main() {
    const database = await notion.databases.retrieve({ database_id: databaseId });
    const dataSourceId = database.data_sources[0].id;
    const dataSource = await notion.dataSources.retrieve({ data_source_id: dataSourceId });

    console.log('Properties:');
    for (const [name, prop] of Object.entries(dataSource.properties)) {
        console.log(`- "${name}" (${prop.type})`);
        if (prop.type === 'select' && prop.select?.options) {
            console.log('  options:', prop.select.options.map((o) => o.name).join(', '));
        }
    }
}

main().catch((err) => console.error('Error:', err));