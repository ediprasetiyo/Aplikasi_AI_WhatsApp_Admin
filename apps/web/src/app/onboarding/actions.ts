'use server';

import { prisma } from '@wa-admin/db';
import { requireSession } from '@/lib/session';

/**
 * Pastikan Subscription record ada untuk org. Trial 14 hari sejak dibuat.
 * Idempotent — bisa dipanggil berulang.
 */
export async function ensureSubscription(organizationId: string) {
  await requireSession();
  const existing = await prisma.subscription.findUnique({
    where: { organizationId },
  });
  if (existing) return existing;

  const now = new Date();
  const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  return prisma.subscription.create({
    data: {
      organizationId,
      plan: 'trial',
      status: 'trial_active',
      trialEndsAt: trialEnd,
    },
  });
}
