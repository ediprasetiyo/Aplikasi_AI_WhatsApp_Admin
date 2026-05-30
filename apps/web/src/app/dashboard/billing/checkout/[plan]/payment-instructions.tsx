'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, CheckCircle2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { PlanKey } from '@/lib/plans';
import { PAYMENT_INFO } from '@/lib/payment-info';
import { cancelPendingSubscription } from '../../actions';

export function PaymentInstructions({
  plan,
  amount,
  method,
  ktpName,
}: {
  plan: PlanKey;
  amount: number;
  method: string;
  ktpName: string;
}) {
  const router = useRouter();
  const [cancelPending, startCancel] = useTransition();
  const info = method === 'dana' ? PAYMENT_INFO.dana : PAYMENT_INFO.bca;

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} disalin`);
  }

  function onCancel() {
    if (
      !confirm(
        'Batalkan pembayaran ini? Anda bisa pilih paket lain. Data yang sudah diinput akan dihapus.',
      )
    )
      return;
    startCancel(async () => {
      const res = await cancelPendingSubscription();
      if (res.ok) {
        toast.success('Pembayaran dibatalkan');
        router.push('/dashboard/billing');
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  const waMessage = encodeURIComponent(
    `Halo Admin Auto Balas, saya sudah transfer untuk paket ${plan}.\n\nNama: ${ktpName}\nMetode: ${info.name}\nJumlah: Rp ${amount.toLocaleString('id')}\n\nBukti transfer terlampir.`,
  );
  const waLink = `https://wa.me/${PAYMENT_INFO.adminWhatsapp}?text=${waMessage}`;

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-lg border-2 border-green-300 bg-green-50 p-4 text-sm">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-700 mt-0.5" />
          <div>
            <div className="font-semibold text-green-900">
              Data Anda tersimpan. Status: Menunggu Pembayaran
            </div>
            <p className="mt-1 text-xs text-green-800">
              Selesaikan pembayaran sesuai instruksi di bawah, lalu kirim bukti
              transfer ke WhatsApp admin.
            </p>
          </div>
        </div>
      </div>

      {/* Instruksi transfer */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="font-semibold">Step 1: Transfer Pembayaran</h2>
        <p className="mt-1 text-xs text-gray-500">
          Transfer sesuai jumlah & rekening berikut.
        </p>

        <div className="mt-4 space-y-3">
          <Row label="Metode">
            <span className="font-semibold">{info.name}</span>
          </Row>
          <Row label="Nomor Rekening">
            <button
              onClick={() => copy(info.accountNumber, 'Nomor rekening')}
              className="flex items-center gap-2 font-mono font-semibold hover:text-brand"
            >
              {info.accountNumber}
              <Copy className="h-3.5 w-3.5" />
            </button>
          </Row>
          <Row label="Atas Nama">
            <span className="font-semibold">{info.accountName}</span>
          </Row>
          <Row label="Jumlah Transfer">
            <button
              onClick={() => copy(amount.toString(), 'Jumlah')}
              className="flex items-center gap-2 text-lg font-bold text-brand hover:text-brand-dark"
            >
              Rp {amount.toLocaleString('id')}
              <Copy className="h-4 w-4" />
            </button>
          </Row>
        </div>

        <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-900">
          💡 <strong>Tips:</strong> Transfer dengan jumlah <strong>persis</strong>{' '}
          (tanpa tambahan kode unik) biar admin gampang verifikasi.
        </div>
      </div>

      {/* Kirim bukti */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="font-semibold">Step 2: Kirim Bukti Transfer ke Admin</h2>
        <p className="mt-1 text-xs text-gray-500">
          Setelah transfer, kirim <strong>screenshot bukti transfer</strong> ke
          WhatsApp admin. Maks 1x24 jam akan diverifikasi & akses dibuka.
        </p>

        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700"
        >
          <MessageCircle className="h-5 w-5" />
          Buka WhatsApp Admin ({PAYMENT_INFO.adminWhatsappDisplay})
        </a>

        <p className="mt-3 text-xs text-gray-500 text-center">
          Atau hubungi langsung: <strong>{PAYMENT_INFO.adminWhatsappDisplay}</strong>
        </p>
      </div>

      {/* Status setelah verifikasi */}
      <div className="rounded-lg border border-dashed bg-gray-50 p-4 text-xs text-gray-600">
        <strong className="text-gray-900">Setelah admin verifikasi:</strong> Status
        langganan otomatis aktif. Akses penuh ke semua fitur sesuai paket. Anda akan
        mendapat notifikasi via WhatsApp dari admin.
      </div>

      {/* Tombol batalkan */}
      <div className="text-center pt-2">
        <button
          onClick={onCancel}
          disabled={cancelPending}
          className="text-sm text-gray-500 hover:text-red-600 underline disabled:opacity-50"
        >
          {cancelPending ? 'Membatalkan...' : 'Batalkan & pilih paket lain'}
        </button>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  );
}
