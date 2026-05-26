'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';

export function InviteForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email'));
    const role = String(fd.get('role')) as 'admin' | 'member';

    setLoading(true);
    const { error } = await authClient.organization.inviteMember({ email, role });
    setLoading(false);

    if (error) {
      toast.error(error.message ?? 'Gagal mengundang');
      return;
    }
    toast.success(`Undangan dikirim ke ${email}`);
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
      <label className="flex-1 min-w-[200px]">
        <span className="block text-sm font-medium">Email</span>
        <input
          name="email"
          type="email"
          required
          placeholder="admin@example.com"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </label>
      <label>
        <span className="block text-sm font-medium">Peran</span>
        <select
          name="role"
          defaultValue="member"
          className="mt-1 rounded-md border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        >
          <option value="admin">Admin</option>
          <option value="member">Member</option>
        </select>
      </label>
      <button
        disabled={loading}
        className="rounded-md bg-brand px-5 py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {loading ? 'Mengirim...' : 'Undang'}
      </button>
    </form>
  );
}
