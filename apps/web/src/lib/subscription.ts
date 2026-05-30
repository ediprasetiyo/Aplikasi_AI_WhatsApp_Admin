import { prisma } from '@wa-admin/db';

export type SubscriptionInfo = {
  plan: string;
  status: string;
  trialEndsAt: Date | null;
  daysRemaining: number | null;
  isExpired: boolean;
  isTrialing: boolean;
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
  const isExpired =
    (sub.status === 'trial_expired' || sub.status === 'expired') ||
    (sub.status === 'trial_active' && (daysRemaining ?? 0) <= 0);

  // Auto-update status kalau trial sudah habis
  if (sub.status === 'trial_active' && (daysRemaining ?? 0) <= 0) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: 'trial_expired' },
    });
  }

  return {
    plan: sub.plan,
    status: sub.status,
    trialEndsAt,
    daysRemaining,
    isExpired,
    isTrialing,
  };
}
