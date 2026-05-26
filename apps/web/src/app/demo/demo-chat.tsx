'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

type Preset = {
  id: string;
  label: string;
  persona: string;
  kb: string[];
  sampleQ: string;
};

type Msg = { role: 'user' | 'assistant'; content: string };

export function DemoChat({ presets }: { presets: Preset[] }) {
  const [activeId, setActiveId] = useState(presets[0]!.id);
  const active = presets.find((p) => p.id === activeId)!;
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
    setInput(active.sampleQ);
  }, [activeId, active.sampleQ]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pending]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || pending) return;
    const next: Msg[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setPending(true);
    try {
      const res = await fetch('/api/demo/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          persona: active.persona,
          kb: active.kb,
          messages: next,
        }),
      });
      const json = await res.json();
      if (json.error) {
        setMessages((m) => [
          ...m,
          { role: 'assistant', content: `⚠️ ${json.error}` },
        ]);
      } else {
        setMessages((m) => [...m, { role: 'assistant', content: json.reply }]);
      }
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: `⚠️ Error: ${(e as Error).message}` },
      ]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr] max-w-5xl mx-auto">
      {/* Preset selector */}
      <aside className="space-y-2">
        <div className="text-sm font-semibold text-gray-700 mb-2">Pilih industri:</div>
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => setActiveId(p.id)}
            className={`w-full text-left rounded-lg border p-3 text-sm transition ${
              p.id === activeId
                ? 'border-brand bg-brand/5 font-medium'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            {p.label}
          </button>
        ))}
        <details className="mt-4 rounded-lg border bg-white p-3 text-xs">
          <summary className="cursor-pointer font-medium text-gray-700">
            Lihat knowledge base
          </summary>
          <ul className="mt-2 space-y-1 text-gray-600">
            {active.kb.map((k, i) => (
              <li key={i}>• {k}</li>
            ))}
          </ul>
        </details>
      </aside>

      {/* Chat */}
      <div className="flex flex-col rounded-lg border bg-white h-[600px]">
        <div className="border-b px-4 py-3">
          <div className="font-semibold">{active.label}</div>
          <div className="text-xs text-gray-500">Chat seperti customer beneran</div>
        </div>
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">
              Ketik pertanyaan di bawah, atau pakai contoh yang sudah ada.
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-brand text-white'
                    : 'bg-white border text-gray-900'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {pending && (
            <div className="flex justify-start">
              <div className="rounded-lg border bg-white px-3 py-2 text-sm text-gray-400">
                <span className="inline-block animate-pulse">AI sedang mengetik...</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <form onSubmit={onSend} className="border-t p-3">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanya seperti customer..."
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              className="rounded-md bg-brand px-4 py-2 text-white hover:bg-brand-dark disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
