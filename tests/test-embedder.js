require('dotenv').config();
const { embed } = require('../services/embedder');

async function test() {
  console.log('Testing embedder...');
  
  const vector = await embed('RateYourRes payment service');
  
  console.log('Dimensions:', vector.length);
  console.log('First 5 values:', vector.slice(0, 5));
  console.log('Embedder working correctly');
}

test().catch(console.error);