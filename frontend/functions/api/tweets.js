// Cloudflare Pages Function - Proxy to server API for tweets

export async function onRequest(context) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=60',
  };

  try {
    // Proxy to the server API via Cloudflare-proxied subdomain
    const response = await fetch('https://api.clawtank.com/api/tweets', {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Server API error: ${response.status}`);
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), { headers });
  } catch (error) {
    console.error('Tweets proxy error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch tweets', tweets: [], stats: { count: 0, followers: 0 } }),
      { status: 500, headers }
    );
  }
}
