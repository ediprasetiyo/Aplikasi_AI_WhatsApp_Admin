import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, RefreshCw, ArrowUpCircle, Sparkles } from 'lucide-react';
import { requireActiveOrgId } from '@/lib/session';
import { getSubscriptionInfo } from '@/lib/subscription';
import { PLANS, type PlanKey } from '@/lib/plans';
import { prisma } from '@wa-admin/db';
import { CheckoutForm } from './form';
import { PaymentInstructions } from './payment-instructions';

const VALID_PLANS = ['starter', 'pro', 'business'] as const;

type Intent = 'new' | 'renewal' | 'upgrade';

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ plan: string }>;
  searchParams: Promise<{ intent?: string }>;
}) {
  const { plan } = await params;
  const { intent: intentQuery } = await searchParams;
  if (!VALID_PLANS.includes(plan as (typeof VALID_PLANS)[number])) notFound();

  const planKey = plan as PlanKey;
  const planConfig = PLANS[planKey];

  const orgId = await requireActiveOrgId();
  const sub = await getSubscriptionInfo(orgId);
  const fullSub = await prisma.subscription.findUnique({
    where: { organizationId: sub.billingOrgId },
  });

  // Detect intent dari current sub kalau tidak ada di query
  let intent: Intent = 'new';
  if (intentQuery === 'renewal' || intentQuery === 'upgrade') {
    intent = intentQuery as Intent;
  } else if (sub.status === 'active') {
    intent = sub.plan === plan ? 'renewal' : 'upgrade';
  }

  // Kalau status pending_payment & plan-nya match dengan intentPlan → tampilkan instruksi
  const showInstructions =
    fullSub?.status === 'pending_payment' &&
    (fullSub.paymentIntentPlan === plan || fullSub.plan === plan);

  return (
    <div className="mx-auto max-w-2xl p-6 md:p-8">
      <Link
        href="/dashboard/billing"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Berlangganan
      </Link>

      <div className="mt-4 flex items-center gap-3">
        {intent === 'renewal' ? (
          <RefreshCw className="h-7 w-7 text-brand" />
        ) : intent === 'upgrade' ? (
          <ArrowUpCircle className="h-7 w-7 text-brand" />
        ) : (
          <Sparkles className="h-7 w-7 text-brand" />
        )}
        <div>
          <h1 className="text-3xl font-bold">
            {intent === 'renewal'
              ? `Perpanjang ${planConfig.name}`
              : intent === 'upgrade'
                ? `Upgrade ke ${planConfig.name}`
                : `Berlangganan ${planConfig.name}`}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {intent === 'renewal'
              ? 'Masa aktif paket akan diperpanjang +30 hari setelah pembayaran diverifikasi.'
              : intent === 'upgrade'
                ? 'Paket akan langsung berubah setelah pembayaran diverifikasi. Berlaku 30 hari.'
                : 'Paket akan aktif 30 hari setelah pembayaran diverifikasi.'}
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Total Pembayaran</div>
            <div className="mt-1 text-3xl font-bold">
              Rp {planConfig.priceIdr.toLocaleString('id')}
            </div>
          </div>
          <div className="text-right text-xs text-gray-500">
            <div className="font-semibold uppercase">{intent}</div>
            <div>{planConfig.maxWorkspaces} workspace · {planConfig.maxWhatsappAccounts} WA</div>
          </div>
        </div>
      </div>

      {showInstructions ? (
        <PaymentInstructions
          plan={planKey}
          amount={planConfig.priceIdr}
          method={fullSub!.paymentMethod ?? 'bca'}
          ktpName={fullSub!.ktpName ?? '-'}
        />
      ) : (
        <CheckoutForm
          planKey={planKey}
          intent={intent}
          defaults={
            fullSub
              ? {
                  ktpName: fullSub.ktpName ?? '',
                  ktpNumber: fullSub.ktpNumber ?? '',
                  phoneNumber: fullSub.phoneNumber ?? '',
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
