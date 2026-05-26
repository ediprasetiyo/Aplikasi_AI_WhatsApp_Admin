import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { WhatsappModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), WhatsappModule],
  controllers: [HealthController],
})
export class AppModule {}
