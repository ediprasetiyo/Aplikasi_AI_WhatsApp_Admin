'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { signOut } from '@/lib/auth-client';

export function AdminSignOut() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await signOut();
        // Redirect ke main domain login karena admin subdomain butuh auth dari main
        if (typeof window !== 'undefined' && window.location.hostname.startsWith('admin.')) {
          window.location.href = 'https://autobalas.my.id/login';
        } else {
          router.push('/login');
        }
      }}
      className="flex w-full items-center gap-2 rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-100 hover:bg-gray-700 hover:text-white"
    >
      <LogOut className="h-4 w-4" />
      Keluar
    </button>
  );
}
