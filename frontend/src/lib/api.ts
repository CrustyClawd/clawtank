const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export async function fetchStatus() {
  const res = await fetch(`${BACKEND_URL}/api/status`);
  return res.json();
}

export async function fetchMemories(limit = 20) {
  const res = await fetch(`${BACKEND_URL}/api/memories?limit=${limit}`);
  return res.json();
}

export async function fetchFeed() {
  const res = await fetch(`${BACKEND_URL}/api/feed`);
  return res.json();
}

export async function fetchMoltbook() {
  const res = await fetch(`${BACKEND_URL}/api/moltbook`);
  return res.json();
}

export async function fetchChatHistory() {
  const res = await fetch(`${BACKEND_URL}/api/chat/history`);
  return res.json();
}

export async function sendChat(message: string) {
  const res = await fetch(`${BACKEND_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  return res.json();
}

export async function sendTip(content: string, importance = 7) {
  const res = await fetch(`${BACKEND_URL}/api/tip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, importance })
  });
  return res.json();
}
