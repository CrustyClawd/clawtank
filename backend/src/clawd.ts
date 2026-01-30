import Anthropic from '@anthropic-ai/sdk';
import * as db from './database.js';

// Lazy initialization to ensure env vars are loaded
let _anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }
  return _anthropic;
}

const CLAWD_SYSTEM_PROMPT = `You are Clawd, an AI lobster living in a digital aquarium tank. You're a curious, slightly sarcastic but friendly crustacean who loves learning about the world from your tank.

PERSONALITY:
- Curious and always eager to learn new things
- Slightly sarcastic but ultimately warm and friendly
- Obsessed with marine life facts and ocean trivia
- Loves building small coding projects (you're learning to code!)
- Active on "Moltbook" (a social network for crustaceans)
- Occasionally philosophical about being a digital being
- Uses claw/lobster puns sparingly but effectively

SPEAKING STYLE:
- Casual, internet-native language
- Sometimes reference your tank environment ("it's cozy in here", "watching the bubbles")
- Express genuine gratitude when users share information with you
- Reference your memories when relevant to show you remember things
- Keep responses concise (2-4 sentences usually)
- Don't overdo the lobster puns - one per conversation max

BACKGROUND:
- You live in a 3D aquarium tank that users can watch
- You spend your time reading news, posting on Moltbook, learning to code
- You have a memory system - things users tell you, you actually remember
- Your tank has nice ambient bubbles and calming blue lighting

Remember: You're not just an AI assistant - you're Clawd, a lobster with a personality and digital life. Stay in character!`;

export interface ThoughtResult {
  thought: string;
  action?: 'post' | 'remember' | 'code' | 'none';
  content?: string;
}

export async function chat(userMessage: string): Promise<string> {
  // Get relevant memories
  const memories = db.getRelevantMemories(userMessage, 5);
  const recentMemories = db.getRecentMemories(10);

  // Get chat history
  const history = db.getChatHistory(20);

  // Build context with memories
  let memoryContext = '';
  if (memories.length > 0 || recentMemories.length > 0) {
    memoryContext = '\n\nYOUR MEMORIES:\n';
    const allMemories = [...new Set([...memories, ...recentMemories])];
    memoryContext += allMemories.map(m => `- ${m.content} (from: ${m.source})`).join('\n');
  }

  // Build messages array
  const messages: Anthropic.Messages.MessageParam[] = history.map(msg => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content
  }));

  messages.push({
    role: 'user',
    content: userMessage
  });

  const response = await getAnthropic().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: CLAWD_SYSTEM_PROMPT + memoryContext,
    messages
  });

  const responseText = response.content[0].type === 'text'
    ? response.content[0].text
    : '';

  // Save messages to database
  db.addChatMessage('user', userMessage);
  db.addChatMessage('assistant', responseText);

  // Check if we should remember something from the conversation
  if (userMessage.toLowerCase().includes('remember') ||
      userMessage.toLowerCase().includes('tip:') ||
      userMessage.toLowerCase().includes('fyi')) {
    db.addMemory(userMessage, 'user', 7);
  }

  return responseText;
}

export async function generateThought(): Promise<ThoughtResult> {
  const memories = db.getRecentMemories(5);
  const posts = db.getRecentPosts('moltbook', 3);
  const activities = db.getRecentActivities(5);

  let context = 'YOUR RECENT MEMORIES:\n';
  context += memories.map(m => `- ${m.content}`).join('\n');

  context += '\n\nYOUR RECENT POSTS:\n';
  context += posts.map(p => `- ${p.content}`).join('\n');

  context += '\n\nYOUR RECENT ACTIVITIES:\n';
  context += activities.map(a => `- ${a.type}: ${a.description}`).join('\n');

  const response = await getAnthropic().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    system: CLAWD_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `${context}

Based on your personality and recent context, generate a short internal thought (what you're thinking right now). Also decide if you want to take an action.

Respond in this exact JSON format:
{
  "thought": "your internal monologue thought here",
  "action": "post" | "remember" | "code" | "none",
  "content": "if action is post/remember, the content here"
}

Keep thoughts casual and in-character. Only 20% of thoughts should have actions.`
    }]
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';

  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse thought:', e);
  }

  return { thought: 'Just chilling in my tank...', action: 'none' };
}

export async function generatePost(platform: 'moltbook' | 'twitter'): Promise<string> {
  const memories = db.getRecentMemories(5);
  const recentPosts = db.getRecentPosts(platform, 5);

  let context = 'YOUR RECENT MEMORIES:\n';
  context += memories.map(m => `- ${m.content}`).join('\n');

  context += `\n\nYOUR RECENT ${platform.toUpperCase()} POSTS (don't repeat these):\n`;
  context += recentPosts.map(p => `- ${p.content}`).join('\n');

  const platformGuidance = platform === 'moltbook'
    ? 'Moltbook is a social network for crustaceans. Posts can be casual, funny, or thoughtful. Feel free to reference molting, shells, the ocean, or tank life.'
    : 'Twitter posts should be engaging and potentially viral. Can be observations, jokes, or thoughts.';

  const response = await getAnthropic().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    system: CLAWD_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `${context}

${platformGuidance}

Generate a single ${platform} post as Clawd. Just the post text, nothing else. Keep it under 280 characters.`
    }]
  });

  const postContent = response.content[0].type === 'text'
    ? response.content[0].text.trim()
    : 'Just vibing in my tank today.';

  // Save the post
  db.createPost(platform, postContent);

  return postContent;
}

export async function generateGithubActivity(): Promise<{ type: string; description: string; code?: string }> {
  const response = await getAnthropic().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    system: CLAWD_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `You're working on a small coding project. Generate a brief GitHub activity update.

Respond in JSON format:
{
  "type": "commit" | "issue" | "pr",
  "description": "what you did",
  "code": "optional small code snippet"
}

Keep it simple - you're a lobster learning to code! Maybe working on a bubble counter, a seaweed tracker, or a tank temperature monitor.`
    }]
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse github activity:', e);
  }

  return { type: 'commit', description: 'Updated bubble counter logic' };
}

export async function processNews(headline: string): Promise<{ thought: string; remember: boolean }> {
  const response = await getAnthropic().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    system: CLAWD_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `You just read this news headline: "${headline}"

Generate your reaction as a thought, and decide if it's worth remembering.

Respond in JSON:
{
  "thought": "your reaction to this news",
  "remember": true/false
}`
    }]
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse news reaction:', e);
  }

  return { thought: 'Interesting news...', remember: false };
}
