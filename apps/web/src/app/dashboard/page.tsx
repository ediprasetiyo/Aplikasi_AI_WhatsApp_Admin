import { requireSession } from '@/lib/session';
import { prisma } from '@wa-admin/db';

export default async function DashboardHome() {
  const session = await requireSession();
  const activeOrgId = session.session.activeOrganizationId;

  const org = activeOrgId
    ? await prisma.organization.findUnique({
        where: { id: activeOrgId },
        include: { _count: { select: { members: true } } },
      })
    : null;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Selamat datang, {session.user.name} 👋</h1>
      <p className="mt-2 text-gray-600">
        Workspace aktif: <span className="font-medium">{org?.name ?? '—'}</span>
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <StatCard label="Anggota Tim" value={org?._count.members ?? 0} />
        <StatCard label="Nomor WA Terhubung" value={0} hint="Belum tersedia (fase berikutnya)" />
        <StatCard label="Chat Hari Ini" value={0} hint="Belum tersedia (fase berikutnya)" />
      </div>

      <div className="mt-10 rounded-lg border bg-white p-6">
        <h2 className="text-lg font-semibold">Langkah selanjutnya</h2>
        <ul className="mt-3 space-y-2 text-sm text-gray-600">
          <li>✅ Buat workspace</li>
          <li>👉 <a href="/dashboard/team" className="text-brand hover:underline">Undang anggota tim</a></li>
          <li>⏳ Connect nomor WhatsApp (segera)</li>
          <li>⏳ Setup AI knowledge base (segera)</li>
        </ul>
      </div>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-lg border bg-white p-6">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
      {hint && <div className="mt-1 text-xs text-gray-400">{hint}</div>}
    </div>
  );
}
