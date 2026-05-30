'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@wa-admin/db';
import { requireSession, getActiveOrgId } from '@/lib/session';

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

async function getActiveOrg() {
  const session = await requireSession();
  const orgId = await getActiveOrgId();
  if (!orgId) throw new Error('Workspace belum ada — buat dulu di /onboarding');
  return { session, orgId };
}

const settingSchema = z.object({
  enabled: z.boolean(),
  systemPrompt: z.string().trim().min(10, 'System prompt terlalu pendek'),
  model: z.string().trim().min(3),
  replyDelayMs: z.coerce.number().int().min(0).max(60000),
});

export async function saveAiSetting(input: {
  enabled: boolean;
  systemPrompt: string;
  model: string;
  replyDelayMs: number;
}): Promise<ActionResult> {
  try {
    const { orgId } = await getActiveOrg();
    const parsed = settingSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Input tidak valid' };
    }
    await prisma.aiSetting.upsert({
      where: { organizationId: orgId },
      create: { organizationId: orgId, ...parsed.data },
      update: parsed.data,
    });
    revalidatePath('/dashboard/ai');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

const kbSchema = z.object({
  title: z.string().trim().min(2, 'Judul minimal 2 karakter'),
  content: z.string().trim().min(5, 'Isi terlalu pendek'),
});

export async function createKnowledgeEntry(formData: FormData): Promise<ActionResult> {
  try {
    const { orgId } = await getActiveOrg();
    const parsed = kbSchema.safeParse({
      title: formData.get('title'),
      content: formData.get('content'),
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Input tidak valid' };
    }
    await prisma.knowledgeEntry.create({
      data: { organizationId: orgId, ...parsed.data },
    });
    revalidatePath('/dashboard/ai');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Import bulk knowledge dari file Excel/CSV (parsed di client jadi array) */
const importSchema = z.object({
  entries: z
    .array(
      z.object({
        title: z.string().trim().min(2),
        content: z.string().trim().min(5),
      }),
    )
    .min(1)
    .max(500),
});

export async function importKnowledgeEntries(
  entries: Array<{ title: string; content: string }>,
): Promise<ActionResult<{ created: number; skipped: number }>> {
  try {
    const { orgId } = await getActiveOrg();
    const parsed = importSchema.safeParse({ entries });
    if (!parsed.success) {
      return {
        ok: false,
        error: `Validasi gagal: ${parsed.error.issues[0]?.message ?? ''}`,
      };
    }
    let created = 0;
    let skipped = 0;
    for (const e of parsed.data.entries) {
      try {
        await prisma.knowledgeEntry.create({
          data: { organizationId: orgId, title: e.title, content: e.content },
        });
        created++;
      } catch {
        skipped++;
      }
    }
    revalidatePath('/dashboard/ai');
    return { ok: true, data: { created, skipped } };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function updateKnowledgeEntry(
  id: string,
  data: { title: string; content: string },
): Promise<ActionResult> {
  try {
    const { orgId } = await getActiveOrg();
    const parsed = kbSchema.safeParse(data);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Input tidak valid' };
    }
    const entry = await prisma.knowledgeEntry.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!entry) return { ok: false, error: 'Entry tidak ditemukan' };
    await prisma.knowledgeEntry.update({
      where: { id },
      data: parsed.data,
    });
    revalidatePath('/dashboard/ai');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteKnowledgeEntry(id: string): Promise<ActionResult> {
  try {
    const { orgId } = await getActiveOrg();
    const entry = await prisma.knowledgeEntry.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!entry) return { ok: false, error: 'Entry tidak ditemukan' };
    await prisma.knowledgeEntry.delete({ where: { id } });
    revalidatePath('/dashboard/ai');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
