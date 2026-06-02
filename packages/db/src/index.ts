import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * Singleton Prisma client.
 *
 * Untuk Neon serverless: gunakan URL pooled (`*-pooler.*.neon.tech`) di DATABASE_URL
 * supaya tidak kena error `E57P01 terminating connection due to administrator command`
 * setiap kali Neon auto-suspend compute. URL pooled menggunakan PgBouncer yang lebih tahan
 * terhadap auto-suspend.
 *
 * Contoh DATABASE_URL untuk Neon (pakai `-pooler` & `pgbouncer=true`):
 *   postgresql://user:pwd@ep-xxx-pooler.region.aws.neon.tech/db?sslmode=require&pgbouncer=true&connect_timeout=15
 *
 * Log level di-set ke 'warn'+'error' supaya error transient Neon (E57P01) tetap kelihatan
 * tapi tidak nge-spam dengan info logs.
 */
export const prisma =
  globalThis.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

export * from '@prisma/client';
