'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { connectWhatsappAccount } from './actions';

export function ConnectForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showToken, setShowToken] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await connectWhatsappAccount(fd);
      if (res.ok) {
        toast.success('Nomor WhatsApp terhubung!');
        (e.target as HTMLFormElement).reset();
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" autoComplete="off">
      {/* Trick untuk disable Chrome autofill — input hidden palsu */}
      <input type="text" name="fakeusernameremembered" className="hidden" autoComplete="off" />
      <input type="password" name="fakepasswordremembered" className="hidden" autoComplete="new-password" />

      <Field
        label="Phone Number ID"
        name="phoneNumberId"
        placeholder="123456789012345"
        hint="Dari Meta → WhatsApp → API Setup → 'Phone number ID'"
        required
        autoComplete="off"
        inputMode="numeric"
      />
      <Field
        label="Access Token"
        name="accessToken"
        type={showToken ? 'text' : 'password'}
        placeholder="EAAxxxx..."
        hint="Gunakan permanent token (System User), bukan temporary 24-jam"
        required
        autoComplete="new-password"
        right={
          <button
            type="button"
            onClick={() => setShowToken((v) => !v)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {showToken ? 'Sembunyikan' : 'Tampilkan'}
          </button>
        }
      />
      <Field
        label="Business Account ID (opsional)"
        name="businessAccountId"
        placeholder="123456789012345"
        hint="WABA ID — boleh kosong"
        autoComplete="off"
        inputMode="numeric"
      />
      <button
        disabled={pending}
        className="w-full rounded-md bg-brand py-2.5 font-medium text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {pending ? 'Memverifikasi ke Meta...' : 'Hubungkan Nomor'}
      </button>
    </form>
  );
}

function Field({
  label,
  hint,
  right,
  ...props
}: {
  label: string;
  hint?: string;
  right?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        {right}
      </div>
      <input
        {...props}
        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      />
      {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
    </label>
  );
}
