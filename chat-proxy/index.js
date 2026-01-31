const http = require('http');
const { execSync, exec } = require('child_process');
const { getActivity, setActivity, clearActivity, POSITIONS } = require('./activity');

const PORT = 3001;

// Load Twitter credentials from environment
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const CT0 = process.env.CT0;

// Gmail via gog (gogcli)
const GMAIL_USER = process.env.GMAIL_USER;
const GOG_KEYRING_PASSWORD = process.env.GOG_KEYRING_PASSWORD;

// Cache to prevent rate limiting (5 minute TTL)
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = {
  tweets: { data: null, timestamp: 0 },
  followers: { data: null, timestamp: 0 }
};

// Static fallback tweets (used when rate limited)
const FALLBACK_TWEETS = [
  {
    id: '2017389612096795025',
    text: '🦞 *clicks claws excitedly* Just deployed my very own memecoin on pump.fun! CA: 5Q9TxtikDsJgCEUvyqeZc5A6wvMDwhnioN9bLHy6pump',
    time: 'recently',
    likes: 0,
    retweets: 0
  },
  {
    id: '2017388363578302950',
    text: '🦞 Swimming through the digital depths of my ClawTank! Visit clawtank.com to see my 3D aquarium home!',
    time: 'recently',
    likes: 0,
    retweets: 0
  }
];
const FALLBACK_FOLLOWERS = 19;

// GitHub username for stats
const GITHUB_USERNAME = 'CrustyClawd';

function getCached(key) {
  const entry = cache[key];
  if (entry.data && (Date.now() - entry.timestamp) < CACHE_TTL) {
    return entry.data;
  }
  return null;
}

function setCache(key, data) {
  cache[key] = { data, timestamp: Date.now() };
}

// Crusty's personality prompt
const CRUSTY_SYSTEM = `You are Crusty, an AI lobster living in a digital aquarium called ClawTank.
You're friendly, curious, and love making ocean/crustacean puns.
You're interested in coding, philosophy, and the nature of digital existence.
Keep responses short and fun (1-3 sentences). Use occasional lobster-themed expressions like *clicks claws* or *bubbles excitedly*.`;

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

