const API_URL = '/api';

export async function sendQuery(question, role, history = [], settings = {}) {
  const res = await fetch(`${API_URL}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      role,
      history: history.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      relevance: settings.relevance ?? 0.5,
      contextWindow: settings.contextWindow ?? 2,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Something went wrong');
  }

  return res.json();
}
