'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@wa-admin/db';
import { requireSession, getActiveOrgId } from '@/lib/session';
import { sendTextMessage } from '@/lib/whatsapp';
import { generateAndSendReply } from '@/lib/ai-reply';
import { worker } from '@/lib/worker-client';

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

async function getOrg() {
  await requireSession();
  const orgId = await getActiveOrgId();
  if (!orgId) throw new Error('Workspace belum ada — buat dulu di /onboarding');
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
      if (acc.provider === 'baileys') {
        // Pakai customerJid lengkap untuk routing yang benar (@lid vs @s.whatsapp.net)
        const targetJid = convo.customerJid ?? `${convo.customerPhone}@s.whatsapp.net`;
        const res = await worker.send(acc.id, targetJid, parsed.data.text);
        await prisma.message.update({
          where: { id: saved.id },
          data: { status: 'sent', waMessageId: res.messageId ?? undefined },
        });
      } else {
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
      }
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

/** Mark conversation(s) sebagai sudah dibaca/dihandle — geser dari "Belum Dijawab" ke "Selesai" */
export async function markConversationsRead(ids: string[]): Promise<ActionResult<{ count: number }>> {
  try {
    const orgId = await getOrg();
    const result = await prisma.conversation.updateMany({
      where: { id: { in: ids }, organizationId: orgId },
      data: { markedReadAt: new Date() },
    });
    revalidatePath('/dashboard/inbox');
    return { ok: true, data: { count: result.count } };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Ban customer — chat berikutnya tidak akan diproses AI */
export async function banCustomer(conversationId: string): Promise<ActionResult> {
  try {
    const orgId = await getOrg();
    const convo = await prisma.conversation.findFirst({
      where: { id: conversationId, organizationId: orgId },
    });
    if (!convo) return { ok: false, error: 'Conversation tidak ditemukan' };
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { customerStatus: 'banned' },
    });
    revalidatePath('/dashboard/inbox');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function unbanCustomer(conversationId: string): Promise<ActionResult> {
  try {
    const orgId = await getOrg();
    await prisma.conversation.updateMany({
      where: { id: conversationId, organizationId: orgId },
      data: { customerStatus: 'active', repeatCount: 0 },
    });
    revalidatePath('/dashboard/inbox');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/**
 * Kirim ulang pesan outbound yang status-nya `failed` / `pending`.
 * Gunakan body pesan existing — JANGAN bikin pesan baru, supaya history bersih.
 */
export async function resendFailedMessage(messageId: string): Promise<ActionResult> {
  try {
    const orgId = await getOrg();
    const msg = await prisma.message.findFirst({
      where: { id: messageId },
      include: {
        conversation: {
          include: { whatsappAccount: true },
        },
      },
    });
    if (!msg) return { ok: false, error: 'Pesan tidak ditemukan' };
    if (msg.conversation.organizationId !== orgId) {
      return { ok: false, error: 'Tidak punya akses' };
    }
    if (msg.direction !== 'outbound') {
      return { ok: false, error: 'Hanya pesan outbound yang bisa di-resend' };
    }
    if (msg.status === 'sent' || msg.status === 'delivered' || msg.status === 'read') {
      return { ok: false, error: 'Pesan sudah terkirim, tidak perlu di-resend' };
    }
    if (!msg.body) {
      return { ok: false, error: 'Pesan kosong, tidak bisa di-resend' };
    }

    const acc = msg.conversation.whatsappAccount;
    if (!acc || acc.status !== 'active') {
      return { ok: false, error: 'WhatsApp tidak aktif. Hubungkan dulu di menu WhatsApp.' };
    }

    // Mark sebagai "sending" supaya UI bisa kasih loading state
    await prisma.message.update({
      where: { id: msg.id },
      data: { status: 'pending' },
    });

    try {
      let wamid: string | null = null;
      if (acc.provider === 'baileys') {
        const targetJid =
          msg.conversation.customerJid ?? `${msg.conversation.customerPhone}@s.whatsapp.net`;
        const res = await worker.send(acc.id, targetJid, msg.body);
        wamid = res.messageId;
      } else {
        const res = await sendTextMessage({
          phoneNumberId: acc.phoneNumberId,
          accessToken: acc.accessToken,
          to: msg.conversation.customerPhone,
          text: msg.body,
        });
        wamid = res.messages[0]?.id ?? null;
      }
      await prisma.message.update({
        where: { id: msg.id },
        data: { status: 'sent', waMessageId: wamid ?? undefined },
      });
      revalidatePath(`/dashboard/inbox/${msg.conversationId}`);
      revalidatePath('/dashboard/inbox');
      return { ok: true };
    } catch (e) {
      await prisma.message.update({
        where: { id: msg.id },
        data: { status: 'failed' },
      });
      return { ok: false, error: `Gagal kirim: ${(e as Error).message}` };
    }
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
