'use client';

import { useClawdStore } from '@/store/clawd';

function ActivityIndicator() {
  const activity = useClawdStore((s) => s.activity);

  const activityIcons: Record<string, string> = {
    thinking: '💭',
    reading: '📰',
    posting: '✍️',
    coding: '💻',
    chatting: '💬',
    idle: '🦞'
  };

  const activityColors: Record<string, string> = {
    thinking: 'text-purple-400',
    reading: 'text-blue-400',
    posting: 'text-green-400',
    coding: 'text-yellow-400',
    chatting: 'text-pink-400',
    idle: 'text-gray-400'
  };

  const type = activity?.type || 'idle';

  return (
    <div className="bg-tank-dark/80 rounded-lg p-4 border border-tank-accent/20">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{activityIcons[type]}</span>
        <span className={`font-mono text-sm uppercase ${activityColors[type]}`}>
          {type}
        </span>
        <span className="ml-auto flex gap-1">
          <span className="w-2 h-2 bg-tank-glow rounded-full animate-pulse" />
          <span className="w-2 h-2 bg-tank-glow rounded-full animate-pulse delay-75" />
          <span className="w-2 h-2 bg-tank-glow rounded-full animate-pulse delay-150" />
        </span>
      </div>
      <p className="text-gray-300 text-sm">
        {activity?.description || 'Chilling in the tank...'}
      </p>
    </div>
  );
}

function ThoughtStream() {
  const thoughts = useClawdStore((s) => s.thoughts);

  return (
    <div className="bg-tank-dark/80 rounded-lg p-4 border border-tank-accent/20 flex-1 overflow-hidden">
      <h3 className="font-mono text-tank-accent text-sm uppercase mb-3 flex items-center gap-2">
        <span>💭</span> Clawd's Mind
      </h3>
      <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin">
        {thoughts.length === 0 ? (
          <p className="text-gray-500 text-sm italic">Thoughts will appear here...</p>
        ) : (
          thoughts.map((thought, i) => (
            <div
              key={i}
              className={`text-sm p-2 rounded bg-tank-water/50 border-l-2 border-purple-400/50 ${
                i === 0 ? 'opacity-100' : 'opacity-60'
              }`}
            >
              <p className="text-gray-300">{thought}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function MemoryFeed() {
  const memories = useClawdStore((s) => s.memories);

  const sourceIcons: Record<string, string> = {
    user: '👤',
    news: '📰',
    moltbook: '🦐',
    self: '🦞'
  };

  return (
    <div className="bg-tank-dark/80 rounded-lg p-4 border border-tank-accent/20 flex-1 overflow-hidden">
      <h3 className="font-mono text-tank-accent text-sm uppercase mb-3 flex items-center gap-2">
        <span>🧠</span> Memories
      </h3>
      <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin">
        {memories.length === 0 ? (
          <p className="text-gray-500 text-sm italic">No memories yet...</p>
        ) : (
          memories.slice(0, 10).map((memory) => (
            <div
              key={memory.id}
              className="text-sm p-2 rounded bg-tank-water/50 border-l-2 border-tank-glow/50"
            >
              <div className="flex items-start gap-2">
                <span>{sourceIcons[memory.source] || '📝'}</span>
                <p className="text-gray-300 flex-1">{memory.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function LeftSidebar() {
  const connected = useClawdStore((s) => s.connected);

  return (
    <div className="w-80 bg-gradient-to-b from-tank-dark to-tank-water/50 p-4 flex flex-col gap-4 border-r border-tank-accent/20">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-tank-accent">ClawTank</h2>
        <span className={`text-xs px-2 py-1 rounded-full ${connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {connected ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>

      <ActivityIndicator />
      <ThoughtStream />
      <MemoryFeed />
    </div>
  );
}
