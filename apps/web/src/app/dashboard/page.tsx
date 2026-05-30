import { requireSession } from '@/lib/session';
import { prisma } from '@wa-admin/db';

export default async function DashboardHome() {
  const session = await requireSession();
  let activeOrgId = session.session.activeOrganizationId;

  // Fallback: kalau session tidak punya activeOrganizationId (mis. data DB direset
  // setelah session dibuat), pakai membership pertama user.
  if (!activeOrgId) {
    const firstMembership = await prisma.member.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' },
    });
    activeOrgId = firstMembership?.organizationId ?? null;
  }

  const org = activeOrgId
    ? await prisma.organization.findUnique({
        where: { id: activeOrgId },
        include: {
          _count: { select: { members: true, whatsappAccounts: true } },
        },
      })
    : null;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const chatsToday = activeOrgId
    ? await prisma.message.count({
        where: {
          conversation: { organizationId: activeOrgId },
          createdAt: { gte: todayStart },
        },
      })
    : 0;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Selamat datang, {session.user.name} 👋</h1>
      <p className="mt-2 text-gray-600">
        Workspace aktif:{' '}
        <span className="font-medium">{org?.name ?? 'Belum ada workspace'}</span>
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <StatCard label="Anggota Tim" value={org?._count.members ?? 0} />
        <StatCard
          label="Nomor WA Terhubung"
          value={org?._count.whatsappAccounts ?? 0}
          hint={
            (org?._count.whatsappAccounts ?? 0) === 0
              ? 'Hubungkan di menu WhatsApp'
              : undefined
          }
        />
        <StatCard label="Chat Hari Ini" value={chatsToday} />
      </div>

      <div className="mt-10 rounded-lg border bg-white p-6">
        <h2 className="text-lg font-semibold">Langkah selanjutnya</h2>
        <ul className="mt-3 space-y-2 text-sm text-gray-600">
          {!org && (
            <li>
              👉{' '}
              <a href="/onboarding" className="text-brand hover:underline">
                Buat workspace dulu
              </a>
            </li>
          )}
          {org && <li>✅ Buat workspace</li>}
          <li>
            👉{' '}
            <a href="/dashboard/team" className="text-brand hover:underline">
              Undang anggota tim
            </a>
          </li>
          {org && (org._count.whatsappAccounts ?? 0) === 0 ? (
            <li>
              👉{' '}
              <a href="/dashboard/whatsapp" className="text-brand hover:underline">
                Hubungkan nomor WhatsApp
              </a>
            </li>
          ) : (
            <li>✅ WhatsApp terhubung</li>
          )}
          <li>
            👉{' '}
            <a href="/dashboard/ai" className="text-brand hover:underline">
              Setup AI knowledge base
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border bg-white p-6">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
      {hint && <div className="mt-1 text-xs text-gray-400">{hint}</div>}
    </div>
  );
}
