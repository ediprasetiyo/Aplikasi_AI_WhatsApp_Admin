import Link from 'next/link';
import { redirect } from 'next/navigation';
import { MessageCircleReply, LayoutDashboard, Users, Settings, LogOut, Phone, Inbox, Sparkles, Shield, CreditCard } from 'lucide-react';
import { requireSession, isSuperAdmin } from '@/lib/session';
import { prisma } from '@wa-admin/db';
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

  const showAdmin = await isSuperAdmin();
  // Role user di workspace aktif — member punya akses terbatas
  const role = activeMembership.role;
  const isOwnerOrAdmin = role === 'owner' || role === 'admin';

  // Hitung conversation yang last message-nya inbound (= belum dijawab)
  const conversations = await prisma.conversation.findMany({
    where: { organizationId: activeOrgId },
    select: {
      messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { direction: true } },
    },
  });
  const pendingCount = conversations.filter(
    (c) => c.messages[0]?.direction === 'inbound',
  ).length;

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
          <NavLink href="/dashboard" icon={LayoutDashboard}>
            Dashboard
          </NavLink>
          <NavLink href="/dashboard/inbox" icon={Inbox} badge={pendingCount}>
            Inbox
          </NavLink>
          <NavLink href="/dashboard/whatsapp" icon={Phone}>
            WhatsApp
          </NavLink>
          {/* Menu khusus owner/admin */}
          {isOwnerOrAdmin && (
            <>
              <NavLink href="/dashboard/ai" icon={Sparkles}>
                AI
              </NavLink>
              <NavLink href="/dashboard/team" icon={Users}>
                Tim
              </NavLink>
              <NavLink href="/dashboard/billing" icon={CreditCard}>
                Berlangganan
              </NavLink>
              <NavLink href="/dashboard/settings" icon={Settings}>
                Setting
              </NavLink>
            </>
          )}
          {/* Super Admin link tidak ditampilkan — pemilik akses via admin.autobalas.my.id */}
        </nav>

        {/* Spacer push profil ke bawah, tetap di posisi tanpa ikut scroll */}
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
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100"
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1">{children}</span>
      {badge !== undefined && badge > 0 && (
        <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  );
}
