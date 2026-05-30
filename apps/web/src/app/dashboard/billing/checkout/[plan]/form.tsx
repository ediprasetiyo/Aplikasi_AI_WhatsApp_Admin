'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { PlanKey } from '@/lib/plans';
import { submitSubscription } from '../../actions';

export function CheckoutForm({ planKey }: { planKey: PlanKey }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [ktpName, setKtpName] = useState('');
  const [ktpNumber, setKtpNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bca' | 'dana'>('bca');

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await submitSubscription({
        plan: planKey,
        ktpName,
        ktpNumber,
        phoneNumber: phoneNumber.replace(/\D/g, ''),
        paymentMethod,
      });
      if (res.ok) {
        toast.success('Data tersimpan. Lanjut ke instruksi pembayaran.');
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 space-y-4 rounded-lg border bg-white p-6 shadow-sm"
    >
      <h2 className="font-semibold">Data Diri (sesuai KTP)</h2>
      <p className="text-xs text-gray-500">
        Wajib sesuai KTP — untuk verifikasi pemilik akun. Data Anda aman & tidak
        akan disebarluaskan.
      </p>

      <div>
        <label className="block">
          <span className="text-sm font-medium">Nama Lengkap (sesuai KTP)</span>
          <input
            value={ktpName}
            onChange={(e) => setKtpName(e.target.value.toUpperCase())}
            required
            placeholder="EDI PRASETIYO"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </label>
      </div>

      <div>
        <label className="block">
          <span className="text-sm font-medium">Nomor KTP (NIK 16 digit)</span>
          <input
            value={ktpNumber}
            onChange={(e) =>
              setKtpNumber(e.target.value.replace(/\D/g, '').slice(0, 16))
            }
            required
            inputMode="numeric"
            placeholder="3201234567890123"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </label>
        {ktpNumber.length > 0 && ktpNumber.length !== 16 && (
          <p className="mt-1 text-xs text-red-600">NIK harus 16 digit</p>
        )}
      </div>

      <div>
        <label className="block">
          <span className="text-sm font-medium">Nomor HP / WhatsApp</span>
          <input
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
            inputMode="tel"
            placeholder="08123456789"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <span className="mt-1 block text-xs text-gray-500">
            Untuk konfirmasi pembayaran & support
          </span>
        </label>
      </div>

      <div>
        <label className="block">
          <span className="text-sm font-medium">Metode Pembayaran</span>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label
              className={`flex cursor-pointer items-center gap-2 rounded-md border-2 p-3 ${
                paymentMethod === 'bca'
                  ? 'border-brand bg-brand/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                checked={paymentMethod === 'bca'}
                onChange={() => setPaymentMethod('bca')}
                className="text-brand"
              />
              <div>
                <div className="text-sm font-semibold">Transfer BCA</div>
                <div className="text-xs text-gray-500">Verified instant</div>
              </div>
            </label>
            <label
              className={`flex cursor-pointer items-center gap-2 rounded-md border-2 p-3 ${
                paymentMethod === 'dana'
                  ? 'border-brand bg-brand/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                checked={paymentMethod === 'dana'}
                onChange={() => setPaymentMethod('dana')}
                className="text-brand"
              />
              <div>
                <div className="text-sm font-semibold">DANA</div>
                <div className="text-xs text-gray-500">E-wallet</div>
              </div>
            </label>
          </div>
        </label>
      </div>

      <button
        disabled={pending}
        className="w-full rounded-md bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {pending ? 'Menyimpan...' : 'Lanjut ke Instruksi Pembayaran'}
      </button>
    </form>
  );
}
