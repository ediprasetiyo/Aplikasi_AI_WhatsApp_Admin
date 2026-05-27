// Client untuk Baileys worker — dipanggil dari server actions saja, jangan client-side.

const WORKER_URL = process.env.WORKER_URL;
const WORKER_AUTH_SECRET = process.env.WORKER_AUTH_SECRET;

function assertConfig() {
  if (!WORKER_URL) throw new Error('WORKER_URL belum di-set di env');
  if (!WORKER_AUTH_SECRET) throw new Error('WORKER_AUTH_SECRET belum di-set di env');
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  assertConfig();
  const res = await fetch(`${WORKER_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${WORKER_AUTH_SECRET}`,
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(String(json.error ?? `Worker error ${res.status}`));
  }
  return json as T;
}

export type SessionStatus = {
  status:
    | 'pending_qr'
    | 'connecting'
    | 'connected'
    | 'disconnected'
    | 'error'
    | 'active'
    | 'not_found';
  qrDataUrl: string | null;
  phone: string | null;
  name: string | null;
  lastError: string | null;
};

export const worker = {
  connect: (accountId: string, organizationId: string) =>
    call<{ ok: true }>('/sessions/connect', {
      method: 'POST',
      body: JSON.stringify({ accountId, organizationId }),
    }),

  status: (accountId: string) =>
    call<SessionStatus>(`/sessions/${accountId}/status`),

  disconnect: (accountId: string) =>
    call<{ ok: true }>(`/sessions/${accountId}/disconnect`, { method: 'POST' }),

  send: (accountId: string, to: string, text: string) =>
    call<{ ok: true; messageId: string }>('/messages/send', {
      method: 'POST',
      body: JSON.stringify({ accountId, to, text }),
    }),

  health: () => call<{ status: string; sessions: number }>('/health'),
};
