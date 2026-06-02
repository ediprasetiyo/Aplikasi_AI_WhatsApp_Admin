import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  MessageCircleReply,
  LayoutDashboard,
  Users,
  Settings,
  Phone,
  Inbox,
  Sparkles,
  CreditCard,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { requireSession } from '@/lib/session';
import { prisma } from '@wa-admin/db';
import { getSubscriptionInfo } from '@/lib/subscription';
import { SignOutButton } from './_components/sign-out-button';
import { OrgSwitcher } from './_components/org-switcher';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  const memberships = await prisma.member.findMany({
    where: { userId: session.user.id },
    include: { organization: true },
    orderBy: { createdAt: 'asc' },
  });

  if (memberships.length === 0) redirect('/onboarding');

  const activeOrgId = session.session.activeOrganizationId ?? memberships[0]!.organizationId;
  const activeMembership =
    memberships.find((m) => m.organizationId === activeOrgId) ?? memberships[0]!;

  // Role user di workspace aktif — member punya akses terbatas
  const role = activeMembership.role;
  const isOwnerOrAdmin = role === 'owner' || role === 'admin';

  // Cek subscription: kalau locked, sidebar lock visually
  // Server-side guard sudah ada di tiap page via requireActiveSubscription()
  const sub = await getSubscriptionInfo(activeOrgId);

  // Badge "Inbox" — hitung percakapan UNREAD:
  //   ada pesan inbound yang lebih baru dari markedReadAt (atau belum pernah di-mark).
  //   Customer banned tidak dihitung.
  const convosForBadge = await prisma.conversation.findMany({
    where: { organizationId: activeOrgId, customerStatus: { not: 'banned' } },
    select: {
      markedReadAt: true,
      messages: {
        where: { direction: 'inbound' },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { createdAt: true },
      },
    },
  });
  const pendingCount = convosForBadge.filter((c) => {
    const lastInbound = c.messages[0];
    if (!lastInbound) return false;
    if (!c.markedReadAt) return true; // belum pernah dibaca
    return lastInbound.createdAt.getTime() > c.markedReadAt.getTime();
  }).length;

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-64 flex-col border-r bg-white px-4 py-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <MessageCircleReply className="h-6 w-6 text-brand" />
          Auto Balas
        </Link>

        <div className="mt-6">
          <OrgSwitcher
            memberships={memberships.map((m) => ({
              id: m.organizationId,
              name: m.organization.name,
              slug: m.organization.slug,
            }))}
            activeId={activeMembership.organizationId}
          />
        </div>

        <nav className="mt-8 space-y-1 text-sm">
          <NavLink
            href="/dashboard"
            icon={LayoutDashboard}
            locked={sub.isLocked}
          >
            Dashboard
          </NavLink>
          <NavLink
            href="/dashboard/inbox"
            icon={Inbox}
            badge={pendingCount}
            locked={sub.isLocked}
          >
            Inbox
          </NavLink>
          <NavLink href="/dashboard/whatsapp" icon={Phone} locked={sub.isLocked}>
            WhatsApp
          </NavLink>
          {/* Menu khusus owner/admin */}
          {isOwnerOrAdmin && (
            <>
              <NavLink href="/dashboard/ai" icon={Sparkles} locked={sub.isLocked}>
                AI
              </NavLink>
              <NavLink href="/dashboard/team" icon={Users} locked={sub.isLocked}>
                Tim
              </NavLink>
              {/* Berlangganan SELALU bisa diakses biar user bisa bayar walau expired */}
              <NavLink
                href="/dashboard/billing"
                icon={CreditCard}
                highlight={sub.isLocked}
              >
                Berlangganan
              </NavLink>
              <NavLink href="/dashboard/settings" icon={Settings} locked={sub.isLocked}>
                Setting
              </NavLink>
            </>
          )}
        </nav>

        {/* Lock banner di bawah nav */}
        {sub.isLocked && (
          <div className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-xs text-red-900">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Akses Terkunci</strong>
                <p className="mt-1">
                  Paket Anda sudah berakhir. Berlangganan untuk akses semua fitur lagi.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Spacer push profil ke bawah */}
        <div className="mt-auto pt-6">
          <div className="mb-3 text-xs text-gray-500">
            <div className="truncate font-medium text-gray-700">{session.user.name}</div>
            <div className="truncate">{session.user.email}</div>
          </div>
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 bg-gray-50">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  icon: Icon,
  badge,
  locked,
  highlight,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  locked?: boolean;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  if (locked) {
    return (
      <div
        className="flex items-center gap-3 rounded-md px-3 py-2 text-gray-400 cursor-not-allowed opacity-60"
        title="Berlangganan dulu untuk akses fitur ini"
      >
        <Icon className="h-4 w-4" />
        <span className="flex-1">{children}</span>
        <Lock className="h-3.5 w-3.5" />
      </div>
    );
  }
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-md px-3 py-2 transition ${
        highlight
          ? 'bg-brand text-white font-medium hover:bg-brand-dark'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1">{children}</span>
      {badge !== undefined && badge > 0 && (
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
          highlight ? 'bg-white text-brand' : 'bg-red-500 text-white'
        }`}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  );
}
