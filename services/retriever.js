require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const { embed } = require('./embedder');
const { retrieveRelevantChunks } = require('./vectorStore');

const client = new Anthropic();

async function rewriteQuery(userQuery) {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 150,
    messages: [{
      role: 'user',
      content: `Rewrite this question as a concise, keyword-rich search query optimised for retrieving relevant code and documentation. Return only the rewritten query, nothing else.

Question: ${userQuery}`
    }]
  });
  return response.content[0].text.trim();
}

function filterByRelevance(chunks, threshold = 0.65) {
  return chunks.filter(chunk => chunk.similarity >= threshold);
}

function buildContext(docs, code) {
  let context = '';

  if (docs.length > 0) {
    context += '=== CONFLUENCE DOCUMENTATION ===\n\n';
    docs.forEach((doc, i) => {
      context += `[Doc ${i + 1}] ${doc.page_title} (${doc.space_key})\n`;
      context += `URL: ${doc.page_url}\n`;
      context += `${doc.content}\n\n`;
    });
  }

  if (code.length > 0) {
    context += '=== CODEBASE ===\n\n';
    code.forEach((chunk, i) => {
      context += `[Code ${i + 1}] ${chunk.function_name} — ${chunk.file_path}\n`;
      context += `Summary: ${chunk.summary}\n`;
      context += `\`\`\`${chunk.language}\n${chunk.content}\n\`\`\`\n\n`;
    });
  }

  return context;
}

async function askClaude(userQuery, context) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: `You are an expert assistant for a software development team working on RateYourRes — a South African university residence rating platform.

      You have access to two knowledge sources:
      1. Confluence documentation — business requirements, specs, and architecture decisions
      2. Codebase — actual implementation from GitHub

      When answering:
      - Cross-reference both sources when relevant
      - If a requirement exists in Confluence but is not implemented in the code, say so clearly
      - If code exists without documentation, flag it
      - Always cite which source supports each part of your answer
      - If the context does not contain enough information to answer confidently, say so`,

    messages: [{
      role: 'user',
      content: `Here is relevant context retrieved from our systems:

${context}

---

Question: ${userQuery}`
    }]
  });

  return response.content[0].text;
}

async function query(userQuery, options = {}) {
  console.log(`\nQuery: ${userQuery}`);

  // Step 1 — Rewrite query for better retrieval
  const rewrittenQuery = await rewriteQuery(userQuery);
  console.log(`Rewritten: ${rewrittenQuery}`);

  // Step 2 — Embed the rewritten query
  const queryVector = await embed(rewrittenQuery);

  // Step 3 — Retrieve relevant chunks
  const { docs, code } = await retrieveRelevantChunks(queryVector, options);

  // Step 4 — Filter by similarity threshold
  const relevantDocs = filterByRelevance(docs);
  const relevantCode = filterByRelevance(code);

  console.log(`Retrieved: ${relevantDocs.length} docs, ${relevantCode.length} code chunks`);

  // Step 5 — Handle no results
  if (relevantDocs.length === 0 && relevantCode.length === 0) {
    return {
      answer: "I couldn't find anything relevant in the documentation or codebase for that question. Try rephrasing or check that the relevant content has been indexed.",
      sources: { docs: [], code: [] }
    };
  }

  // Step 6 — Build context and ask Claude
  const context = buildContext(relevantDocs, relevantCode);
  const answer = await askClaude(userQuery, context);

  // Step 7 — Return answer with sources
  return {
    answer,
    sources: {
      docs: relevantDocs.map(d => ({
        title: d.page_title,
        url: d.page_url,
        similarity: Math.round(d.similarity * 100) / 100
      })),
      code: relevantCode.map(c => ({
        file: c.file_path,
        function: c.function_name,
        similarity: Math.round(c.similarity * 100) / 100
      }))
    }
  };
}

module.exports = { query };