import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireSession } from '@/lib/session';
import { prisma } from '@wa-admin/db';
import { OnboardingForm } from './form';
import { getPlan } from '@/lib/plans';
import { AlertTriangle } from 'lucide-react';

export default async function OnboardingPage() {
  const session = await requireSession();

  // Hitung berapa workspace user ini sudah punya
  const memberships = await prisma.member.findMany({
    where: { userId: session.user.id },
    include: { organization: { include: { subscription: true } } },
  });

  // Cari plan tertinggi dari semua org user
  const planKeys = memberships.map((m) => m.organization.subscription?.plan ?? 'trial');
  const planRank: Record<string, number> = {
    trial: 0,
    starter: 1,
    pro: 2,
    business: 3,
  };
  const bestPlan = planKeys.reduce<string>(
    (best, p) => ((planRank[p] ?? 0) > (planRank[best] ?? 0) ? p : best),
    'trial',
  );
  const planConfig = getPlan(bestPlan);
  const currentCount = memberships.length;
  const limit = planConfig.maxWorkspaces;
  const canCreate = currentCount < limit;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-lg">
        <h1 className="text-3xl font-bold">
          {currentCount === 0 ? 'Setup Workspace' : 'Workspace Baru'}
        </h1>
        <p className="mt-2 text-gray-600">
          Setiap workspace mewakili 1 bisnis (mis. klinik, salon, dealer). Anda bisa undang
          admin lain setelah workspace dibuat.
        </p>

        {currentCount > 0 && (
          <div className="mt-4 rounded-md border bg-white px-4 py-2 text-xs text-gray-600">
            Workspace Anda saat ini: <strong>{currentCount}</strong> / {limit} (paket{' '}
            <strong className="capitalize">{planConfig.name}</strong>)
          </div>
        )}

        <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
          {canCreate ? (
            <OnboardingForm />
          ) : (
            <div>
              <div className="flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">
                    Limit workspace tercapai ({currentCount} / {limit})
                  </div>
                  <p className="mt-1 text-xs">
                    Paket <strong className="capitalize">{planConfig.name}</strong> hanya
                    boleh {limit} workspace. Upgrade ke paket lebih tinggi untuk tambah.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Link
                  href="/dashboard/billing"
                  className="flex-1 rounded-md bg-brand py-2 text-center text-sm font-medium text-white hover:bg-brand-dark"
                >
                  Upgrade Paket
                </Link>
                <Link
                  href="/dashboard"
                  className="flex-1 rounded-md border py-2 text-center text-sm hover:bg-gray-50"
                >
                  Kembali
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
