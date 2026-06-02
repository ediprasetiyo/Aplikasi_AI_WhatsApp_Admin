'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { ensureSubscription, canCreateWorkspace } from './actions';

const INDUSTRIES = [
  'Klinik',
  'Salon',
  'Barbershop',
  'Dealer',
  'Travel',
  'Laundry',
  'Cafe / Resto',
  'Toko Online',
  'Lainnya',
];

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function OnboardingForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState(INDUSTRIES[0]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    // Validasi jatah workspace dulu (server-side, anti-bypass)
    const guard = await canCreateWorkspace();
    if (!guard.ok) {
      setLoading(false);
      toast.error(guard.reason ?? 'Jatah workspace habis');
      router.push('/dashboard/billing');
      return;
    }

    const { data, error } = await authClient.organization.create({
      name: name.trim(),
      slug: `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`,
      metadata: { industry },
    });
    if (error) {
      setLoading(false);
      toast.error(error.message ?? 'Gagal membuat workspace');
      return;
    }

    // Set sebagai active org
    if (data?.id) {
      await authClient.organization.setActive({ organizationId: data.id });
      // Pastikan subscription record tercipta (trial 14 hari)
      await ensureSubscription(data.id);
    }

    setLoading(false);
    toast.success('Workspace dibuat! Trial 14 hari aktif.');
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <label className="block">
        <span className="text-sm font-medium">Nama Bisnis / Workspace</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Mis. Klinik Sehat Jaya"
          required
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
        {name && (
          <span className="mt-1 block text-xs text-gray-500">URL: /{slugify(name)}</span>
        )}
      </label>
      <label className="block">
        <span className="text-sm font-medium">Industri</span>
        <select
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        >
          {INDUSTRIES.map((i) => (
            <option key={i}>{i}</option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-gray-500">
          Bantu AI menyesuaikan gaya bahasa balasan.
        </span>
      </label>

      <div className="rounded-md border border-green-200 bg-green-50 p-3 text-xs text-green-900">
        🎁 <strong>Trial gratis 14 hari</strong> — semua fitur aktif, tanpa kartu kredit.
        Setelah trial habis, pilih paket berlangganan.
      </div>

      <button
        disabled={loading}
        className="w-full rounded-md bg-brand py-2.5 font-medium text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {loading ? 'Membuat...' : 'Buat Workspace & Mulai Trial'}
      </button>
    </form>
  );
}
