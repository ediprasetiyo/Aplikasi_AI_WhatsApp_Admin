'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@wa-admin/db';
import { getActiveOrgId } from '@/lib/session';
import { worker, type SessionStatus } from '@/lib/worker-client';

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

async function getOrgId() {
  const orgId = await getActiveOrgId();
  if (!orgId) throw new Error('Workspace belum ada — buat dulu di /onboarding');
  return orgId;
}

/** Mulai session Baileys baru atau resume yang ada → web polling QR */
export async function startBaileysSession(): Promise<ActionResult<{ accountId: string }>> {
  try {
    const orgId = await getOrgId();

    // Cek apakah sudah ada Baileys account untuk org ini
    let account = await prisma.whatsappAccount.findFirst({
      where: { organizationId: orgId, provider: 'baileys' },
    });

    if (!account) {
      account = await prisma.whatsappAccount.create({
        data: {
          organizationId: orgId,
          provider: 'baileys',
          phoneNumberId: `baileys_${orgId.slice(0, 8)}_${Date.now()}`,
          displayPhoneNumber: 'Menunggu scan QR...',
          accessToken: '',
          status: 'connecting',
        },
      });
    } else {
      await prisma.whatsappAccount.update({
        where: { id: account.id },
        data: { status: 'connecting', lastError: null },
      });
    }

    await worker.connect(account.id, orgId);
    revalidatePath('/dashboard/whatsapp');
    return { ok: true, data: { accountId: account.id } };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function getBaileysStatus(accountId: string): Promise<ActionResult<SessionStatus>> {
  try {
    await getOrgId();
    const status = await worker.status(accountId);
    return { ok: true, data: status };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function disconnectBaileys(accountId: string): Promise<ActionResult> {
  try {
    const orgId = await getOrgId();
    const acc = await prisma.whatsappAccount.findFirst({
      where: { id: accountId, organizationId: orgId },
    });
    if (!acc) return { ok: false, error: 'Akun tidak ditemukan' };

    try {
      await worker.disconnect(accountId);
    } catch {
      // worker bisa offline — tetap update DB
    }
    await prisma.whatsappAccount.update({
      where: { id: accountId },
      data: { status: 'disconnected' },
    });
    await prisma.baileysSession
      .update({
        where: { whatsappAccountId: accountId },
        data: { credsJson: null, qrCode: null },
      })
      .catch(() => null);
    revalidatePath('/dashboard/whatsapp');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