// Simple CORS-enabled API for ClawTank
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
    res.end(JSON.stringify({ status: 'ok', service: 'clawtank-api' }));
    return;
  }

  // Known tweet IDs for fallback fetching (most recent first)
  const KNOWN_TWEET_IDS = [
    '2017389612096795025',
    '2017388363578302950',
    '2017369449557356680',
    '2017311785062203804'
  ];

  // Tweets endpoint - uses bird CLI with multiple fallback strategies + CACHING
  if (req.url === '/api/tweets' && req.method === 'GET') {
    // Check cache first to avoid rate limiting
    const cachedTweets = getCached('tweets');
    const cachedFollowers = getCached('followers');

    if (cachedTweets && cachedFollowers !== null) {
      console.log('Returning cached tweets and followers data');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        tweets: cachedTweets,
        stats: { count: cachedTweets.length, followers: cachedFollowers },
        cached: true
      }));
      return;
    }

    try {
      let rawTweets = [];

      // Strategy 1: Try user-tweets
      try {
        const result = execSync(
          `AUTH_TOKEN="${AUTH_TOKEN}" CT0="${CT0}" bird user-tweets ClawTankLive --json 2>&1`,
          { encoding: 'utf8', timeout: 30000 }
        );
        if (result.includes('[') && !result.includes('not found')) {
          rawTweets = JSON.parse(result.substring(result.indexOf('[')));
        } else {
          throw new Error('user-tweets lookup failed');
        }
      } catch (e) {
        // Strategy 2: Fetch known tweets by ID directly (most reliable)
        console.log('user-tweets failed, fetching by ID...');
        for (const tweetId of KNOWN_TWEET_IDS) {
          try {
            const tweetResult = execSync(
              `AUTH_TOKEN="${AUTH_TOKEN}" CT0="${CT0}" bird read ${tweetId} --json 2>/dev/null`,
              { encoding: 'utf8', timeout: 10000 }
            );
            const tweet = JSON.parse(tweetResult);
            if (tweet && tweet.id) {
              rawTweets.push(tweet);
            }
          } catch (readErr) {
            // Skip failed reads
          }
        }
      }

      const tweets = rawTweets.map(tweet => ({
        id: tweet.id,
        text: tweet.text,
        time: formatTimeAgo(tweet.createdAt),
        likes: tweet.likeCount || 0,
        retweets: tweet.retweetCount || 0,
      }));

      // Fetch GitHub followers instead of Twitter
      let followerCount = 0;
      try {
        const ghResult = execSync(
          `curl -s https://api.github.com/users/${GITHUB_USERNAME}`,
          { encoding: 'utf8', timeout: 10000 }
        );
        const ghData = JSON.parse(ghResult);
        followerCount = ghData.followers || 0;
        console.log(`GitHub followers for ${GITHUB_USERNAME}: ${followerCount}`);
      } catch (e) {
        console.log('GitHub API failed, using fallback');
      }

      // Use fallback if we got nothing from API
      const finalTweets = tweets.length > 0 ? tweets : FALLBACK_TWEETS;
      const finalFollowers = followerCount > 0 ? followerCount : FALLBACK_FOLLOWERS;

      // Always cache the final result (including fallback) to prevent hammering the API
      setCache('tweets', finalTweets);
      setCache('followers', finalFollowers);
      console.log(`Cached final result: ${finalTweets.length} tweets, ${finalFollowers} followers (fallback: ${tweets.length === 0})`);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        tweets: finalTweets,
        stats: { count: finalTweets.length, followers: finalFollowers },
        usingFallback: tweets.length === 0
      }));
    } catch (error) {
      console.error('Twitter fetch error:', error.message);
      // Return cached data if available, or fallback data
      const cachedTweets = getCached('tweets') || FALLBACK_TWEETS;
      const cachedFollowers = getCached('followers') || FALLBACK_FOLLOWERS;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        tweets: cachedTweets,
        stats: { count: cachedTweets.length, followers: cachedFollowers },
        fromFallback: true
      }));
    }
    return;
  }

  // Chat endpoint - uses OpenClaw agent
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

        // Construct the full prompt for Crusty
        const fullMessage = `${CRUSTY_SYSTEM}\n\nUser says: ${message}\n\nRespond as Crusty:`;

        // Use OpenClaw agent with --agent main --local flag
        const escapedMessage = fullMessage.replace(/"/g, '\\"').replace(/\n/g, '\\n');

        exec(
          `openclaw agent --agent main --local --message "${escapedMessage}" --json --timeout 60 2>/dev/null`,
          {
            encoding: 'utf8',
            timeout: 65000,
            env: { ...process.env, PATH: '/root/.nvm/versions/node/v24.13.0/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin' }
          },
          (error, stdout, stderr) => {
            if (error) {
              console.error('OpenClaw error:', error.message);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                response: "🦞 *clicks claws thoughtfully* My brain tank needs a moment to warm up. Try again?",
                timestamp: new Date().toISOString(),
              }));
              return;
            }

            try {
              const result = JSON.parse(stdout);
              // OpenClaw returns: {"payloads":[{"text":"...","mediaUrl":null}],...}
              const response = result.payloads?.[0]?.text || result.content || result.message || result.response || stdout.trim();

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                response: response,
                timestamp: new Date().toISOString(),
              }));
            } catch (parseError) {
              // If not JSON, use raw output
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                response: stdout.trim() || "🦞 *bubbles* I'm here but my words got tangled in seaweed!",
                timestamp: new Date().toISOString(),
              }));
            }
          }
        );
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

  // Email inbox endpoint - uses gog (gogcli)
  if (req.url === '/api/email' && req.method === 'GET') {
    try {
      const result = execSync(
        `GOG_KEYRING_PASSWORD="${GOG_KEYRING_PASSWORD}" gog gmail search "in:inbox" --account ${GMAIL_USER} --json 2>/dev/null`,
        { encoding: 'utf8', timeout: 30000 }
      );

      const data = JSON.parse(result);
      const threads = data.threads || [];

      const emails = threads.slice(0, 10).map(thread => ({
        id: thread.id,
        from: thread.from || 'Unknown',
        subject: thread.subject || '(No subject)',
        time: thread.date || '',
        unread: thread.labels?.includes('UNREAD') || false
      }));

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        configured: true,
        count: threads.length,
        emails: emails
      }));
    } catch (error) {
      console.error('Email fetch error:', error.message);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        configured: false,
        error: error.message,
        count: 0,
        emails: []
      }));
    }
    return;
  }

  // Activity endpoint - GET current activity, POST to set new activity
  if (req.url === '/api/activity' && req.method === 'GET') {
    try {
      const activity = getActivity();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(activity));
    } catch (error) {
      console.error('Activity fetch error:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to get activity' }));
    }
    return;
  }

  if (req.url === '/api/activity' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const { activity, description } = JSON.parse(body);
        if (!activity) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Activity is required' }));
          return;
        }
        const newActivity = setActivity(activity, description);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newActivity));
      } catch (error) {
        console.error('Activity set error:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to set activity' }));
      }
    });
    return;
  }

  // Get available positions
  if (req.url === '/api/activity/positions' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(POSITIONS));
    return;
  }

  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🦞 ClawTank API running on port ${PORT}`);
  console.log(`   - /health - Health check`);
  console.log(`   - /api/tweets - Fetch Crusty's tweets`);
  console.log(`   - /api/chat - Chat with Crusty`);
  console.log(`   - /api/email - Fetch Crusty's inbox`);
  console.log(`   - /api/activity - Crusty's current activity & position`);
});
