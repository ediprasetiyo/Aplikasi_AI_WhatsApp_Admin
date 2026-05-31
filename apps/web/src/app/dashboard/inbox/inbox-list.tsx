'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Clock, CheckCheck, Ban } from 'lucide-react';
import {
  BulkActionBar,
  InboxItemCheckbox,
  useSelection,
} from './bulk-actions';

type ConvoItem = {
  id: string;
  customerPhone: string;
  customerName: string | null;
  customerStatus: string;
  lastMessageAt: Date;
  markedReadAt: Date | null;
  messages: Array<{ direction: string; body: string | null; type: string }>;
  _count: { messages: number };
  isPending: boolean;
};

export function InboxList({ conversations }: { conversations: ConvoItem[] }) {
  const { selected, toggle, ids } = useSelection();

  return (
    <div className="mt-4">
      <BulkActionBar selectedIds={ids} />

      <ul className="divide-y rounded-lg border bg-white">
        {conversations.map((c) => {
          const last = c.messages[0];
          const isSelected = selected.has(c.id);
          const isBanned = c.customerStatus === 'banned';

          return (
            <li key={c.id}>
              <div
                className={`flex items-start gap-3 px-3 py-4 hover:bg-gray-50 transition ${
                  c.isPending && !isBanned ? 'bg-red-50/30 border-l-4 border-l-red-400' : ''
                } ${isBanned ? 'opacity-60' : ''} ${isSelected ? 'bg-brand/5' : ''}`}
              >
                <div className="flex items-center pt-1">
                  <InboxItemCheckbox
                    id={c.id}
                    selected={isSelected}
                    onChange={toggle}
                  />
                </div>

                <Link
                  href={`/dashboard/inbox/${c.id}`}
                  className="flex flex-1 items-start justify-between gap-4 min-w-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">
                        {c.customerName ?? c.customerPhone}
                      </span>
                      <span className="text-xs font-normal text-gray-500">
                        · {c.customerPhone}
                      </span>
                      {isBanned ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
                          <Ban className="h-3 w-3" /> Banned
                        </span>
                      ) : c.isPending ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          <Clock className="h-3 w-3" /> Belum dijawab
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                          <CheckCheck className="h-3 w-3" /> Selesai
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
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
