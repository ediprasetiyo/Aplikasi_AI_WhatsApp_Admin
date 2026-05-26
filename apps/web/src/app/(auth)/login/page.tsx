'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { signIn } from '@/lib/auth-client';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email'));
    const password = String(fd.get('password'));

    setLoading(true);
    const { error } = await signIn.email({ email, password });
    setLoading(false);

    if (error) {
      toast.error(error.message ?? 'Email atau password salah');
      return;
    }
    router.push('/dashboard');
  }

  return (
    <>
      <h1 className="text-2xl font-bold">Masuk</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Password</span>
          <input
            name="password"
            type="password"
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </label>
        <button
          disabled={loading}
          className="w-full rounded-md bg-brand py-2.5 font-medium text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? 'Memproses...' : 'Masuk'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-600">
        Belum punya akun?{' '}
        <Link href="/register" className="font-medium text-brand hover:underline">
          Daftar
        </Link>
      </p>
    </>
  );
}
