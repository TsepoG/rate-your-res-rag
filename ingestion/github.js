require('dotenv').config();
const axios = require('axios');
const { getSyncState, upsertSyncState } = require('../services/syncState');
const { embed } = require('../services/embedder');
const { storeCodeChunk } = require('../services/vectorStore');
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic();

const githubClient = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Authorization: `Bearer ${process.env.GH_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  },
});

const CODE_EXTENSIONS = [
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.py',
  '.java',
  '.cs',
  '.go',
  '.rb',
  '.php',
  '.sql',
  '.css',
  '.tf',
  '.tfvars',
];

const EXCLUDED_PATHS = [
  'node_modules/',
  'dist/',
  'build/',
  'coverage/',
  '.git/',
  'vendor/',
];

const MAX_CHUNK_CHARS = 3000;

function isCodeFile(path) {
  const hasValidExtension = CODE_EXTENSIONS.some((ext) => path.endsWith(ext));
  const isExcluded = EXCLUDED_PATHS.some((excluded) => path.includes(excluded));
  return hasValidExtension && !isExcluded;
}

function detectLanguage(path) {
  const ext = path.split('.').pop();
  const map = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    cs: 'csharp',
    go: 'go',
    rb: 'ruby',
    php: 'php',
    sql: 'sql',
    css: 'css',
    tf: 'terraform',
    tfvars: 'terraform',
  };
  return map[ext] || 'plaintext';
}

async function getFileTree(owner, repo) {
  const repoData = await githubClient.get(`/repos/${owner}/${repo}`);
  const defaultBranch = repoData.data.default_branch;

  const treeRes = await githubClient.get(
    `/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
  );

  return treeRes.data.tree.filter(
    (item) => item.type === 'blob' && isCodeFile(item.path),
  );
}

async function getFileContent(owner, repo, path) {
  const res = await githubClient.get(
    `/repos/${owner}/${repo}/contents/${path}`,
    { headers: { Accept: 'application/vnd.github.raw+json' } },
  );
  return res.data;
}

function chunkByFunctions(content, filePath, repo) {
  const lines = content.split('\n');
  const chunks = [];
  const language = detectLanguage(filePath);

  const functionPatterns = [
    /^(export\s+)?(async\s+)?function\s+(\w+)/,
    /^(export\s+)?(const|let|var)\s+(\w+)\s*=\s*(async\s*)?\(/,
    /^(export\s+)?(default\s+)?(class)\s+(\w+)/,
    /^\s{2,}(async\s+)?(\w+)\s*\([^)]*\)\s*\{/,
  ];

  let currentChunk = [];
  let currentName = 'module';
  let startLine = 1;
  let braceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isFunction = functionPatterns.some((p) => p.test(line));

    if (isFunction && braceDepth === 0) {
      if (currentChunk.length > 3) {
        let chunkContent = currentChunk.join('\n');

        // Truncate if too large
        if (chunkContent.length > MAX_CHUNK_CHARS) {
          chunkContent = chunkContent.slice(0, MAX_CHUNK_CHARS);
        }

        chunks.push({
          content: chunkContent,
          metadata: {
            repo,
            filePath,
            name: currentName,
            language,
            startLine,
            endLine: i,
          },
        });
      }

      currentChunk = [line];
      currentName = line.match(/(\w+)\s*[\(=]/)
        ? line.match(/(\w+)\s*[\(=]/)[1]
        : `chunk_${i}`;
      startLine = i + 1;
    } else {
      currentChunk.push(line);
    }

    braceDepth += (line.match(/\{/g) || []).length;
    braceDepth -= (line.match(/\}/g) || []).length;
    if (braceDepth < 0) braceDepth = 0;
  }

  // Push final chunk
  if (currentChunk.length > 3) {
    let chunkContent = currentChunk.join('\n');
    if (chunkContent.length > MAX_CHUNK_CHARS) {
      chunkContent = chunkContent.slice(0, MAX_CHUNK_CHARS);
    }
    chunks.push({
      content: chunkContent,
      metadata: {
        repo,
        filePath,
        name: currentName,
        language,
        startLine,
        endLine: lines.length,
      },
    });
  }

  // If no function chunks found, split file into MAX_CHUNK_CHARS pieces
  if (chunks.length === 0 && content.trim().length > 0) {
    const parts = [];
    for (let i = 0; i < content.length; i += MAX_CHUNK_CHARS) {
      parts.push(content.slice(i, i + MAX_CHUNK_CHARS));
    }

    parts.forEach((part, index) => {
      chunks.push({
        content: part,
        metadata: {
          repo,
          filePath,
          name: `${filePath.split('/').pop()}_part${index + 1}`,
          language,
          startLine: index * 50 + 1,
          endLine: (index + 1) * 50,
        },
      });
    });
  }

  return chunks;
}

async function generateSummary(code, filePath) {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 150,
    messages: [
      {
        role: 'user',
        content: `In 2-3 sentences, describe what this code does in plain English. Focus on business purpose not implementation details. File: ${filePath}

${code.slice(0, 1000)}`,
      },
    ],
  });
  return response.content[0].text;
}

async function ingestRepository(owner, repo, { force = false } = {}) {
  console.log(`Starting ingestion for repo: ${owner}/${repo}`);

  const files = await getFileTree(owner, repo);
  console.log(`Found ${files.length} code files`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of files) {
    const identifier = `github:${repo}:${file.path}`;

    // Check if file has changed since last sync
    if (!force) {
      const existing = await getSyncState('github', identifier);
      if (existing && existing.sha === file.sha) {
        console.log(`  → Skipped (unchanged): ${file.path}`);
        skipped++;
        continue;
      }
    }

    try {
      console.log(`Processing: ${file.path}`);
      const content = await getFileContent(owner, repo, file.path);
      const chunks = chunkByFunctions(content, file.path, repo);

      for (const chunk of chunks) {
        const summary = await generateSummary(chunk.content, file.path);

        const [codeVector, summaryVector] = await Promise.all([
          embed(chunk.content),
          embed(summary),
        ]);

        await storeCodeChunk({
          ...chunk,
          summary,
          codeVector,
          summaryVector,
          metadata: { ...chunk.metadata, functionName: chunk.metadata.name },
        });
      }

      await upsertSyncState('github', identifier, { sha: file.sha });

      updated++;
      console.log(`  → Updated: ${file.path} (${chunks.length} chunks)`);

      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.log(`  → Error: ${file.path}: ${err.message}`);
      errors++;
    }
  }

  console.log(
    `\nGitHub complete — ${updated} updated, ${skipped} skipped, ${errors} errors`,
  );
  return { updated, skipped, errors };
}

module.exports = { ingestRepository };
