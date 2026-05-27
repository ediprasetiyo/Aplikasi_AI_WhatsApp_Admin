import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pino from 'pino';
import { sessions } from './sessions.js';
import { authMiddleware } from './auth.js';

const log = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport: process.env.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty' },
});

const PORT = Number(process.env.PORT ?? 4000);
const ORIGIN = (process.env.WEB_ORIGIN ?? 'http://localhost:3000').split(',');

const app = express();
app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));

// Health (no auth) — buat ping ngecek worker hidup
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    sessions: sessions.size(),
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Semua endpoint di bawah butuh Bearer token dari WEB_AUTH_SECRET
app.use(authMiddleware);

/**
 * POST /sessions/connect
 * Body: { accountId, organizationId }
 * Mulai session Baileys baru; respond dengan accountId untuk polling status.
 */
app.post('/sessions/connect', async (req, res) => {
  const { accountId, organizationId } = req.body as {
    accountId?: string;
    organizationId?: string;
  };
  if (!accountId || !organizationId) {
    res.status(400).json({ error: 'accountId & organizationId wajib' });
    return;
  }
  try {
    await sessions.start(accountId, organizationId);
    res.json({ ok: true, accountId });
  } catch (e) {
    log.error({ err: e }, 'failed to start session');
    res.status(500).json({ error: (e as Error).message });
  }
});

/**
 * GET /sessions/:accountId/status
 * Polling endpoint untuk web — return QR (kalau pending) atau status connected
 */
app.get('/sessions/:accountId/status', async (req, res) => {
  const accountId = req.params.accountId;
  if (!accountId) {
    res.status(400).json({ error: 'accountId wajib' });
    return;
  }
  const status = await sessions.getStatus(accountId);
  res.json(status);
});

/**
 * POST /sessions/:accountId/disconnect
 * Putus & hapus session
 */
app.post('/sessions/:accountId/disconnect', async (req, res) => {
  const accountId = req.params.accountId;
  if (!accountId) {
    res.status(400).json({ error: 'accountId wajib' });
    return;
  }
  try {
    await sessions.stop(accountId);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/**
 * POST /messages/send
 * Body: { accountId, to, text }
 * Kirim pesan dari session ke nomor customer.
 */
app.post('/messages/send', async (req, res) => {
  const { accountId, to, text } = req.body as {
    accountId?: string;
    to?: string;
    text?: string;
  };
  if (!accountId || !to || !text) {
    res.status(400).json({ error: 'accountId, to, text wajib' });
    return;
  }
  try {
    const id = await sessions.sendMessage(accountId, to, text);
    res.json({ ok: true, messageId: id });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.listen(PORT, () => {
  log.info(`Baileys worker listening on http://localhost:${PORT}`);
  log.info(`Web origin allowed: ${ORIGIN.join(', ')}`);
});

// Graceful shutdown
async function shutdown(signal: string) {
  log.info(`Received ${signal}, shutting down...`);
  await sessions.stopAll();
  process.exit(0);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
