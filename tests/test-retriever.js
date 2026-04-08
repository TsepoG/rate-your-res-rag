require('dotenv').config();
const { query } = require('../services/retriever');
const { closePool } = require('../services/vectorStore');

async function test() {
  // Test 1 — architecture question
  const result1 = await query('What tech stack does RateYourRes use?');
  console.log('\n=== ANSWER ===');
  console.log(result1.answer);
  console.log('\n=== SOURCES ===');
  console.log('Docs:', result1.sources.docs);
  console.log('Code:', result1.sources.code);

  // Test 2 — cross-referencing question
  const result2 = await query('How does authentication work?');
  console.log('\n=== ANSWER ===');
  console.log(result2.answer);
  console.log('\n=== SOURCES ===');
  console.log('Docs:', result2.sources.docs);
  console.log('Code:', result2.sources.code);

  await closePool();
}

test().catch(console.error);