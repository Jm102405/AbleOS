import { Client } from '@notionhq/client';

const REHAB_DATABASE_ID = '39f97b1c96b680dd9a77d8d83da4793c';

export default async function handler(req, res) {
    try {
        const { side } = req.query;

        if (!side || (side !== 'Side A' && side !== 'Side B')) {
            return res.status(400).json({ error: 'Query param "side" must be "Side A" or "Side B"' });
        }

        const notion = new Client({ auth: process.env.NOTION_API_KEY });

        const database = await notion.databases.retrieve({ database_id: REHAB_DATABASE_ID });
        const dataSourceId = database.data_sources[0].id;

        const stages = [];
        let cursor = undefined;
        let hasMore = true;

        while (hasMore) {
            const response = await notion.dataSources.query({
                data_source_id: dataSourceId,
                start_cursor: cursor,
                filter: {
                    property: 'Side',
                    select: { equals: side },
                },
            });

            for (const page of response.results) {
                const props = page.properties;
                stages.push({
                    notionPageId: page.id,
                    stageName: props['Stage Name']?.rich_text?.[0]?.plain_text || '',
                    workDone: props['Work Done']?.checkbox || false,
                    photoUploaded: props['Photo Uploaded']?.checkbox || false,
                    drivePhotoLink: props['Drive Photo Link']?.url || null,
                    status: props['Status']?.select?.name || 'Not Started',
                });
            }

            hasMore = response.has_more;
            cursor = response.next_cursor || undefined;
        }

        res.status(200).json({ stages });
    } catch (error) {
        console.error('Notion API error:', error);
        res.status(500).json({ error: 'Failed to fetch rehab stages from Notion' });
    }
}