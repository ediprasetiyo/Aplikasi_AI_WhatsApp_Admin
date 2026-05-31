import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { prisma } from '@wa-admin/db';
import { requireSuperAdmin } from '@/lib/session';

export default async function AdminWorkspacesPage() {
  await requireSuperAdmin();

  const orgs = await prisma.organization.findMany({
    include: {
      subscription: true,
      _count: {
        select: {
          members: true,
          whatsappAccounts: true,
          conversations: true,
          knowledgeEntries: true,
        },
      },
      members: {
        include: { user: { select: { email: true, name: true } } },
        take: 1,
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl">
      <div className="flex items-center gap-2">
        <Building2 className="h-6 w-6 text-brand" />
        <h1 className="text-2xl font-bold">Semua Customer ({orgs.length})</h1>
      </div>
      <p className="mt-2 text-sm text-gray-600">
        List customer & workspace. Klik untuk lihat detail, edit nama, atau hapus.
      </p>

      <div className="mt-6 overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">Customer / Workspace</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Paket</th>
              <th className="px-4 py-3 text-left">Join</th>
              <th className="px-4 py-3 text-left">Expired</th>
              <th className="px-4 py-3 text-right">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orgs.map((o) => {
              const owner = o.members[0]?.user;
              const sub = o.subscription;
              const expiry =
                sub?.status === 'active' && sub.currentPeriodEnd
                  ? sub.currentPeriodEnd
                  : sub?.trialEndsAt;
              const expired = expiry && expiry.getTime() < Date.now();
              return (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{o.name}</div>
                    <div className="text-xs text-gray-500">{owner?.name ?? '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-xs">{owner?.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    <PlanBadge
                      plan={sub?.plan ?? 'trial'}
                      status={sub?.status ?? 'trial_active'}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {o.createdAt.toLocaleDateString('id', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td
                    className={`px-4 py-3 text-xs ${
                      expired ? 'text-red-600 font-medium' : 'text-gray-600'
                    }`}
                  >
                    {expiry
                      ? expiry.toLocaleDateString('id', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                    {expired && ' (expired)'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/workspaces/${o.id}`}
                      className="inline-flex items-center gap-1 rounded-md border border-brand px-2.5 py-1 text-xs font-medium text-brand hover:bg-brand hover:text-white"
                    >
                      Lihat Detail →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {orgs.length === 0 && (
        <div className="mt-6 rounded-lg border border-dashed bg-gray-50 p-12 text-center text-gray-500">
          Belum ada customer.
        </div>
      )}
    </div>
  );
}

function PlanBadge({ plan, status }: { plan: string; status: string }) {
  const colors: Record<string, string> = {
    trial: 'bg-blue-100 text-blue-800',
    starter: 'bg-purple-100 text-purple-800',
    pro: 'bg-green-100 text-green-800',
    business: 'bg-yellow-100 text-yellow-800',
  };
  const statusLabel: Record<string, string> = {
    trial_active: 'trial',
    trial_expired: 'trial habis',
    pending_payment: 'menunggu bayar',
    active: 'aktif',
    expired: 'habis',
    suspended: 'suspended',
  };
  return (
    <div className="flex flex-col items-start gap-1">
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
          colors[plan] ?? 'bg-gray-100 text-gray-700'
        }`}
      >
        {plan}
      </span>
      <span className="text-[10px] text-gray-500">{statusLabel[status] ?? status}</span>
    </div>
  );
}
