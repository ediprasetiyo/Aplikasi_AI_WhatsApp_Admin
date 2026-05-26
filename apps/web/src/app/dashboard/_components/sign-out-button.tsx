'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { signOut } from '@/lib/auth-client';

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await signOut();
        router.push('/login');
      }}
      className="flex w-full items-center gap-2 rounded-md border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
    >
      <LogOut className="h-4 w-4" />
      Keluar
    </button>
  );
}
