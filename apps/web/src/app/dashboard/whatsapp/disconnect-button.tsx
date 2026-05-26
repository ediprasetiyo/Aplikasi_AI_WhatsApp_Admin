'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { disconnectWhatsappAccount } from './actions';

export function DisconnectButton({ accountId }: { accountId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!confirm('Putuskan koneksi nomor ini? Semua riwayat chat tetap tersimpan.')) return;
    startTransition(async () => {
      const res = await disconnectWhatsappAccount(accountId);
      if (res.ok) {
        toast.success('Nomor diputus');
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      {pending ? '...' : 'Putus'}
    </button>
  );
}
