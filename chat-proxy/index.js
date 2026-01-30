const http = require('http');
const { execSync, exec } = require('child_process');
const Imap = require('imap');

const PORT = 3001;

// Load Twitter credentials
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'ccdfaf152d2db772511338a62ab332877d85d4c6';
const CT0 = process.env.CT0 || '456d18b4e58b5d418508c094a029593fd39f32c5a613eaf882854d05efcb0143505ef348e40f7886ab5f9030e61250c19bd9b927db46530a36aa7c29bac87447fc982b65b473da4443aaee6e51f73268';

// Gmail credentials (requires app password - not regular password)
const GMAIL_USER = process.env.GMAIL_USER || 'krustyclawd@gmail.com';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || '';

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

  // Tweets endpoint - uses bird CLI
  if (req.url === '/api/tweets' && req.method === 'GET') {
    try {
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

      let stats = { count: tweets.length, followers: 0 };
      try {
        const aboutResult = execSync(
          `AUTH_TOKEN="${AUTH_TOKEN}" CT0="${CT0}" bird about ClawTankLive --json 2>/dev/null`,
          { encoding: 'utf8', timeout: 15000 }
        );
        const userData = JSON.parse(aboutResult);
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

  // Email inbox endpoint
  if (req.url === '/api/email' && req.method === 'GET') {
    if (!GMAIL_APP_PASSWORD) {
      // Return placeholder when not configured
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        configured: false,
        count: 0,
        emails: [],
        message: 'Gmail not configured - need app password'
      }));
      return;
    }

    try {
      const emails = await new Promise((resolve, reject) => {
        const imap = new Imap({
          user: GMAIL_USER,
          password: GMAIL_APP_PASSWORD,
          host: 'imap.gmail.com',
          port: 993,
          tls: true,
          tlsOptions: { rejectUnauthorized: false }
        });

        const emailList = [];

        imap.once('ready', () => {
          imap.openBox('INBOX', true, (err, box) => {
            if (err) {
              imap.end();
              reject(err);
              return;
            }

            const totalMessages = box.messages.total;
            if (totalMessages === 0) {
              imap.end();
              resolve({ count: 0, emails: [] });
              return;
            }

            // Fetch last 10 emails
            const fetchRange = Math.max(1, totalMessages - 9) + ':' + totalMessages;
            const fetch = imap.seq.fetch(fetchRange, {
              bodies: ['HEADER.FIELDS (FROM SUBJECT DATE)'],
              struct: true
            });

            fetch.on('message', (msg, seqno) => {
              let header = '';
              msg.on('body', (stream) => {
                stream.on('data', (chunk) => {
                  header += chunk.toString('utf8');
                });
              });
              msg.once('end', () => {
                const from = header.match(/From: (.+)/i)?.[1] || 'Unknown';
                const subject = header.match(/Subject: (.+)/i)?.[1] || '(No subject)';
                const date = header.match(/Date: (.+)/i)?.[1] || '';
                emailList.push({
                  id: seqno,
                  from: from.trim(),
                  subject: subject.trim(),
                  date: date.trim(),
                  time: date ? formatTimeAgo(date) : ''
                });
              });
            });

            fetch.once('end', () => {
              imap.end();
              resolve({
                count: totalMessages,
                emails: emailList.reverse().slice(0, 10)
              });
            });

            fetch.once('error', (err) => {
              imap.end();
              reject(err);
            });
          });
        });

        imap.once('error', reject);
        imap.connect();
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        configured: true,
        ...emails
      }));
    } catch (error) {
      console.error('Email fetch error:', error.message);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        configured: true,
        error: error.message,
        count: 0,
        emails: []
      }));
    }
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
});
