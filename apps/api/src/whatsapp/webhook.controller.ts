import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Logger,
  Post,
  Query,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import * as crypto from 'crypto';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp/webhook')
export class WhatsappWebhookController {
  private readonly logger = new Logger(WhatsappWebhookController.name);

  constructor(private readonly svc: WhatsappService) {}

  /**
   * Meta panggil GET ini saat Anda klik "Verify and save" di Meta dashboard.
   * Kirim balik hub.challenge kalau hub.verify_token cocok dengan env kita.
   */
  @Get()
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const expected = process.env.WHATSAPP_VERIFY_TOKEN;
    if (!expected) {
      this.logger.error('WHATSAPP_VERIFY_TOKEN belum di-set di .env');
      throw new ForbiddenException('verify token not configured');
    }
    if (mode === 'subscribe' && token === expected) {
      this.logger.log('Webhook verified by Meta');
      return challenge;
    }
    throw new ForbiddenException('verify token mismatch');
  }

  /**
   * Meta kirim event (pesan masuk, status delivery, dst.) ke sini.
   * Wajib balas 200 cepat (<20 detik) — proses async di queue nanti.
   */
  @Post()
  async receive(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-hub-signature-256') signature: string,
    @Body() body: unknown,
  ) {
    // verify signature kalau APP_SECRET di-set
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    if (appSecret) {
      if (!signature || !req.rawBody) {
        throw new BadRequestException('missing signature');
      }
      const expected =
        'sha256=' +
        crypto.createHmac('sha256', appSecret).update(req.rawBody).digest('hex');
      const a = Buffer.from(signature);
      const b = Buffer.from(expected);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        throw new ForbiddenException('invalid signature');
      }
    }

    // jangan await heavy processing — biar respond cepat
    this.svc.handleEvent(body).catch((e) => {
      this.logger.error('handleEvent failed', e);
    });

    return { status: 'ok' };
  }
}
