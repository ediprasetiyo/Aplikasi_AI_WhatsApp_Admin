'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@wa-admin/db';
import { requireSession, requireActiveOrgId } from '@/lib/session';

export type ActionResult = { ok: true } | { ok: false; error: string };

const nameSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100),
});

export async function updateWorkspaceName(name: string): Promise<ActionResult> {
  try {
    const session = await requireSession();
    const orgId = await requireActiveOrgId();
    const parsed = nameSchema.safeParse({ name });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Nama tidak valid' };
    }

    // Cek role: hanya owner/admin yang bisa edit
    const member = await prisma.member.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId: session.user.id } },
    });
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return { ok: false, error: 'Hanya Owner/Admin yang bisa edit nama workspace' };
    }

    await prisma.organization.update({
      where: { id: orgId },
      data: { name: parsed.data.name },
    });
    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteOwnWorkspace(): Promise<ActionResult> {
  try {
    const session = await requireSession();
    const orgId = await requireActiveOrgId();

    // Hanya owner yang bisa hapus workspace miliknya
    const member = await prisma.member.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId: session.user.id } },
    });
    if (!member || member.role !== 'owner') {
      return { ok: false, error: 'Hanya Owner yang bisa hapus workspace' };
    }

    await prisma.organization.delete({ where: { id: orgId } });
    revalidatePath('/dashboard');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
