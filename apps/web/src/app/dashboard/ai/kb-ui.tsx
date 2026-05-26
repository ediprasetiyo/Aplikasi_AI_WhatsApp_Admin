'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { createKnowledgeEntry, deleteKnowledgeEntry } from './actions';

export function KbForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createKnowledgeEntry(fd);
      if (res.ok) {
        toast.success('Knowledge ditambahkan');
        (e.target as HTMLFormElement).reset();
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        name="title"
        placeholder="Judul (mis. Jam Operasional)"
        required
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      />
      <textarea
        name="content"
        placeholder="Isi (mis. Senin-Jumat 09.00-17.00, Sabtu 09.00-13.00, Minggu tutup)"
        rows={3}
        required
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      />
      <button
        disabled={pending}
        className="w-full rounded-md border border-brand py-2 text-sm font-medium text-brand hover:bg-brand hover:text-white disabled:opacity-50"
      >
        {pending ? 'Menambahkan...' : '+ Tambah Knowledge'}
      </button>
    </form>
  );
}

export function KbList({ entries }: { entries: Array<{ id: string; title: string; content: string }> }) {
  if (entries.length === 0) {
    return (
      <p className="text-center text-sm text-gray-400 py-4">
        Belum ada knowledge. Tambah minimal 3-5 untuk hasil AI yang baik.
      </p>
    );
  }
  return (
    <ul className="space-y-2 max-h-96 overflow-y-auto">
      {entries.map((e) => (
        <KbItem key={e.id} entry={e} />
      ))}
    </ul>
  );
}

function KbItem({ entry }: { entry: { id: string; title: string; content: string } }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!confirm(`Hapus "${entry.title}"?`)) return;
    startTransition(async () => {
      const res = await deleteKnowledgeEntry(entry.id);
      if (res.ok) {
        toast.success('Dihapus');
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <li className="rounded-md border bg-gray-50 p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium">{entry.title}</div>
          <div className="mt-1 text-xs text-gray-600 whitespace-pre-wrap">{entry.content}</div>
        </div>
        <button
          onClick={onDelete}
          disabled={pending}
          className="text-gray-400 hover:text-red-600 disabled:opacity-50"
          aria-label="Hapus"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}
