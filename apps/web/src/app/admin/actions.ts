'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@wa-admin/db';
import { requireSuperAdmin } from '@/lib/session';

type ActionResult = { ok: true } | { ok: false; error: string };

export async function adminUpdateWorkspaceName(
  organizationId: string,
  name: string,
): Promise<ActionResult> {
  await requireSuperAdmin();
  try {
    const trimmed = name.trim();
    if (trimmed.length < 2) return { ok: false, error: 'Nama terlalu pendek' };
    await prisma.organization.update({
      where: { id: organizationId },
      data: { name: trimmed },
    });
    revalidatePath('/admin/workspaces');
    revalidatePath(`/admin/workspaces/${organizationId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

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
  const session = await requireSuperAdmin();
  try {
    const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
    if (!sub) return { ok: false, error: 'Subscription tidak ditemukan' };

    const now = new Date();
    const intent = sub.paymentIntent ?? 'new';
    const targetPlan = sub.paymentIntentPlan ?? sub.plan;

    // Hitung currentPeriodEnd baru sesuai intent
    let newPeriodEnd: Date;
    let newPlan: string;

    if (intent === 'renewal') {
      // Extend +30 hari dari currentPeriodEnd existing (atau dari now kalau sudah expired)
      const base =
        sub.currentPeriodEnd && sub.currentPeriodEnd.getTime() > now.getTime()
          ? sub.currentPeriodEnd
          : now;
      newPeriodEnd = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);
      newPlan = sub.plan; // tetap paket sama
    } else if (intent === 'upgrade') {
      // Ganti plan + reset period dari hari ini +30
      newPlan = targetPlan;
      newPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else {
      // new — pertama kali bayar dari trial
      newPlan = targetPlan;
      newPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'active',
        plan: newPlan,
        currentPeriodEnd: newPeriodEnd,
        paymentApprovedAt: now,
        paymentApprovedBy: session.user.email,
        // Clear intent setelah applied
        paymentIntent: null,
        paymentIntentPlan: null,
      },
    });
    revalidatePath('/admin/subscriptions');
    revalidatePath('/admin');
    revalidatePath('/admin/workspaces');
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
