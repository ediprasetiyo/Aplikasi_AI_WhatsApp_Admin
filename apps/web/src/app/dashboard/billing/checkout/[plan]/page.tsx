import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { requireActiveOrgId } from '@/lib/session';
import { getSubscriptionInfo } from '@/lib/subscription';
import { PLANS, type PlanKey } from '@/lib/plans';
import { CheckoutForm } from './form';
import { PaymentInstructions } from './payment-instructions';

const VALID_PLANS = ['starter', 'pro', 'business'] as const;

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ plan: string }>;
}) {
  const { plan } = await params;
  if (!VALID_PLANS.includes(plan as (typeof VALID_PLANS)[number])) notFound();

  const planKey = plan as PlanKey;
  const planConfig = PLANS[planKey];

  const orgId = await requireActiveOrgId();
  const sub = await getSubscriptionInfo(orgId);

  // Kalau sudah pending_payment dengan plan yang sama → tampilkan instruksi pembayaran
  // Kalau belum → tampilkan form
  const showInstructions =
    sub.status === 'pending_payment' &&
    (await import('@wa-admin/db').then((db) =>
      db.prisma.subscription.findUnique({
        where: { organizationId: orgId },
        select: { plan: true, paymentMethod: true, paymentAmount: true, ktpName: true },
      }),
    ).then((s) => s?.plan === plan ? s : null));

  return (
    <div className="mx-auto max-w-2xl p-6 md:p-8">
      <Link
        href="/dashboard/billing"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke pilihan paket
      </Link>

      <div className="mt-4">
        <h1 className="text-3xl font-bold">Berlangganan {planConfig.name}</h1>
        <p className="mt-1 text-gray-600">{planConfig.tagline}</p>
      </div>

      {/* Summary */}
      <div className="mt-6 rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Total per bulan</div>
            <div className="mt-1 text-3xl font-bold">
              Rp {planConfig.priceIdr.toLocaleString('id')}
            </div>
          </div>
          <div className="text-right text-xs text-gray-500">
            Paket {planConfig.name}
            <br />
            {planConfig.maxWorkspaces} workspace · {planConfig.maxWhatsappAccounts} WA
          </div>
        </div>
      </div>

      {showInstructions ? (
        <PaymentInstructions
          plan={planKey}
          amount={planConfig.priceIdr}
          method={showInstructions.paymentMethod ?? 'bca'}
          ktpName={showInstructions.ktpName ?? '-'}
        />
      ) : (
        <>
          {sub.status === 'pending_payment' && (
            <div className="mt-6 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
              <AlertCircle className="inline h-4 w-4 mr-1" />
              Anda punya pembayaran pending untuk paket lain. Mengisi form di bawah akan
              mengganti pesanan sebelumnya.
            </div>
          )}
          <CheckoutForm planKey={planKey} />
        </>
      )}
    </div>
  );
}
