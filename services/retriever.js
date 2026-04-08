require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const { embed } = require('./embedder');
const { retrieveRelevantChunks } = require('./vectorStore');

const client = new Anthropic();

const ROLES = {
  dev: {
    label: 'Developer',
    tone: 'Use technical language, include code references, mention file paths and function names.'
  },
  ba: {
    label: 'Business Analyst',
    tone: 'Use plain business language. Avoid code snippets unless essential. Focus on what the system does, not how it does it. Explain technical terms simply.'
  },
  po: {
    label: 'Product Owner',
    tone: 'Use plain language focused on product behaviour and user impact. No code. Focus on what works, what is missing, and what the user experiences.'
  },
  qa: {
    label: 'QA Engineer',
    tone: 'Focus on what is testable — inputs, outputs, edge cases, error handling, and validation rules. Keep technical but practical.'
  },
  pm: {
    label: 'Project Manager',
    tone: 'Use plain language. Focus on what is built, what is missing, and what the current state is. No code. Think status reports and progress summaries.'
  }
};

async function rewriteQuery(userQuery) {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `Rewrite this question as 3 different keyword-rich search queries optimised for retrieving relevant code and documentation. Return only the 3 queries, one per line, nothing else.

Question: ${userQuery}`
    }]
  });
  return response.content[0].text.trim().split('\n').filter(q => q.trim());
}

function filterByRelevance(chunks, threshold = 0.50) {
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

async function askClaude(userQuery, context, role = 'dev') {
  const roleConfig = ROLES[role] || ROLES.dev;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: `You are an expert assistant for the RateYourRes project — a South African university residence rating platform.

You are answering a question from a ${roleConfig.label}.
Tone and style: ${roleConfig.tone}

You have access to two knowledge sources:
1. Confluence documentation — business requirements, specs, and architecture decisions
2. Codebase — actual implementation from GitHub

When answering:
- Cross-reference both sources when relevant
- If a requirement exists in Confluence but is not implemented in code, say so clearly
- If code exists without documentation, flag it
- Always cite which source supports each part of your answer using plain language like "According to the documentation..." or "Looking at the code..."
- If the context does not contain enough information, say so simply
- Never use raw file paths or function names when answering for non-developer roles — describe what the code does instead`,

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
  const { role = 'dev' } = options;
  console.log(`\nQuery: ${userQuery} [role: ${role}]`);

  // Step 1 — Generate multiple rewritten queries for better recall
  const rewrittenQueries = await rewriteQuery(userQuery);
  console.log(`Rewritten queries:`, rewrittenQueries);

  // Step 2 — Embed and retrieve for each rewritten query, then deduplicate
  const allDocs = new Map();
  const allCode = new Map();

  for (const rewritten of rewrittenQueries) {
    const queryVector = await embed(rewritten);
    const { docs, code } = await retrieveRelevantChunks(queryVector, {
      ...options,
      limit: 8
    });

    // Deduplicate by id, keeping highest similarity
    docs.forEach(doc => {
      const key = doc.page_title + doc.content.slice(0, 50);
      if (!allDocs.has(key) || allDocs.get(key).similarity < doc.similarity) {
        allDocs.set(key, doc);
      }
    });

    code.forEach(chunk => {
      const key = chunk.file_path + chunk.function_name;
      if (!allCode.has(key) || allCode.get(key).similarity < chunk.similarity) {
        allCode.set(key, chunk);
      }
    });
  }

  // Step 3 — Filter by relevance threshold
  const relevantDocs = filterByRelevance([...allDocs.values()]);
  const relevantCode = filterByRelevance([...allCode.values()]);

  // Step 4 — Sort by similarity descending, take top 5 each
  relevantDocs.sort((a, b) => b.similarity - a.similarity);
  relevantCode.sort((a, b) => b.similarity - a.similarity);

  const topDocs = relevantDocs.slice(0, 5);
  const topCode = relevantCode.slice(0, 5);

  console.log(`Retrieved: ${topDocs.length} docs, ${topCode.length} code chunks`);

  // Step 5 — Handle no results
  if (topDocs.length === 0 && topCode.length === 0) {
    return {
      answer: "I couldn't find anything relevant in the documentation or codebase for that question. Try rephrasing or check that the relevant content has been indexed.",
      sources: { docs: [], code: [] }
    };
  }

  // Step 6 — Build context and ask Claude
  const context = buildContext(topDocs, topCode);
  const answer = await askClaude(userQuery, context, role);

  // Step 7 — Return answer with sources
  return {
    answer,
    sources: {
      docs: topDocs.map(d => ({
        title: d.page_title,
        url: d.page_url,
        similarity: Math.round(d.similarity * 100) / 100
      })),
      code: topCode.map(c => ({
        file: c.file_path,
        function: c.function_name,
        similarity: Math.round(c.similarity * 100) / 100
      }))
    }
  };
}

module.exports = { query };