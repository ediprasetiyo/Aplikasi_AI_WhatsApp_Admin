import Link from 'next/link';
import { requireSession } from '@/lib/session';
import { prisma } from '@wa-admin/db';
import { OnboardingForm } from './form';
import { getPlan } from '@/lib/plans';
import { getSubscriptionInfo, countOwnedWorkspaces } from '@/lib/subscription';
import { AlertTriangle, Sparkles } from 'lucide-react';

export default async function OnboardingPage() {
  const session = await requireSession();

  // Cari primary workspace user (org tertua dimana user adalah owner)
  const primaryMembership = await prisma.member.findFirst({
    where: { userId: session.user.id, role: 'owner' },
    orderBy: { createdAt: 'asc' },
    include: { organization: true },
  });

  // Hitung workspace yang dimiliki (owner) user
  const ownedCount = await countOwnedWorkspaces(session.user.id);

  // Plan diambil dari subscription primary (semua workspace ikut paket ini)
  const sub = primaryMembership
    ? await getSubscriptionInfo(primaryMembership.organizationId)
    : null;
  const planConfig = getPlan(sub?.plan ?? 'trial');
  const limit = planConfig.maxWorkspaces;
  const canCreate = ownedCount < limit;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-lg">
        <h1 className="text-3xl font-bold">
          {ownedCount === 0 ? 'Setup Workspace' : 'Workspace Baru'}
        </h1>
        <p className="mt-2 text-gray-600">
          Setiap workspace mewakili 1 bisnis (mis. klinik, salon, dealer). Anda bisa undang
          admin lain setelah workspace dibuat.
        </p>

        {ownedCount > 0 && (
          <div className="mt-4 rounded-md border bg-white px-4 py-3 text-xs text-gray-700">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand" />
              <span>
                Paket Anda saat ini: <strong className="capitalize">{planConfig.name}</strong>
                {' — '}
                jatah <strong>{limit}</strong> workspace ({ownedCount} sudah dipakai)
              </span>
            </div>
            <p className="mt-1.5 text-gray-500">
              Workspace tambahan otomatis ikut paket & masa aktif workspace pertama Anda. Tidak
              perlu bayar lagi.
            </p>
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
                    Jatah workspace habis ({ownedCount} / {limit})
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
