import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { requireActiveOrgId } from '@/lib/session';
import { prisma } from '@wa-admin/db';
import { ReplyBox } from './reply-box';
import { MessageStatus } from './message-status';
import { AutoRefresh } from '../auto-refresh';
import { renderWhatsappText } from '@/lib/wa-format';

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orgId = await requireActiveOrgId();

  const convo = await prisma.conversation.findFirst({
    where: { id, organizationId: orgId },
    include: {
      whatsappAccount: true,
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!convo) notFound();

  const isSimulator = convo.whatsappAccount.status !== 'active';

  return (
    <div className="flex h-screen flex-col">
      <AutoRefresh intervalMs={4000} />
      {/* header */}
      <div className="border-b bg-white px-6 py-3">
        <Link
          href="/dashboard/inbox"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Inbox
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <div className="font-semibold">{convo.customerName ?? convo.customerPhone}</div>
            <div className="text-xs text-gray-500">
              {convo.customerPhone} · via {convo.whatsappAccount.displayPhoneNumber}
            </div>
          </div>
          {isSimulator && (
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
              Mode Simulator
            </span>
          )}
        </div>
      </div>

      {/* messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 px-6 py-4 space-y-3">
        {convo.messages.length === 0 && (
          <p className="text-center text-sm text-gray-400">Belum ada pesan.</p>
        )}
        {convo.messages.map((m) => {
          const outbound = m.direction === 'outbound';
          const isFailed = outbound && m.status === 'failed';
          return (
            <div
              key={m.id}
              className={`flex ${outbound ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 text-sm ${
                  outbound
                    ? isFailed
                      ? 'bg-red-600 text-white border-2 border-red-700'
                      : 'bg-brand text-white'
                    : 'bg-white text-gray-900 border'
                }`}
              >
                <div className="whitespace-pre-wrap break-words">
                  {m.body ? renderWhatsappText(m.body) : `[${m.type}]`}
                </div>
                <div
                  className={`mt-1 flex items-center gap-1.5 text-[10px] ${
                    outbound ? 'text-white/70' : 'text-gray-400'
                  }`}
                >
                  <span>{format(m.createdAt, 'HH:mm dd MMM')}</span>
                  {outbound && (
                    <>
                      <span>·</span>
                      <MessageStatus
                        messageId={m.id}
                        status={m.status}
                        inverted={true}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* reply box */}
      <ReplyBox conversationId={convo.id} />
    </div>
  );
}
