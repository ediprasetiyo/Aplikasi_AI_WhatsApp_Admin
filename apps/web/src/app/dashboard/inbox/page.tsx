import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { requireSession } from '@/lib/session';
import { prisma } from '@wa-admin/db';
import { SimulateButton } from './simulate-button';

export default async function InboxPage() {
  const session = await requireSession();
  const orgId = session.session.activeOrganizationId;
  if (!orgId) return <div className="p-8">Pilih workspace dulu.</div>;

  const conversations = await prisma.conversation.findMany({
    where: { organizationId: orgId },
    orderBy: { lastMessageAt: 'desc' },
    take: 100,
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      _count: { select: { messages: true } },
    },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inbox</h1>
          <p className="mt-2 text-gray-600">Semua percakapan customer di satu tempat.</p>
        </div>
        <SimulateButton />
      </div>

      {conversations.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed bg-gray-50 p-12 text-center">
          <p className="text-gray-600">Belum ada percakapan.</p>
          <p className="mt-2 text-sm text-gray-500">
            Hubungkan WhatsApp di menu WhatsApp, atau klik "Simulasi" untuk testing AI tanpa WA.
          </p>
        </div>
      ) : (
        <ul className="mt-6 divide-y rounded-lg border bg-white">
          {conversations.map((c) => {
            const last = c.messages[0];
            return (
              <li key={c.id}>
                <Link
                  href={`/dashboard/inbox/${c.id}`}
                  className="flex items-start justify-between gap-4 px-5 py-4 hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">
                      {c.customerName ?? c.customerPhone}{' '}
                      <span className="text-xs font-normal text-gray-500">
                        · {c.customerPhone}
                      </span>
                    </div>
                    <div className="mt-1 truncate text-sm text-gray-600">
                      {last?.direction === 'outbound' && (
                        <span className="text-gray-400">Anda: </span>
                      )}
                      {last?.body ?? `[${last?.type ?? 'tidak ada pesan'}]`}
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500">
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
