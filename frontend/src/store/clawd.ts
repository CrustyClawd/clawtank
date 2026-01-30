import { create } from 'zustand';

export interface Activity {
  id: string;
  type: 'thinking' | 'reading' | 'posting' | 'coding' | 'chatting' | 'idle';
  description: string;
  started_at: string;
}

export interface Memory {
  id: string;
  content: string;
  source: string;
  created_at: string;
}

export interface Post {
  id: string;
  platform: string;
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

interface ClawdState {
  // Current state
  activity: Activity | null;
  thoughts: string[];
  mood: string;

  // Feeds
  memories: Memory[];
  posts: Post[];
  chatMessages: ChatMessage[];
  news: { headline: string; reaction: string }[];
  githubActivity: { type: string; description: string; code?: string }[];

  // Connection
  connected: boolean;

  // Actions
  setActivity: (activity: Activity) => void;
  addThought: (thought: string) => void;
  addMemory: (memory: Memory) => void;
  addPost: (post: Post) => void;
  addChatMessage: (message: ChatMessage) => void;
  addNews: (news: { headline: string; reaction: string }) => void;
  addGithubActivity: (activity: { type: string; description: string; code?: string }) => void;
  setConnected: (connected: boolean) => void;
  setInitialData: (data: {
    memories?: Memory[];
    posts?: Post[];
    chatMessages?: ChatMessage[];
  }) => void;
}

export const useClawdStore = create<ClawdState>((set) => ({
  activity: null,
  thoughts: [],
  mood: 'content',
  memories: [],
  posts: [],
  chatMessages: [],
  news: [],
  githubActivity: [],
  connected: false,

  setActivity: (activity) => set({ activity }),

  addThought: (thought) =>
    set((state) => ({
      thoughts: [thought, ...state.thoughts].slice(0, 20)
    })),

  addMemory: (memory) =>
    set((state) => ({
      memories: [memory, ...state.memories].slice(0, 50)
    })),

  addPost: (post) =>
    set((state) => ({
      posts: [post, ...state.posts].slice(0, 50)
    })),

  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, message].slice(-100)
    })),

  addNews: (news) =>
    set((state) => ({
      news: [news, ...state.news].slice(0, 20)
    })),

  addGithubActivity: (activity) =>
    set((state) => ({
      githubActivity: [activity, ...state.githubActivity].slice(0, 20)
    })),

  setConnected: (connected) => set({ connected }),

  setInitialData: (data) =>
    set((state) => ({
      memories: data.memories || state.memories,
      posts: data.posts || state.posts,
      chatMessages: data.chatMessages || state.chatMessages
    }))
}));
