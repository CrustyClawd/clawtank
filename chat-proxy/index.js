const http = require('http');
const { execSync } = require('child_process');

const OPENCLAW_URL = 'http://localhost:18789';
const OPENCLAW_TOKEN = '08022c2d4980a848a90076323e499c34ff20285942643cd8';
const PORT = 3001;

// Load Twitter credentials
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'ccdfaf152d2db772511338a62ab332877d85d4c6';
const CT0 = process.env.CT0 || '456d18b4e58b5d418508c094a029593fd39f32c5a613eaf882854d05efcb0143505ef348e40f7886ab5f9030e61250c19bd9b927db46530a36aa7c29bac87447fc982b65b473da4443aaee6e51f73268';

function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Simple CORS-enabled proxy for OpenClaw chat and Twitter
const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'clawtank-chat-proxy' }));
    return;
  }

  // Tweets endpoint - uses bird CLI
  if (req.url === '/api/tweets' && req.method === 'GET') {
    try {
      // Use bird CLI to fetch tweets
      const result = execSync(
        `AUTH_TOKEN="${AUTH_TOKEN}" CT0="${CT0}" bird user-tweets ClawTankLive --json 2>/dev/null`,
        { encoding: 'utf8', timeout: 30000 }
      );

      const rawTweets = JSON.parse(result);
      const tweets = rawTweets.map(tweet => ({
        id: tweet.id,
        text: tweet.text,
        time: formatTimeAgo(tweet.createdAt),
        likes: tweet.likeCount || 0,
        retweets: tweet.retweetCount || 0,
      }));

      // Get user info for stats
      let stats = { count: tweets.length, followers: 0 };
      try {
        const whoami = execSync(
          `AUTH_TOKEN="${AUTH_TOKEN}" CT0="${CT0}" bird about ClawTankLive --json 2>/dev/null`,
          { encoding: 'utf8', timeout: 15000 }
        );
        const userData = JSON.parse(whoami);
        stats = {
          count: userData.statusesCount || tweets.length,
          followers: userData.followersCount || 0,
        };
      } catch (e) {
        // Ignore stats errors
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ tweets, stats }));
    } catch (error) {
      console.error('Twitter fetch error:', error.message);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ tweets: [], stats: { count: 0, followers: 0 } }));
    }
    return;
  }

  // Chat endpoint
  if (req.url === '/api/chat' && req.method === 'POST') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { message } = JSON.parse(body);

        if (!message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Message is required' }));
          return;
        }

        // Send message to OpenClaw gateway
        const response = await fetch(`${OPENCLAW_URL}/api/v1/agent/turn`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: message }],
            stream: false,
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenClaw error: ${response.status}`);
        }

        const data = await response.json();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          response: data.content || data.message || 'Krusty is thinking...',
          timestamp: new Date().toISOString(),
        }));
      } catch (error) {
        console.error('Chat error:', error);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Failed to process message',
          response: "🦞 *clicks claws* Sorry, my neural network is taking a nap. Try again in a moment!"
        }));
      }
    });
    return;
  }

  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🦞 ClawTank API running on port ${PORT}`);
  console.log(`   - /health - Health check`);
  console.log(`   - /api/tweets - Fetch Krusty's tweets`);
  console.log(`   - /api/chat - Chat with Krusty`);
});
