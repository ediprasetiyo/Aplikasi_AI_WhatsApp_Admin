import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Clock, CheckCheck, Inbox as InboxIcon } from 'lucide-react';
import { requireActiveOrgId } from '@/lib/session';
import { prisma } from '@wa-admin/db';
import { SimulateButton } from './simulate-button';
import { AutoRefresh } from './auto-refresh';

type Filter = 'all' | 'pending' | 'answered';

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const orgId = await requireActiveOrgId();
  const { filter = 'all' } = await searchParams;
  const activeFilter: Filter =
    filter === 'pending' || filter === 'answered' ? filter : 'all';

  const conversations = await prisma.conversation.findMany({
    where: { organizationId: orgId },
    orderBy: { lastMessageAt: 'desc' },
    take: 200,
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      _count: { select: { messages: true } },
    },
  });

  // Tentukan status setiap conversation berdasarkan arah pesan terakhir
  const withStatus = conversations.map((c) => ({
    ...c,
    isPending: c.messages[0]?.direction === 'inbound',
  }));

  const filtered =
    activeFilter === 'pending'
      ? withStatus.filter((c) => c.isPending)
      : activeFilter === 'answered'
        ? withStatus.filter((c) => !c.isPending)
        : withStatus;

  const pendingCount = withStatus.filter((c) => c.isPending).length;
  const answeredCount = withStatus.length - pendingCount;

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
            Semua percakapan customer di satu tempat.
          </p>
        </div>
        <SimulateButton />
      </div>

      {/* Filter tabs */}
      <div className="mt-6 flex gap-2 border-b">
        <FilterTab
          href="/dashboard/inbox"
          active={activeFilter === 'all'}
          label="Semua"
          count={withStatus.length}
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
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed bg-gray-50 p-12 text-center">
          <p className="text-gray-600">
            {activeFilter === 'pending'
              ? 'Tidak ada pesan yang belum dijawab. 🎉'
              : activeFilter === 'answered'
                ? 'Belum ada percakapan yang sudah dijawab.'
                : 'Belum ada percakapan.'}
          </p>
          {activeFilter === 'all' && (
            <p className="mt-2 text-sm text-gray-500">
              Hubungkan WhatsApp di menu WhatsApp, atau klik "Simulasi" untuk testing AI.
            </p>
          )}
        </div>
      ) : (
        <ul className="mt-4 divide-y rounded-lg border bg-white">
          {filtered.map((c) => {
            const last = c.messages[0];
            return (
              <li key={c.id}>
                <Link
                  href={`/dashboard/inbox/${c.id}`}
                  className={`flex items-start justify-between gap-4 px-5 py-4 hover:bg-gray-50 ${
                    c.isPending ? 'bg-red-50/30 border-l-4 border-l-red-400' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-medium ${c.isPending ? 'text-gray-900' : ''}`}>
                        {c.customerName ?? c.customerPhone}
                      </span>
                      <span className="text-xs font-normal text-gray-500">
                        · {c.customerPhone}
                      </span>
                      {c.isPending ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          <Clock className="h-3 w-3" />
                          Belum dijawab
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                          <CheckCheck className="h-3 w-3" />
                          Selesai
                        </span>
                      )}
                    </div>
                    <div className="mt-1 truncate text-sm text-gray-600">
                      {last?.direction === 'outbound' && (
                        <span className="text-gray-400">Anda: </span>
                      )}
                      {last?.body ?? `[${last?.type ?? 'tidak ada pesan'}]`}
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500 flex-shrink-0">
                    <div>
                      {formatDistanceToNow(c.lastMessageAt, {
                        addSuffix: true,
                        locale: idLocale,
                      })}
                    </div>
                    <div className="mt-1">{c._count.messages} pesan</div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
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
  color?: 'red' | 'green';
}) {
  const countColor = color === 'red' ? 'bg-red-100 text-red-700' : color === 'green' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600';
  return (
    <Link
      href={href}
      className={`relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
        active
          ? 'border-brand text-brand'
          : 'border-transparent text-gray-600 hover:text-gray-900'
      }`}
    >
      {label}
      <span className={`rounded-full px-2 py-0.5 text-xs ${active ? 'bg-brand/10 text-brand' : countColor}`}>
        {count}
      </span>
    </Link>
  );
}
