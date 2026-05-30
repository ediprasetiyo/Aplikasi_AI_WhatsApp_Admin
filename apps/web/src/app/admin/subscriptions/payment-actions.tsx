'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import { approvePayment, rejectPayment } from '../actions';

export function PaymentActions({ subscriptionId }: { subscriptionId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onApprove() {
    if (!confirm('Approve pembayaran ini? User akan mendapat akses paket selama 30 hari.'))
      return;
    startTransition(async () => {
      const res = await approvePayment(subscriptionId);
      if (res.ok) {
        toast.success('Pembayaran disetujui ✓');
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function onReject() {
    const reason = prompt('Alasan reject (opsional):') ?? '';
    startTransition(async () => {
      const res = await rejectPayment(subscriptionId, reason);
      if (res.ok) {
        toast.success('Pembayaran di-reject');
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={onApprove}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        <Check className="h-3.5 w-3.5" />
        Approve
      </button>
      <button
        onClick={onReject}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-md border border-red-300 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        <X className="h-3.5 w-3.5" />
        Reject
      </button>
    </div>
  );
}
