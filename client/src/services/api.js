const API_URL = '/api'

export async function sendQuery(question, role, history = []) {
  const res = await fetch(`${API_URL}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      role,
      history: history.map(m => ({
        role: m.role,
        content: m.content
      }))
    })
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Something went wrong')
  }

  return res.json()
}