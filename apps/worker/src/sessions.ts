import {
  makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  initAuthCreds,
  BufferJSON,
  type WASocket,
  type AuthenticationCreds,
  type AuthenticationState,
  type SignalDataTypeMap,
} from 'baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import pino from 'pino';
import { prisma } from '@wa-admin/db';

const log = pino({ name: 'sessions' }).child({});

const WORKER_ID = process.env.WORKER_ID ?? `worker-${process.pid}`;

type SessionState = {
  accountId: string;
  organizationId: string;
  sock: WASocket | null;
  qrDataUrl: string | null;
  status: 'pending_qr' | 'connecting' | 'connected' | 'disconnected' | 'error';
  lastError: string | null;
  // Guard against race conditions saat multi-reconnect
  connecting: boolean;
  reconnectTimer: NodeJS.Timeout | null;
};

class SessionManager {
  private map = new Map<string, SessionState>();

  size() {
    return this.map.size;
  }

  async start(accountId: string, organizationId: string) {
    const existing = this.map.get(accountId);
    if (existing && existing.status === 'connected') {
      log.info({ accountId }, 'session already connected, skip');
      return;
    }
    // bersih total session lama: cancel timer + end sock + hapus dari map
    if (existing) {
      if (existing.reconnectTimer) {
        clearTimeout(existing.reconnectTimer);
        existing.reconnectTimer = null;
      }
      if (existing.sock) {
        try {
          existing.sock.end(undefined);
        } catch {
          /* ignore */
        }
      }
      this.map.delete(accountId);
      // Jeda biar WhatsApp server sempat tutup session lama
      await new Promise((r) => setTimeout(r, 1000));
    }

    const state: SessionState = {
      accountId,
      organizationId,
      sock: null,
      qrDataUrl: null,
      status: 'connecting',
      lastError: null,
      connecting: false,
      reconnectTimer: null,
    };
    this.map.set(accountId, state);

    await this.connect(state);
  }

