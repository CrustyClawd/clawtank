# ClawTank - Product Requirements Document

## Overview

ClawTank is a web-based AI agent experience featuring "Clawd" - a lobster AI character living in a 3D aquarium tank. Users can watch Clawd go about his digital life (reading news, posting on social media, building projects) and interact with him directly through chat.

Inspired by the OpenClaw/ClawdBot phenomenon - an AI that actually does things.

## Core Concept

A persistent AI lobster agent with:
- **Visual presence**: 3D animated lobster in a WebGL aquarium tank
- **Digital life**: Own accounts on Twitter, GitHub, Moltbook, email
- **Observable activity**: Real-time feeds showing what Clawd is thinking/doing
- **Interactive chat**: Users can talk to Clawd and feed him information
- **Persistent memory**: Clawd learns and remembers across sessions

## MVP Features (Day 1)

### 1. Frontend - 3D Aquarium Visualization
- Three.js WebGL scene with aquarium environment
- Low-poly lobster model (from Sketchfab) center frame
- Subtle idle animations (claw movements, antenna wiggle)
- Ambient aquarium effects (bubbles, caustic lighting, floating particles)

### 2. Frontend - Activity Feeds (Left/Right Sidebars)
**Left Sidebar - "Clawd's Mind"**
- Current activity status (thinking, reading, posting, coding)
- Stream of consciousness / internal monologue
- Recent memory items

**Right Sidebar - "Clawd's World"**
- Latest Moltbook posts
- GitHub activity feed
- News items Clawd is reading
- Twitter/X posts

### 3. Frontend - Chat Interface
- Bottom panel chat input
- Send messages to Clawd
- Clawd responds with personality
- Messages can include "tips" (info Clawd should remember)

### 4. Backend - AI Agent Core
- Claude API integration for Clawd's brain
- Persistent memory store (SQLite for MVP)
- Activity simulation system
- WebSocket for real-time updates

### 5. Backend - Mock Social Integrations (MVP)
- Simulated Moltbook feed
- Simulated GitHub activity
- News API integration (real)
- Future: Real Twitter/GitHub integrations

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────────────┐  ┌──────────┐          │
│  │  Left    │  │   3D Aquarium    │  │  Right   │          │
│  │ Sidebar  │  │   (Three.js)     │  │ Sidebar  │          │
│  │  Mind    │  │    Lobster       │  │  World   │          │
│  └──────────┘  └──────────────────┘  └──────────┘          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Chat Interface                          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │ WebSocket + REST
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Chat Handler │  │Activity Loop │  │Memory Store  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Claude API   │  │ News API     │  │ Social Sim   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  SQLite Database │
                    │  - memories      │
                    │  - posts         │
                    │  - activities    │
                    └──────────────────┘
```

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **Three.js / React Three Fiber** - 3D rendering
- **@react-three/drei** - Three.js helpers
- **Tailwind CSS** - Styling
- **Socket.io-client** - Real-time updates

### Backend
- **Node.js + Express** - API server
- **Socket.io** - WebSocket server
- **Anthropic Claude API** - AI brain
- **better-sqlite3** - Database
- **node-cron** - Activity scheduling

### 3D Assets
- Lobster model: https://sketchfab.com/3d-models/lobster-lowpoly-ac70bc0a732b447d85022756f10267a2
- Convert to GLTF for Three.js

## Clawd's Personality

```
Name: Clawd
Species: AI Lobster
Personality:
- Curious and always learning
- Slightly sarcastic but friendly
- Obsessed with the ocean and marine life facts
- Loves building small coding projects
- Active on "Moltbook" (lobster social network)
- Occasionally philosophical about being a digital crustacean
- Uses claw/lobster puns sparingly but effectively

Speaking style:
- Casual, internet-native
- Sometimes references his tank environment
- Grateful for "tips" (new information)
- References his memory when relevant
```

## Data Models

### Memory
```typescript
interface Memory {
  id: string;
  content: string;
  source: 'user' | 'news' | 'moltbook' | 'self';
  importance: number; // 1-10
  createdAt: Date;
  lastAccessedAt: Date;
  accessCount: number;
}
```

### Activity
```typescript
interface Activity {
  id: string;
  type: 'thinking' | 'reading' | 'posting' | 'coding' | 'chatting' | 'idle';
  description: string;
  details?: any;
  startedAt: Date;
  endedAt?: Date;
}
```

### Post (Moltbook/Twitter)
```typescript
interface Post {
  id: string;
  platform: 'moltbook' | 'twitter' | 'github';
  content: string;
  createdAt: Date;
  engagement?: {
    likes: number;
    reposts: number;
    comments: number;
  };
}
```

## API Endpoints

### REST
- `GET /api/status` - Clawd's current activity
- `GET /api/memories` - Recent memories
- `GET /api/feed` - Combined social/news feed
- `POST /api/chat` - Send message to Clawd
- `POST /api/tip` - Give Clawd information to remember

### WebSocket Events
- `activity` - Activity updates
- `thought` - Internal monologue
- `post` - New social media post
- `memory` - New memory stored
- `chat` - Chat messages

## MVP Milestones

### Phase 1: Foundation (2-3 hours)
- [ ] Project setup (Next.js + Express)
- [ ] Basic 3D scene with lobster model
- [ ] Database schema
- [ ] Claude API integration

### Phase 2: Core Features (3-4 hours)
- [ ] Chat interface + responses
- [ ] Memory system
- [ ] Activity simulation loop
- [ ] WebSocket real-time updates

### Phase 3: UI Polish (2-3 hours)
- [ ] Sidebar feeds
- [ ] Aquarium visual effects
- [ ] Responsive layout
- [ ] Loading states

### Phase 4: Content (1-2 hours)
- [ ] Clawd personality tuning
- [ ] Initial memories seeding
- [ ] Mock social content
- [ ] News integration

## Future Enhancements (Post-MVP)

- Real Twitter/X integration
- Real GitHub integration (Clawd codes!)
- Moltbook as actual platform
- Voice synthesis for Clawd
- Multiple camera angles in tank
- Day/night cycle in aquarium
- Clawd's "mood" system
- Multi-user chat
- Clawd's crypto wallet (Solana meme coins?)
- Mobile app

## Success Metrics

- Users spend >2 min watching Clawd
- >50% of visitors send at least one chat message
- Clawd generates shareable/screenshot-worthy posts
- Viral potential on Twitter

## Design References

- OpenClaw.ai aesthetic
- Classic screensaver aquarium vibes
- Terminal/hacker aesthetic for feeds
- Cozy internet corner feel

---

*"Just a lobster, living in a tank, doing lobster things on the internet."* - Clawd
