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
          <NavLink href="/dashboard/inbox" icon={Inbox}>
            Inbox
          </NavLink>
          <NavLink href="/dashboard/ai" icon={Sparkles}>
            AI
          </NavLink>
          <NavLink href="/dashboard/whatsapp" icon={Phone}>
            WhatsApp
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
          {showAdmin && (
            <>
              <div className="my-3 border-t border-gray-200" />
              <a
                href={
                  process.env.NODE_ENV === 'production'
                    ? 'https://admin.autobalas.my.id'
                    : '/admin'
                }
                className="flex items-center gap-3 rounded-md px-3 py-2 text-red-600 hover:bg-red-50 text-sm"
              >
                <Shield className="h-4 w-4" />
                Super Admin
              </a>
            </>
          )}
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
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100"
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}