  private async connect(state: SessionState) {
    const { accountId } = state;
    if (state.connecting) {
      log.warn({ accountId }, 'connect() dipanggil saat sudah connecting, skip');
      return;
    }
    state.connecting = true;

    // Pastikan socket lama benar-benar tutup sebelum buat baru
    if (state.sock) {
      try {
        state.sock.end(undefined);
      } catch {
        /* ignore */
      }
      state.sock = null;
    }

    log.info({ accountId }, 'starting baileys connect');

    const { state: authState, saveCreds } = await usePrismaAuthState(accountId);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: authState,
      printQRInTerminal: false,
      browser: ['Auto Balas', 'Chrome', '120.0.0'],
      syncFullHistory: false,
      markOnlineOnConnect: false,
      logger: pino({ level: 'warn' }) as never,
    });
    state.sock = sock;
    // Reference ke socket "current" — event dari socket lama akan diabaikan
    const mySock = sock;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      // Abaikan event dari socket yang sudah bukan socket aktif (stale)
      if (state.sock !== mySock) {
        return;
      }
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          const dataUrl = await QRCode.toDataURL(qr, { width: 300, margin: 1 });
          state.qrDataUrl = dataUrl;
          state.status = 'pending_qr';
          await prisma.baileysSession.upsert({
            where: { whatsappAccountId: accountId },
            create: {
              whatsappAccountId: accountId,
              qrCode: dataUrl,
              workerId: WORKER_ID,
              lastSeenAt: new Date(),
            },
            update: { qrCode: dataUrl, workerId: WORKER_ID, lastSeenAt: new Date() },
          });
          await prisma.whatsappAccount.update({
            where: { id: accountId },
            data: { status: 'pending_qr' },
          });
          log.info({ accountId }, 'QR generated, waiting for scan');
        } catch (e) {
          log.error({ err: e }, 'failed to generate QR');
        }
      }

      if (connection === 'open') {
        const me = sock.user;
        const phone = me?.id?.split(':')[0]?.split('@')[0] ?? '';
        state.qrDataUrl = null;
        state.status = 'connected';
        state.lastError = null;
        state.connecting = false;
        // Cancel pending reconnect kalau ada
        if (state.reconnectTimer) {
          clearTimeout(state.reconnectTimer);
          state.reconnectTimer = null;
        }
        await prisma.whatsappAccount.update({
          where: { id: accountId },
          data: {
            status: 'active',
            displayPhoneNumber: phone ? `+${phone}` : 'Unknown',
            verifiedName: me?.name ?? null,
            lastError: null,
          },
        });
        await prisma.baileysSession.update({
          where: { whatsappAccountId: accountId },
          data: { qrCode: null, lastSeenAt: new Date() },
        });
        log.info({ accountId, phone }, 'connected to WhatsApp');
      }

      if (connection === 'close') {
        const code = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const loggedOut = code === DisconnectReason.loggedOut;
        const replaced = code === DisconnectReason.connectionReplaced;
        // Jangan reconnect kalau loggedOut atau replaced — keduanya butuh aksi user
        const shouldReconnect = !loggedOut && !replaced;
        state.status = loggedOut || replaced ? 'disconnected' : 'error';
        state.lastError = replaced
          ? 'Session diambil alih perangkat lain — scan QR ulang'
          : (lastDisconnect?.error?.message ?? null);
        log.warn(
          { accountId, code, loggedOut, replaced, err: state.lastError },
          'connection closed',
        );
        await prisma.whatsappAccount.update({
          where: { id: accountId },
          data: {
            status: loggedOut || replaced ? 'disconnected' : 'error',
            lastError: state.lastError,
          },
        });
        state.connecting = false;
        if (loggedOut || replaced) {
          // user logout/replace dari HP — hapus creds biar bisa scan QR ulang fresh
          await prisma.baileysSession
            .update({
              where: { whatsappAccountId: accountId },
              data: { credsJson: null, qrCode: null },
            })
            .catch(() => null);
          if (state.reconnectTimer) {
            clearTimeout(state.reconnectTimer);
            state.reconnectTimer = null;
          }
          this.map.delete(accountId);
        } else if (shouldReconnect && !state.reconnectTimer) {
          // reconnect setelah jeda untuk error transient (network blip, dst.)
          // Guard !state.reconnectTimer biar tidak schedule multiple reconnect bersamaan.
          // Code 515 (restartRequired) = normal setelah QR pair, reconnect cepat.
          const delay = code === 515 ? 1000 : 5000;
          state.reconnectTimer = setTimeout(() => {
            state.reconnectTimer = null;
            const s = this.map.get(accountId);
            if (s) this.connect(s).catch((e) => log.error({ err: e }, 'reconnect failed'));
          }, delay);
        }
      }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;
      for (const msg of messages) {
        if (msg.key.fromMe) continue;
        const remoteJid = msg.key.remoteJid ?? '';
        if (!remoteJid.endsWith('@s.whatsapp.net')) continue; // skip group
        const customerPhone = remoteJid.split('@')[0]!;
        const body =
          msg.message?.conversation ??
          msg.message?.extendedTextMessage?.text ??
          msg.message?.imageMessage?.caption ??
          msg.message?.videoMessage?.caption ??
          null;
        const messageType = msg.message?.imageMessage
          ? 'image'
          : msg.message?.videoMessage
            ? 'video'
            : msg.message?.audioMessage
              ? 'audio'
              : msg.message?.documentMessage
                ? 'document'
                : 'text';

        const pushName = msg.pushName ?? null;

        try {
          const convo = await prisma.conversation.upsert({
            where: {
              whatsappAccountId_customerPhone: {
                whatsappAccountId: accountId,
                customerPhone,
              },
            },
            create: {
              organizationId: state.organizationId,
              whatsappAccountId: accountId,
              customerPhone,
              customerName: pushName,
              lastMessageAt: new Date(),
            },
            update: {
              customerName: pushName ?? undefined,
              lastMessageAt: new Date(),
            },
          });

          await prisma.message.create({
            data: {
              conversationId: convo.id,
              waMessageId: msg.key.id ?? undefined,
              direction: 'inbound',
              type: messageType,
              body,
              raw: JSON.parse(JSON.stringify(msg, BufferJSON.replacer)) as object,
            },
          });

          log.info({ accountId, from: customerPhone, body: body?.slice(0, 80) }, 'inbound');

          // TODO: trigger AI auto-reply via webhook ke web
          // POST {WEB_URL}/api/internal/ai-reply { conversationId }
          await triggerAiReply(convo.id);
        } catch (e) {
          log.error({ err: e, accountId }, 'failed to persist message');
        }
      }
    });
  }

  async stop(accountId: string) {
    const state = this.map.get(accountId);
    if (!state) return;
    try {
      state.sock?.end(undefined);
    } catch {
      /* ignore */
    }
    this.map.delete(accountId);
    await prisma.whatsappAccount
      .update({
        where: { id: accountId },
        data: { status: 'disconnected' },
      })
      .catch(() => null);
    log.info({ accountId }, 'session stopped');
  }

  async stopAll() {
    for (const accountId of this.map.keys()) {
      await this.stop(accountId);
    }
  }

  async getStatus(accountId: string) {
    const state = this.map.get(accountId);
    if (!state) {
      // mungkin session lama di DB, belum di-resume
      const acc = await prisma.whatsappAccount.findUnique({
        where: { id: accountId },
        include: { baileysSession: true },
      });
      if (!acc) return { status: 'not_found' as const };
      return {
        status: acc.status,
        qrDataUrl: acc.baileysSession?.qrCode ?? null,
        phone: acc.displayPhoneNumber,
        name: acc.verifiedName,
        lastError: acc.lastError,
      };
    }
    return {
      status: state.status,
      qrDataUrl: state.qrDataUrl,
      phone: state.sock?.user?.id?.split(':')[0]?.split('@')[0]
        ? `+${state.sock.user.id.split(':')[0]?.split('@')[0]}`
        : null,
      name: state.sock?.user?.name ?? null,
      lastError: state.lastError,
    };
  }

  async sendMessage(accountId: string, to: string, text: string) {
    const state = this.map.get(accountId);
    if (!state || state.status !== 'connected' || !state.sock) {
      throw new Error('Session belum connected');
    }
    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
    const result = await state.sock.sendMessage(jid, { text });
    return result?.key?.id ?? null;
  }
}

