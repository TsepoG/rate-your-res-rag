-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Confluence docs chunks
CREATE TABLE IF NOT EXISTS confluence_chunks (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  vector vector(768),
  page_id TEXT,
  page_title TEXT,
  space_key TEXT,
  page_url TEXT,
  last_modified TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GitHub code chunks
CREATE TABLE IF NOT EXISTS code_chunks (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  summary TEXT,
  code_vector vector(768),
  summary_vector vector(768),
  repo TEXT,
  file_path TEXT,
  function_name TEXT,
  language TEXT,
  start_line INTEGER,
  end_line INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sync state tracking for incremental re-indexing
CREATE TABLE IF NOT EXISTS sync_state (
  source TEXT NOT NULL,
  identifier TEXT NOT NULL,
  last_modified TEXT,
  sha TEXT,
  last_synced TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (source, identifier)
);

-- HNSW indexes
CREATE INDEX IF NOT EXISTS confluence_vector_idx
  ON confluence_chunks USING hnsw (vector vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS code_vector_idx
  ON code_chunks USING hnsw (code_vector vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS code_summary_vector_idx
  ON code_chunks USING hnsw (summary_vector vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);