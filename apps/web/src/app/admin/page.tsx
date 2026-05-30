import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  Users,
  Building2,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar,
} from 'lucide-react';
import { prisma } from '@wa-admin/db';
import { requireSuperAdmin } from '@/lib/session';

export default async function AdminDashboardPage() {
  await requireSuperAdmin();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    totalOrgs,
    activeSubsCount,
    pendingSubsCount,
    trialActiveCount,
    expiredCount,
    monthRevenue,
    totalRevenue,
    newOrgsToday,
    recentPending,
    recentApproved,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.organization.count(),
    prisma.subscription.count({ where: { status: 'active' } }),
    prisma.subscription.count({ where: { status: 'pending_payment' } }),
    prisma.subscription.count({ where: { status: 'trial_active' } }),
    prisma.subscription.count({
      where: { status: { in: ['trial_expired', 'expired'] } },
    }),
    prisma.subscription.aggregate({
      _sum: { paymentAmount: true },
      where: {
        status: 'active',
        paymentApprovedAt: { gte: monthStart },
      },
    }),
    prisma.subscription.aggregate({
      _sum: { paymentAmount: true },
      where: { status: 'active' },
    }),
    prisma.organization.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.subscription.findMany({
      where: { status: 'pending_payment' },
      include: {
        organization: {
          include: {
            members: { include: { user: true }, take: 1, orderBy: { createdAt: 'asc' } },
          },
        },
      },
      orderBy: { paymentSubmittedAt: 'desc' },
      take: 5,
    }),
    prisma.subscription.findMany({
      where: { status: 'active' },
      include: {
        organization: {
          include: {
            members: { include: { user: true }, take: 1, orderBy: { createdAt: 'asc' } },
          },
        },
      },
      orderBy: { paymentApprovedAt: 'desc' },
      take: 5,
    }),
  ]);

  return (
    <div className="p-6 md:p-8 max-w-7xl">
      <div>
        <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
        <p className="mt-1 text-gray-600">
          Monitor revenue, user, dan semua pembayaran masuk.
        </p>
      </div>

      {/* Revenue stats — paling penting */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BigStat
          icon={DollarSign}
          label="Revenue Bulan Ini"
          value={`Rp ${((monthRevenue._sum.paymentAmount ?? 0) / 1_000_000).toFixed(2)}jt`}
          rawValue={`Rp ${(monthRevenue._sum.paymentAmount ?? 0).toLocaleString('id')}`}
          color="green"
        />
        <BigStat
          icon={TrendingUp}
          label="Total Revenue"
          value={`Rp ${((totalRevenue._sum.paymentAmount ?? 0) / 1_000_000).toFixed(2)}jt`}
          rawValue={`Rp ${(totalRevenue._sum.paymentAmount ?? 0).toLocaleString('id')}`}
          color="blue"
        />
        <BigStat
          icon={CreditCard}
          label="Subscribers Aktif"
          value={activeSubsCount.toString()}
          rawValue={`dari ${totalOrgs} workspace`}
          color="purple"
        />
        <BigStat
          icon={AlertCircle}
          label="Menunggu Verifikasi"
          value={pendingSubsCount.toString()}
          rawValue="Klik untuk verifikasi"
          color="yellow"
          href="/admin/subscriptions"
        />
      </div>

      {/* Secondary stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SmallStat icon={Users} label="Total User" value={totalUsers} />
        <SmallStat icon={Building2} label="Total Workspace" value={totalOrgs} />
        <SmallStat icon={Clock} label="Trial Aktif" value={trialActiveCount} />
        <SmallStat icon={Calendar} label="Workspace Baru Hari Ini" value={newOrgsToday} />
      </div>

      {/* Pending payments — quick action */}
      <div className="mt-8 rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            Pembayaran Menunggu ({recentPending.length})
          </h2>
          <Link
            href="/admin/subscriptions"
            className="text-xs text-brand hover:underline"
          >
            Lihat semua →
          </Link>
        </div>
        {recentPending.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">Tidak ada pembayaran pending.</p>
        ) : (
          <ul className="mt-3 divide-y">
            {recentPending.map((s) => {
              const owner = s.organization.members[0]?.user;
              return (
                <li key={s.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <div className="font-medium">{s.organization.name}</div>
                    <div className="text-xs text-gray-500">
                      {owner?.email} · {s.paymentSubmittedAt?.toLocaleDateString('id')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold capitalize">{s.plan}</div>
                    <div className="text-xs text-gray-500">
                      Rp {(s.paymentAmount ?? 0).toLocaleString('id')}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Recent approved */}
      <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 font-semibold">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          Subscriber Aktif Terbaru
        </h2>
        {recentApproved.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">Belum ada subscriber aktif.</p>
        ) : (
          <ul className="mt-3 divide-y">
            {recentApproved.map((s) => {
              const owner = s.organization.members[0]?.user;
              return (
                <li key={s.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <div className="font-medium">{s.organization.name}</div>
                    <div className="text-xs text-gray-500">
                      {owner?.email} · sejak{' '}
                      {s.paymentApprovedAt?.toLocaleDateString('id')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold capitalize">{s.plan}</div>
                    <div className="text-xs text-gray-500">
                      sampai {s.currentPeriodEnd?.toLocaleDateString('id')}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Quick navigation */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/workspaces"
          className="flex items-center gap-3 rounded-lg border bg-white p-5 shadow-sm hover:border-brand"
        >
          <Building2 className="h-8 w-8 text-brand" />
          <div>
            <div className="font-semibold">Kelola Workspace</div>
            <div className="text-xs text-gray-500">
              {totalOrgs} workspace · hapus yang tidak terpakai
            </div>
          </div>
        </Link>
        <Link
          href="/admin/subscriptions"
          className="flex items-center gap-3 rounded-lg border bg-white p-5 shadow-sm hover:border-brand"
        >
          <CreditCard className="h-8 w-8 text-brand" />
          <div>
            <div className="font-semibold">Subscriptions</div>
            <div className="text-xs text-gray-500">
              Approve/reject pembayaran masuk
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

function BigStat({
  icon: Icon,
  label,
  value,
  rawValue,
  color,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  rawValue?: string;
  color: 'green' | 'blue' | 'purple' | 'yellow';
  href?: string;
}) {
  const colorMap = {
    green: 'bg-green-50 text-green-700 border-green-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  };
  const content = (
    <div className={`rounded-lg border-2 p-5 ${colorMap[color]}`}>
      <div className="flex items-center justify-between">
        <Icon className="h-5 w-5 opacity-70" />
        <span className="text-xs font-medium uppercase tracking-wide opacity-70">
          {label}
        </span>
      </div>
      <div className="mt-3 text-2xl font-bold">{value}</div>
      {rawValue && <div className="mt-0.5 text-xs opacity-70">{rawValue}</div>}
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block hover:scale-105 transition">
        {content}
      </Link>
    );
  }
  return content;
}

function SmallStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
