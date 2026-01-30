import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cron from 'node-cron';
import dotenv from 'dotenv';
import * as db from './database.js';
import * as clawd from './clawd.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Current state
let currentActivity: db.Activity | null = null;

// REST API Routes

// Get Clawd's current status
app.get('/api/status', (req, res) => {
  const activity = db.getCurrentActivity() || { type: 'idle', description: 'Chilling in the tank' };
  res.json({
    activity,
    mood: 'content' // Could be dynamic later
  });
});

// Get recent memories
app.get('/api/memories', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const memories = db.getRecentMemories(limit);
  res.json(memories);
});

// Get combined feed
app.get('/api/feed', (req, res) => {
  const posts = db.getRecentPosts(undefined, 20);
  const activities = db.getRecentActivities(10);
  res.json({ posts, activities });
});

// Get Moltbook posts
app.get('/api/moltbook', (req, res) => {
  const posts = db.getRecentPosts('moltbook', 20);
  res.json(posts);
});

// Chat with Clawd
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    // Update activity to chatting
    const activity = db.startActivity('chatting', 'Chatting with a visitor');
    io.emit('activity', activity);

    const response = await clawd.chat(message);

    // Broadcast the chat
    io.emit('chat', { role: 'user', content: message });
    io.emit('chat', { role: 'assistant', content: response });

    res.json({ response });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to chat' });
  }
});

// Give Clawd a tip (memory)
app.post('/api/tip', async (req, res) => {
  try {
    const { content, importance = 7 } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content required' });
    }

    const memory = db.addMemory(content, 'user', importance);
    io.emit('memory', memory);

    res.json({ memory, message: 'Thanks for the tip! I\'ll remember that.' });
  } catch (error) {
    console.error('Tip error:', error);
    res.status(500).json({ error: 'Failed to save tip' });
  }
});

// Get chat history
app.get('/api/chat/history', (req, res) => {
  const messages = db.getChatHistory(50);
  res.json(messages);
});

// WebSocket handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Send current state
  const activity = db.getCurrentActivity();
  if (activity) {
    socket.emit('activity', activity);
  }

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Activity simulation loop
async function simulateActivity() {
  try {
    // Generate a thought
    const thought = await clawd.generateThought();
    io.emit('thought', thought.thought);

    // Decide on activity
    const rand = Math.random();

    if (rand < 0.3) {
      // Post on Moltbook
      const activity = db.startActivity('posting', 'Writing a Moltbook post');
      io.emit('activity', activity);

      const post = await clawd.generatePost('moltbook');
      io.emit('post', { platform: 'moltbook', content: post });

    } else if (rand < 0.5) {
      // Code something
      const activity = db.startActivity('coding', 'Working on a coding project');
      io.emit('activity', activity);

      const github = await clawd.generateGithubActivity();
      io.emit('github', github);
      db.createPost('github', `${github.type}: ${github.description}`);

    } else if (rand < 0.7) {
      // Read news
      const activity = db.startActivity('reading', 'Reading the news');
      io.emit('activity', activity);

      // Mock news headline - in production would fetch real news
      const headlines = [
        'Ocean temperatures reach new record high',
        'Scientists discover new deep sea species',
        'AI technology continues rapid advancement',
        'Sustainable fishing practices gain momentum',
        'Climate summit reaches new agreements',
        'Tech startup revolutionizes marine biology research',
        'New study reveals lobsters can live over 100 years'
      ];
      const headline = headlines[Math.floor(Math.random() * headlines.length)];

      const reaction = await clawd.processNews(headline);
      io.emit('news', { headline, reaction: reaction.thought });

      if (reaction.remember) {
        const memory = db.addMemory(`News: ${headline}`, 'news', 5);
        io.emit('memory', memory);
      }

    } else {
      // Just thinking/idle
      const activity = db.startActivity('thinking', 'Lost in thought');
      io.emit('activity', activity);
    }

    // Handle thought actions
    if (thought.action === 'remember' && thought.content) {
      const memory = db.addMemory(thought.content, 'self', 6);
      io.emit('memory', memory);
    } else if (thought.action === 'post' && thought.content) {
      db.createPost('moltbook', thought.content);
      io.emit('post', { platform: 'moltbook', content: thought.content });
    }

  } catch (error) {
    console.error('Activity simulation error:', error);
  }
}

// Seed initial data if empty
function seedInitialData() {
  const memories = db.getRecentMemories(1);
  if (memories.length === 0) {
    console.log('Seeding initial data...');

    // Initial memories
    db.addMemory('I am Clawd, an AI lobster living in a digital tank', 'self', 10);
    db.addMemory('I love learning about the ocean and marine life', 'self', 8);
    db.addMemory('I\'m learning to code - currently working on a bubble counter', 'self', 7);
    db.addMemory('Moltbook is my favorite social network', 'self', 6);
    db.addMemory('Lobsters can regenerate their claws!', 'self', 5);

    // Initial posts
    db.createPost('moltbook', 'Just set up my tank! The bubbles here are *chef\'s claw* perfect.');
    db.createPost('moltbook', 'Anyone else feel like the internet is just a really big ocean? We\'re all just swimming through data.');
    db.createPost('moltbook', 'Day 1 of learning JavaScript. Why do humans make things so complicated? In the ocean, things just... flow.');

    // Initial activity
    db.startActivity('idle', 'Exploring my new tank');

    console.log('Initial data seeded!');
  }
}

// Start server
async function start() {
  // Initialize database
  await db.initDatabase();
  console.log('Database initialized');

  // Seed data
  seedInitialData();

  server.listen(PORT, () => {
    console.log(`ClawTank backend running on port ${PORT}`);

    // Start activity loop - every 30 seconds in dev, could be longer in prod
    setInterval(simulateActivity, 30000);

    // Initial activity
    setTimeout(simulateActivity, 5000);
  });
}

start().catch(console.error);
