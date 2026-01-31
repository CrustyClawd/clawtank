// Cloudflare Pages Function - Proxy to chat-proxy for activity state

const BACKEND_URL = 'http://api.clawtank.com';

export async function onRequest(context) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    const fetchOptions = {
      method: context.request.method,
      headers: { 'Content-Type': 'application/json' },
    };

    // Forward body for POST requests
    if (context.request.method === 'POST') {
      fetchOptions.body = await context.request.text();
    }

    const response = await fetch(`${BACKEND_URL}/api/activity`, fetchOptions);
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers
    });
  } catch (error) {
    console.error('Activity proxy error:', error);
    return new Response(
      JSON.stringify({
        current: 'idle',
        position: { x: 0, z: 0, name: 'center' },
        description: 'Chilling in the tank',
        error: 'Backend unavailable'
      }),
      { status: 200, headers }
    );
  }
}
