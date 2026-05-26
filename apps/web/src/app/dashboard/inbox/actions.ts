'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@wa-admin/db';
import { requireSession } from '@/lib/session';
import { sendTextMessage } from '@/lib/whatsapp';
import { generateAndSendReply } from '@/lib/ai-reply';

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

async function getOrg() {
  const session = await requireSession();
  const orgId = session.session.activeOrganizationId;
  if (!orgId) throw new Error('Pilih workspace dulu');
  return orgId;
}

const replySchema = z.object({
  conversationId: z.string().min(1),
  text: z.string().trim().min(1, 'Balasan kosong').max(4000),
});

/** Kirim balasan manual dari admin ke customer */
export async function sendManualReply(input: {
  conversationId: string;
  text: string;
}): Promise<ActionResult> {
  try {
    const orgId = await getOrg();
    const parsed = replySchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Input tidak valid' };
    }
    const convo = await prisma.conversation.findFirst({
      where: { id: parsed.data.conversationId, organizationId: orgId },
      include: { whatsappAccount: true },
    });
    if (!convo) return { ok: false, error: 'Conversation tidak ditemukan' };

    const saved = await prisma.message.create({
      data: {
        conversationId: convo.id,
        direction: 'outbound',
        type: 'text',
        body: parsed.data.text,
        status: 'pending',
      },
    });
    await prisma.conversation.update({
      where: { id: convo.id },
      data: { lastMessageAt: new Date() },
    });

    const acc = convo.whatsappAccount;
    if (!acc || acc.status !== 'active') {
      await prisma.message.update({
        where: { id: saved.id },
        data: { status: 'simulated' },
      });
      revalidatePath(`/dashboard/inbox/${convo.id}`);
      return { ok: true };
    }

    try {
      const result = await sendTextMessage({
        phoneNumberId: acc.phoneNumberId,
        accessToken: acc.accessToken,
        to: convo.customerPhone,
        text: parsed.data.text,
      });
      await prisma.message.update({
        where: { id: saved.id },
        data: { status: 'sent', waMessageId: result.messages[0]?.id },
      });
    } catch (e) {
      await prisma.message.update({ where: { id: saved.id }, data: { status: 'failed' } });
      return { ok: false, error: (e as Error).message };
    }

    revalidatePath(`/dashboard/inbox/${convo.id}`);
    revalidatePath('/dashboard/inbox');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

const simSchema = z.object({
  customerPhone: z.string().trim().regex(/^\d{8,15}$/, 'Format nomor: digit saja, tanpa +'),
  customerName: z.string().trim().optional().or(z.literal('')),
  text: z.string().trim().min(1).max(4000),
  triggerAi: z.boolean().optional(),
});

/** Simulator: bikin pesan inbound palsu untuk testing tanpa WA terhubung */
export async function simulateInbound(input: {
  customerPhone: string;
  customerName?: string;
  text: string;
  triggerAi?: boolean;
}): Promise<ActionResult<{ conversationId: string; aiReply?: string }>> {
  try {
    const orgId = await getOrg();
    const parsed = simSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Input tidak valid' };
    }

    // Cari atau buat WA account placeholder (untuk simulator)
    let account = await prisma.whatsappAccount.findFirst({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'asc' },
    });
    if (!account) {
      account = await prisma.whatsappAccount.create({
        data: {
          organizationId: orgId,
          phoneNumberId: `sim_${orgId.slice(0, 8)}`,
          displayPhoneNumber: '+62 SIMULATOR',
          verifiedName: 'Simulator',
          accessToken: 'sim',
          status: 'disconnected',
        },
      });
    }

    const convo = await prisma.conversation.upsert({
      where: {
        whatsappAccountId_customerPhone: {
          whatsappAccountId: account.id,
          customerPhone: parsed.data.customerPhone,
        },
      },
      create: {
        organizationId: orgId,
        whatsappAccountId: account.id,
        customerPhone: parsed.data.customerPhone,
        customerName: parsed.data.customerName || null,
        lastMessageAt: new Date(),
      },
      update: {
        customerName: parsed.data.customerName || undefined,
        lastMessageAt: new Date(),
      },
    });

    await prisma.message.create({
      data: {
        conversationId: convo.id,
        direction: 'inbound',
        type: 'text',
        body: parsed.data.text,
      },
    });

    let aiReply: string | undefined;
    if (parsed.data.triggerAi) {
      try {
        const res = await generateAndSendReply(convo.id);
        if (res.replyText) aiReply = res.replyText;
      } catch (e) {
        // AI bisa gagal (no key, dsb) — pesan inbound tetap tersimpan
        return {
          ok: true,
          data: { conversationId: convo.id, aiReply: `(AI gagal: ${(e as Error).message})` },
        };
      }
    }

    revalidatePath('/dashboard/inbox');
    revalidatePath(`/dashboard/inbox/${convo.id}`);
    return { ok: true, data: { conversationId: convo.id, aiReply } };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Trigger AI reply manual untuk conversation existing (tombol "Jawab dengan AI") */
export async function triggerAiReply(conversationId: string): Promise<ActionResult<{ reply: string }>> {
  try {
    const orgId = await getOrg();
    const convo = await prisma.conversation.findFirst({
      where: { id: conversationId, organizationId: orgId },
    });
    if (!convo) return { ok: false, error: 'Conversation tidak ditemukan' };

    const res = await generateAndSendReply(conversationId);
    if (!res.replyText) {
      return { ok: false, error: res.error ?? 'AI tidak menghasilkan balasan' };
    }
    revalidatePath(`/dashboard/inbox/${conversationId}`);
    revalidatePath('/dashboard/inbox');
    return { ok: true, data: { reply: res.replyText } };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
