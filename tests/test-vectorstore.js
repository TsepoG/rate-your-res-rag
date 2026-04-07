require('dotenv').config();
const { storeConfluenceChunk, retrieveRelevantChunks, closePool } = require('../services/vectorStore');
const { embed } = require('../services/embedder');

async function test() {
  console.log('Testing vector store...');

  const vector = await embed('university residence rating review');

  await storeConfluenceChunk({
    content: 'RateYourRes allows students to rate their university residences across South Africa.',
    vector,
    metadata: {
      pageId: 'test-001',
      chunkIndex: 0,
      title: 'Test Page',
      space: 'RAT',
      url: 'https://test.atlassian.net/wiki/test',
      lastModified: new Date().toISOString()
    }
  });

  console.log('Stored test chunk successfully');

  const queryVector = await embed('student residence reviews');
  const results = await retrieveRelevantChunks(queryVector, { limit: 3 });

  console.log('Retrieved docs:', results.docs.length);
  console.log('Top result:', results.docs[0]?.page_title, '| similarity:', results.docs[0]?.similarity);

  await closePool();
  console.log('Vector store working correctly');
}

test().catch(console.error);