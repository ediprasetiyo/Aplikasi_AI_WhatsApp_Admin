import Link from 'next/link';
import {
  MessageCircle,
  MessageCircleReply,
  Bot,
  Users,
  Zap,
  Clock,
  Shield,
  Check,
  ArrowRight,
  Star,
  Lock,
  FileCheck,
  Award,
} from 'lucide-react';

const WA_NUMBER = '6282115525327';
const WA_CTA = `https://wa.me/${WA_NUMBER}?text=Halo%20Pak%20Edi%2C%20saya%20tertarik%20dengan%20WA%20Admin%20AI`;

export default function LandingPage() {
  return (
    <main>
      {/* ===== Header ===== */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <MessageCircleReply className="h-6 w-6 text-brand" />
            Auto Balas
          </div>
          <nav className="flex items-center gap-2 md:gap-4">
            <Link href="/demo" className="hidden md:inline text-sm text-gray-600 hover:text-gray-900">
              Coba Demo
            </Link>
            <a href="#harga" className="hidden md:inline text-sm text-gray-600 hover:text-gray-900">
              Harga
            </a>
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
              Masuk
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
            >
              Coba Gratis
            </Link>
          </nav>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="container py-16 md:py-24 text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border bg-yellow-50 px-3 py-1 text-xs">
          <span className="text-yellow-700">🎁 Promo Early User</span>
          <span className="text-gray-600">— 14 hari gratis, no kartu kredit</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Customer chat WhatsApp tidak<br />
          <span className="text-brand">terbalas?</span> Hilang duitnya.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
          Pasang admin AI WhatsApp yang balas chat customer otomatis 24 jam — bahkan saat Anda tidur.
          Cocok untuk klinik, salon, dealer, travel, laundry, cafe, & toko online.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href="/demo"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-brand px-6 py-3 font-medium text-white hover:bg-brand-dark"
          >
            Coba Demo Live <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-6 py-3 font-medium hover:bg-gray-50"
          >
            Daftar 14 Hari Gratis
          </Link>
        </div>
        <p className="mt-4 text-xs text-gray-500">⚡ Setup 5 menit · 🔒 Aman, pakai WhatsApp Cloud API resmi Meta · 💸 Tanpa biaya per pesan</p>
      </section>

      {/* ===== Problem stats ===== */}
      <section className="border-y bg-gray-900 py-12 text-white">
        <div className="container grid gap-6 md:grid-cols-3 text-center">
          <Stat number="68%" label="customer pindah ke kompetitor karena chat lambat dibalas" />
          <Stat number="3-5 jam" label="rata-rata waktu admin habis balas chat berulang setiap hari" />
          <Stat number="24/7" label="AI Anda akan balas — saat Anda libur, tidur, atau ibadah" />
        </div>
      </section>

      {/* ===== Fitur ===== */}
      <section id="fitur" className="container py-16">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold">Semua yang Anda butuhkan</h2>
          <p className="mt-2 text-gray-600">Tidak perlu coding. Tidak perlu IT team.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Feature
            icon={Bot}
            title="AI Auto-Reply"
            desc="Latih AI dengan FAQ bisnis Anda. AI jawab pertanyaan customer dengan akurat & ramah."
          />
          <Feature
            icon={Zap}
            title="Setup 5 Menit"
            desc="Connect nomor WhatsApp Business via Meta Cloud API. Langsung jalan."
          />
          <Feature
            icon={Clock}
            title="Aktif 24 Jam"
            desc="Customer dijawab walau jam 2 pagi. Tidak ada lagi 'no response'."
          />
          <Feature
            icon={Users}
            title="Inbox Tim"
            desc="Semua chat di 1 dashboard. Invite admin, kelola bersama. AI + human takeover."
          />
          <Feature
            icon={Shield}
            title="Aman dari Banned"
            desc="Pakai WhatsApp Cloud API resmi Meta. Bukan unofficial bot yang bisa ke-banned."
          />
          <Feature
            icon={MessageCircle}
            title="Multi Workspace"
            desc="Punya beberapa bisnis? Kelola semua dalam 1 akun, terpisah datanya."
          />
          <Feature
            icon={Star}
            title="Knowledge Base"
            desc="Upload harga, jam buka, alamat, FAQ. AI selalu jawab konsisten."
          />
          <Feature
            icon={Bot}
            title="Custom Persona"
            desc="Atur gaya bahasa AI: santai, profesional, atau khas bisnis Anda."
          />
        </div>
      </section>

      {/* ===== Use cases ===== */}
      <section className="border-y bg-gray-50 py-16">
        <div className="container">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold">Cocok untuk bisnis Anda</h2>
            <p className="mt-2 text-gray-600">Sudah dipakai industri ini</p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8 text-center">
            {[
              '🏥 Klinik',
              '💇 Salon',
              '💈 Barbershop',
              '🚗 Dealer',
              '✈️ Travel',
              '🧺 Laundry',
              '☕ Cafe',
              '🛍️ Toko Online',
            ].map((i) => (
              <div key={i} className="rounded-md border bg-white p-3 text-sm">
                {i}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Pricing ===== */}
      <section id="harga" className="container py-16">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold">Harga sederhana, hasil cepat</h2>
          <p className="mt-2 text-gray-600">
            ROI biasanya 1-2 minggu — 1 customer yang tidak hilang sudah balik modal.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          <PriceCard
            name="Starter"
            price="299"
            for="Solo / UMKM kecil"
            features={[
              '1 nomor WhatsApp',
              '1.000 chat AI/bulan',
              '10 entri knowledge base',
              '1 admin user',
              'Email support',
            ]}
            cta="Coba Gratis"
          />
          <PriceCard
            name="Pro"
            price="599"
            for="Tim 2-5 orang"
            features={[
              '2 nomor WhatsApp',
              '5.000 chat AI/bulan',
              'Unlimited knowledge base',
              '5 admin user',
              'Custom persona AI',
              'WhatsApp support',
            ]}
            cta="Coba Gratis"
            highlight
          />
          <PriceCard
            name="Business"
            price="1.499"
            for="Multi-cabang / scale-up"
            features={[
              '5 nomor WhatsApp',
              'Unlimited chat AI',
              'Unlimited everything',
              'Unlimited admin user',
              'Priority support',
              'Custom integration',
            ]}
            cta="Hubungi Kami"
          />
        </div>
        <p className="mt-6 text-center text-xs text-gray-500">
          *Harga per bulan dalam Ribu Rupiah. Setup gratis. Bisa cancel kapan saja.
        </p>
      </section>

      {/* ===== FAQ ===== */}
      <section className="border-y bg-gray-50 py-16">
        <div className="container max-w-3xl">
          <h2 className="text-3xl font-bold text-center">Pertanyaan Umum</h2>
          <div className="mt-10 space-y-4">
            {FAQ.map((f) => (
              <details key={f.q} className="rounded-lg border bg-white p-5">
                <summary className="cursor-pointer font-medium">{f.q}</summary>
                <p className="mt-3 text-sm text-gray-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Trust / License ===== */}
      <section className="container py-16">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold">Aman, Resmi, & Terpercaya</h2>
          <p className="mt-2 text-gray-600">
            Kami serius soal keamanan data & legalitas. Bisnis Anda di tangan yang benar.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
          <TrustBadge
            icon={Shield}
            title="Resmi Meta API"
            desc="Pakai WhatsApp Cloud API resmi dari Meta. Bukan bot unofficial yang berisiko banned."
          />
          <TrustBadge
            icon={Lock}
            title="Data Terenkripsi"
            desc="Semua percakapan, knowledge base, & kredensial dienkripsi at-rest & in-transit (TLS 1.3)."
          />
          <TrustBadge
            icon={FileCheck}
            title="Lisensi Komersial"
            desc="Lisensi resmi untuk pemakaian komersial. Bisa dipakai untuk bisnis tanpa khawatir."
          />
          <TrustBadge
            icon={Award}
            title="UU PDP Compliant"
            desc="Mengikuti standar UU Perlindungan Data Pribadi RI No. 27/2022. Data milik Anda, tetap Anda."
          />
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="container py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold">Siap kurangi beban admin?</h2>
        <p className="mt-3 text-gray-600">
          14 hari gratis. Setup dibantu. Bisa cancel kapan saja.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href="/register"
            className="rounded-md bg-brand px-8 py-3 font-medium text-white hover:bg-brand-dark"
          >
            Daftar Sekarang
          </Link>
          <a
            href={WA_CTA}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-gray-300 px-8 py-3 font-medium hover:bg-gray-50"
          >
            Chat via WhatsApp →
          </a>
        </div>
        <p className="mt-4 text-xs text-gray-500">
          atau hubungi langsung:{' '}
          <a href={WA_CTA} target="_blank" rel="noreferrer" className="font-medium text-brand hover:underline">
            +62 821-1552-5327
          </a>
        </p>
      </section>

      <footer className="border-t bg-gray-50">
        <div className="container py-10">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 font-bold">
                <MessageCircleReply className="h-5 w-5 text-brand" />
                Auto Balas
              </div>
              <p className="mt-3 text-sm text-gray-600 max-w-sm">
                AI auto-reply WhatsApp untuk UMKM Indonesia. Bantu owner kurangi beban admin
                & jangan sampai customer hilang.
              </p>
              <p className="mt-4 text-xs text-gray-500">
                <strong>Created by Edi Prasetiyo</strong>
                <br />
                WhatsApp:{' '}
                <a href={WA_CTA} target="_blank" rel="noreferrer" className="text-brand hover:underline">
                  +62 821-1552-5327
                </a>
              </p>
            </div>
            <div>
              <div className="font-semibold text-sm">Produk</div>
              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                <li><Link href="/demo" className="hover:text-brand">Coba Demo</Link></li>
                <li><a href="#harga" className="hover:text-brand">Harga</a></li>
                <li><a href="#fitur" className="hover:text-brand">Fitur</a></li>
                <li><Link href="/register" className="hover:text-brand">Daftar</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-sm">Legal</div>
              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                <li><Link href="/terms" className="hover:text-brand">Syarat & Ketentuan</Link></li>
                <li><Link href="/privacy" className="hover:text-brand">Kebijakan Privasi</Link></li>
                <li><Link href="/license" className="hover:text-brand">Lisensi</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t pt-6 flex flex-col sm:flex-row justify-between gap-2 text-xs text-gray-500">
            <div>© {new Date().getFullYear()} Auto Balas · Made in Indonesia 🇮🇩</div>
            <div>Created with ❤️ by <span className="font-medium text-gray-700">Edi Prasetiyo</span></div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function TrustBadge({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-lg border bg-white p-6 text-center">
      <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand/10">
        <Icon className="h-6 w-6 text-brand" />
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{desc}</p>
    </div>
  );
}

const FAQ = [
  {
    q: 'Apakah nomor WhatsApp saya akan ke-banned?',
    a: 'Tidak. Kami pakai WhatsApp Cloud API resmi dari Meta — bukan bot unofficial. Jadi nomor Anda aman, tetap bisa dipakai normal.',
  },
  {
    q: 'Berapa lama setup?',
    a: 'Sekitar 5-15 menit untuk akun baru. Anda perlu daftar Meta Business (gratis) dan dapat Phone Number ID + Access Token, lalu paste ke dashboard kami. Kami bantu setup gratis untuk paket Pro & Business.',
  },
  {
    q: 'AI-nya bisa belajar bisnis saya?',
    a: 'Ya. Anda tinggal isi knowledge base: jam buka, harga, menu, FAQ, kebijakan refund, dll. AI akan jawab customer berdasarkan info yang Anda kasih, bukan ngarang.',
  },
  {
    q: 'Kalau AI tidak bisa jawab, gimana?',
    a: 'AI bisa Anda instruksikan untuk forward ke admin manusia. Anda & tim juga bisa lihat semua chat di Inbox dan reply manual kapan saja.',
  },
  {
    q: 'Bisa dipakai banyak nomor WhatsApp?',
    a: 'Bisa. Paket Pro bisa 2 nomor, Business 5 nomor. Cocok untuk yang punya beberapa cabang atau divisi.',
  },
  {
    q: 'Bagaimana cara bayar?',
    a: 'Transfer bank, e-wallet (OVO/Dana/GoPay), atau virtual account via Midtrans. Bisa bayar bulanan, no kontrak panjang.',
  },
];

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div className="text-4xl font-bold text-brand">{number}</div>
      <div className="mt-2 text-sm text-gray-300">{label}</div>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-lg border bg-white p-6">
      <Icon className="h-8 w-8 text-brand" />
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{desc}</p>
    </div>
  );
}

function PriceCard({
  name,
  price,
  for: forWho,
  features,
  cta,
  highlight,
}: {
  name: string;
  price: string;
  for: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-8 ${
        highlight ? 'border-brand bg-brand/5 shadow-lg ring-2 ring-brand' : 'bg-white'
      }`}
    >
      {highlight && (
        <div className="mb-3 inline-block rounded-full bg-brand px-3 py-1 text-xs font-medium text-white">
          PALING POPULER
        </div>
      )}
      <h3 className="text-xl font-bold">{name}</h3>
      <p className="text-sm text-gray-500">{forWho}</p>
      <div className="mt-4">
        <span className="text-4xl font-bold">Rp {price}rb</span>
        <span className="text-gray-500">/bulan</span>
      </div>
      <ul className="mt-6 space-y-2 text-sm">
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <Check className="h-4 w-4 mt-0.5 text-brand shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/register"
        className={`mt-8 block rounded-md py-2.5 text-center font-medium ${
          highlight
            ? 'bg-brand text-white hover:bg-brand-dark'
            : 'border border-gray-300 hover:bg-gray-50'
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}
