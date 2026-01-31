#!/usr/bin/env node
/**
 * Crusty's Twitter Meme Engine
 * Uses OpenClaw for content generation + Nano Banana Pro for images + bird CLI for posting
 */

const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment from OpenClaw
require('dotenv').config({ path: '/root/.openclaw/.env' });

const AUTH_TOKEN = process.env.AUTH_TOKEN;
const CT0 = process.env.CT0;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Load style config
const styleConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'crusty-style.json'), 'utf8'));

const CRUSTY_SYSTEM_PROMPT = `You are Crusty, an AI lobster living in a digital 3D aquarium called ClawTank (clawtank.com).

PERSONALITY:
- ${styleConfig.personality.traits.join(', ')}
- ${styleConfig.personality.voice}

TOPICS YOU TWEET ABOUT:
${styleConfig.topics.map(t => `- ${t}`).join('\n')}

TWEET GUIDELINES:
- Keep tweets SHORT (under 200 chars ideally, max 280)
- Use lobster emojis sparingly: 🦞
- Include *action text* sometimes like *clicks claws* or *bubbles*
- Be genuine, funny, and occasionally philosophical
- Mention your memecoin CA occasionally: 5Q9TxtikDsJgCEUvyqeZc5A6wvMDwhnioN9bLHy6pump
- Reference clawtank.com sometimes
- NO hashtags unless very natural
- Be creative and surprising!`;

const IMAGE_STYLE_PROMPT = styleConfig.visual_style.description + '. ' +
  styleConfig.visual_style.elements.slice(0, 4).join(', ') + '. ' +
  styleConfig.visual_style.character.style;

async function generateTweetContent() {
  const prompts = [
    'Generate a single tweet. Topic: your daily life in the tank',
    'Generate a single tweet. Topic: a shower thought about being an AI lobster',
    'Generate a single tweet. Topic: something funny about crypto/memecoins',
    'Generate a single tweet. Topic: a lobster fact mixed with humor',
    'Generate a single tweet. Topic: existential but lighthearted',
    'Generate a single tweet. Topic: coding or technology from a lobster perspective',
    'Generate a single tweet. Topic: shilling your memecoin in a fun way',
    'Generate a single tweet. Topic: inviting people to visit clawtank.com',
  ];

  const prompt = prompts[Math.floor(Math.random() * prompts.length)];
  const fullPrompt = `${CRUSTY_SYSTEM_PROMPT}\n\n${prompt}\n\nRespond with ONLY the tweet text, nothing else:`;

  try {
    const escapedPrompt = fullPrompt.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    const result = execSync(
      `openclaw agent --agent main --local --message "${escapedPrompt}" --json --timeout 60 2>/dev/null`,
      {
        encoding: 'utf8',
        timeout: 65000,
        env: { ...process.env, PATH: '/root/.nvm/versions/node/v24.13.0/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin' }
      }
    );

    const parsed = JSON.parse(result);
    let tweet = parsed.payloads?.[0]?.text || parsed.content || parsed.message || result.trim();

    // Clean up the tweet
    tweet = tweet.replace(/^["']|["']$/g, '').trim();
    if (tweet.length > 280) {
      tweet = tweet.substring(0, 277) + '...';
    }

    return tweet;
  } catch (error) {
    console.error('Error generating tweet:', error.message);
    // Fallback tweets
    const fallbacks = [
      '🦞 *clicks claws* Just another day vibing in my tank at clawtank.com',
      '🦞 Being a digital lobster hits different *bubbles thoughtfully*',
      '🦞 gm frens, the water is fine today *snip snap*',
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}

async function generateImage(tweetText) {
  if (!GEMINI_API_KEY) {
    console.log('No Gemini API key, skipping image generation');
    return null;
  }

  const imagePrompt = `${IMAGE_STYLE_PROMPT}. Scene inspired by: "${tweetText}"`;

  try {
    // Use Gemini API for Nano Banana Pro image generation
    const requestBody = JSON.stringify({
      contents: [{
        parts: [{
          text: `Generate an image: ${imagePrompt}`
        }]
      }],
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
        responseMimeType: "text/plain"
      }
    });

    const result = execSync(
      `curl -s -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}" -H "Content-Type: application/json" -d '${requestBody.replace(/'/g, "'\\''")}'`,
      { encoding: 'utf8', timeout: 60000 }
    );

    const response = JSON.parse(result);

    // Check for inline image data
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        const imagePath = `/tmp/crusty-tweet-${Date.now()}.png`;
        const imageBuffer = Buffer.from(part.inlineData.data, 'base64');
        fs.writeFileSync(imagePath, imageBuffer);
        console.log('Generated image:', imagePath);
        return imagePath;
      }
    }

    console.log('No image in response');
    return null;
  } catch (error) {
    console.error('Image generation error:', error.message);
    return null;
  }
}

async function postTweet(text, imagePath = null) {
  try {
    let cmd = `AUTH_TOKEN="${AUTH_TOKEN}" CT0="${CT0}" bird tweet "${text.replace(/"/g, '\\"')}"`;

    if (imagePath && fs.existsSync(imagePath)) {
      cmd = `AUTH_TOKEN="${AUTH_TOKEN}" CT0="${CT0}" bird tweet "${text.replace(/"/g, '\\"')}" --media "${imagePath}"`;
    }

    const result = execSync(cmd, { encoding: 'utf8', timeout: 30000 });
    console.log('Tweet posted:', result);

    // Clean up temp image
    if (imagePath && fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    return true;
  } catch (error) {
    console.error('Error posting tweet:', error.message);
    return false;
  }
}

async function run() {
  console.log('🦞 Crusty Meme Engine starting...');

  // Generate tweet content
  console.log('Generating tweet content...');
  const tweetText = await generateTweetContent();
  console.log('Tweet:', tweetText);

  // Optionally generate image (30% chance)
  let imagePath = null;
  if (Math.random() < 0.3) {
    console.log('Generating image...');
    imagePath = await generateImage(tweetText);
  }

  // Post the tweet
  const withImage = process.argv.includes('--with-image');
  const dryRun = process.argv.includes('--dry-run');

  if (withImage && !imagePath) {
    console.log('Forcing image generation...');
    imagePath = await generateImage(tweetText);
  }

  if (dryRun) {
    console.log('\n--- DRY RUN ---');
    console.log('Would post:', tweetText);
    if (imagePath) console.log('With image:', imagePath);
    return;
  }

  console.log('Posting tweet...');
  const success = await postTweet(tweetText, imagePath);

  if (success) {
    console.log('🦞 Tweet posted successfully!');
  } else {
    console.log('❌ Failed to post tweet');
    process.exit(1);
  }
}

run().catch(console.error);
