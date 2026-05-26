import { NextResponse } from 'next/server';
import { z } from 'zod';
import { chat, type ChatMessage } from '@/lib/groq';

const schema = z.object({
  persona: z.string().min(10),
  kb: z.array(z.string()).max(20),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(2000),
      }),
    )
    .min(1)
    .max(20),
});

// Simple in-memory rate limit per IP (cocok untuk dev/demo, bukan production scale)
const RATE: Record<string, { count: number; ts: number }> = {};
const RATE_MAX = 20;
const RATE_WINDOW_MS = 60_000; // 20 req/menit per IP

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const now = Date.now();
    const entry = RATE[ip];
    if (entry && now - entry.ts < RATE_WINDOW_MS) {
      if (entry.count >= RATE_MAX) {
        return NextResponse.json(
          { error: 'Terlalu banyak request. Coba lagi sebentar.' },
          { status: 429 },
        );
      }
      entry.count++;
    } else {
      RATE[ip] = { count: 1, ts: now };
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Input tidak valid' }, { status: 400 });
    }

    const { persona, kb, messages } = parsed.data;
    const kbBlock = kb.length ? '\n\nInformasi bisnis:\n' + kb.map((k) => `- ${k}`).join('\n') : '';

    const chatMessages: ChatMessage[] = [
      {
        role: 'system',
        content: `${persona}${kbBlock}\n\nBalas dalam bahasa Indonesia santai-profesional. Jawaban singkat (1-3 kalimat). Kalau pertanyaan di luar konteks bisnis, arahkan kembali ke layanan yang tersedia.`,
      },
      ...messages.map((m) => ({ role: m.role, content: m.content }) as ChatMessage),
    ];

    const reply = await chat({
      model: 'llama-3.3-70b-versatile',
      messages: chatMessages,
      temperature: 0.5,
      maxTokens: 300,
    });

    return NextResponse.json({ reply });
  } catch (e) {
    const msg = (e as Error).message;
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
