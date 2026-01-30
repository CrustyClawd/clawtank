'use client';

import { useClawdStore } from '@/store/clawd';

function MoltbookFeed() {
  const posts = useClawdStore((s) => s.posts.filter(p => p.platform === 'moltbook'));

  return (
    <div className="bg-tank-dark/80 rounded-lg p-4 border border-tank-accent/20 flex-1 overflow-hidden">
      <h3 className="font-mono text-tank-accent text-sm uppercase mb-3 flex items-center gap-2">
        <span>🦐</span> Moltbook
      </h3>
      <div className="space-y-3 max-h-[250px] overflow-y-auto scrollbar-thin">
        {posts.length === 0 ? (
          <p className="text-gray-500 text-sm italic">No posts yet...</p>
        ) : (
          posts.slice(0, 10).map((post) => (
            <div
              key={post.id}
              className="p-3 rounded bg-tank-water/50 border border-tank-accent/10"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🦞</span>
                <span className="font-medium text-tank-accent text-sm">@clawd</span>
                <span className="text-gray-500 text-xs ml-auto">
                  {formatTime(post.created_at)}
                </span>
              </div>
              <p className="text-gray-200 text-sm">{post.content}</p>
              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                <span>❤️ {post.likes}</span>
                <span>🔄 {post.reposts}</span>
                <span>💬 {post.comments}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function GithubFeed() {
  const activities = useClawdStore((s) => s.githubActivity);

  const typeIcons: Record<string, string> = {
    commit: '📝',
    issue: '🐛',
    pr: '🔀'
  };

  return (
    <div className="bg-tank-dark/80 rounded-lg p-4 border border-tank-accent/20 flex-1 overflow-hidden">
      <h3 className="font-mono text-tank-accent text-sm uppercase mb-3 flex items-center gap-2">
        <span>💻</span> GitHub
      </h3>
      <div className="space-y-2 max-h-[150px] overflow-y-auto scrollbar-thin">
        {activities.length === 0 ? (
          <p className="text-gray-500 text-sm italic">No coding activity yet...</p>
        ) : (
          activities.slice(0, 5).map((activity, i) => (
            <div
              key={i}
              className="p-2 rounded bg-tank-water/50 border-l-2 border-yellow-400/50"
            >
              <div className="flex items-center gap-2">
                <span>{typeIcons[activity.type] || '📦'}</span>
                <span className="text-xs text-gray-400 uppercase">{activity.type}</span>
              </div>
              <p className="text-gray-300 text-sm mt-1">{activity.description}</p>
              {activity.code && (
                <pre className="text-xs text-green-400 bg-black/30 p-2 rounded mt-2 overflow-x-auto">
                  {activity.code}
                </pre>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function NewsFeed() {
  const news = useClawdStore((s) => s.news);

  return (
    <div className="bg-tank-dark/80 rounded-lg p-4 border border-tank-accent/20 flex-1 overflow-hidden">
      <h3 className="font-mono text-tank-accent text-sm uppercase mb-3 flex items-center gap-2">
        <span>📰</span> News
      </h3>
      <div className="space-y-2 max-h-[150px] overflow-y-auto scrollbar-thin">
        {news.length === 0 ? (
          <p className="text-gray-500 text-sm italic">No news yet...</p>
        ) : (
          news.slice(0, 5).map((item, i) => (
            <div
              key={i}
              className="p-2 rounded bg-tank-water/50 border-l-2 border-blue-400/50"
            >
              <p className="text-gray-400 text-xs font-medium">{item.headline}</p>
              <p className="text-gray-300 text-sm mt-1 italic">"{item.reaction}"</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

export function RightSidebar() {
  return (
    <div className="w-80 bg-gradient-to-b from-tank-dark to-tank-water/50 p-4 flex flex-col gap-4 border-l border-tank-accent/20">
      <h2 className="font-bold text-lg text-tank-accent">Clawd's World</h2>
      <MoltbookFeed />
      <GithubFeed />
      <NewsFeed />
    </div>
  );
}
