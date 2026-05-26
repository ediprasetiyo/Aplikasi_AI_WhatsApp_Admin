'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { signUp } from '@/lib/auth-client';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get('name'));
    const email = String(fd.get('email'));
    const password = String(fd.get('password'));

    setLoading(true);
    const { error } = await signUp.email({ name, email, password });
    setLoading(false);

    if (error) {
      toast.error(error.message ?? 'Gagal mendaftar');
      return;
    }
    toast.success('Akun dibuat. Lanjut setup workspace.');
    router.push('/onboarding');
  }

  return (
    <>
      <h1 className="text-2xl font-bold">Daftar Akun Baru</h1>
      <p className="mt-2 text-sm text-gray-600">14 hari gratis. Tanpa kartu kredit.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field label="Nama" name="name" type="text" required />
        <Field label="Email" name="email" type="email" required />
        <Field label="Password" name="password" type="password" required minLength={8} />
        <button
          disabled={loading}
          className="w-full rounded-md bg-brand py-2.5 font-medium text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? 'Memproses...' : 'Daftar'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-600">
        Sudah punya akun?{' '}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Masuk
        </Link>
      </p>
    </>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        {...props}
        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      />
    </label>
  );
}
