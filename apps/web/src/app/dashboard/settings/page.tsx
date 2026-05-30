import { requireSession, getActiveOrgId } from '@/lib/session';
import { prisma } from '@wa-admin/db';

function parseIndustry(metadata: string | null): string | null {
  if (!metadata) return null;
  try {
    const obj = JSON.parse(metadata) as Record<string, unknown>;
    const v = obj.industry;
    return typeof v === 'string' ? v : null;
  } catch {
    return null;
  }
}

export default async function SettingsPage() {
  const session = await requireSession();
  const activeOrgId = await getActiveOrgId();
  const org = activeOrgId
    ? await prisma.organization.findUnique({ where: { id: activeOrgId } })
    : null;
  const industry = parseIndustry(org?.metadata ?? null);

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-bold">Pengaturan</h1>

      <div className="mt-6 rounded-lg border bg-white p-6">
        <h2 className="font-semibold">Workspace</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <Row label="Nama" value={org?.name} />
          <Row label="Slug" value={org?.slug} />
          <Row label="Industri" value={industry ?? '—'} />
          <Row label="Dibuat" value={org?.createdAt.toLocaleDateString('id')} />
        </dl>
      </div>

      <div className="mt-6 rounded-lg border bg-white p-6">
        <h2 className="font-semibold">Akun</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <Row label="Nama" value={session.user.name} />
          <Row label="Email" value={session.user.email} />
        </dl>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium">{value ?? '—'}</dd>
    </div>
  );
}
