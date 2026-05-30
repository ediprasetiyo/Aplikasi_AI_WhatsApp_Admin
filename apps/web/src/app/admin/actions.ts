'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@wa-admin/db';
import { requireSuperAdmin } from '@/lib/session';

type ActionResult = { ok: true } | { ok: false; error: string };

export async function deleteWorkspace(organizationId: string): Promise<ActionResult> {
  await requireSuperAdmin();
  try {
    // Cascade akan hapus semua: members, invitations, whatsappAccounts, conversations,
    // messages, knowledgeEntries, aiSetting, subscription, baileysSession.
    await prisma.organization.delete({ where: { id: organizationId } });
    revalidatePath('/admin');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function approvePayment(subscriptionId: string): Promise<ActionResult> {
  await requireSuperAdmin();
  try {
    const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
    if (!sub) return { ok: false, error: 'Subscription tidak ditemukan' };
    const session = await requireSuperAdmin();
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'active',
        currentPeriodEnd: periodEnd,
        paymentApprovedAt: new Date(),
        paymentApprovedBy: session.user.email,
      },
    });
    revalidatePath('/admin/subscriptions');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function rejectPayment(
  subscriptionId: string,
  notes: string,
): Promise<ActionResult> {
  await requireSuperAdmin();
  try {
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'trial_expired',
        paymentNotes: notes,
      },
    });
    revalidatePath('/admin/subscriptions');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
