'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { QrCode, Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import {
  startBaileysSession,
  getBaileysStatus,
  disconnectBaileys,
} from './baileys-actions';

type Status =
  | 'idle'
  | 'starting'
  | 'pending_qr'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

export function BaileysConnect({
  existingAccountId,
  existingStatus,
  existingPhone,
}: {
  existingAccountId?: string;
  existingStatus?: string;
  existingPhone?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [accountId, setAccountId] = useState<string | null>(existingAccountId ?? null);
  const [status, setStatus] = useState<Status>(
    existingStatus === 'active' || existingStatus === 'connected'
      ? 'connected'
      : existingStatus === 'pending_qr'
        ? 'pending_qr'
        : 'idle',
  );
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(existingPhone ?? null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Polling status saat sedang connecting / pending_qr
  useEffect(() => {
    if (!accountId) return;
    if (status !== 'pending_qr' && status !== 'connecting' && status !== 'starting') return;

    const interval = setInterval(async () => {
      const res = await getBaileysStatus(accountId);
      if (!res.ok) {
        setErrorMsg(res.error);
        return;
      }
      const data = res.data!;
      if (data.qrDataUrl) setQrUrl(data.qrDataUrl);
      if (data.phone) setPhone(data.phone);

      if (data.status === 'connected' || data.status === 'active') {
        setStatus('connected');
        setQrUrl(null);
        toast.success('WhatsApp terhubung!');
        router.refresh();
      } else if (data.status === 'pending_qr') {
        setStatus('pending_qr');
      } else if (data.status === 'connecting') {
        setStatus('connecting');
      } else if (data.status === 'error') {
        setStatus('error');
        setErrorMsg(data.lastError);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [accountId, status, router]);

  function onStart() {
    setErrorMsg(null);
    setQrUrl(null);
    setStatus('starting');
    startTransition(async () => {
      const res = await startBaileysSession();
      if (!res.ok) {
        setStatus('error');
        setErrorMsg(res.error);
        toast.error(res.error);
        return;
      }
      setAccountId(res.data!.accountId);
      setStatus('connecting');
    });
  }

  function onDisconnect() {
    if (!accountId) return;
    if (!confirm('Putus koneksi WhatsApp? Anda perlu scan QR lagi untuk reconnect.')) return;
    startTransition(async () => {
      const res = await disconnectBaileys(accountId);
      if (res.ok) {
        toast.success('WhatsApp diputus');
        setStatus('idle');
        setAccountId(null);
        setQrUrl(null);
        setPhone(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      {status === 'idle' && (
        <div className="rounded-lg border-2 border-dashed border-brand/30 bg-brand/5 p-8 text-center">
          <QrCode className="mx-auto h-12 w-12 text-brand" />
          <h3 className="mt-4 font-semibold">Hubungkan via Scan QR</h3>
          <p className="mt-1 text-sm text-gray-600">
            Sama seperti login WhatsApp Web. Selesai dalam 60 detik.
          </p>
          <button
            onClick={onStart}
            disabled={pending}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-brand px-6 py-2.5 font-medium text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <QrCode className="h-4 w-4" />
            )}
            Generate QR Code
          </button>
        </div>
      )}

      {(status === 'starting' || status === 'connecting') && !qrUrl && (
        <div className="rounded-lg border bg-white p-8 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-brand" />
          <p className="mt-4 text-sm text-gray-600">
            Menyiapkan QR code... <br />
            Ini sekitar 5-10 detik.
          </p>
        </div>
      )}

      {status === 'pending_qr' && qrUrl && (
        <div className="rounded-lg border bg-white p-6">
          <div className="flex flex-col items-center text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="QR WhatsApp" className="h-64 w-64 rounded-lg border" />
            <h3 className="mt-4 font-semibold">Scan QR ini dari WhatsApp Anda</h3>
            <ol className="mt-3 text-left text-sm text-gray-600 space-y-1">
              <li>1. Buka WhatsApp di HP</li>
              <li>2. Tap menu (titik 3) → <strong>Perangkat tertaut</strong></li>
              <li>3. Tap <strong>Tautkan perangkat</strong></li>
              <li>4. Arahkan kamera ke QR di atas</li>
            </ol>
            <p className="mt-4 text-xs text-gray-500">
              QR auto-refresh setiap ~30 detik. Halaman ini polling status...
            </p>
          </div>
        </div>
      )}

      {status === 'connected' && (
        <div className="rounded-lg border bg-green-50 p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-green-600" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-900">WhatsApp Terhubung</h3>
              <p className="mt-1 text-sm text-green-800">
                Nomor: <strong>{phone ?? '—'}</strong>
              </p>
              <p className="mt-2 text-xs text-green-700">
                Semua chat masuk akan tampil di <strong>Inbox</strong>. AI auto-reply
                aktif kalau sudah diatur di tab <strong>AI</strong>.
              </p>
            </div>
            <button
              onClick={onDisconnect}
              disabled={pending}
              className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Putus
            </button>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="rounded-lg border bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <XCircle className="h-6 w-6 flex-shrink-0 text-red-600" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">Koneksi Gagal</h3>
              <p className="mt-1 text-sm text-red-800">{errorMsg ?? 'Unknown error'}</p>
            </div>
            <button
              onClick={onStart}
              disabled={pending}
              className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <RefreshCw className="h-3 w-3" />
              Coba Lagi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
