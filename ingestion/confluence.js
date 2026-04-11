require('dotenv').config();
const axios = require('axios');
const { embed } = require('../services/embedder');
const { storeConfluenceChunk } = require('../services/vectorStore');
const { getSyncState, upsertSyncState } = require('../services/syncState');

const confluenceClient = axios.create({
  baseURL: `${process.env.CONFLUENCE_BASE_URL}/wiki/rest/api`,
  auth: {
    username: process.env.CONFLUENCE_EMAIL,
    password: process.env.CONFLUENCE_API_TOKEN,
  },
  headers: { 'Content-Type': 'application/json' },
});

async function getAllPages(spaceKey) {
  let allPages = [];
  let start = 0;
  const limit = 50;

  while (true) {
    const response = await confluenceClient.get('/content', {
      params: {
        spaceKey,
        type: 'page',
        expand: 'body.storage,version,space',
        limit,
        start,
      },
    });

    const { results } = response.data;
    allPages = [...allPages, ...results];

    if (results.length < limit) break;
    start += limit;
  }

  console.log(`Found ${allPages.length} pages in space ${spaceKey}`);
  return allPages;
}

function cleanPage(page) {
  const rawHtml = page.body.storage.value;

  const text = rawHtml
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    id: page.id,
    title: page.title,
    space: page.space.key,
    url: page._links.webui,
    text,
    lastModified: page.version.when,
  };
}

function chunkDocument(doc, chunkSize = 400, overlap = 80) {
  const words = doc.text.split(' ');
  const chunks = [];
  let i = 0;

  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim().length > 0) {
      chunks.push({
        content: chunk,
        metadata: {
          source: 'confluence',
          pageId: doc.id,
          title: doc.title,
          space: doc.space,
          url: doc.url,
          chunkIndex: chunks.length,
          lastModified: doc.lastModified,
        },
      });
    }
    i += chunkSize - overlap;
  }

  return chunks;
}

async function ingestPage(page, { force = false } = {}) {
  const identifier = `confluence:${page.id}`;
  const lastModified = page.version.when;

  // Check if page has changed since last sync
  if (!force) {
    const existing = await getSyncState('confluence', identifier);
    if (existing && existing.last_modified === lastModified) {
      return { status: 'skipped', title: page.title };
    }
  }

  const cleaned = cleanPage(page);
  const chunks = chunkDocument(cleaned);

  for (const chunk of chunks) {
    const vector = await embed(chunk.content);
    await storeConfluenceChunk({ ...chunk, vector });
  }

  await upsertSyncState('confluence', identifier, { lastModified });
  return { status: 'updated', title: page.title, chunks: chunks.length };
}

async function ingestConfluenceSpace(spaceKey, { force = false } = {}) {
  console.log(`Starting Confluence ingestion for space: ${spaceKey}`);

  const pages = await getAllPages(spaceKey);
  let updated = 0;
  let skipped = 0;
  let totalChunks = 0;

  for (const page of pages) {
    const result = await ingestPage(page, { force });

    if (result.status === 'updated') {
      console.log(`  → Updated: ${result.title} (${result.chunks} chunks)`);
      updated++;
      totalChunks += result.chunks;
    } else {
      console.log(`  → Skipped (unchanged): ${result.title}`);
      skipped++;
    }
  }

  console.log(
    `\nConfluence complete — ${updated} updated, ${skipped} skipped, ${totalChunks} chunks stored`,
  );
  return { updated, skipped, totalChunks };
}

module.exports = { ingestConfluenceSpace };
