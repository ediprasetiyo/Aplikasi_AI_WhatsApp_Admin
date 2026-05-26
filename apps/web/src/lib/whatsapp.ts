// Helper untuk berinteraksi dengan WhatsApp Cloud API (Meta Graph API v21)
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api

const GRAPH_BASE = 'https://graph.facebook.com/v21.0';

export type PhoneNumberInfo = {
  id: string;
  display_phone_number: string;
  verified_name?: string;
  quality_rating?: string;
};

/** Verify access token & ambil info nomor */
export async function getPhoneNumberInfo(
  phoneNumberId: string,
  accessToken: string,
): Promise<{ ok: true; data: PhoneNumberInfo } | { ok: false; error: string }> {
  try {
    const res = await fetch(
      `${GRAPH_BASE}/${phoneNumberId}?fields=id,display_phone_number,verified_name,quality_rating`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      },
    );
    const json = await res.json();
    if (!res.ok) {
      return { ok: false, error: json?.error?.message ?? `HTTP ${res.status}` };
    }
    return { ok: true, data: json as PhoneNumberInfo };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Kirim text message ke customer */
export async function sendTextMessage(opts: {
  phoneNumberId: string;
  accessToken: string;
  to: string; // e.g. "628123456789"
  text: string;
}) {
  const res = await fetch(`${GRAPH_BASE}/${opts.phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: opts.to,
      type: 'text',
      text: { body: opts.text, preview_url: false },
    }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message ?? `Send failed: HTTP ${res.status}`);
  }
  return json as { messages: Array<{ id: string }> };
}
