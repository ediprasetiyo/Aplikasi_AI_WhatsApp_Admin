import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
// Load .env dari root monorepo (sebelum import AppModule yang mungkin pakai env)
loadEnv({ path: resolve(__dirname, '../../../.env') });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // rawBody:true → kita perlu buffer asli buat verify HMAC X-Hub-Signature-256
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const port = Number(process.env.API_PORT ?? 3001);
  const origin = process.env.WEB_ORIGIN ?? 'http://localhost:3000';

  app.enableCors({ origin, credentials: true });
  app.setGlobalPrefix('api');

  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`[api] listening on http://localhost:${port}`);
}
bootstrap();
