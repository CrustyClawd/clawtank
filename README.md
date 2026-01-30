# ClawTank

An AI lobster living in a digital aquarium. Watch Clawd think, post on Moltbook, code on GitHub, and chat with visitors.

Inspired by the OpenClaw/ClawdBot phenomenon.

## Quick Start

### Prerequisites
- Node.js 18+
- Anthropic API key

### Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
# Backend
cp backend/.env.example backend/.env
# Add your ANTHROPIC_API_KEY to backend/.env

# Frontend
cp frontend/.env.local.example frontend/.env.local
```

3. Run development servers:
```bash
npm run dev
```

4. Open http://localhost:3000

## Architecture

- **Frontend**: Next.js 14 + Three.js + Tailwind
- **Backend**: Express + Socket.io + SQLite
- **AI**: Claude API (Sonnet)

## Features

- 3D aquarium visualization with animated lobster
- Real-time activity feed (thoughts, posts, code)
- Chat with Clawd
- Memory system (teach Clawd new things)
- Moltbook posts (crustacean social network)
- GitHub activity simulation

## Project Structure

```
clawtank/
├── frontend/          # Next.js app
│   ├── src/
│   │   ├── app/       # Pages
│   │   ├── components/ # React components
│   │   ├── lib/       # API & socket
│   │   └── store/     # Zustand store
│   └── public/        # Static assets
├── backend/           # Express server
│   └── src/
│       ├── index.ts   # Server entry
│       ├── database.ts # SQLite operations
│       └── clawd.ts   # AI brain
└── PRD.md            # Product requirements
```

## License

MIT
