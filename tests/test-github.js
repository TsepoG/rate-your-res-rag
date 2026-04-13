require('dotenv').config();
const { ingestRepository } = require('../ingestion/github');

async function test() {
  console.log('Starting GitHub ingestion...');
  await ingestRepository(
    process.env.GH_OWNER,
    process.env.GH_REPO
  );
  console.log('Done!');
}

test().catch(console.error);