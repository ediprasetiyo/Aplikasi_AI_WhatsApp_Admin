import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/session';
import { prisma } from '@wa-admin/db';
import { OnboardingForm } from './form';

export default async function OnboardingPage() {
  const session = await requireSession();

  // Catatan: TIDAK redirect ke /dashboard kalau user sudah punya membership —
  // izinkan create workspace baru kapan saja (untuk multi-bisnis).

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-lg">
        <h1 className="text-3xl font-bold">Setup Workspace</h1>
        <p className="mt-2 text-gray-600">
          Setiap workspace mewakili 1 bisnis (mis. klinik, salon, dealer). Anda bisa undang admin
          lain setelah workspace dibuat.
        </p>
        <div className="mt-8 rounded-lg border bg-white p-6 shadow-sm">
          <OnboardingForm />
        </div>
      </div>
    </div>
  );
}
