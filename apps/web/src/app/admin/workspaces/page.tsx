import { Building2 } from 'lucide-react';
import { prisma } from '@wa-admin/db';
import { requireSuperAdmin } from '@/lib/session';
import { DeleteButton } from '../delete-button';

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
        <h1 className="text-2xl font-bold">Semua Workspace ({orgs.length})</h1>
      </div>
      <p className="mt-2 text-sm text-gray-600">
        Kelola workspace yang dibuat user. Hapus yang sudah tidak dipakai biar DB bersih.
      </p>

      <div className="mt-6 overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">Workspace</th>
              <th className="px-4 py-3 text-left">Owner</th>
              <th className="px-4 py-3 text-left">Plan</th>
              <th className="px-4 py-3 text-right">Members</th>
              <th className="px-4 py-3 text-right">WA</th>
              <th className="px-4 py-3 text-right">Chats</th>
              <th className="px-4 py-3 text-right">KB</th>
              <th className="px-4 py-3 text-left">Dibuat</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orgs.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium">{o.name}</div>
                  <div className="text-xs text-gray-500">/{o.slug}</div>
                </td>
                <td className="px-4 py-3 text-xs">
                  {o.members[0]?.user.email ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <PlanBadge
                    plan={o.subscription?.plan ?? 'trial'}
                    status={o.subscription?.status ?? 'trial_active'}
                  />
                </td>
                <td className="px-4 py-3 text-right">{o._count.members}</td>
                <td className="px-4 py-3 text-right">{o._count.whatsappAccounts}</td>
                <td className="px-4 py-3 text-right">{o._count.conversations}</td>
                <td className="px-4 py-3 text-right">{o._count.knowledgeEntries}</td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {o.createdAt.toLocaleDateString('id', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  <DeleteButton orgId={o.id} orgName={o.name} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {orgs.length === 0 && (
        <div className="mt-6 rounded-lg border border-dashed bg-gray-50 p-12 text-center text-gray-500">
          Belum ada workspace.
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
  const statusColors: Record<string, string> = {
    trial_active: 'bg-blue-50 text-blue-700',
    trial_expired: 'bg-red-50 text-red-700',
    pending_payment: 'bg-yellow-50 text-yellow-700',
    active: 'bg-green-50 text-green-700',
    expired: 'bg-red-50 text-red-700',
  };
  return (
    <div className="flex flex-col items-start gap-1">
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${colors[plan] ?? 'bg-gray-100 text-gray-700'}`}
      >
        {plan}
      </span>
      <span
        className={`rounded px-1.5 py-0.5 text-[10px] ${statusColors[status] ?? 'bg-gray-100 text-gray-600'}`}
      >
        {status.replace('_', ' ')}
      </span>
    </div>
  );
}
