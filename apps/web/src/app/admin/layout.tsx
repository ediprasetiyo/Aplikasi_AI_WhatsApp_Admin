import Link from 'next/link';
import { Shield, Building2, CreditCard, LogOut, ArrowLeft } from 'lucide-react';
import { requireSuperAdmin } from '@/lib/session';
import { SignOutButton } from '../dashboard/_components/sign-out-button';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSuperAdmin();

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-64 flex-col border-r bg-gray-900 px-4 py-6 text-white">
        <Link href="/admin" className="flex items-center gap-2 font-bold text-lg">
          <Shield className="h-6 w-6 text-red-400" />
          Super Admin
        </Link>
        <p className="mt-1 text-xs text-gray-400">Mode pemilik aplikasi</p>

        <nav className="mt-8 space-y-1 text-sm">
          <AdminLink href="/admin" icon={Building2}>
            Workspaces
          </AdminLink>
          <AdminLink href="/admin/subscriptions" icon={CreditCard}>
            Subscriptions
          </AdminLink>
          <AdminLink href="/dashboard" icon={ArrowLeft}>
            Kembali ke Dashboard
          </AdminLink>
        </nav>

        <div className="mt-auto pt-6">
          <div className="mb-3 text-xs text-gray-400">
            <div className="truncate font-medium text-gray-200">{session.user.name}</div>
            <div className="truncate">{session.user.email}</div>
          </div>
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 bg-gray-50">{children}</main>
    </div>
  );
}

function AdminLink({
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
      className="flex items-center gap-3 rounded-md px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white"
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}
