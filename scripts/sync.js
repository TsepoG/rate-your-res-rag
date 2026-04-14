require('dotenv').config();
const { runSync } = require('../services/sync');
const { pool } = require('../services/syncState');
const { closePool } = require('../services/vectorStore');
const { Pool } = require('pg');

async function main() {
  const force = process.argv.includes('--force');
  const checkFirst = process.argv.includes('--check-first');

  if (force) {
    console.log('Force mode — re-indexing everything regardless of changes');
  }

  // If --check-first flag is passed, only sync if database is empty
  if (checkFirst && !force) {
    const db = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
      const result = await db.query('SELECT COUNT(*) FROM sync_state');
      const count = parseInt(result.rows[0].count);
      await db.end();

      if (count > 0) {
        console.log(`Data exists (${count} records) — skipping initial sync`);
        await pool.end();
        await closePool();
        return;
      }
      console.log('Fresh environment — running initial sync...');
    } catch (err) {
      await db.end();
      console.error('Check failed:', err.message);
      process.exit(1);
    }
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
