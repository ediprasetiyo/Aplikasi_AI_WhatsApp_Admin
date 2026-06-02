'use server';

import { prisma } from '@wa-admin/db';
import { requireSession } from '@/lib/session';
import { PLANS, type PlanKey } from '@/lib/plans';

/**
 * Pastikan Subscription record ada untuk org tertentu — HANYA jika org tersebut adalah
 * primary workspace user (org tertua dimana user adalah owner). Workspace ke-2/ke-3 dst
 * tidak butuh record sendiri; mereka share subscription dari primary.
 * Trial 14 hari sejak signup pertama.
 * Idempotent — bisa dipanggil berulang.
 */
export async function ensureSubscription(organizationId: string) {
  const session = await requireSession();

  // Cek apakah ini primary workspace user (org tertua dimana user adalah owner)
  const primary = await prisma.member.findFirst({
    where: { userId: session.user.id, role: 'owner' },
    orderBy: { createdAt: 'asc' },
    select: { organizationId: true },
  });

  // Kalau ini BUKAN primary → skip, workspace ini ikut subscription primary
  if (!primary || primary.organizationId !== organizationId) {
    return null;
  }

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

/**
 * Validasi server-side: user boleh bikin workspace baru?
 * Cek jatah workspace di paket subscription primary.
 */
export async function canCreateWorkspace(): Promise<{ ok: boolean; reason?: string; limit?: number; current?: number }> {
  const session = await requireSession();
  const primary = await prisma.member.findFirst({
    where: { userId: session.user.id, role: 'owner' },
    orderBy: { createdAt: 'asc' },
  });
  if (!primary) return { ok: true }; // belum punya workspace sama sekali
  const sub = await prisma.subscription.findUnique({
    where: { organizationId: primary.organizationId },
  });
  const planKey = (sub?.plan ?? 'trial') as PlanKey;
  const planConfig = PLANS[planKey] ?? PLANS.trial;
  const ownedCount = await prisma.member.count({
    where: { userId: session.user.id, role: 'owner' },
  });
  if (ownedCount >= planConfig.maxWorkspaces) {
    return {
      ok: false,
      reason: `Paket ${planConfig.name} hanya boleh ${planConfig.maxWorkspaces} workspace. Anda sudah punya ${ownedCount}.`,
      limit: planConfig.maxWorkspaces,
      current: ownedCount,
    };
  }
  return { ok: true, limit: planConfig.maxWorkspaces, current: ownedCount };
}
