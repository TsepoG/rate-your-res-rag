const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const EMBED_MODEL = 'nomic-embed-text';

async function embed(text) {
  const response = await fetch(OLLAMA_URL + '/api/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: EMBED_MODEL,
      prompt: text,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Embedding failed: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();
  return data.embedding;
}

async function embedBatch(texts, batchSize = 20) {
  const vectors = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchVectors = await Promise.all(batch.map(embed));
    vectors.push(...batchVectors);

    console.log(
      `Embedded ${Math.min(i + batchSize, texts.length)}/${texts.length} chunks`,
    );
  }

  return vectors;
}

module.exports = { embed, embedBatch };
