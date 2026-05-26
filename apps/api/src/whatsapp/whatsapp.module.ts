import { Module } from '@nestjs/common';
import { WhatsappWebhookController } from './webhook.controller';
import { WhatsappService } from './whatsapp.service';

@Module({
  controllers: [WhatsappWebhookController],
  providers: [WhatsappService],
})
export class WhatsappModule {}
