import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface Memory {
  id: string;
  content: string;
  source: 'user' | 'news' | 'moltbook' | 'self';
  importance: number;
  created_at: string;
  last_accessed_at: string;
  access_count: number;
}

export interface Activity {
  id: string;
  type: 'thinking' | 'reading' | 'posting' | 'coding' | 'chatting' | 'idle';
  description: string;
  details?: string;
  started_at: string;
  ended_at?: string;
}

export interface Post {
  id: string;
  platform: 'moltbook' | 'twitter' | 'github';
  content: string;
  created_at: string;
  likes: number;
  reposts: number;
  comments: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface DatabaseSchema {
  memories: Memory[];
  activities: Activity[];
  posts: Post[];
  chatMessages: ChatMessage[];
}

const defaultData: DatabaseSchema = {
  memories: [],
  activities: [],
  posts: [],
  chatMessages: []
};

const adapter = new JSONFile<DatabaseSchema>(join(__dirname, '..', 'data.json'));
const db = new Low<DatabaseSchema>(adapter, defaultData);

// Initialize database
export async function initDatabase() {
  await db.read();
  db.data ||= defaultData;
  await db.write();
}

// Memory operations
export function addMemory(content: string, source: Memory['source'], importance: number = 5): Memory {
  const now = new Date().toISOString();
  const memory: Memory = {
    id: uuidv4(),
    content,
    source,
    importance,
    created_at: now,
    last_accessed_at: now,
    access_count: 0
  };
  db.data!.memories.unshift(memory);
  db.write();
  return memory;
}

export function getMemory(id: string): Memory | undefined {
  return db.data!.memories.find(m => m.id === id);
}

export function getRecentMemories(limit: number = 20): Memory[] {
  return db.data!.memories
    .sort((a, b) => new Date(b.last_accessed_at).getTime() - new Date(a.last_accessed_at).getTime())
    .slice(0, limit);
}

export function getRelevantMemories(query: string, limit: number = 5): Memory[] {
  const keywords = query.toLowerCase().split(/\s+/);
  return db.data!.memories
    .filter(m => keywords.some(k => m.content.toLowerCase().includes(k)))
    .sort((a, b) => b.importance - a.importance || b.access_count - a.access_count)
    .slice(0, limit);
}

export function accessMemory(id: string): void {
  const memory = db.data!.memories.find(m => m.id === id);
  if (memory) {
    memory.last_accessed_at = new Date().toISOString();
    memory.access_count++;
    db.write();
  }
}

// Activity operations
export function startActivity(type: Activity['type'], description: string, details?: any): Activity {
  const now = new Date().toISOString();

  // End any current activity
  db.data!.activities.forEach(a => {
    if (!a.ended_at) {
      a.ended_at = now;
    }
  });

  const activity: Activity = {
    id: uuidv4(),
    type,
    description,
    details: details ? JSON.stringify(details) : undefined,
    started_at: now
  };

  db.data!.activities.unshift(activity);
  db.write();
  return activity;
}

export function getActivity(id: string): Activity | undefined {
  return db.data!.activities.find(a => a.id === id);
}

export function getCurrentActivity(): Activity | undefined {
  return db.data!.activities.find(a => !a.ended_at);
}

export function getRecentActivities(limit: number = 10): Activity[] {
  return db.data!.activities
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
    .slice(0, limit);
}

// Post operations
export function createPost(platform: Post['platform'], content: string): Post {
  const post: Post = {
    id: uuidv4(),
    platform,
    content,
    created_at: new Date().toISOString(),
    likes: Math.floor(Math.random() * 10),
    reposts: Math.floor(Math.random() * 3),
    comments: Math.floor(Math.random() * 5)
  };

  db.data!.posts.unshift(post);
  db.write();
  return post;
}

export function getPost(id: string): Post | undefined {
  return db.data!.posts.find(p => p.id === id);
}

export function getRecentPosts(platform?: string, limit: number = 20): Post[] {
  let posts = db.data!.posts;
  if (platform) {
    posts = posts.filter(p => p.platform === platform);
  }
  return posts
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

export function updatePostEngagement(id: string, likes: number, reposts: number, comments: number): void {
  const post = db.data!.posts.find(p => p.id === id);
  if (post) {
    post.likes = likes;
    post.reposts = reposts;
    post.comments = comments;
    db.write();
  }
}

// Chat operations
export function addChatMessage(role: ChatMessage['role'], content: string): ChatMessage {
  const message: ChatMessage = {
    id: uuidv4(),
    role,
    content,
    created_at: new Date().toISOString()
  };

  db.data!.chatMessages.push(message);
  // Keep only last 200 messages
  if (db.data!.chatMessages.length > 200) {
    db.data!.chatMessages = db.data!.chatMessages.slice(-200);
  }
  db.write();
  return message;
}

export function getChatMessage(id: string): ChatMessage | undefined {
  return db.data!.chatMessages.find(m => m.id === id);
}

export function getRecentChatMessages(limit: number = 50): ChatMessage[] {
  return db.data!.chatMessages
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

export function getChatHistory(limit: number = 20): ChatMessage[] {
  return db.data!.chatMessages.slice(-limit);
}

export default db;
