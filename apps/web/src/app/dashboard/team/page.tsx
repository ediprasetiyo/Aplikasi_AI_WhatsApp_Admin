import { requireActiveOrgId } from '@/lib/session';
import { prisma } from '@wa-admin/db';
import { InviteForm } from './invite-form';

export default async function TeamPage() {
  const activeOrgId = await requireActiveOrgId();

  const [members, invitations] = await Promise.all([
    prisma.member.findMany({
      where: { organizationId: activeOrgId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.invitation.findMany({
      where: { organizationId: activeOrgId, status: 'pending' },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Tim</h1>
      <p className="mt-2 text-gray-600">Undang admin lain untuk bantu kelola workspace.</p>

      <div className="mt-8 rounded-lg border bg-white p-6">
        <h2 className="font-semibold">Undang Anggota Baru</h2>
        <div className="mt-4">
          <InviteForm />
        </div>
      </div>

      <div className="mt-8 rounded-lg border bg-white">
        <div className="border-b px-6 py-4 font-semibold">Anggota Aktif ({members.length})</div>
        <ul className="divide-y">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between px-6 py-3 text-sm">
              <div>
                <div className="font-medium">{m.user.name}</div>
                <div className="text-gray-500">{m.user.email}</div>
              </div>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{m.role}</span>
            </li>
          ))}
        </ul>
      </div>

      {invitations.length > 0 && (
        <div className="mt-6 rounded-lg border bg-white">
          <div className="border-b px-6 py-4 font-semibold">Undangan Tertunda ({invitations.length})</div>
          <ul className="divide-y">
            {invitations.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between px-6 py-3 text-sm">
                <div>
                  <div className="font-medium">{inv.email}</div>
                  <div className="text-gray-500">Kedaluwarsa {inv.expiresAt.toLocaleDateString('id')}</div>
                </div>
                <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">
                  pending
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
