import Link from 'next/link';
import {
  Users,
  Phone,
  MessageCircle,
  Send,
  Bot,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { requireSession, getActiveOrgId } from '@/lib/session';
import { prisma } from '@wa-admin/db';
import { getSubscriptionInfo } from '@/lib/subscription';
import { requireActiveSubscription } from '@/lib/subscription-guard';
import { Calendar, Sparkles } from 'lucide-react';

// Threshold safety untuk Baileys (QR scan, unofficial). Cloud API official tidak punya limit harian.
// Aman: <100/day, Hati-hati: 100-300, Risk tinggi: >300
const SAFE_DAILY = 100;
const CAUTION_DAILY = 300;

export default async function DashboardHome() {
  await requireActiveSubscription();
  const session = await requireSession();
  const activeOrgId = await getActiveOrgId();

  const org = activeOrgId
    ? await prisma.organization.findUnique({
        where: { id: activeOrgId },
        include: {
          _count: { select: { members: true, whatsappAccounts: true } },
        },
      })
    : null;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  const [
    chatsToday,
    sentToday,
    sentWeek,
    receivedToday,
    aiSetting,
    knowledgeCount,
    baileysAccount,
  ] = activeOrgId
    ? await Promise.all([
        prisma.message.count({
          where: {
            conversation: { organizationId: activeOrgId },
            createdAt: { gte: todayStart },
          },
        }),
        prisma.message.count({
          where: {
            conversation: { organizationId: activeOrgId },
            direction: 'outbound',
            createdAt: { gte: todayStart },
          },
        }),
        prisma.message.count({
          where: {
            conversation: { organizationId: activeOrgId },
            direction: 'outbound',
            createdAt: { gte: weekStart },
          },
        }),
        prisma.message.count({
          where: {
            conversation: { organizationId: activeOrgId },
            direction: 'inbound',
            createdAt: { gte: todayStart },
          },
        }),
        prisma.aiSetting.findUnique({ where: { organizationId: activeOrgId } }),
        prisma.knowledgeEntry.count({ where: { organizationId: activeOrgId } }),
        prisma.whatsappAccount.findFirst({
          where: { organizationId: activeOrgId, provider: 'baileys' },
        }),
      ])
    : [0, 0, 0, 0, null, 0, null];

  const isBaileys = !!baileysAccount && baileysAccount.status === 'active';
  const usagePercent = Math.min(100, Math.round((sentToday / CAUTION_DAILY) * 100));
  const usageLevel: 'safe' | 'caution' | 'danger' =
    sentToday < SAFE_DAILY ? 'safe' : sentToday < CAUTION_DAILY ? 'caution' : 'danger';

  const subscription = activeOrgId ? await getSubscriptionInfo(activeOrgId) : null;

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Selamat datang, {session.user.name.split(' ')[0]}</h1>
          <p className="mt-1 text-gray-600">
            Workspace aktif:{' '}
            <span className="font-medium text-gray-900">
              {org?.name ?? 'Belum ada workspace'}
            </span>
          </p>
        </div>
        {subscription && <SubscriptionBadge sub={subscription} />}
      </div>

      {/* Trial banner */}
      {subscription?.isTrialing && (subscription.daysRemaining ?? 0) <= 7 && (
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 flex-shrink-0 text-yellow-700 mt-0.5" />
              <div>
                <div className="font-semibold text-yellow-900">
                  Trial Anda berakhir dalam {subscription.daysRemaining} hari
                </div>
                <p className="mt-1 text-xs text-yellow-800">
                  Setelah trial habis, akses akan dibatasi sampai Anda berlangganan.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/billing"
              className="rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
            >
              Pilih Paket →
            </Link>
          </div>
        </div>
      )}

      {subscription?.isExpired && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-700 mt-0.5" />
              <div>
                <div className="font-semibold text-red-900">Trial sudah berakhir</div>
                <p className="mt-1 text-xs text-red-800">
                  Beberapa fitur dibatasi. Pilih paket berlangganan untuk akses penuh.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/billing"
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Berlangganan →
            </Link>
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={MessageCircle}
          label="Chat Hari Ini"
          value={chatsToday}
          sub={`${receivedToday} masuk · ${sentToday} keluar`}
          color="blue"
        />
        <StatCard
          icon={Bot}
          label="Status AI"
          value={aiSetting?.enabled ? 'Aktif' : 'Off'}
          sub={`${knowledgeCount} knowledge`}
          color={aiSetting?.enabled ? 'green' : 'gray'}
          valueAsText
        />
        <StatCard
          icon={Phone}
          label="WhatsApp"
          value={org?._count.whatsappAccounts ?? 0}
          sub={isBaileys ? 'QR Scan · Aktif' : 'Belum terhubung'}
          color={isBaileys ? 'green' : 'gray'}
        />
        <StatCard
          icon={Users}
          label="Anggota Tim"
          value={org?._count.members ?? 0}
          sub="Bisa undang di Tim"
          color="purple"
        />
      </div>

      {/* Usage / WhatsApp safety */}
      <div className="mt-8 rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-5 w-5 text-brand" />
              Pemakaian & Keamanan WhatsApp
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Pantau jumlah pesan terkirim untuk hindari risiko nomor di-suspend WhatsApp.
              {isBaileys
                ? ' Anda pakai mode QR Scan (resiko ada).'
                : ' Anda pakai Cloud API resmi (aman, tidak ada batas harian).'}
            </p>
          </div>
          <UsageBadge level={usageLevel} count={sentToday} />
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1.5">
            <span>Pesan keluar hari ini</span>
            <span className="font-medium">
              {sentToday} / {CAUTION_DAILY} batas hati-hati
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full transition-all ${
                usageLevel === 'safe'
                  ? 'bg-green-500'
                  : usageLevel === 'caution'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <div className="mt-2 grid grid-cols-3 text-[10px] text-gray-500">
            <span>Aman &lt; 100</span>
            <span className="text-center">Hati-hati 100-300</span>
            <span className="text-right">Risiko tinggi &gt; 300</span>
          </div>
        </div>

        {/* Tambahan stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <MiniStat
            icon={Send}
            label="Keluar hari ini"
            value={sentToday}
            color={
              usageLevel === 'safe'
                ? 'text-green-600'
                : usageLevel === 'caution'
                  ? 'text-yellow-600'
                  : 'text-red-600'
            }
          />
          <MiniStat
            icon={TrendingUp}
            label="Keluar 7 hari"
            value={sentWeek}
            color="text-gray-700"
          />
          <MiniStat
            icon={MessageCircle}
            label="Masuk hari ini"
            value={receivedToday}
            color="text-blue-600"
          />
        </div>

        {usageLevel !== 'safe' && (
          <div
            className={`mt-5 rounded-md border p-3 text-xs ${
              usageLevel === 'caution'
                ? 'border-yellow-200 bg-yellow-50 text-yellow-900'
                : 'border-red-200 bg-red-50 text-red-900'
            }`}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>
                  {usageLevel === 'caution'
                    ? 'Pemakaian sedang tinggi'
                    : 'PERINGATAN: Risiko di-suspend'}
                </strong>
                <p className="mt-0.5">
                  {usageLevel === 'caution'
                    ? 'Pelan-pelan saja. Hindari kirim banyak pesan dalam waktu singkat.'
                    : 'Berhenti kirim broadcast/marketing. Pertimbangkan upgrade ke Cloud API resmi Meta untuk volume tinggi.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tips safety */}
        <details className="mt-5 text-xs text-gray-600">
          <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
            Tips hindari nomor di-suspend WhatsApp →
          </summary>
          <ul className="mt-3 space-y-1.5 pl-4 list-disc">
            <li>Hanya balas chat yang masuk (jangan inisiasi broadcast massal).</li>
            <li>Variasikan isi balasan — AI sudah handle ini.</li>
            <li>Beri jeda antar pesan (delay 1-3 detik sudah ada di pengaturan AI).</li>
            <li>Jangan pakai nomor baru (umur &lt;1 bulan) untuk bot.</li>
            <li>
              Untuk volume tinggi (&gt;500/hari) atau broadcast marketing, pakai{' '}
              <Link href="/dashboard/whatsapp" className="text-brand hover:underline">
                Cloud API resmi Meta
              </Link>
              .
            </li>
          </ul>
        </details>
      </div>

      {/* Langkah selanjutnya */}
      <div className="mt-8 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="font-semibold">Langkah selanjutnya</h2>
        <ul className="mt-4 space-y-2 text-sm">
          <Step done={!!org} href="/onboarding" label="Buat workspace" />
          <Step
            done={(org?._count.whatsappAccounts ?? 0) > 0}
            href="/dashboard/whatsapp"
            label="Hubungkan WhatsApp"
          />
          <Step
            done={knowledgeCount >= 5}
            href="/dashboard/ai"
            label={`Tambah knowledge base (${knowledgeCount}/5 minimal)`}
          />
          <Step
            done={aiSetting?.enabled ?? false}
            href="/dashboard/ai"
            label="Aktifkan AI auto-reply"
          />
          <Step
            done={(org?._count.members ?? 0) > 1}
            href="/dashboard/team"
            label="Undang anggota tim"
          />
        </ul>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  valueAsText,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  sub?: string;
  color: 'blue' | 'green' | 'purple' | 'gray';
  valueAsText?: boolean;
}) {
  const colorMap = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    purple: 'text-purple-600 bg-purple-50',
    gray: 'text-gray-500 bg-gray-50',
  };
  return (
    <div className="rounded-lg border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </span>
        <div className={`rounded-md p-1.5 ${colorMap[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className={`mt-2 ${valueAsText ? 'text-xl' : 'text-3xl'} font-bold text-gray-900`}>
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-gray-500">{sub}</div>}
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-md bg-gray-50 p-3">
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <Icon className={`h-3.5 w-3.5 ${color}`} />
        {label}
      </div>
      <div className={`mt-1 text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function UsageBadge({
  level,
  count,
}: {
  level: 'safe' | 'caution' | 'danger';
  count: number;
}) {
  if (level === 'safe') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
        <ShieldCheck className="h-3.5 w-3.5" />
        Aman ({count} pesan)
      </span>
    );
  }
  if (level === 'caution') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
        <AlertTriangle className="h-3.5 w-3.5" />
        Hati-hati ({count} pesan)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
      <AlertTriangle className="h-3.5 w-3.5" />
      Risiko tinggi ({count} pesan)
    </span>
  );
}

function SubscriptionBadge({
  sub,
}: {
  sub: {
    plan: string;
    status: string;
    daysRemaining: number | null;
    isTrialing: boolean;
    isExpired: boolean;
    currentPeriodEnd?: Date | null;
  };
}) {
  // Status ACTIVE — tampilkan paket + tanggal expired + sisa hari
  if (sub.status === 'active') {
    const daysLeft = sub.currentPeriodEnd
      ? Math.max(
          0,
          Math.ceil(
            (sub.currentPeriodEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000),
          ),
        )
      : 0;
    return (
      <div className="rounded-lg border-2 border-green-400 bg-green-50 px-5 py-3 min-w-[220px]">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-green-700" />
          <span className="text-xs font-medium uppercase tracking-wide text-green-700">
            Paket Aktif
          </span>
        </div>
        <div className="mt-1 text-xl font-bold capitalize text-green-900">{sub.plan}</div>
        <div className="mt-0.5 text-xs text-green-800">
          Aktif sampai{' '}
          {sub.currentPeriodEnd
            ? sub.currentPeriodEnd.toLocaleDateString('id', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : '—'}
          {' · '}
          <strong className={daysLeft < 7 ? 'text-red-700' : ''}>{daysLeft} hari lagi</strong>
        </div>
      </div>
    );
  }
  if (sub.isTrialing) {
    return (
      <div className="rounded-lg border border-brand bg-brand/5 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand" />
          <span className="text-xs font-medium uppercase tracking-wide text-brand">
            Trial
          </span>
        </div>
        <div className="mt-0.5 text-lg font-bold text-gray-900">
          {sub.daysRemaining ?? 0} hari lagi
        </div>
      </div>
    );
  }
  if (sub.isExpired) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-2.5">
        <div className="text-xs font-medium uppercase tracking-wide text-red-700">
          Berakhir
        </div>
        <div className="mt-0.5 text-sm font-bold text-red-900">Perlu berlangganan</div>
      </div>
    );
  }
  if (sub.status === 'pending_payment') {
    return (
      <div className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2.5">
        <div className="text-xs font-medium uppercase tracking-wide text-yellow-700">
          Menunggu Konfirmasi
        </div>
        <div className="mt-0.5 text-sm font-bold text-yellow-900">Pembayaran sedang dicek</div>
      </div>
    );
  }
  return null;
}

function Step({ done, href, label }: { done: boolean; href: string; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
          done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
        }`}
      >
        {done ? '✓' : '○'}
      </span>
      {done ? (
        <span className="text-gray-600 line-through">{label}</span>
      ) : (
        <Link href={href} className="text-brand hover:underline">
          {label}
        </Link>
      )}
    </li>
  );
}
