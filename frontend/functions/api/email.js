// Cloudflare Pages Function - Proxy to server API for email

export async function onRequest(context) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=60',
  };

  try {
    // Proxy to the server API
    const response = await fetch('https://api.clawtank.com/api/email', {
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), { headers });
  } catch (error) {
    console.error('Email proxy error:', error);
    return new Response(
      JSON.stringify({
        configured: false,
        error: 'Failed to fetch email data',
        count: 0,
        emails: []
      }),
      { status: 500, headers }
    );
  }
}
