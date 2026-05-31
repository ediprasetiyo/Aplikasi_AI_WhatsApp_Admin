import Link from 'next/link';
import { Inbox as InboxIcon } from 'lucide-react';
import { requireActiveOrgId } from '@/lib/session';
import { prisma } from '@wa-admin/db';
import { SimulateButton } from './simulate-button';
import { AutoRefresh } from './auto-refresh';
import { InboxList } from './inbox-list';

type Filter = 'all' | 'pending' | 'answered' | 'banned';

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const orgId = await requireActiveOrgId();
  const { filter = 'all' } = await searchParams;
  const activeFilter: Filter =
    filter === 'pending' || filter === 'answered' || filter === 'banned'
      ? filter
      : 'all';

  const conversations = await prisma.conversation.findMany({
    where: { organizationId: orgId },
    orderBy: { lastMessageAt: 'desc' },
    take: 200,
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { direction: true, body: true, type: true },
      },
      _count: { select: { messages: true } },
    },
  });

  const withStatus = conversations.map((c) => ({
    ...c,
    isPending:
      c.messages[0]?.direction === 'inbound' && c.customerStatus !== 'banned',
  }));

  const filtered =
    activeFilter === 'pending'
      ? withStatus.filter((c) => c.isPending && c.customerStatus !== 'banned')
      : activeFilter === 'answered'
        ? withStatus.filter((c) => !c.isPending && c.customerStatus !== 'banned')
        : activeFilter === 'banned'
          ? withStatus.filter((c) => c.customerStatus === 'banned')
          : withStatus;

  const pendingCount = withStatus.filter((c) => c.isPending).length;
  const answeredCount = withStatus.filter(
    (c) => !c.isPending && c.customerStatus !== 'banned',
  ).length;
  const bannedCount = withStatus.filter((c) => c.customerStatus === 'banned').length;

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <AutoRefresh intervalMs={5000} />
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <InboxIcon className="h-7 w-7 text-brand" />
            Inbox
            {pendingCount > 0 && (
              <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-sm font-semibold text-white">
                {pendingCount}
              </span>
            )}
          </h1>
          <p className="mt-2 text-gray-600">
            Semua percakapan customer di satu tempat. Centang untuk pilih & tandai
            sudah dibaca.
          </p>
        </div>
        <SimulateButton />
      </div>

      {/* Filter tabs */}
      <div className="mt-6 flex gap-2 border-b overflow-x-auto">
        <FilterTab
          href="/dashboard/inbox"
          active={activeFilter === 'all'}
          label="Semua"
          count={withStatus.length - bannedCount}
        />
        <FilterTab
          href="/dashboard/inbox?filter=pending"
          active={activeFilter === 'pending'}
          label="Belum Dijawab"
          count={pendingCount}
          color="red"
        />
        <FilterTab
          href="/dashboard/inbox?filter=answered"
          active={activeFilter === 'answered'}
          label="Sudah Dijawab"
          count={answeredCount}
          color="green"
        />
        {bannedCount > 0 && (
          <FilterTab
            href="/dashboard/inbox?filter=banned"
            active={activeFilter === 'banned'}
            label="Banned (Spam)"
            count={bannedCount}
            color="gray"
          />
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed bg-gray-50 p-12 text-center">
          <p className="text-gray-600">
            {activeFilter === 'pending'
              ? 'Tidak ada pesan yang belum dijawab. 🎉'
              : activeFilter === 'answered'
                ? 'Belum ada percakapan yang sudah dijawab.'
                : activeFilter === 'banned'
                  ? 'Tidak ada customer banned. 👍'
                  : 'Belum ada percakapan.'}
          </p>
          {activeFilter === 'all' && (
            <p className="mt-2 text-sm text-gray-500">
              Hubungkan WhatsApp di menu WhatsApp, atau klik "Simulasi" untuk testing AI.
            </p>
          )}
        </div>
      ) : (
        <InboxList conversations={filtered} />
      )}
    </div>
  );
}

function FilterTab({
  href,
  active,
  label,
  count,
  color,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
  color?: 'red' | 'green' | 'gray';
}) {
  const countColor =
    color === 'red'
      ? 'bg-red-100 text-red-700'
      : color === 'green'
        ? 'bg-green-100 text-green-700'
        : color === 'gray'
          ? 'bg-gray-200 text-gray-700'
          : 'bg-gray-100 text-gray-600';
  return (
    <Link
      href={href}
      className={`relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition whitespace-nowrap ${
        active
          ? 'border-brand text-brand'
          : 'border-transparent text-gray-600 hover:text-gray-900'
      }`}
    >
      {label}
      <span
        className={`rounded-full px-2 py-0.5 text-xs ${
          active ? 'bg-brand/10 text-brand' : countColor
        }`}
      >
        {count}
      </span>
    </Link>
  );
}
