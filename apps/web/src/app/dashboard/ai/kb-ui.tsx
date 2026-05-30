'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2, Pencil, Eye, X, Check } from 'lucide-react';
import {
  createKnowledgeEntry,
  deleteKnowledgeEntry,
  updateKnowledgeEntry,
} from './actions';
import { renderWhatsappText } from '@/lib/wa-format';
import { RichTextarea } from './rich-textarea';

export function KbForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Judul & isi wajib diisi');
      return;
    }
    const fd = new FormData();
    fd.set('title', title);
    fd.set('content', content);
    startTransition(async () => {
      const res = await createKnowledgeEntry(fd);
      if (res.ok) {
        toast.success('Knowledge ditambahkan');
        setTitle('');
        setContent('');
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Judul (mis. Jam Operasional)"
        required
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      />
      <RichTextarea
        value={content}
        onChange={setContent}
        placeholder={`Isi knowledge. Contoh:\n*Menu Andalan:*\n- Sate Wayang Rp25rb\n- Soto Ayam Rp20rb\n\n_Tersedia jam 11.00-20.00_`}
        rows={8}
      />

      <button
        disabled={pending || !content.trim() || !title.trim()}
        className="w-full rounded-md bg-brand py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {pending ? 'Menambahkan...' : '+ Tambah Knowledge'}
      </button>
    </form>
  );
}

export function KbList({
  entries,
}: {
  entries: Array<{ id: string; title: string; content: string }>;
}) {
  if (entries.length === 0) {
    return (
      <div className="rounded-md border border-dashed bg-gray-50 px-4 py-8 text-center">
        <p className="text-sm text-gray-500">Belum ada knowledge.</p>
        <p className="mt-1 text-xs text-gray-400">
          Tambah minimal 3-5 entry biar AI bisa jawab dengan baik.
        </p>
      </div>
    );
  }
  return (
    <ul className="space-y-2 max-h-[700px] overflow-y-auto pr-2 -mr-2">
      {entries.map((e) => (
        <KbItem key={e.id} entry={e} />
      ))}
    </ul>
  );
}

function KbItem({ entry }: { entry: { id: string; title: string; content: string } }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<'view' | 'edit' | 'preview'>('view');
  const [editTitle, setEditTitle] = useState(entry.title);
  const [editContent, setEditContent] = useState(entry.content);

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

  function onSave() {
    startTransition(async () => {
      const res = await updateKnowledgeEntry(entry.id, {
        title: editTitle,
        content: editContent,
      });
      if (res.ok) {
        toast.success('Disimpan');
        setMode('view');
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function onCancelEdit() {
    setEditTitle(entry.title);
    setEditContent(entry.content);
    setMode('view');
  }

  // === EDIT MODE ===
  if (mode === 'edit') {
    return (
      <li className="rounded-md border border-brand bg-white p-3 text-sm">
        <input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="mb-2 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
        <RichTextarea value={editContent} onChange={setEditContent} rows={6} />
        <div className="mt-2 flex justify-end gap-2">
          <button
            onClick={onCancelEdit}
            disabled={pending}
            className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50"
          >
            <X className="h-3 w-3" /> Batal
          </button>
          <button
            onClick={onSave}
            disabled={pending || !editTitle.trim() || !editContent.trim()}
            className="inline-flex items-center gap-1 rounded-md bg-brand px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-dark disabled:opacity-50"
          >
            <Check className="h-3 w-3" /> {pending ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </li>
    );
  }

  // === PREVIEW MODE (WhatsApp style) ===
  if (mode === 'preview') {
    return (
      <li className="rounded-md border bg-gray-50 p-3 text-sm">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="font-medium">{entry.title}</div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMode('view')}
              title="Tutup preview"
              className="text-gray-400 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="rounded-md bg-[#e5ddd5] p-3">
          <div className="max-w-[85%] rounded-lg bg-white p-3 text-sm shadow-sm">
            <div className="whitespace-pre-wrap break-words">
              {renderWhatsappText(entry.content)}
            </div>
          </div>
        </div>
      </li>
    );
  }

  // === VIEW MODE (default) ===
  return (
    <li className="rounded-md border bg-gray-50 p-3 text-sm group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium">{entry.title}</div>
          <div className="mt-1 text-xs text-gray-600 whitespace-pre-wrap break-words line-clamp-4">
            {renderWhatsappText(entry.content)}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setMode('preview')}
            title="Preview WhatsApp"
            className="rounded p-1 text-gray-500 hover:bg-white hover:text-brand"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setMode('edit')}
            title="Edit"
            className="rounded p-1 text-gray-500 hover:bg-white hover:text-brand"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            disabled={pending}
            title="Hapus"
            className="rounded p-1 text-gray-400 hover:bg-white hover:text-red-600 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </li>
  );
}
