import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { organization } from 'better-auth/plugins';
import { prisma } from '@wa-admin/db';

// Origins yang diizinkan untuk akses auth API (CSRF protection).
// Otomatis menerima: localhost dev, URL utama, URL Vercel preview/branch, dan custom domain di env.
function buildTrustedOrigins(): string[] {
  const list = new Set<string>([
    'http://localhost:3000',
    'https://autobalas.my.id',
    'https://www.autobalas.my.id',
    'https://admin.autobalas.my.id',
  ]);
  if (process.env.BETTER_AUTH_URL) list.add(process.env.BETTER_AUTH_URL);
  if (process.env.NEXT_PUBLIC_APP_URL) list.add(process.env.NEXT_PUBLIC_APP_URL);
  if (process.env.VERCEL_URL) list.add(`https://${process.env.VERCEL_URL}`);
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    list.add(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }
  // tambahan domain manual (comma-separated)
  if (process.env.AUTH_TRUSTED_ORIGINS) {
    for (const o of process.env.AUTH_TRUSTED_ORIGINS.split(',')) {
      const t = o.trim();
      if (t) list.add(t);
    }
  }
  return Array.from(list);
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // MVP: skip verification
    minPasswordLength: 8,
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 5,
      membershipLimit: 50,
      invitationExpiresIn: 60 * 60 * 24 * 7, // 7 days
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh once/day
  },
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  trustedOrigins: buildTrustedOrigins(),
  secret: process.env.BETTER_AUTH_SECRET!,
  // Cookie shared antar subdomain (autobalas.my.id, admin.autobalas.my.id, www.x)
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain: process.env.NODE_ENV === 'production' ? '.autobalas.my.id' : undefined,
    },
    defaultCookieAttributes: {
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
});

export type Session = typeof auth.$Infer.Session;
