'use client';

import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

type Org = { id: string; name: string; slug: string };

export function OrgSwitcher({ memberships, activeId }: { memberships: Org[]; activeId: string }) {
  const router = useRouter();

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    if (id === '__new__') {
      router.push('/onboarding');
      return;
    }
    await authClient.organization.setActive({ organizationId: id });
    router.refresh();
  }

  return (
    <select
      value={activeId}
      onChange={onChange}
      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
    >
      {memberships.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
      <option value="__new__">+ Workspace baru</option>
    </select>
  );
}
