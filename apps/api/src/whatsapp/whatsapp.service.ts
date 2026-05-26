import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@wa-admin/db';

// Tipe minimal dari payload Meta. Lengkapnya:
// https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples
type WaMessage = {
  id: string;
  from: string;
  timestamp: string;
  type: string;
  text?: { body?: string };
  image?: { id?: string; mime_type?: string; caption?: string };
  audio?: { id?: string };
  video?: { id?: string; caption?: string };
  document?: { id?: string; filename?: string; caption?: string };
};

type WaContact = { wa_id: string; profile?: { name?: string } };

type WaWebhookEvent = {
  object: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{
      field?: string;
      value?: {
        messaging_product?: string;
        metadata?: { display_phone_number?: string; phone_number_id?: string };
        contacts?: WaContact[];
        messages?: WaMessage[];
        statuses?: Array<{ id: string; status: string; recipient_id: string }>;
      };
    }>;
  }>;
};

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  async handleEvent(payload: unknown) {
    const ev = payload as WaWebhookEvent;
    if (ev?.object !== 'whatsapp_business_account') {
      this.logger.warn(`Ignored event object=${ev?.object}`);
      return;
    }

    for (const entry of ev.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value;
        if (!value) continue;

        const phoneNumberId = value.metadata?.phone_number_id;
        if (!phoneNumberId) continue;

        const account = await prisma.whatsappAccount.findUnique({
          where: { phoneNumberId },
        });
        if (!account) {
          this.logger.warn(`Unknown phone_number_id=${phoneNumberId}, ignoring`);
          continue;
        }

        // Pesan masuk
        for (const msg of value.messages ?? []) {
          await this.persistInboundMessage(account, value.contacts ?? [], msg);
        }

        // Status update (delivered/read/failed) untuk outbound kita
        for (const st of value.statuses ?? []) {
          await prisma.message.updateMany({
            where: { waMessageId: st.id },
            data: { status: st.status },
          });
        }
      }
    }
  }

  private async persistInboundMessage(
    account: { id: string; organizationId: string },
    contacts: WaContact[],
    msg: WaMessage,
  ) {
    const customerPhone = msg.from;
    const customerName = contacts.find((c) => c.wa_id === customerPhone)?.profile?.name;

    const convo = await prisma.conversation.upsert({
      where: {
        whatsappAccountId_customerPhone: {
          whatsappAccountId: account.id,
          customerPhone,
        },
      },
      create: {
        organizationId: account.organizationId,
        whatsappAccountId: account.id,
        customerPhone,
        customerName: customerName ?? null,
        lastMessageAt: new Date(),
      },
      update: {
        customerName: customerName ?? undefined,
        lastMessageAt: new Date(),
      },
    });

    const body =
      msg.text?.body ??
      msg.image?.caption ??
      msg.video?.caption ??
      msg.document?.caption ??
      null;

    try {
      await prisma.message.create({
        data: {
          conversationId: convo.id,
          waMessageId: msg.id,
          direction: 'inbound',
          type: msg.type ?? 'text',
          body,
          raw: msg as unknown as object,
        },
      });
    } catch (e) {
      // duplicate (waMessageId unique constraint) — Meta retry, aman diabaikan
      this.logger.debug(`Skip duplicate msg ${msg.id}: ${(e as Error).message}`);
    }

    this.logger.log(`Inbound from ${customerPhone}: ${body?.slice(0, 80) ?? `[${msg.type}]`}`);
  }
}
