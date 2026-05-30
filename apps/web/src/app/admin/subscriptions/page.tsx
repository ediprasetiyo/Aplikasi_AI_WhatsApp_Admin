import { CreditCard } from 'lucide-react';
import { prisma } from '@wa-admin/db';
import { requireSuperAdmin } from '@/lib/session';
import { PaymentActions } from './payment-actions';

export default async function AdminSubscriptionsPage() {
  await requireSuperAdmin();

  const subs = await prisma.subscription.findMany({
    include: {
      organization: {
        include: {
          members: {
            include: { user: { select: { email: true, name: true } } },
            take: 1,
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
    orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
  });

  const pending = subs.filter((s) => s.status === 'pending_payment');
  const active = subs.filter((s) => s.status === 'active');
  const others = subs.filter(
    (s) => s.status !== 'pending_payment' && s.status !== 'active',
  );

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center gap-2">
        <CreditCard className="h-6 w-6 text-brand" />
        <h1 className="text-2xl font-bold">Subscriptions</h1>
      </div>
      <p className="mt-2 text-sm text-gray-600">
        Approve atau reject pembayaran manual yang masuk dari user.
      </p>

      {/* PENDING — paling penting */}
      <section className="mt-6">
        <h2 className="font-semibold text-yellow-800">
          🟡 Menunggu Konfirmasi ({pending.length})
        </h2>
        <div className="mt-3 space-y-3">
          {pending.length === 0 ? (
            <div className="rounded-md border border-dashed bg-gray-50 p-4 text-center text-sm text-gray-500">
              Tidak ada pembayaran pending.
            </div>
          ) : (
            pending.map((s) => <SubRow key={s.id} sub={s} />)
          )}
        </div>
      </section>

      {/* ACTIVE */}
      <section className="mt-8">
        <h2 className="font-semibold text-green-800">
          ✅ Berlangganan Aktif ({active.length})
        </h2>
        <div className="mt-3 space-y-2">
          {active.map((s) => (
            <SubRowCompact key={s.id} sub={s} />
          ))}
          {active.length === 0 && (
            <div className="text-sm text-gray-500">Belum ada subscriber aktif.</div>
          )}
        </div>
      </section>

      {/* OTHERS (trial/expired) */}
      <section className="mt-8">
        <h2 className="font-semibold text-gray-700">
          ⚪ Trial & Lainnya ({others.length})
        </h2>
        <div className="mt-3 space-y-2">
          {others.slice(0, 20).map((s) => (
            <SubRowCompact key={s.id} sub={s} />
          ))}
        </div>
      </section>
    </div>
  );
}

type SubWithOrg = {
  id: string;
  plan: string;
  status: string;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  ktpName: string | null;
  ktpNumber: string | null;
  ktpImageUrl: string | null;
  phoneNumber: string | null;
  paymentMethod: string | null;
  paymentAmount: number | null;
  paymentProofUrl: string | null;
  paymentNotes: string | null;
  paymentSubmittedAt: Date | null;
  organization: {
    id: string;
    name: string;
    members: Array<{ user: { email: string; name: string } }>;
  };
};

function SubRow({ sub }: { sub: SubWithOrg }) {
  const owner = sub.organization.members[0]?.user;
  return (
    <div className="rounded-lg border border-yellow-300 bg-yellow-50/50 p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="font-semibold">{sub.organization.name}</div>
          <div className="text-xs text-gray-600">
            {owner?.name} · {owner?.email}
          </div>
          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
            <div>
              <strong>Paket:</strong>{' '}
              <span className="capitalize">{sub.plan}</span>
            </div>
            <div>
              <strong>Jumlah:</strong> Rp{' '}
              {(sub.paymentAmount ?? 0).toLocaleString('id')}
            </div>
            <div>
              <strong>Metode:</strong>{' '}
              <span className="uppercase">{sub.paymentMethod ?? '—'}</span>
            </div>
            <div>
              <strong>Submit:</strong>{' '}
              {sub.paymentSubmittedAt?.toLocaleString('id') ?? '—'}
            </div>
            <div>
              <strong>Nama KTP:</strong> {sub.ktpName ?? '—'}
            </div>
            <div>
              <strong>No. KTP:</strong> {sub.ktpNumber ?? '—'}
            </div>
            <div>
              <strong>HP:</strong> {sub.phoneNumber ?? '—'}
            </div>
          </div>
          {(sub.ktpImageUrl || sub.paymentProofUrl) && (
            <div className="mt-3 flex gap-2">
              {sub.ktpImageUrl && (
                <a
                  href={sub.ktpImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border bg-white px-2.5 py-1 text-xs hover:bg-gray-50"
                >
                  🆔 Lihat KTP
                </a>
              )}
              {sub.paymentProofUrl && (
                <a
                  href={sub.paymentProofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border bg-white px-2.5 py-1 text-xs hover:bg-gray-50"
                >
                  💳 Lihat Bukti Transfer
                </a>
              )}
            </div>
          )}
        </div>
        <PaymentActions subscriptionId={sub.id} />
      </div>
    </div>
  );
}

function SubRowCompact({ sub }: { sub: SubWithOrg }) {
  const owner = sub.organization.members[0]?.user;
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border bg-white px-4 py-2 text-sm">
      <div className="min-w-0 flex-1">
        <div className="font-medium">{sub.organization.name}</div>
        <div className="text-xs text-gray-500">{owner?.email}</div>
      </div>
      <div className="text-right text-xs">
        <div className="font-medium capitalize">{sub.plan}</div>
        <div className="text-gray-500">{sub.status.replace('_', ' ')}</div>
      </div>
    </div>
  );
}
