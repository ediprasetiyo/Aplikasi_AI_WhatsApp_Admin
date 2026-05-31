import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Users,
  Phone,
  MessageCircle,
  BookOpen,
  CreditCard,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { prisma } from '@wa-admin/db';
import { requireSuperAdmin } from '@/lib/session';
import { AdminWorkspaceActions } from './actions-ui';

export default async function AdminWorkspaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSuperAdmin();
  const { id } = await params;

  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      subscription: true,
      members: { include: { user: true }, orderBy: { createdAt: 'asc' } },
      whatsappAccounts: true,
      _count: {
        select: {
          conversations: true,
          knowledgeEntries: true,
        },
      },
    },
  });
  if (!org) notFound();

  // Usage stats
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const [msgMonth, msgDay, msgTotal, msgInbound, msgOutbound] = await Promise.all([
    prisma.message.count({
      where: { conversation: { organizationId: id }, createdAt: { gte: monthStart } },
    }),
    prisma.message.count({
      where: { conversation: { organizationId: id }, createdAt: { gte: dayStart } },
    }),
    prisma.message.count({ where: { conversation: { organizationId: id } } }),
    prisma.message.count({
      where: { conversation: { organizationId: id }, direction: 'inbound' },
    }),
    prisma.message.count({
      where: { conversation: { organizationId: id }, direction: 'outbound' },
    }),
  ]);

  const owner = org.members[0]?.user;
  const sub = org.subscription;

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <Link
        href="/admin/workspaces"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke list workspace
      </Link>

      <div className="mt-4 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Building2 className="h-7 w-7 text-brand" />
            {org.name}
          </h1>
          <p className="mt-1 text-sm text-gray-500">/{org.slug}</p>
        </div>
        <AdminWorkspaceActions orgId={org.id} orgName={org.name} />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {/* Owner & subscription */}
        <div className="md:col-span-2 space-y-4">
          <Section title="Customer / Owner" icon={Users}>
            <Row label="Nama" value={owner?.name ?? '—'} />
            <Row label="Email" value={owner?.email ?? '—'} />
            <Row label="Jumlah Member" value={`${org.members.length} orang`} />
          </Section>

          <Section title="Subscription" icon={CreditCard}>
            <Row
              label="Paket"
              value={
                <span className="capitalize font-semibold">
                  {sub?.plan ?? 'trial'}
                </span>
              }
            />
            <Row label="Status" value={sub?.status.replace('_', ' ') ?? '—'} />
            {sub?.trialEndsAt && (
              <Row
                label="Trial Berakhir"
                value={sub.trialEndsAt.toLocaleDateString('id', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              />
            )}
            {sub?.currentPeriodEnd && (
              <Row
                label="Paket Berakhir"
                value={sub.currentPeriodEnd.toLocaleDateString('id', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              />
            )}
            {sub?.paymentApprovedAt && (
              <Row
                label="Disetujui"
                value={sub.paymentApprovedAt.toLocaleDateString('id')}
              />
            )}
          </Section>

          {/* Member list */}
          <Section title={`Tim (${org.members.length})`} icon={Users}>
            <ul className="divide-y">
              {org.members.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <div>
                    <div className="font-medium">{m.user.name}</div>
                    <div className="text-xs text-gray-500">{m.user.email}</div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                      m.role === 'owner'
                        ? 'bg-purple-100 text-purple-800'
                        : m.role === 'admin'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {m.role}
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          {/* WhatsApp accounts */}
          <Section title={`WhatsApp (${org.whatsappAccounts.length})`} icon={Phone}>
            {org.whatsappAccounts.length === 0 ? (
              <p className="text-sm text-gray-500">Belum ada nomor terhubung.</p>
            ) : (
              <ul className="divide-y">
                {org.whatsappAccounts.map((w) => (
                  <li
                    key={w.id}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <div>
                      <div className="font-medium">{w.displayPhoneNumber}</div>
                      <div className="text-xs text-gray-500">
                        {w.provider} · {w.status}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        {/* Usage stats sidebar */}
        <div className="space-y-4">
          <Section title="Usage" icon={TrendingUp}>
            <Row
              label="Chat hari ini"
              value={<span className="font-bold text-brand">{msgDay}</span>}
            />
            <Row label="Chat bulan ini" value={msgMonth} />
            <Row label="Total chat" value={msgTotal} />
            <Row label="Masuk" value={msgInbound} />
            <Row label="Keluar" value={msgOutbound} />
          </Section>

          <Section title="Konten" icon={BookOpen}>
            <Row label="Conversation" value={org._count.conversations} />
            <Row label="Knowledge entries" value={org._count.knowledgeEntries} />
          </Section>

          <Section title="Tanggal" icon={Calendar}>
            <Row
              label="Dibuat"
              value={org.createdAt.toLocaleDateString('id', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            />
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="border-b px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-brand" />
          {title}
        </h2>
      </div>
      <div className="p-4 space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm border-b border-gray-100 pb-1.5 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
