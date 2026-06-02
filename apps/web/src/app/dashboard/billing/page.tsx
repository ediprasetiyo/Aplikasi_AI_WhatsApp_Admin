import Link from 'next/link';
import {
  Check,
  Sparkles,
  Crown,
  Building2,
  Calendar,
  RefreshCw,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';
import { requireActiveOrgId } from '@/lib/session';
import { prisma } from '@wa-admin/db';
import { getSubscriptionInfo } from '@/lib/subscription';
import { PLANS, type PlanKey } from '@/lib/plans';

const PLAN_RANK: Record<string, number> = {
  trial: 0,
  starter: 1,
  pro: 2,
  business: 3,
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const orgId = await requireActiveOrgId();
  const { reason } = await searchParams;
  const sub = await getSubscriptionInfo(orgId);
  const fullSub = await prisma.subscription.findUnique({
    where: { organizationId: orgId },
  });

  const isActive = sub.status === 'active';
  const isPending = sub.status === 'pending_payment';
  const fromExpired = reason === 'expired';

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-8">
      {fromExpired && (
        <div className="mb-6 rounded-lg border-2 border-red-300 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <svg
              className="h-5 w-5 flex-shrink-0 text-red-700 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h2 className="font-semibold text-red-900">
                Paket Anda Sudah Berakhir
              </h2>
              <p className="mt-1 text-sm text-red-800">
                Semua menu dikunci sampai Anda berlangganan. Pilih paket di bawah untuk
                lanjut menggunakan Auto Balas.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold">Berlangganan</h1>
        <p className="mt-2 text-gray-600">
          Kelola paket berlangganan Anda — perpanjang, upgrade, atau ubah paket.
        </p>
      </div>

      {/* === ACTIVE SUBSCRIPTION CARD === */}
      {isActive && fullSub && (
        <ActiveSubscriptionCard
          plan={sub.plan as PlanKey}
          currentPeriodEnd={fullSub.currentPeriodEnd}
        />
      )}

      {/* === PENDING PAYMENT BANNER === */}
      {isPending && fullSub && (
        <div className="mt-8 rounded-lg border-2 border-yellow-300 bg-yellow-50 p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-semibold text-yellow-900">
                Pembayaran sedang diverifikasi
              </h2>
              <p className="mt-1 text-sm text-yellow-800">
                Paket{' '}
                <strong className="capitalize">
                  {fullSub.paymentIntentPlan ?? fullSub.plan}
                </strong>{' '}
                Rp {(fullSub.paymentAmount ?? 0).toLocaleString('id')} menunggu approval
                admin. Maks 1x24 jam.
              </p>
            </div>
            <Link
              href={`/dashboard/billing/checkout/${fullSub.paymentIntentPlan ?? fullSub.plan}`}
              className="rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
            >
              Lihat Instruksi Pembayaran →
            </Link>
          </div>
        </div>
      )}

      {/* === TRIAL STATUS === */}
      {sub.isTrialing && (
        <div className="mt-8 rounded-lg border-2 border-blue-200 bg-blue-50 p-5 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-blue-600" />
          <h2 className="mt-2 text-xl font-bold text-blue-900">
            Anda sedang Trial — {sub.daysRemaining} hari lagi
          </h2>
          <p className="mt-1 text-sm text-blue-800">
            Pilih paket berbayar sebelum trial habis biar akses tidak terputus.
          </p>
        </div>
      )}

      {/* === EXPIRED === */}
      {sub.isExpired && !isPending && (
        <div className="mt-8 rounded-lg border-2 border-red-300 bg-red-50 p-5 text-center">
          <h2 className="text-xl font-bold text-red-900">Paket Anda Sudah Berakhir</h2>
          <p className="mt-1 text-sm text-red-800">
            Pilih paket di bawah untuk lanjut menggunakan Auto Balas.
          </p>
        </div>
      )}

      {/* === PLAN GRID === */}
      <div className="mt-10">
        <h2 className="text-center text-2xl font-bold">
          {isActive ? 'Upgrade Paket' : 'Pilih Paket'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isActive
            ? 'Ganti ke paket yang lebih cocok dengan bisnis Anda saat ini.'
            : 'Bisa upgrade/cancel kapan saja.'}
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <PlanCard
            planKey="starter"
            icon={Sparkles}
            currentPlan={sub.plan}
            isActive={isActive}
          />
          <PlanCard
            planKey="pro"
            icon={Crown}
            currentPlan={sub.plan}
            isActive={isActive}
            highlight
          />
          <PlanCard
            planKey="business"
            icon={Building2}
            currentPlan={sub.plan}
            isActive={isActive}
          />
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-gray-500">
        *Harga per bulan. Pembayaran manual via transfer BCA atau DANA. Setup gratis.
      </p>
    </div>
  );
}

function ActiveSubscriptionCard({
  plan,
  currentPeriodEnd,
}: {
  plan: PlanKey;
  currentPeriodEnd: Date | null;
}) {
  const planConfig = PLANS[plan];
  const daysLeft = currentPeriodEnd
    ? Math.max(
        0,
        Math.ceil((currentPeriodEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
      )
    : 0;

  return (
    <div className="mt-8 rounded-xl border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-3 py-1 text-xs font-bold text-white">
            ✓ PAKET AKTIF
          </div>
          <h2 className="mt-3 text-3xl font-bold capitalize">{planConfig.name}</h2>
          <p className="mt-1 text-sm text-gray-600">{planConfig.tagline}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">
            Rp {planConfig.priceIdr.toLocaleString('id')}
          </div>
          <div className="text-xs text-gray-500">/bulan</div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-white p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="h-4 w-4" />
            Berlaku sampai
          </div>
          <div className="mt-1 text-lg font-bold">
            {currentPeriodEnd
              ? currentPeriodEnd.toLocaleDateString('id', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : '—'}
          </div>
          <div
            className={`mt-0.5 text-xs ${
              daysLeft < 7 ? 'text-red-600 font-medium' : 'text-gray-500'
            }`}
          >
            {daysLeft} hari lagi
          </div>
        </div>

        <div className="rounded-lg bg-white p-4">
          <div className="text-xs text-gray-500">Limit Paket</div>
          <ul className="mt-1 text-xs space-y-0.5">
            <li>• {planConfig.maxWorkspaces} workspace</li>
            <li>• {planConfig.maxWhatsappAccounts} nomor WhatsApp</li>
            <li>
              •{' '}
              {planConfig.maxMessagesPerMonth === -1
                ? 'Unlimited'
                : planConfig.maxMessagesPerMonth.toLocaleString('id')}{' '}
              chat/bulan
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-5 flex gap-3 flex-wrap">
        <Link
          href={`/dashboard/billing/checkout/${plan}?intent=renewal`}
          className="flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 rounded-md bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          <RefreshCw className="h-4 w-4" />
          Perpanjang Paket (+30 hari)
        </Link>
        <Link
          href="#upgrade-section"
          className="flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 rounded-md border-2 border-brand bg-white px-4 py-3 text-sm font-semibold text-brand hover:bg-brand/5"
        >
          <ArrowUpCircle className="h-4 w-4" />
          Upgrade Paket
        </Link>
      </div>
    </div>
  );
}

function PlanCard({
  planKey,
  icon: Icon,
  currentPlan,
  isActive,
  highlight = false,
}: {
  planKey: PlanKey;
  icon: React.ComponentType<{ className?: string }>;
  currentPlan: string;
  isActive: boolean;
  highlight?: boolean;
}) {
  const plan = PLANS[planKey];
  const isCurrent = currentPlan === planKey;
  const currentRank = PLAN_RANK[currentPlan] ?? 0;
  const targetRank = PLAN_RANK[planKey] ?? 0;
  const isUpgrade = targetRank > currentRank;
  const isDowngrade = targetRank < currentRank;

  const intent = isActive ? (isCurrent ? 'renewal' : 'upgrade') : 'new';

  return (
    <div
      id="upgrade-section"
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
        <div className="text-3xl font-bold">
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
        {isCurrent && isActive ? (
          <Link
            href={`/dashboard/billing/checkout/${planKey}?intent=renewal`}
            className="block w-full rounded-md border-2 border-green-500 bg-green-50 py-2.5 text-center text-sm font-medium text-green-700 hover:bg-green-100"
          >
            ✓ Paket Aktif · Perpanjang
          </Link>
        ) : (
          <Link
            href={`/dashboard/billing/checkout/${planKey}?intent=${intent}`}
            className={`flex w-full items-center justify-center gap-1.5 rounded-md py-2.5 text-center text-sm font-medium transition ${
              highlight
                ? 'bg-brand text-white hover:bg-brand-dark'
                : 'border-2 border-gray-300 text-gray-700 hover:border-brand hover:text-brand'
            }`}
          >
            {isUpgrade && <ArrowUpCircle className="h-4 w-4" />}
            {isDowngrade && <ArrowDownCircle className="h-4 w-4" />}
            {isUpgrade
              ? `Upgrade ke ${plan.name}`
              : isDowngrade
                ? `Downgrade ke ${plan.name}`
                : `Pilih ${plan.name}`}
          </Link>
        )}
      </div>
    </div>
  );
}
