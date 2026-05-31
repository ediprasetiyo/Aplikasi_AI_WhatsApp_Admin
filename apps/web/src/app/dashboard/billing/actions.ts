'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@wa-admin/db';
import { requireSession, requireActiveOrgId } from '@/lib/session';
import { PLANS, type PlanKey } from '@/lib/plans';

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

const PLAN_RANK: Record<string, number> = {
  trial: 0,
  starter: 1,
  pro: 2,
  business: 3,
};

const checkoutSchema = z.object({
  plan: z.enum(['starter', 'pro', 'business']),
  intent: z.enum(['new', 'renewal', 'upgrade']),
  ktpName: z.string().trim().min(3, 'Nama lengkap wajib sesuai KTP'),
  ktpNumber: z
    .string()
    .trim()
    .regex(/^\d{16}$/, 'Nomor KTP harus 16 digit angka'),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^\d{8,15}$/, 'Format nomor: 08xxx atau 628xxx (digit saja)'),
  paymentMethod: z.enum(['bca', 'dana']),
});

export async function submitSubscription(input: {
  plan: string;
  intent: string;
  ktpName: string;
  ktpNumber: string;
  phoneNumber: string;
  paymentMethod: string;
}): Promise<ActionResult> {
  try {
    const session = await requireSession();
    const orgId = await requireActiveOrgId();
    const parsed = checkoutSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Input tidak valid' };
    }
    const { plan, intent, ktpName, ktpNumber, phoneNumber, paymentMethod } = parsed.data;
    const planConfig = PLANS[plan as PlanKey];

    // Validasi intent vs current subscription
    const current = await prisma.subscription.findUnique({
      where: { organizationId: orgId },
    });

    if (intent === 'renewal') {
      if (!current || current.status !== 'active') {
        return { ok: false, error: 'Perpanjang hanya bisa dari status Aktif' };
      }
      if (current.plan !== plan) {
        return { ok: false, error: 'Pilih paket sama saat perpanjang' };
      }
    }

    if (intent === 'upgrade') {
      if (!current) {
        return { ok: false, error: 'Tidak ada subscription aktif' };
      }
      const currentRank = PLAN_RANK[current.plan] ?? 0;
      const targetRank = PLAN_RANK[plan] ?? 0;
      if (targetRank < currentRank) {
        // Downgrade — cek apakah user punya terlalu banyak workspace
        const memberCount = await prisma.member.count({
          where: { userId: session.user.id },
        });
        if (memberCount > planConfig.maxWorkspaces) {
          return {
            ok: false,
            error: `Anda punya ${memberCount} workspace. Paket ${planConfig.name} hanya boleh ${planConfig.maxWorkspaces}. Hapus workspace berlebih dulu sebelum downgrade.`,
          };
        }
      }
    }

    await prisma.subscription.upsert({
      where: { organizationId: orgId },
      create: {
        organizationId: orgId,
        plan: current?.plan ?? 'trial', // jangan ubah plan sampai approved
        status: 'pending_payment',
        ktpName,
        ktpNumber,
        phoneNumber,
        paymentMethod,
        paymentAmount: planConfig.priceIdr,
        paymentSubmittedAt: new Date(),
        paymentIntent: intent,
        paymentIntentPlan: plan,
      },
      update: {
        // PENTING: jangan timpa plan sampai admin approve, biar fitur tetap aktif
        status: 'pending_payment',
        ktpName,
        ktpNumber,
        phoneNumber,
        paymentMethod,
        paymentAmount: planConfig.priceIdr,
        paymentSubmittedAt: new Date(),
        paymentApprovedAt: null,
        paymentApprovedBy: null,
        paymentIntent: intent,
        paymentIntentPlan: plan,
      },
    });

    revalidatePath('/dashboard/billing');
    revalidatePath('/dashboard');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Batalkan pembayaran pending — balik ke status sebelumnya */
export async function cancelPendingSubscription(): Promise<ActionResult> {
  try {
    await requireSession();
    const orgId = await requireActiveOrgId();
    const sub = await prisma.subscription.findUnique({ where: { organizationId: orgId } });
    if (!sub) return { ok: false, error: 'Tidak ada subscription' };
    if (sub.status !== 'pending_payment') {
      return { ok: false, error: 'Status saat ini bukan pending_payment' };
    }
    const now = new Date();
    // Kalau current period masih aktif (renewal/upgrade dari paket aktif) → balik ke active
    // Kalau trial masih jalan → balik ke trial
    // Kalau semua sudah habis → trial_expired
    const stillActive = sub.currentPeriodEnd && sub.currentPeriodEnd.getTime() > now.getTime();
    const stillTrialing = sub.trialEndsAt && sub.trialEndsAt.getTime() > now.getTime();
    const newStatus = stillActive ? 'active' : stillTrialing ? 'trial_active' : 'trial_expired';
    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: newStatus,
        // Reset data pembayaran tapi keep ktp untuk kemudahan future
        paymentMethod: null,
        paymentAmount: null,
        paymentSubmittedAt: null,
        paymentIntent: null,
        paymentIntentPlan: null,
      },
    });
    revalidatePath('/dashboard/billing');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Polling endpoint — return status terbaru, dipakai checkout page untuk auto-redirect */
export async function pollSubscriptionStatus(): Promise<
  ActionResult<{ status: string; plan: string; currentPeriodEnd: string | null }>
> {
  try {
    await requireSession();
    const orgId = await requireActiveOrgId();
    const sub = await prisma.subscription.findUnique({ where: { organizationId: orgId } });
    if (!sub) return { ok: false, error: 'No subscription' };
    return {
      ok: true,
      data: {
        status: sub.status,
        plan: sub.plan,
        currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
      },
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
