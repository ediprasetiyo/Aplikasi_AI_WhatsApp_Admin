import Link from 'next/link';
import { format } from 'date-fns';
import {
  FileSearch,
  Building2,
  UserPlus,
  CreditCard,
  CheckCircle,
  XCircle,
  Phone,
  AlertTriangle,
} from 'lucide-react';
import { prisma } from '@wa-admin/db';
import { requireSuperAdmin } from '@/lib/session';

const LIMIT = 200;

type AuditEvent = {
  ts: Date;
  type:
    | 'org_create'
    | 'member_join'
    | 'invite_sent'
    | 'subscription_submit'
    | 'subscription_approve'
    | 'subscription_reject'
    | 'wa_connect'
    | 'wa_error'
    | 'customer_banned';
  orgId: string | null;
  orgName: string;
  actor: string;
  detail: string;
};

/**
 * Halaman Super Admin: audit log activity penting di semua workspace.
 * Diturunkan dari record existing (organization.createdAt, subscription.paymentApprovedAt, dll)
 * — tidak butuh table audit terpisah.
 *
 * Untuk audit compliance, ekspor ke CSV via tombol di pojok kanan atas (TODO).
 */
export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; org?: string }>;
}) {
  await requireSuperAdmin();
  const sp = await searchParams;
  const typeFilter = sp.type?.trim() || '';
  const orgFilter = sp.org?.trim() || '';

  const orgWhere = orgFilter ? { organizationId: orgFilter } : {};
  const orgWhereId = orgFilter ? { id: orgFilter } : {};

  const [orgs, members, invitations, subscriptions, waAccounts, bannedConvos, organizations] =
    await Promise.all([
      // Workspace baru dibuat
      prisma.organization.findMany({
        where: orgWhereId,
        select: {
          id: true,
          name: true,
          createdAt: true,
          members: {
            where: { role: 'owner' },
            take: 1,
            select: { user: { select: { name: true, email: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: LIMIT,
      }),
      // Member baru gabung
      prisma.member.findMany({
        where: orgWhere,
        include: {
          user: { select: { name: true, email: true } },
          organization: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: LIMIT,
      }),
      // Invitation dikirim
      prisma.invitation.findMany({
        where: orgWhere,
        include: {
          organization: { select: { id: true, name: true } },
          inviter: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: LIMIT,
      }),
      // Subscription events (submit/approve/reject)
      prisma.subscription.findMany({
        where: orgWhere,
        include: { organization: { select: { id: true, name: true } } },
        orderBy: { updatedAt: 'desc' },
        take: LIMIT,
      }),
      // WhatsApp connection events
      prisma.whatsappAccount.findMany({
        where: orgWhere,
        include: { organization: { select: { id: true, name: true } } },
        orderBy: { updatedAt: 'desc' },
        take: LIMIT,
      }),
      // Customer banned events
      prisma.conversation.findMany({
        where: { ...orgWhere, customerStatus: 'banned' },
        include: { organization: { select: { id: true, name: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 100,
      }),
      // Untuk dropdown filter
      prisma.organization.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ]);

  // Merge semua jadi 1 timeline
  const events: AuditEvent[] = [];

  for (const o of orgs) {
    events.push({
      ts: o.createdAt,
      type: 'org_create',
      orgId: o.id,
      orgName: o.name,
      actor: o.members[0]?.user.email ?? '—',
      detail: `Workspace "${o.name}" dibuat`,
    });
  }
  for (const m of members) {
    events.push({
      ts: m.createdAt,
      type: 'member_join',
      orgId: m.organization.id,
      orgName: m.organization.name,
      actor: m.user.email,
      detail: `${m.user.name} (${m.role}) join workspace`,
    });
  }
  for (const inv of invitations) {
    events.push({
      ts: inv.createdAt,
      type: 'invite_sent',
      orgId: inv.organization.id,
      orgName: inv.organization.name,
      actor: inv.inviter.email,
      detail: `Undang ${inv.email} sebagai ${inv.role} (${inv.status})`,
    });
  }
  for (const s of subscriptions) {
    if (s.paymentSubmittedAt) {
      events.push({
        ts: s.paymentSubmittedAt,
        type: 'subscription_submit',
        orgId: s.organization.id,
        orgName: s.organization.name,
        actor: s.ktpName ?? '—',
        detail: `Submit pembayaran ${s.plan} · Rp ${(s.paymentAmount ?? 0).toLocaleString('id')} via ${s.paymentMethod ?? '—'} (intent: ${s.paymentIntent ?? '—'})`,
      });
    }
    if (s.paymentApprovedAt) {
      events.push({
        ts: s.paymentApprovedAt,
        type: 'subscription_approve',
        orgId: s.organization.id,
        orgName: s.organization.name,
        actor: s.paymentApprovedBy ?? '—',
        detail: `Approve pembayaran → ${s.plan} aktif sampai ${s.currentPeriodEnd ? format(s.currentPeriodEnd, 'dd MMM yyyy') : '—'}`,
      });
    }
    if (s.status === 'trial_expired' && s.paymentNotes) {
      events.push({
        ts: s.updatedAt,
        type: 'subscription_reject',
        orgId: s.organization.id,
        orgName: s.organization.name,
        actor: 'admin',
        detail: `Tolak pembayaran: ${s.paymentNotes}`,
      });
    }
  }
  for (const w of waAccounts) {
    events.push({
      ts: w.createdAt,
      type: 'wa_connect',
      orgId: w.organization.id,
      orgName: w.organization.name,
      actor: w.provider,
      detail: `Hubungkan WA ${w.displayPhoneNumber} (${w.provider}) — status: ${w.status}`,
    });
    if (w.lastError) {
      events.push({
        ts: w.updatedAt,
        type: 'wa_error',
        orgId: w.organization.id,
        orgName: w.organization.name,
        actor: w.provider,
        detail: `Error WA ${w.displayPhoneNumber}: ${w.lastError}`,
      });
    }
  }
  for (const c of bannedConvos) {
    events.push({
      ts: c.updatedAt,
      type: 'customer_banned',
      orgId: c.organization.id,
      orgName: c.organization.name,
      actor: 'system',
      detail: `Customer ${c.customerPhone} di-banned (spam ${c.repeatCount}x: "${(c.lastInboundText ?? '').slice(0, 40)}")`,
    });
  }

  // Filter & sort
  let filtered = events.sort((a, b) => b.ts.getTime() - a.ts.getTime());
  if (typeFilter) filtered = filtered.filter((e) => e.type === typeFilter);
  filtered = filtered.slice(0, LIMIT);

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center gap-3">
        <FileSearch className="h-7 w-7 text-brand" />
        <div>
          <h1 className="text-3xl font-bold">Audit Activity</h1>
          <p className="mt-1 text-sm text-gray-600">
            Catatan activity penting lintas workspace untuk audit dan investigasi insiden.
          </p>
        </div>
      </div>

      {/* Filter */}
      <form className="mt-6 flex flex-wrap gap-3 rounded-lg border bg-white p-4">
        <div>
          <label className="block text-xs font-medium text-gray-600">Jenis Activity</label>
          <select
            name="type"
            defaultValue={typeFilter}
            className="mt-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">Semua</option>
            <option value="org_create">Workspace dibuat</option>
            <option value="member_join">Member join</option>
            <option value="invite_sent">Invite dikirim</option>
            <option value="subscription_submit">Subscription submit</option>
            <option value="subscription_approve">Subscription approve</option>
            <option value="subscription_reject">Subscription reject</option>
            <option value="wa_connect">WhatsApp connect</option>
            <option value="wa_error">WhatsApp error</option>
            <option value="customer_banned">Customer banned (spam)</option>
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
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Filter
          </button>
          {(typeFilter || orgFilter) && (
            <Link
              href="/admin/audit"
              className="rounded-md border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Reset
            </Link>
          )}
        </div>
      </form>

      <p className="mt-4 text-xs text-gray-500">
        Menampilkan {filtered.length} dari maks {LIMIT} event terbaru. Untuk audit historikal lebih
        jauh, query langsung ke database.
      </p>

      {/* Timeline */}
      <div className="mt-4 rounded-lg border bg-white">
        <ul className="divide-y">
          {filtered.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-gray-400">
              Belum ada activity yang cocok dengan filter.
            </li>
          )}
          {filtered.map((e, i) => (
            <li key={i} className="flex items-start gap-3 px-4 py-3">
              <EventIcon type={e.type} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="text-sm font-medium text-gray-900">{e.detail}</div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    {format(e.ts, 'dd MMM yyyy HH:mm:ss')}
                  </div>
                </div>
                <div className="mt-0.5 text-xs text-gray-500">
                  Workspace:{' '}
                  {e.orgId ? (
                    <Link
                      href={`/admin/workspaces/${e.orgId}`}
                      className="text-brand hover:underline"
                    >
                      {e.orgName}
                    </Link>
                  ) : (
                    e.orgName
                  )}{' '}
                  · Aktor: <span className="font-mono">{e.actor}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function EventIcon({ type }: { type: AuditEvent['type'] }) {
  const cls = 'h-5 w-5 flex-shrink-0 mt-0.5';
  switch (type) {
    case 'org_create':
      return <Building2 className={`${cls} text-blue-600`} />;
    case 'member_join':
    case 'invite_sent':
      return <UserPlus className={`${cls} text-purple-600`} />;
    case 'subscription_submit':
      return <CreditCard className={`${cls} text-yellow-600`} />;
    case 'subscription_approve':
      return <CheckCircle className={`${cls} text-green-600`} />;
    case 'subscription_reject':
      return <XCircle className={`${cls} text-red-600`} />;
    case 'wa_connect':
      return <Phone className={`${cls} text-green-600`} />;
    case 'wa_error':
    case 'customer_banned':
      return <AlertTriangle className={`${cls} text-red-600`} />;
    default:
      return <FileSearch className={cls} />;
  }
}
