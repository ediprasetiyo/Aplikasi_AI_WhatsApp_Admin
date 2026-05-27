'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { signUp } from '@/lib/auth-client';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordValid = password.length >= 8;
  const confirmValid = confirm.length > 0 && confirm === password;
  const canSubmit = passwordValid && confirmValid;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) {
      toast.error('Periksa password & konfirmasi password');
      return;
    }
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get('name'));
    const email = String(fd.get('email'));

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
        <label className="block">
          <span className="text-sm font-medium">Nama</span>
          <input
            name="name"
            type="text"
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </label>

        {/* Password dengan show/hide */}
        <div>
          <label className="block">
            <span className="text-sm font-medium">Password</span>
            <div className="relative mt-1">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 karakter"
                className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>
          {password.length > 0 && (
            <p
              className={`mt-1 flex items-center gap-1 text-xs ${
                passwordValid ? 'text-green-600' : 'text-gray-500'
              }`}
            >
              {passwordValid ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              Minimal 8 karakter
            </p>
          )}
        </div>

        {/* Confirm password dengan show/hide */}
        <div>
          <label className="block">
            <span className="text-sm font-medium">Konfirmasi Password</span>
            <div className="relative mt-1">
              <input
                name="confirm"
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Ulangi password yang sama"
                className={`w-full rounded-md border px-3 py-2 pr-10 focus:outline-none focus:ring-1 ${
                  confirm.length > 0 && !confirmValid
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-brand focus:ring-brand'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
                aria-label={showConfirm ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>
          {confirm.length > 0 && (
            <p
              className={`mt-1 flex items-center gap-1 text-xs ${
                confirmValid ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {confirmValid ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              {confirmValid ? 'Password cocok' : 'Password tidak sama'}
            </p>
          )}
        </div>

        <button
          disabled={loading || !canSubmit}
          className="w-full rounded-md bg-brand py-2.5 font-medium text-white hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed"
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
