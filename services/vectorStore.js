require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function storeConfluenceChunk(chunk) {
  await pool.query(
    `
    INSERT INTO confluence_chunks
      (id, content, vector, page_id, page_title, space_key, page_url, last_modified)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (id) DO UPDATE SET
      content = EXCLUDED.content,
      vector = EXCLUDED.vector,
      last_modified = EXCLUDED.last_modified
  `,
    [
      `confluence_${chunk.metadata.pageId}_${chunk.metadata.chunkIndex}`,
      chunk.content,
      JSON.stringify(chunk.vector),
      chunk.metadata.pageId,
      chunk.metadata.title,
      chunk.metadata.space,
      chunk.metadata.url,
      chunk.metadata.lastModified,
    ],
  );
}

async function storeCodeChunk(chunk) {
  await pool.query(
    `
    INSERT INTO code_chunks
      (id, content, summary, code_vector, summary_vector,
       repo, file_path, function_name, language, start_line, end_line)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (id) DO UPDATE SET
      content = EXCLUDED.content,
      summary = EXCLUDED.summary,
      code_vector = EXCLUDED.code_vector,
      summary_vector = EXCLUDED.summary_vector
  `,
    [
      `github_${chunk.metadata.repo}_${chunk.metadata.functionName}`,
      chunk.content,
      chunk.summary,
      JSON.stringify(chunk.codeVector),
      JSON.stringify(chunk.summaryVector),
      chunk.metadata.repo,
      chunk.metadata.filePath,
      chunk.metadata.name,
      chunk.metadata.language,
      chunk.metadata.startLine,
      chunk.metadata.endLine,
    ],
  );
}

async function retrieveRelevantChunks(queryVector, options = {}) {
  const { spaceKey, repo, limit = 5 } = options;

  const docsResult = await pool.query(
    `
    SELECT content, page_title, page_url, space_key,
           1 - (vector <=> $1::vector) AS similarity
    FROM confluence_chunks
    WHERE ($2::text IS NULL OR space_key = $2)
    ORDER BY vector <=> $1::vector
    LIMIT $3
  `,
    [JSON.stringify(queryVector), spaceKey || null, limit],
  );

  const codeResult = await pool.query(
    `
    SELECT content, summary, repo, file_path, function_name, language,
           1 - (summary_vector <=> $1::vector) AS similarity
    FROM code_chunks
    WHERE ($2::text IS NULL OR repo = $2)
    ORDER BY summary_vector <=> $1::vector
    LIMIT $3
  `,
    [JSON.stringify(queryVector), repo || null, limit],
  );

  return {
    docs: docsResult.rows,
    code: codeResult.rows,
  };
}

async function closePool() {
  await pool.end();
}

module.exports = {
  storeConfluenceChunk,
  storeCodeChunk,
  retrieveRelevantChunks,
  closePool,
};
