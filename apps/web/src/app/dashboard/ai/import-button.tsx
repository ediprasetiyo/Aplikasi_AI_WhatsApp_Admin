'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { importKnowledgeEntries } from './actions';

type Entry = { title: string; content: string };

export function ImportButton() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = ev.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        if (!firstSheet) {
          toast.error('Sheet kosong');
          return;
        }
        const sheet = workbook.Sheets[firstSheet]!;
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
          defval: '',
          raw: false,
        });
        // Auto-detect kolom title & content (atau Judul & Isi)
        const parsed: Entry[] = [];
        for (const row of rows) {
          const keys = Object.keys(row);
          const titleKey = keys.find((k) =>
            ['title', 'judul', 'nama', 'pertanyaan'].includes(k.toLowerCase().trim()),
          );
          const contentKey = keys.find((k) =>
            ['content', 'isi', 'konten', 'jawaban', 'deskripsi'].includes(
              k.toLowerCase().trim(),
            ),
          );
          if (!titleKey || !contentKey) continue;
          const title = String(row[titleKey] ?? '').trim();
          const content = String(row[contentKey] ?? '').trim();
          if (title.length >= 2 && content.length >= 5) {
            parsed.push({ title, content });
          }
        }
        if (parsed.length === 0) {
          toast.error(
            'Tidak ada baris valid. Pastikan kolom "Judul" dan "Isi" ada di header.',
          );
          return;
        }
        setEntries(parsed);
        toast.success(`${parsed.length} entry siap di-import`);
      } catch (err) {
        toast.error(`Gagal baca file: ${(err as Error).message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function onImport() {
    if (entries.length === 0) return;
    startTransition(async () => {
      const res = await importKnowledgeEntries(entries);
      if (res.ok) {
        const { created, skipped } = res.data!;
        toast.success(`${created} ditambahkan${skipped > 0 ? `, ${skipped} di-skip` : ''}`);
        setOpen(false);
        setEntries([]);
        setFileName(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function onClose() {
    setOpen(false);
    setEntries([]);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function downloadTemplate() {
    const ws = XLSX.utils.json_to_sheet([
      { Judul: 'Jam Operasional', Isi: 'Senin-Minggu 10.00-22.00 WIB' },
      { Judul: 'Lokasi', Isi: 'Jl. Contoh No. 123, Jakarta' },
      {
        Judul: 'Menu Andalan',
        Isi: '*Menu favorit kami:*\n- Sate Wayang\n- Nasi Goreng Wayang\n- Soto Ayam',
      },
    ]);
    ws['!cols'] = [{ wch: 25 }, { wch: 60 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Knowledge');
    XLSX.writeFile(wb, 'template-knowledge-autobalas.xlsx');
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-brand bg-white px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand/5"
      >
        <Upload className="h-3.5 w-3.5" />
        Import Excel
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={onClose}
        >
          <div
            className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">Import Knowledge dari Excel</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Upload file <code>.xlsx</code>, <code>.xls</code>, atau <code>.csv</code>{' '}
                  dengan kolom <strong>Judul</strong> & <strong>Isi</strong>.
                </p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4">
              <button
                onClick={downloadTemplate}
                className="text-xs text-brand hover:underline"
              >
                ⬇ Download template Excel
              </button>
            </div>

            <div className="mt-4">
              <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 cursor-pointer hover:border-brand hover:bg-brand/5">
                <FileSpreadsheet className="h-10 w-10 text-gray-400" />
                <span className="text-sm font-medium">
                  {fileName ?? 'Klik untuk pilih file Excel/CSV'}
                </span>
                <span className="text-xs text-gray-500">
                  Header kolom: Judul, Isi (case-insensitive)
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={onFile}
                  className="hidden"
                />
              </label>
            </div>

            {entries.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-medium">
                  Preview ({entries.length} entry akan di-import)
                </div>
                <div className="mt-2 max-h-64 overflow-y-auto rounded border bg-gray-50 p-3 space-y-2">
                  {entries.slice(0, 10).map((e, i) => (
                    <div key={i} className="rounded bg-white p-2 text-xs">
                      <div className="font-semibold">{e.title}</div>
                      <div className="mt-0.5 text-gray-600 line-clamp-2">{e.content}</div>
                    </div>
                  ))}
                  {entries.length > 10 && (
                    <div className="text-center text-xs text-gray-500">
                      ... dan {entries.length - 10} entry lainnya
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={onImport}
                disabled={pending || entries.length === 0}
                className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
              >
                {pending ? 'Mengimport...' : `Import ${entries.length} Entry`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
