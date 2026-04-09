require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function getSyncState(source, identifier) {
  const result = await pool.query(
    `SELECT last_modified, sha, last_synced
     FROM sync_state
     WHERE source = $1 AND identifier = $2`,
    [source, identifier]
  );
  return result.rows[0] || null;
}

async function upsertSyncState(source, identifier, { lastModified, sha }) {
  await pool.query(
    `INSERT INTO sync_state (source, identifier, last_modified, sha, last_synced)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (source, identifier) DO UPDATE SET
       last_modified = EXCLUDED.last_modified,
       sha = EXCLUDED.sha,
       last_synced = NOW()`,
    [source, identifier, lastModified || null, sha || null]
  );
}

async function deleteSyncState(source, identifier) {
  await pool.query(
    `DELETE FROM sync_state WHERE source = $1 AND identifier = $2`,
    [source, identifier]
  );
}

module.exports = { getSyncState, upsertSyncState, deleteSyncState, pool };