import { io, Socket } from 'socket.io-client';
import { useClawdStore } from '@/store/clawd';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export function initSocket() {
  if (socket) return socket;

  socket = io(BACKEND_URL, {
    transports: ['websocket', 'polling']
  });

  const store = useClawdStore.getState();

  socket.on('connect', () => {
    console.log('Connected to ClawTank backend');
    store.setConnected(true);
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from ClawTank backend');
    store.setConnected(false);
  });

  socket.on('activity', (activity) => {
    store.setActivity(activity);
  });

  socket.on('thought', (thought: string) => {
    store.addThought(thought);
  });

  socket.on('memory', (memory) => {
    store.addMemory(memory);
  });

  socket.on('post', (data: { platform: string; content: string }) => {
    store.addPost({
      id: Date.now().toString(),
      platform: data.platform,
      content: data.content,
      created_at: new Date().toISOString(),
      likes: 0,
      reposts: 0,
      comments: 0
    });
  });

  socket.on('chat', (message: { role: 'user' | 'assistant'; content: string }) => {
    store.addChatMessage({
      id: Date.now().toString(),
      role: message.role,
      content: message.content,
      created_at: new Date().toISOString()
    });
  });

  socket.on('news', (news: { headline: string; reaction: string }) => {
    store.addNews(news);
  });

  socket.on('github', (activity: { type: string; description: string; code?: string }) => {
    store.addGithubActivity(activity);
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
