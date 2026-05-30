'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@wa-admin/db';
import { requireSession, requireActiveOrgId } from '@/lib/session';
import { PLANS, type PlanKey } from '@/lib/plans';

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

const checkoutSchema = z.object({
  plan: z.enum(['starter', 'pro', 'business']),
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
  ktpName: string;
  ktpNumber: string;
  phoneNumber: string;
  paymentMethod: string;
}): Promise<ActionResult> {
  try {
    await requireSession();
    const orgId = await requireActiveOrgId();
    const parsed = checkoutSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Input tidak valid' };
    }
    const { plan, ktpName, ktpNumber, phoneNumber, paymentMethod } = parsed.data;
    const planConfig = PLANS[plan as PlanKey];

    await prisma.subscription.upsert({
      where: { organizationId: orgId },
      create: {
        organizationId: orgId,
        plan,
        status: 'pending_payment',
        ktpName,
        ktpNumber,
        phoneNumber,
        paymentMethod,
        paymentAmount: planConfig.priceIdr,
        paymentSubmittedAt: new Date(),
      },
      update: {
        plan,
        status: 'pending_payment',
        ktpName,
        ktpNumber,
        phoneNumber,
        paymentMethod,
        paymentAmount: planConfig.priceIdr,
        paymentSubmittedAt: new Date(),
        // clear hasil approval lama biar dicek ulang admin
        paymentApprovedAt: null,
        paymentApprovedBy: null,
      },
    });

    revalidatePath('/dashboard/billing');
    revalidatePath('/dashboard');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/**
 * Batalkan pembayaran pending — user balik ke status sebelumnya (trial atau expired).
 * Subscription tidak dihapus, hanya status & data pembayaran direset.
 */
export async function cancelPendingSubscription(): Promise<ActionResult> {
  try {
    await requireSession();
    const orgId = await requireActiveOrgId();
    const sub = await prisma.subscription.findUnique({ where: { organizationId: orgId } });
    if (!sub) return { ok: false, error: 'Tidak ada subscription' };
    if (sub.status !== 'pending_payment') {
      return { ok: false, error: 'Status saat ini bukan pending_payment' };
    }
    // Balik ke trial kalau masih dalam periode trial, atau expired kalau sudah habis
    const now = new Date();
    const stillTrialing = sub.trialEndsAt && sub.trialEndsAt.getTime() > now.getTime();
    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: stillTrialing ? 'trial_active' : 'trial_expired',
        plan: 'trial',
        ktpName: null,
        ktpNumber: null,
        phoneNumber: null,
        paymentMethod: null,
        paymentAmount: null,
        paymentSubmittedAt: null,
      },
    });
    revalidatePath('/dashboard/billing');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
