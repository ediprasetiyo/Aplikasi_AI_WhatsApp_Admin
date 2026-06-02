import { prisma } from '@wa-admin/db';

export type SubscriptionInfo = {
  plan: string;
  status: string;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  daysRemaining: number | null;
  isExpired: boolean;
  isTrialing: boolean;
  isActive: boolean;
  /** TRUE kalau tidak punya akses (expired/trial habis & belum bayar). Pakai untuk lock UI */
  isLocked: boolean;
  /** ID workspace tempat subscription disimpan (primary org milik billing owner) */
  billingOrgId: string;
};

/**
 * Cari "billing owner" untuk org tertentu = user yang punya role 'owner' di org tsb.
 * Kemudian return organizationId paling tua milik owner tsb (= primary workspace).
 * Subscription disimpan di primary workspace ini; semua workspace lain milik owner sama
 * ikut paket & expired-nya.
 */
export async function resolveBillingOrgId(organizationId: string): Promise<string> {
  // Cari owner pertama dari org ini
  const owner = await prisma.member.findFirst({
    where: { organizationId, role: 'owner' },
    orderBy: { createdAt: 'asc' },
    select: { userId: true },
  });
  if (!owner) return organizationId; // fallback (org tanpa owner — edge case)

  // Cari org paling tua milik owner ini → itu primary workspace
  const primary = await prisma.member.findFirst({
    where: { userId: owner.userId, role: 'owner' },
    orderBy: { createdAt: 'asc' },
    select: { organizationId: true },
  });
  return primary?.organizationId ?? organizationId;
}

/**
 * Get/create subscription info untuk org.
 * Otomatis resolve ke primary workspace milik billing owner.
 * Workspace ke-2/ke-3 dst akan share subscription dengan workspace pertama.
 */
export async function getSubscriptionInfo(organizationId: string): Promise<SubscriptionInfo> {
  const billingOrgId = await resolveBillingOrgId(organizationId);
  let sub = await prisma.subscription.findUnique({ where: { organizationId: billingOrgId } });

  if (!sub) {
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    sub = await prisma.subscription.create({
      data: {
        organizationId: billingOrgId,
        plan: 'trial',
        status: 'trial_active',
        trialEndsAt: trialEnd,
      },
    });
  }

  const now = new Date();
  const trialEndsAt = sub.trialEndsAt;
  const daysRemaining = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
    : null;
  const isTrialing = sub.status === 'trial_active' && (daysRemaining ?? 0) > 0;
  const paidPeriodExpired =
    sub.status === 'active' &&
    !!sub.currentPeriodEnd &&
    sub.currentPeriodEnd.getTime() <= now.getTime();
  const isExpired =
    sub.status === 'trial_expired' ||
    sub.status === 'expired' ||
    (sub.status === 'trial_active' && (daysRemaining ?? 0) <= 0) ||
    paidPeriodExpired;

  // Auto-update status kalau trial sudah habis (tepat jam 00:00 jadi 0)
  if (sub.status === 'trial_active' && (daysRemaining ?? 0) <= 0) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: 'trial_expired' },
    });
    sub.status = 'trial_expired';
  }
  // Auto-update status paid subscription yang sudah lewat periode
  if (paidPeriodExpired) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: 'expired' },
    });
    sub.status = 'expired';
  }

  const isActive =
    sub.status === 'active' &&
    !!sub.currentPeriodEnd &&
    sub.currentPeriodEnd.getTime() > now.getTime();
  const isLocked =
    !isActive &&
    !isTrialing &&
    sub.status !== 'pending_payment';

  return {
    plan: sub.plan,
    status: sub.status,
    trialEndsAt,
    currentPeriodEnd: sub.currentPeriodEnd,
    daysRemaining,
    isExpired,
    isTrialing,
    isActive,
    isLocked,
    billingOrgId,
  };
}

/**
 * Hitung berapa workspace user sudah punya (sebagai owner) — dipakai untuk
 * enforce quota workspace sesuai paket.
 */
export async function countOwnedWorkspaces(userId: string): Promise<number> {
  return prisma.member.count({ where: { userId, role: 'owner' } });
}
