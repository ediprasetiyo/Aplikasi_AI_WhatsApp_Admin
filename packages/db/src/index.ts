import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Neon serverless butuh WebSocket constructor di Node runtime (bukan Edge).
neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL belum di-set');
  }
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

// Lazy proxy — client baru di-instantiate saat method dipanggil pertama kali.
// Mencegah connection error saat build time / static page collection.
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createClient();
    }
    const value = Reflect.get(globalForPrisma.prisma, prop, receiver);
    return typeof value === 'function' ? value.bind(globalForPrisma.prisma) : value;
  },
});

export * from '@prisma/client';
