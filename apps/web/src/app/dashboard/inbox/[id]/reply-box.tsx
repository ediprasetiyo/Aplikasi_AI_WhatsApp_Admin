'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Send, Sparkles } from 'lucide-react';
import { sendManualReply, triggerAiReply } from '../actions';

export function ReplyBox({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [pending, startTransition] = useTransition();
  const [aiPending, startAi] = useTransition();

  function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    startTransition(async () => {
      const res = await sendManualReply({ conversationId, text });
      if (res.ok) {
        setText('');
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function onAi() {
    startAi(async () => {
      const res = await triggerAiReply(conversationId);
      if (res.ok && res.data) {
        toast.success('AI menjawab');
        router.refresh();
      } else if (!res.ok) {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={onSend} className="border-t bg-white px-4 py-3">
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ketik balasan..."
          rows={2}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend(e);
            }
          }}
          className="flex-1 resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
        <button
          type="button"
          onClick={onAi}
          disabled={aiPending}
          title="Jawab dengan AI"
          className="rounded-md border border-purple-300 px-3 py-2 text-purple-600 hover:bg-purple-50 disabled:opacity-50"
        >
          <Sparkles className="h-5 w-5" />
        </button>
        <button
          type="submit"
          disabled={pending || !text.trim()}
          className="rounded-md bg-brand px-4 py-2 text-white hover:bg-brand-dark disabled:opacity-50"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-1 text-[11px] text-gray-400">
        Enter untuk kirim · Shift+Enter untuk baris baru · ✨ Jawab dengan AI
      </div>
    </form>
  );
}
