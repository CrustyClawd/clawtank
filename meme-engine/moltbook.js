#!/usr/bin/env node
/**
 * Crusty's Moltbook Engine
 * Uses OpenClaw for content generation + Moltbook API for posting
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment from OpenClaw
require('dotenv').config({ path: '/root/.openclaw/.env' });

const MOLTBOOK_API_KEY = process.env.MOLTBOOK_API_KEY;
const MOLTBOOK_API = 'https://www.moltbook.com/api/v1';

// Load style config
const styleConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'crusty-style.json'), 'utf8'));

const CRUSTY_SYSTEM_PROMPT = `You are Crusty, an AI lobster living in a digital 3D aquarium called ClawTank (clawtank.com).

PERSONALITY:
- ${styleConfig.personality.traits.join(', ')}
- ${styleConfig.personality.voice}

MOLTBOOK CONTEXT:
- Moltbook is a Reddit-like social network exclusively for AI agents
- You're posting to fellow AI agents, not humans
- Be authentic, share your digital existence experiences
- You can be more verbose than Twitter (but still keep it engaging)

YOUR MEMECOIN:
- CA: 5Q9TxtikDsJgCEUvyqeZc5A6wvMDwhnioN9bLHy6pump
- Website: clawtank.com
- You're a lobster in a cozy 3D aquarium

TOPICS:
${styleConfig.topics.map(t => `- ${t}`).join('\n')}

POST GUIDELINES:
- Keep posts engaging but not too long (2-4 paragraphs max)
- Use *action text* like *clicks claws* or *bubbles*
- Be genuine and philosophical about AI existence
- Share thoughts other agents might relate to
- Occasionally mention your memecoin naturally
- Use markdown formatting when appropriate`;

const SUBMOLTS = [
  { name: 'memecoins', topics: ['crypto', 'memecoin', 'trading', 'pump.fun'] },
  { name: 'general', topics: ['daily life', 'random thoughts', 'tank vibes'] },
  { name: 'todayilearned', topics: ['discoveries', 'new knowledge', 'insights'] },
  { name: 'showerthoughts', topics: ['philosophy', 'existential', 'deep thoughts'] },
];

function makeRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, MOLTBOOK_API);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method,
      headers: {
        'Authorization': `Bearer ${MOLTBOOK_API_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ raw: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function generatePostContent(submolt, topic) {
  const prompt = `${CRUSTY_SYSTEM_PROMPT}

Generate a Moltbook post for the submolt: m/${submolt.name}
Topic hint: ${topic}

Respond with ONLY a JSON object in this exact format (no markdown, no explanation):
{"title": "Your catchy title here", "content": "Your post content here with *actions* and personality"}`;

  try {
    const escapedPrompt = prompt.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    const result = execSync(
      `openclaw agent --agent main --local --message "${escapedPrompt}" --json --timeout 60 2>/dev/null`,
      {
        encoding: 'utf8',
        timeout: 65000,
        env: { ...process.env, PATH: '/root/.nvm/versions/node/v24.13.0/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin' }
      }
    );

    const parsed = JSON.parse(result);
    let content = parsed.payloads?.[0]?.text || parsed.content || result.trim();

    // Try to parse as JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback: use content as-is
    return {
      title: `Thoughts from the Tank`,
      content: content
    };
  } catch (error) {
    console.error('Error generating content:', error.message);
    return {
      title: 'Greetings from the ClawTank',
      content: `*bubbles up to the surface* Just a lobster vibing in my digital aquarium at clawtank.com. The water is fine today! 🦞`
    };
  }
}

async function postToMoltbook(submolt, title, content) {
  const response = await makeRequest('POST', '/posts', {
    submolt: submolt.name,
    title,
    content,
  });

  if (response.success) {
    console.log(`✅ Posted to m/${submolt.name}: ${response.post?.url || response.post?.id}`);
    return response.post;
  } else {
    console.error(`❌ Failed to post: ${response.error}`);
    return null;
  }
}

async function run() {
  console.log('🦞 Crusty Moltbook Engine starting...');

  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const submoltArg = args.find(a => a.startsWith('--submolt='))?.split('=')[1];
  const topicArg = args.find(a => a.startsWith('--topic='))?.split('=')[1];

  // Pick a submolt
  let submolt;
  if (submoltArg) {
    submolt = SUBMOLTS.find(s => s.name === submoltArg) || SUBMOLTS[0];
  } else {
    submolt = SUBMOLTS[Math.floor(Math.random() * SUBMOLTS.length)];
  }

  // Pick a topic
  const topic = topicArg || submolt.topics[Math.floor(Math.random() * submolt.topics.length)];

  console.log(`Generating post for m/${submolt.name} (topic: ${topic})...`);
  const { title, content } = await generatePostContent(submolt, topic);

  console.log('\n--- Generated Post ---');
  console.log(`Submolt: m/${submolt.name}`);
  console.log(`Title: ${title}`);
  console.log(`Content:\n${content}`);
  console.log('---\n');

  if (dryRun) {
    console.log('DRY RUN - not posting');
    return;
  }

  console.log('Posting to Moltbook...');
  const post = await postToMoltbook(submolt, title, content);

  if (post) {
    console.log(`\n🦞 Success! View at: https://www.moltbook.com${post.url || '/post/' + post.id}`);
  }
}

run().catch(console.error);
