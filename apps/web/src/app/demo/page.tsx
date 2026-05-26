import Link from 'next/link';
import { MessageCircleReply, ArrowLeft } from 'lucide-react';
import { DemoChat } from './demo-chat';

const PRESETS = [
  {
    id: 'klinik',
    label: '🏥 Klinik Gigi',
    persona:
      'Anda adalah admin Klinik Gigi Senyum Sehat. Ramah, profesional, dan informatif. Bantu pasien dengan info layanan, jadwal, dan booking.',
    kb: [
      'Jam Operasional: Senin-Jumat 09.00-20.00, Sabtu 09.00-15.00, Minggu tutup',
      'Layanan: Scaling Rp 250rb, Tambal gigi Rp 300-500rb, Cabut gigi Rp 200-400rb, Behel mulai 4 juta',
      'Lokasi: Jl. Sudirman No.45, Jakarta Pusat. Parkir luas tersedia',
      'Reservasi: untuk booking harap H-1, bisa via WhatsApp ini',
      'Dokter: drg. Sarah (umum), drg. Andi (ortho/behel), drg. Lina (anak)',
    ],
    sampleQ: 'Halo, mau tanya. Buka jam berapa hari Sabtu? Dan biaya scaling berapa ya?',
  },
  {
    id: 'salon',
    label: '💇 Salon Kecantikan',
    persona:
      'Anda admin Salon Cantika. Hangat, friendly, supportif. Bantu pelanggan pilih layanan sesuai kebutuhan.',
    kb: [
      'Jam buka: setiap hari 09.00-21.00, last order 20.00',
      'Layanan rambut: Potong Rp 50rb (pria) / Rp 75rb (wanita), Smoothing 350-600rb, Hair coloring 300-800rb',
      'Layanan facial: basic 150rb, premium 350rb, gold 500rb',
      'Lokasi: Mall Central Park lantai 3 unit 3-15',
      'Promo: Senin-Kamis diskon 15% untuk member',
    ],
    sampleQ: 'Kak, mau smoothing rambut panjang sampai pinggang kira-kira habis berapa ya?',
  },
  {
    id: 'laundry',
    label: '🧺 Laundry Kiloan',
    persona:
      'Anda admin Laundry Bersih Wangi. Singkat, padat, jelas. Pelanggan biasanya buru-buru.',
    kb: [
      'Tarif reguler: Rp 7.000/kg, min 3kg. Selesai 2-3 hari.',
      'Tarif kilat 1 hari: Rp 12.000/kg',
      'Tarif super kilat 6 jam: Rp 18.000/kg',
      'Layanan khusus: bed cover 25rb, jas 30rb, gorden per meter 15rb',
      'Antar jemput gratis dalam radius 3km',
      'Buka 07.00-21.00, libur Minggu setelah jam 17.00',
    ],
    sampleQ: 'Bro, 5kg kilat 1 hari berapa total? Bisa antar ke daerah Tebet?',
  },
  {
    id: 'dealer',
    label: '🚗 Dealer Motor',
    persona:
      'Anda admin dealer Honda resmi. Profesional dan persuasif tapi tidak memaksa. Bantu calon pembeli pilih motor & cicilan.',
    kb: [
      'Produk best seller: Vario 160 (28-32 juta), PCX 160 (33-38 juta), Beat (17-19 juta)',
      'DP minimum: 1.5 juta untuk Beat, 2.5 juta untuk Vario, 3 juta untuk PCX',
      'Cicilan: 12, 24, 35 bulan tersedia. Bunga mulai 0% untuk tenor 12 bulan (event tertentu)',
      'Promo: gratis helm, jaket, dan service 1 tahun untuk semua tipe',
      'Test ride: bisa hari yang sama, bawa SIM C',
      'Alamat: Jl. Raya Bogor KM 28, buka Senin-Sabtu 08.00-17.00',
    ],
    sampleQ: 'Pak, Vario 160 cash sama kredit DP 3 juta berapa cicilan 24 bulan?',
  },
];

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <ArrowLeft className="h-5 w-5" />
            <MessageCircleReply className="h-6 w-6 text-brand" />
            Auto Balas
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Coba untuk Bisnis Anda →
          </Link>
        </div>
      </header>

      <section className="container py-10 text-center">
        <h1 className="text-3xl md:text-4xl font-bold">Coba sendiri, tidak perlu daftar</h1>
        <p className="mx-auto mt-3 max-w-xl text-gray-600">
          Pilih industri di bawah, lalu chat seperti customer beneran. AI akan jawab berdasarkan
          knowledge base bisnis tersebut.
        </p>
      </section>

      <section className="container pb-20">
        <DemoChat presets={PRESETS} />
      </section>

      <section className="container pb-16 text-center">
        <h2 className="text-2xl font-bold">Mau AI seperti ini untuk bisnis Anda?</h2>
        <p className="mt-2 text-gray-600">Setup 5 menit, gratis 14 hari pertama.</p>
        <Link
          href="/register"
          className="mt-6 inline-block rounded-md bg-brand px-8 py-3 font-medium text-white hover:bg-brand-dark"
        >
          Daftar Sekarang →
        </Link>
      </section>
    </main>
  );
}
