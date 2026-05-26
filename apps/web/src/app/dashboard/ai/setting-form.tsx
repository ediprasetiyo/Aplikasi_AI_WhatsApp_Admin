'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { saveAiSetting } from './actions';

type Initial = {
  enabled: boolean;
  systemPrompt: string;
  model: string;
  replyDelayMs: number;
};

const MODELS = [
  { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (default, kualitas terbaik)' },
  { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B (paling cepat)' },
  { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
];

export function SettingForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(initial.enabled);
  const [systemPrompt, setSystemPrompt] = useState(initial.systemPrompt);
  const [model, setModel] = useState(initial.model);
  const [replyDelayMs, setReplyDelayMs] = useState(initial.replyDelayMs);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveAiSetting({ enabled, systemPrompt, model, replyDelayMs });
      if (res.ok) {
        toast.success('Pengaturan disimpan');
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
        />
        <span className="text-sm font-medium">Aktifkan auto-reply AI</span>
      </label>

      <label className="block">
        <span className="text-sm font-medium">Persona / System Prompt</span>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={6}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
        <span className="mt-1 block text-xs text-gray-500">
          Instruksi karakter AI. Mis: "Anda admin Klinik Sehat, ramah & profesional..."
        </span>
      </label>

      <label className="block">
        <span className="text-sm font-medium">Model</span>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          {MODELS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium">Delay sebelum balas (ms)</span>
        <input
          type="number"
          value={replyDelayMs}
          onChange={(e) => setReplyDelayMs(Number(e.target.value))}
          min={0}
          max={60000}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <span className="mt-1 block text-xs text-gray-500">
          1500 = 1.5 detik. Biar tidak terlihat seperti bot.
        </span>
      </label>

      <button
        disabled={pending}
        className="w-full rounded-md bg-brand py-2.5 font-medium text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {pending ? 'Menyimpan...' : 'Simpan Pengaturan'}
      </button>
    </form>
  );
}
