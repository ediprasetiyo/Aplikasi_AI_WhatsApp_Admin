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
};

/**
 * Get/create subscription info untuk org tertentu.
 * Otomatis bikin trial 14 hari kalau belum ada record.
 */
export async function getSubscriptionInfo(organizationId: string): Promise<SubscriptionInfo> {
  let sub = await prisma.subscription.findUnique({ where: { organizationId } });

  if (!sub) {
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    sub = await prisma.subscription.create({
      data: {
        organizationId,
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

  // Active jika status active & period belum habis
  const isActive =
    sub.status === 'active' &&
    !!sub.currentPeriodEnd &&
    sub.currentPeriodEnd.getTime() > now.getTime();
  // Locked = tidak boleh akses fitur. True kalau expired & belum bayar/aktif.
  // Pending_payment masih boleh akses (biar bisa kembali ke instruksi pembayaran).
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
  };
}
