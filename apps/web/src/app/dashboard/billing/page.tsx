import Link from 'next/link';
import { Check, Sparkles, Crown, Building2 } from 'lucide-react';
import { requireActiveOrgId } from '@/lib/session';
import { getSubscriptionInfo } from '@/lib/subscription';
import { PLANS, type PlanKey } from '@/lib/plans';

export default async function BillingPage() {
  const orgId = await requireActiveOrgId();
  const sub = await getSubscriptionInfo(orgId);

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-8">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold">Pilih Paket Berlangganan</h1>
        <p className="mt-2 text-gray-600">
          Sesuaikan paket dengan skala bisnis Anda. Bisa upgrade/cancel kapan saja.
        </p>

        {/* Status saat ini */}
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm">
          <span className="text-gray-500">Status saat ini:</span>
          <span className="font-semibold capitalize">
            {sub.plan}
            {sub.isTrialing && ` (${sub.daysRemaining} hari lagi)`}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              sub.status === 'active'
                ? 'bg-green-100 text-green-800'
                : sub.status === 'pending_payment'
                  ? 'bg-yellow-100 text-yellow-800'
                  : sub.isExpired
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
            }`}
          >
            {sub.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Grid paket */}
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <PlanCard
          planKey="starter"
          icon={Sparkles}
          currentPlan={sub.plan}
          status={sub.status}
        />
        <PlanCard
          planKey="pro"
          icon={Crown}
          currentPlan={sub.plan}
          status={sub.status}
          highlight
        />
        <PlanCard
          planKey="business"
          icon={Building2}
          currentPlan={sub.plan}
          status={sub.status}
        />
      </div>

      <p className="mt-8 text-center text-xs text-gray-500">
        *Harga per bulan. Pembayaran manual via transfer BCA atau DANA.
        Setup gratis. Bisa cancel kapan saja.
      </p>
    </div>
  );
}

function PlanCard({
  planKey,
  icon: Icon,
  currentPlan,
  status,
  highlight = false,
}: {
  planKey: PlanKey;
  icon: React.ComponentType<{ className?: string }>;
  currentPlan: string;
  status: string;
  highlight?: boolean;
}) {
  const plan = PLANS[planKey];
  const isCurrent = currentPlan === planKey;
  const isActiveCurrent = isCurrent && status === 'active';
  const isPendingCurrent = isCurrent && status === 'pending_payment';

  return (
    <div
      className={`relative rounded-xl border-2 bg-white p-6 ${
        highlight ? 'border-brand shadow-lg' : 'border-gray-200'
      }`}
    >
      {highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-4 py-1 text-xs font-bold text-white">
          PALING POPULER
        </div>
      )}

      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${highlight ? 'text-brand' : 'text-gray-600'}`} />
        <h3 className="text-xl font-bold">{plan.name}</h3>
      </div>
      <p className="mt-1 text-sm text-gray-600">{plan.tagline}</p>

      <div className="mt-5">
        <div className="text-4xl font-bold">
          Rp {(plan.priceIdr / 1000).toLocaleString('id')}rb
          <span className="text-base font-normal text-gray-500">/bulan</span>
        </div>
      </div>

      <ul className="mt-6 space-y-2 text-sm">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check
              className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                highlight ? 'text-brand' : 'text-green-600'
              }`}
            />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        {isActiveCurrent ? (
          <button
            disabled
            className="w-full rounded-md border-2 border-green-300 bg-green-50 py-2.5 text-sm font-medium text-green-700"
          >
            ✓ Paket Anda Saat Ini
          </button>
        ) : isPendingCurrent ? (
          <Link
            href={`/dashboard/billing/checkout/${planKey}`}
            className="block w-full rounded-md bg-yellow-500 py-2.5 text-center text-sm font-medium text-white hover:bg-yellow-600"
          >
            Lanjutkan Pembayaran →
          </Link>
        ) : (
          <Link
            href={`/dashboard/billing/checkout/${planKey}`}
            className={`block w-full rounded-md py-2.5 text-center text-sm font-medium transition ${
              highlight
                ? 'bg-brand text-white hover:bg-brand-dark'
                : 'border-2 border-gray-300 text-gray-700 hover:border-brand hover:text-brand'
            }`}
          >
            Pilih {plan.name}
          </Link>
        )}
      </div>
    </div>
  );
}
