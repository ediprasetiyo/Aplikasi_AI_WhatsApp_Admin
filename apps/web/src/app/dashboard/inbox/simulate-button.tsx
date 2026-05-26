'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Beaker } from 'lucide-react';
import { simulateInbound } from './actions';

export function SimulateButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const customerPhone = String(fd.get('customerPhone') ?? '').replace(/\D/g, '');
    const customerName = String(fd.get('customerName') ?? '');
    const text = String(fd.get('text') ?? '');
    const triggerAi = fd.get('triggerAi') === 'on';

    startTransition(async () => {
      const res = await simulateInbound({ customerPhone, customerName, text, triggerAi });
      if (res.ok) {
        toast.success(
          res.data?.aiReply
            ? `Pesan masuk. AI: ${res.data.aiReply.slice(0, 60)}...`
            : 'Pesan masuk masuk inbox',
        );
        setOpen(false);
        if (res.data?.conversationId) {
          router.push(`/dashboard/inbox/${res.data.conversationId}`);
        } else {
          router.refresh();
        }
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md border border-purple-300 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100"
      >
        <Beaker className="h-4 w-4" />
        Simulasi Pesan Masuk
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Simulasi Pesan dari Customer</h2>
            <p className="mt-1 text-sm text-gray-600">
              Untuk testing AI tanpa harus connect WhatsApp beneran.
            </p>
            <form onSubmit={onSubmit} className="mt-4 space-y-3">
              <label className="block">
                <span className="text-sm font-medium">Nomor customer</span>
                <input
                  name="customerPhone"
                  required
                  placeholder="628123456789"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <span className="mt-0.5 block text-xs text-gray-500">Digit saja, tanpa + atau spasi</span>
              </label>
              <label className="block">
                <span className="text-sm font-medium">Nama (opsional)</span>
                <input
                  name="customerName"
                  placeholder="Pak Budi"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Pesan</span>
                <textarea
                  name="text"
                  required
                  rows={3}
                  placeholder="Halo, apakah masih buka hari ini?"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="triggerAi"
                  defaultChecked
                  className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                />
                Trigger AI auto-reply
              </label>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
                >
                  {pending ? 'Memproses...' : 'Kirim Simulasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
