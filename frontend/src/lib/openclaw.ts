// OpenClaw Gateway client

const GATEWAY_URL = process.env.NEXT_PUBLIC_OPENCLAW_URL || 'http://127.0.0.1:18789';
const GATEWAY_TOKEN = process.env.NEXT_PUBLIC_OPENCLAW_TOKEN || '';

interface GatewayStatus {
  version: string;
  uptime: number;
  sessions: number;
  channels: string[];
}

interface Session {
  id: string;
  channel: string;
  model: string;
  tokens: number;
  createdAt: string;
}

// Fetch with auth header
async function gatewayFetch(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (GATEWAY_TOKEN) {
    headers['Authorization'] = `Bearer ${GATEWAY_TOKEN}`;
  }

  const res = await fetch(`${GATEWAY_URL}${path}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    throw new Error(`Gateway error: ${res.status}`);
  }

  return res.json();
}

// Get gateway status
export async function getStatus(): Promise<GatewayStatus> {
  return gatewayFetch('/api/status');
}

// Get active sessions
export async function getSessions(): Promise<Session[]> {
  return gatewayFetch('/api/sessions');
}

// Send message to agent
export async function sendMessage(sessionId: string, message: string) {
  return gatewayFetch('/api/agent/message', {
    method: 'POST',
    body: JSON.stringify({
      sessionId,
      message
    })
  });
}

// WebSocket connection to gateway
export function connectGatewayWS(onMessage: (data: any) => void) {
  const wsUrl = GATEWAY_URL.replace('http', 'ws');
  const ws = new WebSocket(`${wsUrl}/ws`);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (e) {
      console.error('Failed to parse WS message:', e);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('WebSocket closed, reconnecting in 5s...');
    setTimeout(() => connectGatewayWS(onMessage), 5000);
  };

  return ws;
}
