'use client';

import { useState, useRef, useEffect } from 'react';
import { useClawdStore } from '@/store/clawd';
import { sendChat, sendTip } from '@/lib/api';

export function ChatPanel() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'chat' | 'tip'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatMessages = useClawdStore((s) => s.chatMessages);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      if (mode === 'tip') {
        await sendTip(message);
      } else {
        await sendChat(message);
      }
    } catch (error) {
      console.error('Failed to send:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-t from-tank-dark to-tank-dark/80 border-t border-tank-accent/20 p-4">
      {/* Messages */}
      <div className="h-32 overflow-y-auto mb-3 space-y-2 scrollbar-thin">
        {chatMessages.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">
            Say hi to Clawd! He loves to chat.
          </p>
        ) : (
          chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && <span className="text-lg">🦞</span>}
              <div
                className={`max-w-[80%] p-2 rounded-lg text-sm ${
                  msg.role === 'user'
                    ? 'bg-tank-accent/20 text-tank-accent'
                    : 'bg-tank-water/50 text-gray-200'
                }`}
              >
                {msg.content}
              </div>
              {msg.role === 'user' && <span className="text-lg">👤</span>}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex bg-tank-water/30 rounded-lg overflow-hidden border border-tank-accent/20">
          <button
            type="button"
            onClick={() => setMode('chat')}
            className={`px-3 py-2 text-xs font-mono transition-colors ${
              mode === 'chat'
                ? 'bg-tank-accent/20 text-tank-accent'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            💬 Chat
          </button>
          <button
            type="button"
            onClick={() => setMode('tip')}
            className={`px-3 py-2 text-xs font-mono transition-colors ${
              mode === 'tip'
                ? 'bg-tank-glow/20 text-tank-glow'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            🧠 Tip
          </button>
        </div>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === 'tip' ? 'Tell Clawd something to remember...' : 'Say something to Clawd...'}
          className="flex-1 bg-tank-water/30 border border-tank-accent/20 rounded-lg px-4 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-tank-accent/50"
          disabled={isLoading}
        />

        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            isLoading || !input.trim()
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : mode === 'tip'
              ? 'bg-tank-glow/20 text-tank-glow hover:bg-tank-glow/30 border border-tank-glow/50'
              : 'bg-tank-accent/20 text-tank-accent hover:bg-tank-accent/30 border border-tank-accent/50'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">🦞</span>
            </span>
          ) : (
            'Send'
          )}
        </button>
      </form>

      {mode === 'tip' && (
        <p className="text-xs text-tank-glow/60 mt-2">
          Tips are stored in Clawd's memory. He'll remember what you tell him!
        </p>
      )}
    </div>
  );
}
