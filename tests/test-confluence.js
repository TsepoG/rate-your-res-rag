require('dotenv').config();
const { ingestConfluenceSpace } = require('../ingestion/confluence');

async function test() {
  console.log('Starting Confluence ingestion...');
  await ingestConfluenceSpace(process.env.CONFLUENCE_SPACE_KEY);
  console.log('Done!');
}

test().catch(console.error);