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

async function resolveQuery(userQuery, history = []) {
  // If no history, just do a simple rewrite
  if (history.length === 0) {
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

  // With history, resolve the question in context first
  const historyText = history
    .slice(-4) // last 2 exchanges
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content.slice(0, 300)}`)
    .join('\n');

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `Given this conversation history:
${historyText}

Rewrite the follow-up question as 3 standalone, keyword-rich search queries that make sense without the conversation context. Return only the 3 queries, one per line, nothing else.

Follow-up question: ${userQuery}`
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

async function askClaude(userQuery, context, role = 'dev', history = []) {
  const roleConfig = ROLES[role] || ROLES.dev;

  // Build conversation messages — last 3 exchanges max
  const recentHistory = history.slice(-6); // 3 user + 3 assistant messages
  
  const messages = [
    // Previous conversation turns
    ...recentHistory.map(m => ({
      role: m.role,
      content: m.role === 'assistant'
        ? m.content.slice(0, 500) // truncate long assistant messages
        : m.content
    })),
    // Current question with retrieved context
    {
      role: 'user',
      content: `Here is relevant context retrieved from our systems:

${context}

---

Question: ${userQuery}`
    }
  ];

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
- If this is a follow-up question, build on the previous conversation naturally
- If a requirement exists in Confluence but is not implemented in code, say so clearly
- If code exists without documentation, flag it
- Always cite which source supports each part of your answer using plain language
- If the context does not contain enough information, say so simply
- Never use raw file paths or function names when answering for non-developer roles`,

    messages
  });

  return response.content[0].text;
}

async function query(userQuery, options = {}) {
  const { role = 'dev', history = [] } = options;
  console.log(`\nQuery: ${userQuery} [role: ${role}, history: ${history.length} messages]`);

  // Step 1 — Resolve query in context of conversation history
  const rewrittenQueries = await resolveQuery(userQuery, history);
  console.log(`Resolved queries:`, rewrittenQueries);

  // Step 2 — Embed and retrieve for each rewritten query
  const allDocs = new Map();
  const allCode = new Map();

  for (const rewritten of rewrittenQueries) {
    const queryVector = await embed(rewritten);
    const { docs, code } = await retrieveRelevantChunks(queryVector, {
      ...options,
      limit: 8
    });

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

  // Step 3 — Filter and sort
  const relevantDocs = filterByRelevance([...allDocs.values()])
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);

  const relevantCode = filterByRelevance([...allCode.values()])
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);

  console.log(`Retrieved: ${relevantDocs.length} docs, ${relevantCode.length} code chunks`);

  // Step 4 — Handle no results
  if (relevantDocs.length === 0 && relevantCode.length === 0) {
    return {
      answer: "I couldn't find anything relevant in the documentation or codebase for that question. Try rephrasing or check that the relevant content has been indexed.",
      sources: { docs: [], code: [] }
    };
  }

  // Step 5 — Build context and ask Claude with history
  const context = buildContext(relevantDocs, relevantCode);
  const answer = await askClaude(userQuery, context, role, history);

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