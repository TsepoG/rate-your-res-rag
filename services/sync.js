require('dotenv').config();
const { ingestConfluenceSpace } = require('../ingestion/confluence');
const { ingestRepository } = require('../ingestion/github');

async function runSync({ force = false } = {}) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Sync started at ${new Date().toISOString()}`);
  console.log(`Mode: ${force ? 'full re-index' : 'incremental'}`);
  console.log('='.repeat(50));

  const results = {
    confluence: null,
    github: null,
    startedAt: new Date().toISOString(),
  };

  try {
    results.confluence = await ingestConfluenceSpace(
      process.env.CONFLUENCE_SPACE_KEY,
      { force },
    );
  } catch (err) {
    console.error('Confluence sync failed:', err.message);
    results.confluence = { error: err.message };
  }

  try {
    results.github = await ingestRepository(
      process.env.GH_OWNER,
      process.env.GH_REPO,
      { force },
    );
  } catch (err) {
    console.error('GitHub sync failed:', err.message);
    results.github = { error: err.message };
  }

  results.finishedAt = new Date().toISOString();

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Sync finished at ${results.finishedAt}`);
  console.log('Confluence:', results.confluence);
  console.log('GitHub:', results.github);
  console.log('='.repeat(50));

  return results;
}

module.exports = { runSync };
