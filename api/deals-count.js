const { Client } = require('@notionhq/client');

module.exports = async function handler(req, res) {
    try {
        const notion = new Client({ auth: process.env.NOTION_API_KEY });
        const databaseId = process.env.NOTION_DATABASE_ID;

        const database = await notion.databases.retrieve({ database_id: databaseId });
        const dataSourceId = database.data_sources[0].id;

        let count = 0;
        let cursor = undefined;
        let hasMore = true;

        while (hasMore) {
            const response = await notion.dataSources.query({
                data_source_id: dataSourceId,
                start_cursor: cursor,
            });
            count += response.results.length;
            hasMore = response.has_more;
            cursor = response.next_cursor || undefined;
        }

        res.status(200).json({ count });
    } catch (error) {
        console.error('Notion API error:', error);
        res.status(500).json({ error: 'Failed to fetch deal count from Notion' });
    }
};