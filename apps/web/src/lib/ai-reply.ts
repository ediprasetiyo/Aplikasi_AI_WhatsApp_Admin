import { prisma } from '@wa-admin/db';
import { chat, type ChatMessage } from './groq';
import { sendTextMessage } from './whatsapp';
import { worker } from './worker-client';

const MAX_HISTORY = 10; // ambil 10 pesan terakhir untuk context

/**
 * Generate AI reply untuk percakapan, simpan ke DB, dan kirim via WA kalau account active.
 * Return: { replyText, sent } — `sent` true kalau berhasil dikirim ke WA, false kalau cuma disimpan (mis. simulator atau WA error).
 */
export async function generateAndSendReply(conversationId: string): Promise<{
  replyText: string;
  sent: boolean;
  error?: string;
}> {
  const convo = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      whatsappAccount: true,
      organization: {
        include: {
          aiSetting: true,
          knowledgeEntries: { orderBy: { createdAt: 'asc' } },
        },
      },
    },
  });
  if (!convo) throw new Error('Conversation not found');

  const ai = convo.organization.aiSetting;
  if (!ai || !ai.enabled) {
    return { replyText: '', sent: false, error: 'AI auto-reply belum diaktifkan' };
  }

  // Ambil history pesan
  const recent = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    take: MAX_HISTORY,
  });
  const history = recent.reverse();

  // Build system prompt + knowledge base
  const kbBlock =
    convo.organization.knowledgeEntries.length > 0
      ? '\n\nInformasi bisnis yang relevan:\n' +
        convo.organization.knowledgeEntries
          .map((k, i) => `[${i + 1}] ${k.title}\n${k.content}`)
          .join('\n\n')
      : '';

  const industry = parseIndustry(convo.organization.metadata);
  const industryHint = industry ? `\n\nBisnis ini bergerak di bidang: ${industry}.` : '';

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `${ai.systemPrompt}${industryHint}${kbBlock}

ATURAN MENULIS BALASAN:
- Bahasa Indonesia santai-profesional, seperti chat WA antara admin & customer.
- Singkat & to-the-point (maks 4-5 kalimat).
- Jangan ulangi pertanyaan customer.
- Gunakan format WhatsApp untuk balasan yang rapi:
  • *teks tebal* untuk highlight info penting (mis. jam, harga, nama menu)
  • _teks miring_ untuk catatan/tambahan
  • Gunakan baris baru (Enter) untuk pisah poin — JANGAN tulis semua dalam 1 baris panjang
  • Untuk list, pakai "- " atau emoji singkat di tiap baris
- Tutup dengan ramah (mis. "Ada yang bisa dibantu lagi?" atau emoji singkat).`,
    },
    ...history.map((m) => ({
      role: (m.direction === 'inbound' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.body ?? `[${m.type}]`,
    })),
  ];

  const replyText = await chat({ model: ai.model, messages });
  if (!replyText) {
    return { replyText: '', sent: false, error: 'AI mengembalikan respons kosong' };
  }

  // Simpan ke DB dulu
  const saved = await prisma.message.create({
    data: {
      conversationId,
      direction: 'outbound',
      type: 'text',
      body: replyText,
      status: 'pending',
    },
  });

  // Update lastMessageAt
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });

  // Coba kirim via WA
  const acc = convo.whatsappAccount;
  if (!acc || acc.status !== 'active') {
    await prisma.message.update({
      where: { id: saved.id },
      data: { status: 'simulated' },
    });
    return { replyText, sent: false, error: 'WA account tidak aktif (mode simulator)' };
  }

  try {
    let wamid: string | null = null;
    if (acc.provider === 'baileys') {
      // Lewat worker — pakai customerJid lengkap (mis. "xxx@lid") biar routing benar
      const targetJid = convo.customerJid ?? `${convo.customerPhone}@s.whatsapp.net`;
      const res = await worker.send(acc.id, targetJid, replyText);
      wamid = res.messageId;
    } else {
      // Cloud API langsung ke Meta
      const result = await sendTextMessage({
        phoneNumberId: acc.phoneNumberId,
        accessToken: acc.accessToken,
        to: convo.customerPhone,
        text: replyText,
      });
      wamid = result.messages[0]?.id ?? null;
    }
    await prisma.message.update({
      where: { id: saved.id },
      data: { status: 'sent', waMessageId: wamid ?? undefined },
    });
    return { replyText, sent: true };
  } catch (e) {
    const err = (e as Error).message;
    await prisma.message.update({
      where: { id: saved.id },
      data: { status: 'failed' },
    });
    return { replyText, sent: false, error: err };
  }
}

function parseIndustry(metadata: string | null): string | null {
  if (!metadata) return null;
  try {
    const obj = JSON.parse(metadata) as Record<string, unknown>;
    const v = obj.industry;
    return typeof v === 'string' ? v : null;
  } catch {
    return null;
  }
}
