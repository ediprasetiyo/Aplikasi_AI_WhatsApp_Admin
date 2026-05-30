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

/**
 * Email yang dianggap super admin aplikasi (pemilik). Pisah dari role member di
 * organization (yang hanya scope per workspace). Super admin punya akses ke /admin.
 */
const SUPER_ADMIN_EMAILS = ['edi.prasetiyo1994@gmail.com'];

export async function isSuperAdmin(): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  return SUPER_ADMIN_EMAILS.includes(session.user.email.toLowerCase());
}

export async function requireSuperAdmin() {
  const session = await requireSession();
  if (!SUPER_ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
    redirect('/dashboard');
  }
  return session;
}
