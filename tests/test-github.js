require('dotenv').config();
const { ingestRepository } = require('../ingestion/github');

async function test() {
  console.log('Starting GitHub ingestion...');
  await ingestRepository(
    process.env.GITHUB_OWNER,
    process.env.GITHUB_REPO
  );
  console.log('Done!');
}

test().catch(console.error);