import { Settings as SettingsIcon, Building2, User, AlertTriangle } from 'lucide-react';
import { requireSession, getActiveOrgId } from '@/lib/session';
import { requireActiveSubscription } from '@/lib/subscription-guard';
import { getSubscriptionInfo } from '@/lib/subscription';
import { prisma } from '@wa-admin/db';
import { WorkspaceNameForm, DeleteWorkspaceButton } from './forms';

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
  await requireActiveSubscription();
  const session = await requireSession();
  const activeOrgId = await getActiveOrgId();

  const [org, member, sharedSub] = activeOrgId
    ? await Promise.all([
        prisma.organization.findUnique({
          where: { id: activeOrgId },
        }),
        prisma.member.findUnique({
          where: {
            organizationId_userId: {
              organizationId: activeOrgId,
              userId: session.user.id,
            },
          },
        }),
        // Subscription dari primary workspace (paket berlaku untuk semua workspace milik owner)
        getSubscriptionInfo(activeOrgId),
      ])
    : [null, null, null];

  const industry = parseIndustry(org?.metadata ?? null);
  const role = member?.role ?? 'member';
  const canEdit = role === 'owner' || role === 'admin';
  const canDelete = role === 'owner';

  return (
    <div className="mx-auto max-w-3xl p-6 md:p-8">
      <div className="flex items-center gap-2">
        <SettingsIcon className="h-7 w-7 text-brand" />
        <h1 className="text-3xl font-bold">Pengaturan</h1>
      </div>
      <p className="mt-2 text-gray-600">
        Atur workspace, profil akun, dan preferensi aplikasi.
      </p>

      {/* Role Badge */}
      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs">
        <span className="text-gray-500">Role Anda di workspace ini:</span>
        <span className={`font-semibold capitalize ${
          role === 'owner' ? 'text-purple-700' : role === 'admin' ? 'text-blue-700' : 'text-gray-700'
        }`}>{role}</span>
      </div>

      {/* Workspace Section */}
      <section className="mt-6 rounded-lg border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <Building2 className="h-5 w-5 text-brand" />
            Workspace
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            {canEdit
              ? 'Nama bisa diedit. Slug & industri tidak bisa diubah.'
              : 'Hanya Owner/Admin yang bisa edit workspace.'}
          </p>
        </div>
        <div className="p-6 space-y-4">
          <WorkspaceNameForm
            currentName={org?.name ?? ''}
            canEdit={canEdit}
          />

          <Row label="Slug" value={org?.slug ?? '—'} />
          <Row label="Industri" value={industry ?? '—'} />
          <Row
            label="Paket"
            value={
              <span className="capitalize">
                {sharedSub?.plan ?? 'trial'}{' '}
                <span className="ml-1 text-xs text-gray-500">
                  ({(sharedSub?.status ?? 'trial_active').replace('_', ' ')})
                </span>
                {sharedSub && sharedSub.billingOrgId !== activeOrgId && (
                  <span className="ml-1 text-xs text-blue-600">· ikut workspace utama</span>
                )}
              </span>
            }
          />
          <Row
            label="Dibuat"
            value={
              org?.createdAt
                ? new Date(org.createdAt).toLocaleDateString('id', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : '—'
            }
          />
        </div>
      </section>

      {/* Akun */}
      <section className="mt-6 rounded-lg border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <User className="h-5 w-5 text-brand" />
            Akun Anda
          </h2>
        </div>
        <div className="p-6 space-y-3">
          <Row label="Nama" value={session.user.name} />
          <Row label="Email" value={session.user.email} />
        </div>
      </section>

      {/* Danger Zone (Owner only) */}
      {canDelete && (
        <section className="mt-6 rounded-lg border-2 border-red-200 bg-red-50/30 shadow-sm">
          <div className="border-b border-red-200 px-6 py-4">
            <h2 className="flex items-center gap-2 font-semibold text-red-900">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </h2>
            <p className="mt-1 text-xs text-red-700">
              Tindakan permanen — pastikan benar sebelum klik.
            </p>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="font-medium text-sm">Hapus Workspace</div>
                <p className="mt-0.5 text-xs text-gray-600">
                  Semua data (chat, KB, member, WA connection) akan hilang permanen.
                </p>
              </div>
              <DeleteWorkspaceButton workspaceName={org?.name ?? ''} />
            </div>
          </div>
        </section>
      )}

      {!canEdit && (
        <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-xs text-yellow-900">
          ℹ️ Sebagai <strong>Member</strong>, Anda tidak bisa mengubah pengaturan workspace.
          Hubungi Owner/Admin untuk request perubahan.
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
