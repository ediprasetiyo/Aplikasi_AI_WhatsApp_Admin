export const metadata = { title: 'Syarat & Ketentuan · Auto Balas' };

export default function TermsPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Syarat & Ketentuan</h1>
      <p className="text-sm text-gray-500">Berlaku efektif: 1 Januari 2026</p>

      <h2 className="mt-8 text-2xl font-bold">1. Penerimaan Syarat</h2>
      <p>
        Dengan mendaftar dan menggunakan Auto Balas ("Layanan"), Anda setuju terikat oleh syarat &
        ketentuan ini, termasuk Kebijakan Privasi dan Lisensi yang menjadi satu kesatuan.
      </p>

      <h2 className="mt-8 text-2xl font-bold">2. Akun Pengguna</h2>
      <ul>
        <li>Anda harus berusia minimal 18 tahun atau memiliki persetujuan wali</li>
        <li>Anda bertanggung jawab atas keamanan password & aktivitas di akun Anda</li>
        <li>Satu email = satu akun. Akun palsu/multi-trial akan dibekukan</li>
      </ul>

      <h2 className="mt-8 text-2xl font-bold">3. Penggunaan Layanan</h2>
      <p>
        Anda dilarang menggunakan Layanan untuk:
      </p>
      <ul>
        <li>Spam, mass messaging tanpa consent (melanggar kebijakan WhatsApp)</li>
        <li>Phishing, scam, penipuan, atau aktivitas ilegal lainnya</li>
        <li>Mengirim konten yang melanggar SARA, asusila, atau hukum Indonesia</li>
        <li>Mengganggu/menyalahgunakan infrastruktur kami (DDoS, abuse)</li>
      </ul>
      <p>
        Pelanggaran dapat menyebabkan akun dibekukan tanpa refund.
      </p>

      <h2 className="mt-8 text-2xl font-bold">4. Pembayaran</h2>
      <ul>
        <li>Langganan ditagih bulanan via Midtrans (BCA VA, GoPay, OVO, Dana, dll)</li>
        <li>Pembayaran auto-renew kecuali Anda membatalkan sebelum periode berikutnya</li>
        <li>Harga dapat berubah dengan notifikasi 30 hari sebelumnya</li>
      </ul>

      <h2 className="mt-8 text-2xl font-bold">5. Trial 14 Hari</h2>
      <p>
        Akun baru mendapat trial 14 hari penuh fitur. Tidak ada penagihan otomatis setelah trial —
        Anda harus pilih paket berbayar untuk lanjut menggunakan layanan.
      </p>

      <h2 className="mt-8 text-2xl font-bold">6. Batasan Tanggung Jawab</h2>
      <p>
        Layanan diberikan "sebagaimana adanya". Kami tidak bertanggung jawab atas:
      </p>
      <ul>
        <li>Kehilangan profit/customer akibat downtime atau error layanan</li>
        <li>Konsekuensi dari konten yang dihasilkan AI berdasarkan KB yang Anda input</li>
        <li>Kebijakan WhatsApp/Meta yang dapat berubah sewaktu-waktu</li>
      </ul>
      <p>
        Tanggung jawab maksimal kami terbatas pada nilai langganan yang Anda bayar dalam 3 bulan terakhir.
      </p>

      <h2 className="mt-8 text-2xl font-bold">7. Hukum yang Berlaku</h2>
      <p>
        Perjanjian ini tunduk pada hukum Republik Indonesia. Perselisihan diselesaikan secara
        musyawarah; jika gagal, melalui BANI (Badan Arbitrase Nasional Indonesia).
      </p>

      <h2 className="mt-8 text-2xl font-bold">8. Kontak</h2>
      <p>
        WhatsApp: <strong>+62 821-1552-5327</strong><br />
        Operator: <strong>Edi Prasetiyo</strong>
      </p>
    </>
  );
}
