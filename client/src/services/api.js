const API_URL = '/api'

export async function sendQuery(question, role) {
  const res = await fetch(`${API_URL}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, role })
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Something went wrong')
  }

  return res.json()
}