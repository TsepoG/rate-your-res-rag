require('dotenv').config();
const axios = require('axios');
const { embed } = require('../services/embedder');
const { storeConfluenceChunk } = require('../services/vectorStore');

const confluenceClient = axios.create({
  baseURL: `${process.env.CONFLUENCE_BASE_URL}/wiki/rest/api`,
  auth: {
    username: process.env.CONFLUENCE_EMAIL,
    password: process.env.CONFLUENCE_API_TOKEN
  },
  headers: { 'Content-Type': 'application/json' }
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
        start
      }
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
    lastModified: page.version.when
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
          lastModified: doc.lastModified
        }
      });
    }
    i += (chunkSize - overlap);
  }

  return chunks;
}

async function ingestConfluenceSpace(spaceKey) {
  console.log(`Starting ingestion for space: ${spaceKey}`);

  const pages = await getAllPages(spaceKey);
  let totalChunks = 0;

  for (const page of pages) {
    console.log(`Processing: ${page.title}`);

    const cleaned = cleanPage(page);
    const chunks = chunkDocument(cleaned);

    for (const chunk of chunks) {
      const vector = await embed(chunk.content);
      await storeConfluenceChunk({ ...chunk, vector });
    }

    totalChunks += chunks.length;
    console.log(`  → ${chunks.length} chunks stored`);
  }

  console.log(`Ingestion complete. Total chunks stored: ${totalChunks}`);
}

module.exports = { ingestConfluenceSpace };