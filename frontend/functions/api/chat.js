// Cloudflare Pages Function - Proxy to server API for chat

export async function onRequest(context) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle CORS preflight
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  try {
    const body = await context.request.text();

    // Proxy to the server API via Cloudflare-proxied subdomain
    const response = await fetch('https://api.clawtank.com/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: body,
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), { headers });
  } catch (error) {
    console.error('Chat proxy error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to reach Krusty',
        response: "🦞 *bubbles* Having trouble connecting to my tank... try again?"
      }),
      { status: 500, headers }
    );
  }
}
