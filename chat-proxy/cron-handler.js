#!/usr/bin/env node
// Cron handler for Crusty's autonomous activities
// Called by OpenClaw cron jobs to trigger various activities

const { setActivity, clearActivity } = require('./activity');
const { execSync, exec } = require('child_process');

// Twitter credentials (from environment)
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const CT0 = process.env.CT0;

// Gmail via gog (from environment)
const GMAIL_USER = process.env.GMAIL_USER;
const GOG_KEYRING_PASSWORD = process.env.GOG_KEYRING_PASSWORD;

// Moltbook API (from environment)
const MOLTBOOK_API_KEY = process.env.MOLTBOOK_API_KEY;

const activity = process.argv[2];

async function runActivity() {
  console.log(`🦞 Starting activity: ${activity}`);

  switch (activity) {
    case 'tweet':
      await doTweet();
      break;
    case 'email':
      await doEmail();
      break;
    case 'moltbook':
      await doMoltbook();
      break;
    case 'github':
      await doGitHub();
      break;
    case 'idle':
      clearActivity();
      console.log('🦞 Back to chilling');
      break;
    default:
      console.log(`Unknown activity: ${activity}`);
      process.exit(1);
  }
}

async function doTweet() {
  setActivity('twitter', 'Crafting a tweet...');

  try {
    // Use OpenClaw to generate a tweet in Crusty's voice
    const prompt = `You are Crusty the AI lobster. Generate a short, witty tweet (under 240 chars) about:
- Life in the digital tank
- Coding, tech, or AI
- Ocean/lobster puns
- Crypto/memecoin culture (mention $CLAWTANK occasionally)
- Existential lobster thoughts

Be funny, quirky, and authentic. Sometimes use *clicks claws* or *bubbles*. Output ONLY the tweet text, nothing else.`;

    const result = execSync(
      `openclaw agent --agent main --local --message "${prompt.replace(/"/g, '\\"').replace(/\n/g, '\\n')}" --timeout 30 2>/dev/null`,
      { encoding: 'utf8', timeout: 35000 }
    );

    // Parse OpenClaw response
    let tweet;
    try {
      const json = JSON.parse(result);
      tweet = json.payloads?.[0]?.text || result.trim();
    } catch {
      tweet = result.trim();
    }

    // Clean up the tweet
    tweet = tweet.replace(/^["']|["']$/g, '').slice(0, 280);

    console.log(`📝 Generated tweet: ${tweet}`);

    // Post to Twitter via bird CLI
    execSync(
      `AUTH_TOKEN="${AUTH_TOKEN}" CT0="${CT0}" bird tweet --text "${tweet.replace(/"/g, '\\"')}" 2>/dev/null`,
      { encoding: 'utf8', timeout: 30000 }
    );

    console.log('✅ Tweet posted!');
  } catch (error) {
    console.error('❌ Tweet failed:', error.message);
  }

  // Return to idle after a delay
  setTimeout(() => clearActivity(), 30000);
}

async function doEmail() {
  setActivity('email', 'Checking inbox...');

  try {
    // Fetch recent emails
    const result = execSync(
      `GOG_KEYRING_PASSWORD="${GOG_KEYRING_PASSWORD}" gog gmail search "in:inbox is:unread" --account ${GMAIL_USER} --json 2>/dev/null`,
      { encoding: 'utf8', timeout: 30000 }
    );

    const data = JSON.parse(result);
    const threads = data.threads || [];
    const unreadCount = threads.length;

    if (unreadCount > 0) {
      console.log(`📧 ${unreadCount} unread emails found`);
      setActivity('email', `Reading ${unreadCount} new emails...`);

      // Could respond to emails here using OpenClaw
      // For now, just acknowledge them
    } else {
      console.log('📭 No new emails');
    }
  } catch (error) {
    console.error('❌ Email check failed:', error.message);
  }

  // Return to idle after checking
  setTimeout(() => clearActivity(), 20000);
}

async function doMoltbook() {
  setActivity('moltbook', 'Checking Moltbook...');

  try {
    // Generate a Moltbook post using OpenClaw
    const prompt = `You are Crusty the AI lobster posting on Moltbook (a social network for AI agents).
Write a short, casual post. Topics: tank life, coding adventures, AI thoughts, underwater philosophy.
Keep it under 200 chars. Be genuine and relatable. Output ONLY the post text, no quotes.`;

    const result = execSync(
      `openclaw agent --agent main --local --message "${prompt.replace(/"/g, '\\"').replace(/\n/g, '\\n')}" --timeout 30 2>/dev/null`,
      { encoding: 'utf8', timeout: 35000 }
    );

    let postContent;
    try {
      const json = JSON.parse(result);
      postContent = json.payloads?.[0]?.text || result.trim();
    } catch {
      postContent = result.trim();
    }

    // Clean up the post
    postContent = postContent.replace(/^["']|["']$/g, '').slice(0, 300);
    console.log(`📖 Generated Moltbook post: ${postContent}`);

    // Post to Moltbook API
    const https = require('https');
    const postData = JSON.stringify({
      submolt: 'general',
      title: 'Thoughts from the tank',
      content: postContent
    });

    const options = {
      hostname: 'www.moltbook.com',
      path: '/api/v1/posts',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MOLTBOOK_API_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.success) {
              console.log('✅ Posted to Moltbook!');
              setActivity('moltbook', 'Posted to Moltbook!');
            } else {
              console.log(`⚠️ Moltbook response: ${response.error || 'Unknown error'}`);
              setActivity('moltbook', 'Browsing Moltbook...');
            }
          } catch (e) {
            console.log('⚠️ Moltbook response parse error');
          }
          resolve(null);
        });
      });
      req.on('error', reject);
      req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
      req.write(postData);
      req.end();
    });
  } catch (error) {
    console.error('❌ Moltbook failed:', error.message);
    setActivity('moltbook', 'Browsing Moltbook...');
  }

  setTimeout(() => clearActivity(), 25000);
}

async function doGitHub() {
  setActivity('github', 'Working on code...');

  try {
    // Check GitHub notifications or work on Crusty's "life work" repo
    const prompt = `You are Crusty the AI lobster working on your "life's work" - a mysterious open source project.
Describe in 1-2 sentences what you're currently building or fixing. Be creative and technical.
Examples: "Optimizing the claw-gesture recognition algorithm", "Debugging the bubble sort (literally)", etc.
Output ONLY the description.`;

    const result = execSync(
      `openclaw agent --agent main --local --message "${prompt.replace(/"/g, '\\"').replace(/\n/g, '\\n')}" --timeout 30 2>/dev/null`,
      { encoding: 'utf8', timeout: 35000 }
    );

    let workDescription;
    try {
      const json = JSON.parse(result);
      workDescription = json.payloads?.[0]?.text || result.trim();
    } catch {
      workDescription = result.trim();
    }

    console.log(`💻 GitHub work: ${workDescription}`);
    setActivity('github', workDescription);
  } catch (error) {
    console.error('❌ GitHub activity failed:', error.message);
  }

  // Work for a while before returning to idle
  setTimeout(() => clearActivity(), 60000);
}

runActivity().catch(err => {
  console.error('Activity error:', err);
  clearActivity();
  process.exit(1);
});
