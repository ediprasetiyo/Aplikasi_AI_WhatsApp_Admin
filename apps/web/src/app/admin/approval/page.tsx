import { CheckSquare, RefreshCw, ArrowUpCircle, Sparkles } from 'lucide-react';
import { prisma } from '@wa-admin/db';
import { requireSuperAdmin } from '@/lib/session';
import { PaymentActions } from '../subscriptions/payment-actions';

export default async function AdminApprovalPage() {
  await requireSuperAdmin();

  const pending = await prisma.subscription.findMany({
    where: { status: 'pending_payment' },
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
    orderBy: { paymentSubmittedAt: 'asc' },
  });

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="flex items-center gap-2">
        <CheckSquare className="h-6 w-6 text-brand" />
        <h1 className="text-2xl font-bold">Approval Pembayaran ({pending.length})</h1>
      </div>
      <p className="mt-2 text-sm text-gray-600">
        Daftar pembayaran customer yang menunggu verifikasi. Approve setelah cek bukti
        transfer di WhatsApp.
      </p>

      {pending.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed bg-gray-50 p-12 text-center">
          <CheckSquare className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-600">
            Tidak ada pembayaran yang menunggu approval. 🎉
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Semua customer sudah diverifikasi.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {pending.map((s) => {
            const owner = s.organization.members[0]?.user;
            const intent = s.paymentIntent ?? 'new';
            const targetPlan = s.paymentIntentPlan ?? s.plan;
            return (
              <div
                key={s.id}
                className="rounded-lg border-2 border-yellow-300 bg-yellow-50/30 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    {/* Intent badge */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <IntentBadge intent={intent} />
                      <span className="text-xs text-gray-500">
                        {s.paymentSubmittedAt?.toLocaleString('id') ?? '—'}
                      </span>
                    </div>

                    <h3 className="font-semibold text-lg">{s.organization.name}</h3>
                    <p className="text-xs text-gray-600">
                      {owner?.name} · {owner?.email}
                    </p>

                    <div className="mt-3 grid gap-x-4 gap-y-1.5 text-xs sm:grid-cols-2">
                      <Field
                        label="Paket"
                        value={
                          <span className="capitalize font-semibold">
                            {targetPlan}
                            {intent === 'upgrade' && s.plan !== targetPlan && (
                              <span className="text-gray-500 font-normal">
                                {' '}
                                (dari {s.plan})
                              </span>
                            )}
                          </span>
                        }
                      />
                      <Field
                        label="Jumlah"
                        value={
                          <span className="font-semibold text-brand">
                            Rp {(s.paymentAmount ?? 0).toLocaleString('id')}
                          </span>
                        }
                      />
                      <Field
                        label="Metode"
                        value={
                          <span className="uppercase font-medium">
                            {s.paymentMethod ?? '—'}
                          </span>
                        }
                      />
                      <Field label="No HP" value={s.phoneNumber ?? '—'} />
                      <Field label="Nama KTP" value={s.ktpName ?? '—'} />
                      <Field
                        label="NIK"
                        value={
                          <span className="font-mono">{s.ktpNumber ?? '—'}</span>
                        }
                      />
                    </div>
                  </div>

                  <PaymentActions subscriptionId={s.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function IntentBadge({ intent }: { intent: string }) {
  if (intent === 'renewal') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
        <RefreshCw className="h-3 w-3" />
        Perpanjang
      </span>
    );
  }
  if (intent === 'upgrade') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
        <ArrowUpCircle className="h-3 w-3" />
        Upgrade
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
      <Sparkles className="h-3 w-3" />
      Baru
    </span>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span className="text-gray-500">{label}:</span>{' '}
      <span>{value}</span>
    </div>
  );
}
