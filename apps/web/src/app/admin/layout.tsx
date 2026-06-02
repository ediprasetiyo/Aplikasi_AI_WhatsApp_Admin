import Link from 'next/link';
import { Shield, Building2, CreditCard, LayoutDashboard, CheckSquare, ScrollText, FileSearch } from 'lucide-react';
import { prisma } from '@wa-admin/db';
import { requireSuperAdmin } from '@/lib/session';
import { AdminSignOut } from './_components/admin-signout';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSuperAdmin();

  // Badge count pembayaran pending — biar admin tahu ada yg harus diproses
  const pendingCount = await prisma.subscription
    .count({ where: { status: 'pending_payment' } })
    .catch(() => 0);

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-64 flex-col border-r bg-gray-900 px-4 py-6 text-white">
        <Link href="/admin" className="flex items-center gap-2 font-bold text-lg">
          <Shield className="h-6 w-6 text-red-400" />
          Super Admin
        </Link>
        <p className="mt-1 text-xs text-gray-400">Mode pemilik aplikasi</p>

        <nav className="mt-8 space-y-1 text-sm">
          <AdminLink href="/admin" icon={LayoutDashboard}>
            Dashboard
          </AdminLink>
          <AdminLink href="/admin/approval" icon={CheckSquare} badge={pendingCount}>
            Approval
          </AdminLink>
          <AdminLink href="/admin/workspaces" icon={Building2}>
            Workspaces
          </AdminLink>
          <AdminLink href="/admin/subscriptions" icon={CreditCard}>
            Semua Subscriptions
          </AdminLink>
          <AdminLink href="/admin/logs" icon={ScrollText}>
            Log Pesan
          </AdminLink>
          <AdminLink href="/admin/audit" icon={FileSearch}>
            Audit Activity
          </AdminLink>
        </nav>

        <div className="mt-auto pt-6">
          <div className="mb-3 text-xs text-gray-400">
            <div className="truncate font-medium text-gray-200">{session.user.name}</div>
            <div className="truncate">{session.user.email}</div>
          </div>
          <AdminSignOut />
        </div>
      </aside>
      <main className="flex-1 bg-gray-50">{children}</main>
    </div>
  );
}

function AdminLink({
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
      className="flex items-center gap-3 rounded-md px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white"
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
