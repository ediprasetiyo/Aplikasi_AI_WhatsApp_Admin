import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

// Load root .env hanya saat dev lokal. Di Vercel/production, env disuntik platform.
const __dirname = dirname(fileURLToPath(import.meta.url));
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const rootEnv = resolve(__dirname, '../../.env');
  if (existsSync(rootEnv)) {
    const { config: loadEnv } = await import('dotenv');
    loadEnv({ path: rootEnv });
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@wa-admin/db'],
  // Prisma client harus jadi external di server bundle — webpack tidak bisa
  // bundle native binding (.so.node) dengan benar. Next.js akan resolve runtime.
  serverExternalPackages: ['@prisma/client', '.prisma/client'],
};

export default nextConfig;