export const sessions = new SessionManager();

/**
 * Auth state Baileys yang persist ke Prisma (BaileysSession.credsJson),
 * jadi setelah scan QR sekali, restart worker tidak perlu scan ulang.
 */
async function usePrismaAuthState(accountId: string): Promise<{
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
}> {
  const existing = await prisma.baileysSession.findUnique({
    where: { whatsappAccountId: accountId },
  });

  let creds: AuthenticationCreds = initAuthCreds();
  const keys: Record<string, Record<string, unknown>> = {};

  if (existing?.credsJson) {
    try {
      const parsed = JSON.parse(existing.credsJson, BufferJSON.reviver) as {
        creds: AuthenticationCreds;
        keys: Record<string, Record<string, unknown>>;
      };
      creds = parsed.creds;
      Object.assign(keys, parsed.keys ?? {});
    } catch (e) {
      log.warn({ err: e, accountId }, 'failed to parse creds, starting fresh');
    }
  }

  const saveCreds = async () => {
    const json = JSON.stringify({ creds, keys }, BufferJSON.replacer);
    await prisma.baileysSession.upsert({
      where: { whatsappAccountId: accountId },
      create: {
        whatsappAccountId: accountId,
        credsJson: json,
        workerId: WORKER_ID,
        lastSeenAt: new Date(),
      },
      update: { credsJson: json, workerId: WORKER_ID, lastSeenAt: new Date() },
    });
  };

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const result: Record<string, unknown> = {};
          for (const id of ids) {
            const value = keys[type]?.[id];
            if (value !== undefined) {
              result[id] = value;
            }
          }
          return result as { [id: string]: SignalDataTypeMap[typeof type] };
        },
        set: async (data) => {
          for (const category in data) {
            const cat = category as keyof typeof data;
            keys[cat] ??= {};
            for (const id in data[cat]) {
              const value = data[cat][id];
              if (value) keys[cat][id] = value;
              else delete keys[cat][id];
            }
          }
          await saveCreds();
        },
      },
    },
    saveCreds,
  };
}

/**
 * Trigger AI reply di sisi web (HTTP request) untuk conversation tertentu.
 * Web yang punya logic Groq + KB. Worker hanya kirim event.
 */
async function triggerAiReply(conversationId: string) {
  const webUrl = process.env.WEB_URL;
  const internalSecret = process.env.INTERNAL_WEBHOOK_SECRET;
  if (!webUrl || !internalSecret) return;
  try {
    const res = await fetch(`${webUrl}/api/internal/ai-reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${internalSecret}`,
      },
      body: JSON.stringify({ conversationId }),
    });
    if (!res.ok) {
      log.warn(
        { conversationId, status: res.status },
        'ai-reply webhook returned non-ok',
      );
    }
  } catch (e) {
    log.error({ err: e, conversationId }, 'failed to trigger ai reply');
  }
}
