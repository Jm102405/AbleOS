require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Client } = require('@notionhq/client');

const app = express();
app.use(cors());

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

app.get('/api/deals-count', async (req, res) => {
  try {
    // Databases now contain one or more "data sources" — fetch the database
    // first to find the data source ID we actually need to query.
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

    res.json({ count });
  } catch (error) {
    console.error('Notion API error:', error);
    res.status(500).json({ error: 'Failed to fetch deal count from Notion' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});