require('dotenv').config();
const { runSync } = require('../services/sync');
const { pool } = require('../services/syncState');
const { closePool } = require('../services/vectorStore');

async function main() {
  const force = process.argv.includes('--force');

  if (force) {
    console.log('Force mode — re-indexing everything regardless of changes');
  }

  try {
    await runSync({ force });
  } catch (err) {
    console.error('Sync failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
    await closePool();
  }
}

main();