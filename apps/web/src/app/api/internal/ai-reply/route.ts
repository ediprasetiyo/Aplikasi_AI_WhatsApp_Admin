import { NextResponse } from 'next/server';
import { generateAndSendReply } from '@/lib/ai-reply';

/**
 * Worker (Baileys) memanggil endpoint ini saat ada pesan masuk dari customer.
 * Auth via shared secret di header Bearer (INTERNAL_WEBHOOK_SECRET).
 */
export async function POST(req: Request) {
  const expected = process.env.INTERNAL_WEBHOOK_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: 'INTERNAL_WEBHOOK_SECRET belum di-set' },
      { status: 500 },
    );
  }
  const auth = req.headers.get('authorization') ?? '';
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { conversationId?: string };
  if (!body.conversationId) {
    return NextResponse.json({ error: 'conversationId wajib' }, { status: 400 });
  }

  try {
    const result = await generateAndSendReply(body.conversationId);
    return NextResponse.json({ ok: true, sent: result.sent, reply: result.replyText });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
