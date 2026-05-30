import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from './auth';
import { prisma } from '@wa-admin/db';

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect('/login');
  return session;
}

/**
 * Return active organization id untuk user — auto-fallback ke membership
 * pertama kalau session.activeOrganizationId null/stale (mis. setelah reset DB).
 */
export async function getActiveOrgId(): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;

  const fromSession = session.session.activeOrganizationId;
  if (fromSession) {
    // Verifikasi org masih ada di DB (bisa saja sudah dihapus)
    const exists = await prisma.organization.findUnique({
      where: { id: fromSession },
      select: { id: true },
    });
    if (exists) return fromSession;
  }

  // Fallback: membership pertama user
  const firstMembership = await prisma.member.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
    select: { organizationId: true },
  });
  return firstMembership?.organizationId ?? null;
}

/**
 * Require active org; redirect ke /onboarding kalau user belum punya workspace.
 */
export async function requireActiveOrgId(): Promise<string> {
  const orgId = await getActiveOrgId();
  if (!orgId) redirect('/onboarding');
  return orgId;
}
