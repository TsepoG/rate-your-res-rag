require('dotenv').config();
const { query } = require('../services/retriever');
const { closePool } = require('../services/vectorStore');

async function test() {
  const tests = [
    {
      question: 'What tech stack does RateYourRes use?',
      role: 'ba'
    },
    {
      question: 'How does the review submission work?',
      role: 'po'
    },
    {
      question: 'What DynamoDB tables exist and what are their keys?',
      role: 'dev'
    },
    {
      question: 'How is the frontend deployed?',
      role: 'pm'
    }
  ];

  for (const t of tests) {
    const result = await query(t.question, { role: t.role });
    console.log('\n' + '='.repeat(60));
    console.log(`Q [${t.role.toUpperCase()}]: ${t.question}`);
    console.log('='.repeat(60));
    console.log(result.answer);
    console.log('\nSources:');
    result.sources.docs.forEach(d =>
      console.log(`  📄 ${d.title} (${d.similarity})`)
    );
    result.sources.code.forEach(c =>
      console.log(`  💻 ${c.file} → ${c.function} (${c.similarity})`)
    );
  }

  await closePool();
}

test().catch(console.error);