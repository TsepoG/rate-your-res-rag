require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { query } = require('../services/retriever');
const { closePool } = require('../services/vectorStore');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
// app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'RateYourRes RAG is running' });
});

// Main query endpoint
app.post('/api/query', async (req, res) => {
  const {
    question,
    role = 'dev',
    history = [],
    relevance = 0.50,
    contextWindow = 2
  } = req.body

  if (!question || question.trim().length === 0) {
    return res.status(400).json({ error: 'Question is required' })
  }

  if (question.trim().length > 500) {
    return res.status(400).json({ error: 'Question too long — keep it under 500 characters' })
  }

  try {
    const result = await query(question, { role, history, relevance, contextWindow })

    // Tell the frontend exactly which history messages were used
    const contextWindow_used = history.slice(-(contextWindow * 2))

    res.json({
      ...result,
      contextUsed: contextWindow_used.length > 0
        ? { count: contextWindow_used.length, messages: contextWindow_used }
        : null
    })
  } catch (err) {
    console.error('Query error:', err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

// Serve the frontend for all other routes
// app.get('/{*path}', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public/index.html'));
// });

// Start server
const server = app.listen(PORT, () => {
  console.log(`RateYourRes RAG running at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await closePool();
  server.close();
});

module.exports = app;