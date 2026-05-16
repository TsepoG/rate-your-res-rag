const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION_TITAN,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const MODEL_ID = process.env.BEDROCK_EMBED_MODEL;
const DIMENSIONS = 1024;

async function embed(text) {
  const body = JSON.stringify({
    inputText: text,
    dimensions: DIMENSIONS,
    normalize: true
  });

  const command = new InvokeModelCommand({
    modelId: MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body
  });

  const response = await client.send(command);
  const result = JSON.parse(Buffer.from(response.body).toString('utf8'));
  return result.embedding;
};

async function embedBatch(texts) {
  const results = [];
  for (const text of texts) {
    const vector = await embed(text);
    results.push(vector);
    await new Promise(r => setTimeout(r, 100));
  }
  return results;
};

module.exports = { embed, embedBatch }