'use client';

import { useState, useTransition } from 'react';
import { RotateCw, AlertCircle, Clock, Check, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { resendFailedMessage } from '../actions';

/**
 * Status badge + tombol resend untuk pesan outbound.
 * - sent/delivered/read: ikon centang (hijau)
 * - pending: spinner kecil "mengirim..."
 * - failed: ikon alert merah + tombol RETRY
 * - simulated: label "simulator" (tidak terkirim, hanya dummy)
 */
export function MessageStatus({
  messageId,
  status,
  inverted,
}: {
  messageId: string;
  status: string | null;
  /** true kalau bubble berlatar gelap (outbound), supaya warna teks kontras */
  inverted?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [localStatus, setLocalStatus] = useState(status);

  const onRetry = () => {
    startTransition(async () => {
      const res = await resendFailedMessage(messageId);
      if (res.ok) {
        setLocalStatus('sent');
        toast.success('Pesan berhasil dikirim ulang');
      } else {
        setLocalStatus('failed');
        toast.error(res.error);
      }
    });
  };

  const s = localStatus ?? '';
  const textCls = inverted ? 'text-white/70' : 'text-gray-500';

  if (s === 'sent' || s === 'delivered') {
    return (
      <span className={`inline-flex items-center gap-1 ${textCls}`}>
        <Check className="h-3 w-3" />
        terkirim
      </span>
    );
  }
  if (s === 'read') {
    return (
      <span className="inline-flex items-center gap-1 text-blue-300">
        <CheckCheck className="h-3 w-3" />
        dibaca
      </span>
    );
  }
  if (s === 'pending' || pending) {
    return (
      <span className={`inline-flex items-center gap-1 ${textCls}`}>
        <Clock className="h-3 w-3 animate-pulse" />
        mengirim...
      </span>
    );
  }
  if (s === 'simulated') {
    return <span className={`italic ${textCls}`}>simulator</span>;
  }
  if (s === 'failed') {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 text-red-300 font-medium">
          <AlertCircle className="h-3 w-3" />
          gagal kirim
        </span>
        <button
          type="button"
          onClick={onRetry}
          disabled={pending}
          className="inline-flex items-center gap-0.5 rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold text-white hover:bg-white/30 disabled:opacity-50"
          title="Coba kirim ulang ke WhatsApp customer"
        >
          <RotateCw className={`h-2.5 w-2.5 ${pending ? 'animate-spin' : ''}`} />
          Kirim Ulang
        </button>
      </span>
    );
  }
  // Status unknown / kosong: tampilkan apa adanya
  if (s) return <span className={textCls}>{s}</span>;
  return null;
}
