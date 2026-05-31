'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCheck, X } from 'lucide-react';
import { markConversationsRead } from './actions';

export function BulkActionBar({ selectedIds }: { selectedIds: string[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onMarkRead() {
    startTransition(async () => {
      const res = await markConversationsRead(selectedIds);
      if (res.ok) {
        toast.success(`${res.data?.count ?? 0} chat ditandai sebagai sudah dibaca`);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  if (selectedIds.length === 0) return null;

  return (
    <div className="sticky top-0 z-10 -mx-2 mb-3 flex items-center justify-between gap-2 rounded-lg border-2 border-brand bg-brand/5 px-4 py-2 shadow-sm">
      <span className="text-sm font-medium">
        {selectedIds.length} chat dipilih
      </span>
      <button
        onClick={onMarkRead}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
      >
        <CheckCheck className="h-4 w-4" />
        {pending ? 'Memproses...' : 'Tandai Sudah Dibaca'}
      </button>
    </div>
  );
}

export function InboxItemCheckbox({
  id,
  selected,
  onChange,
}: {
  id: string;
  selected: boolean;
  onChange: (id: string, selected: boolean) => void;
}) {
  return (
    <input
      type="checkbox"
      checked={selected}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        e.stopPropagation();
        onChange(id, e.target.checked);
      }}
      className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
    />
  );
}

export function useSelection() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = (id: string, on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  };
  const clear = () => setSelected(new Set());
  return { selected, toggle, clear, ids: Array.from(selected) };
}
