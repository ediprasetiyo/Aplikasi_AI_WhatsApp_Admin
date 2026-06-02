import Link from 'next/link';
import { format } from 'date-fns';
import {
  ScrollText,
  Search,
  Check,
  AlertCircle,
  Clock,
  ArrowDown,
  ArrowUp,
} from 'lucide-react';
import { prisma, Prisma } from '@wa-admin/db';
import { requireSuperAdmin } from '@/lib/session';

const PAGE_SIZE = 100;

type SearchParams = {
  status?: string;
  direction?: string;
  org?: string;
  q?: string;
  page?: string;
};

/**
 * Halaman Super Admin: log semua pesan lintas workspace.
 * Untuk debug ("kenapa pesan ke pelanggan X tidak terkirim?") dan audit operasional.
 */
export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireSuperAdmin();
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10));
  const skip = (page - 1) * PAGE_SIZE;

  // Filter dari query string
  const statusFilter = sp.status?.trim() || '';
  const directionFilter = sp.direction?.trim() || '';
  const orgFilter = sp.org?.trim() || '';
  const qFilter = sp.q?.trim() || '';

  const where: Prisma.MessageWhereInput = {};
  if (statusFilter) where.status = statusFilter;
  if (directionFilter) where.direction = directionFilter;
  if (orgFilter) where.conversation = { organizationId: orgFilter };
  if (qFilter) where.body = { contains: qFilter, mode: 'insensitive' };

  const [messages, total, organizations, statusCounts] = await Promise.all([
    prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      skip,
      include: {
        conversation: {
          select: {
            id: true,
            customerPhone: true,
            customerName: true,
            organization: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.message.count({ where }),
    prisma.organization.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    // Aggregate count per status (untuk indicator cepat)
    prisma.message.groupBy({
      by: ['status'],
      _count: true,
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const summaryMap: Record<string, number> = {};
  for (const s of statusCounts) {
    summaryMap[s.status ?? 'null'] = s._count;
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center gap-3">
        <ScrollText className="h-7 w-7 text-brand" />
        <div>
          <h1 className="text-3xl font-bold">Log Pesan</h1>
          <p className="mt-1 text-sm text-gray-600">
            Semua pesan masuk & keluar lintas workspace. Filter status untuk debug bug pengiriman.
          </p>
        </div>
      </div>

      {/* Summary cards — 24 jam terakhir */}
      <div className="mt-6 grid gap-3 grid-cols-2 md:grid-cols-5">
        <SummaryCard label="Total 24j" value={Object.values(summaryMap).reduce((a, b) => a + b, 0)} color="gray" />
        <SummaryCard label="Terkirim" value={(summaryMap['sent'] ?? 0) + (summaryMap['delivered'] ?? 0)} color="green" />
        <SummaryCard label="Pending" value={summaryMap['pending'] ?? 0} color="yellow" />
        <SummaryCard label="Gagal" value={summaryMap['failed'] ?? 0} color="red" />
        <SummaryCard label="Simulator" value={summaryMap['simulated'] ?? 0} color="gray" />
      </div>

      {/* Filter form */}
      <form className="mt-6 flex flex-wrap items-end gap-3 rounded-lg border bg-white p-4">
        <div>
          <label className="block text-xs font-medium text-gray-600">Status</label>
          <select
            name="status"
            defaultValue={statusFilter}
            className="mt-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">Semua</option>
            <option value="sent">Terkirim</option>
            <option value="delivered">Delivered</option>
            <option value="read">Dibaca</option>
            <option value="failed">Gagal</option>
            <option value="pending">Pending</option>
            <option value="simulated">Simulator</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600">Arah</label>
          <select
            name="direction"
            defaultValue={directionFilter}
            className="mt-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">Semua</option>
            <option value="inbound">Inbound (dari customer)</option>
            <option value="outbound">Outbound (dari kita)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600">Workspace</label>
          <select
            name="org"
            defaultValue={orgFilter}
            className="mt-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">Semua workspace</option>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-600">Cari isi pesan</label>
          <input
            type="text"
            name="q"
            defaultValue={qFilter}
            placeholder="Kata kunci..."
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          <Search className="h-4 w-4" />
          Filter
        </button>
        {(statusFilter || directionFilter || orgFilter || qFilter) && (
          <Link
            href="/admin/logs"
            className="rounded-md border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Reset
          </Link>
        )}
      </form>

      {/* Hasil count */}
      <p className="mt-4 text-xs text-gray-500">
        {total.toLocaleString('id')} pesan total · halaman {page} dari {totalPages}
      </p>

      {/* Tabel */}
      <div className="mt-3 overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-medium text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left">Waktu</th>
              <th className="px-3 py-2 text-left">Workspace</th>
              <th className="px-3 py-2 text-left">Customer</th>
              <th className="px-3 py-2 text-center">Arah</th>
              <th className="px-3 py-2 text-left">Isi (preview)</th>
              <th className="px-3 py-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {messages.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-gray-400">
                  Tidak ada pesan yang cocok dengan filter.
                </td>
              </tr>
            )}
            {messages.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap">
                  {format(m.createdAt, 'dd MMM HH:mm:ss')}
                </td>
                <td className="px-3 py-2 text-xs">
                  <Link
                    href={`/admin/workspaces/${m.conversation.organization.id}`}
                    className="text-brand hover:underline"
                  >
                    {m.conversation.organization.name}
                  </Link>
                </td>
                <td className="px-3 py-2 text-xs">
                  <div className="font-medium">{m.conversation.customerName ?? '—'}</div>
                  <div className="text-gray-500">{m.conversation.customerPhone}</div>
                </td>
                <td className="px-3 py-2 text-center">
                  {m.direction === 'inbound' ? (
                    <ArrowDown className="inline h-4 w-4 text-blue-600" />
                  ) : (
                    <ArrowUp className="inline h-4 w-4 text-green-600" />
                  )}
                </td>
                <td className="px-3 py-2 text-xs">
                  <div className="max-w-md truncate">{m.body ?? `[${m.type}]`}</div>
                </td>
                <td className="px-3 py-2 text-center">
                  <StatusBadge status={m.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {page > 1 && (
            <PageLink
              page={page - 1}
              params={sp}
              label="← Sebelumnya"
            />
          )}
          <span className="px-3 py-1.5 text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          {page < totalPages && <PageLink page={page + 1} params={sp} label="Berikutnya →" />}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'green' | 'yellow' | 'red' | 'gray';
}) {
  const colorMap = {
    green: 'border-green-200 bg-green-50 text-green-900',
    yellow: 'border-yellow-200 bg-yellow-50 text-yellow-900',
    red: 'border-red-200 bg-red-50 text-red-900',
    gray: 'border-gray-200 bg-gray-50 text-gray-900',
  };
  return (
    <div className={`rounded-lg border-2 p-3 ${colorMap[color]}`}>
      <div className="text-xs font-medium uppercase tracking-wide opacity-80">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value.toLocaleString('id')}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const s = status ?? '';
  if (s === 'sent' || s === 'delivered' || s === 'read') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
        <Check className="h-3 w-3" />
        {s}
      </span>
    );
  }
  if (s === 'failed') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">
        <AlertCircle className="h-3 w-3" />
        gagal
      </span>
    );
  }
  if (s === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">
        <Clock className="h-3 w-3" />
        pending
      </span>
    );
  }
  if (s === 'simulated') {
    return (
      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs italic text-gray-600">
        simulator
      </span>
    );
  }
  return <span className="text-xs text-gray-400">—</span>;
}

function PageLink({
  page,
  params,
  label,
}: {
  page: number;
  params: SearchParams;
  label: string;
}) {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.direction) qs.set('direction', params.direction);
  if (params.org) qs.set('org', params.org);
  if (params.q) qs.set('q', params.q);
  qs.set('page', String(page));
  return (
    <Link
      href={`/admin/logs?${qs.toString()}`}
      className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
    >
      {label}
    </Link>
  );
}
