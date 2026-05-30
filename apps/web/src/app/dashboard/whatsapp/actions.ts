'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@wa-admin/db';
import { requireSession, getActiveOrgId } from '@/lib/session';
import { getPhoneNumberInfo } from '@/lib/whatsapp';

const connectSchema = z.object({
  phoneNumberId: z.string().trim().min(5, 'Phone Number ID wajib'),
  accessToken: z.string().trim().min(20, 'Access Token tidak valid'),
  businessAccountId: z.string().trim().optional().or(z.literal('')),
});

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function connectWhatsappAccount(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const orgId = await getActiveOrgId();
  if (!orgId) return { ok: false, error: 'Workspace belum ada' };

  // pastikan user adalah owner/admin di workspace
  const member = await prisma.member.findUnique({
    where: { organizationId_userId: { organizationId: orgId, userId: session.user.id } },
  });
  if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
    return { ok: false, error: 'Hanya owner/admin yang bisa connect WhatsApp' };
  }

  const parsed = connectSchema.safeParse({
    phoneNumberId: formData.get('phoneNumberId'),
    accessToken: formData.get('accessToken'),
    businessAccountId: formData.get('businessAccountId') ?? '',
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Input tidak valid' };
  }

  const { phoneNumberId, accessToken, businessAccountId } = parsed.data;

  // verify ke Meta
  const verify = await getPhoneNumberInfo(phoneNumberId, accessToken);
  if (!verify.ok) {
    return { ok: false, error: `Verifikasi Meta gagal: ${verify.error}` };
  }

  // upsert
  try {
    await prisma.whatsappAccount.upsert({
      where: { phoneNumberId },
      create: {
        organizationId: orgId,
        phoneNumberId,
        displayPhoneNumber: verify.data.display_phone_number,
        verifiedName: verify.data.verified_name ?? null,
        businessAccountId: businessAccountId || null,
        accessToken,
        status: 'active',
      },
      update: {
        organizationId: orgId,
        displayPhoneNumber: verify.data.display_phone_number,
        verifiedName: verify.data.verified_name ?? null,
        businessAccountId: businessAccountId || null,
        accessToken,
        status: 'active',
        lastError: null,
      },
    });
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  revalidatePath('/dashboard/whatsapp');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function disconnectWhatsappAccount(accountId: string): Promise<ActionResult> {
  await requireSession();
  const orgId = await getActiveOrgId();
  if (!orgId) return { ok: false, error: 'Workspace belum ada' };

  const account = await prisma.whatsappAccount.findFirst({
    where: { id: accountId, organizationId: orgId },
  });
  if (!account) return { ok: false, error: 'Akun WA tidak ditemukan' };

  await prisma.whatsappAccount.delete({ where: { id: accountId } });
  revalidatePath('/dashboard/whatsapp');
  return { ok: true };
}
