export const metadata = { title: 'Kebijakan Privasi · WA Admin AI' };

export default function PrivacyPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Kebijakan Privasi</h1>
      <p className="text-sm text-gray-500">Berlaku efektif: 1 Januari 2026</p>

      <h2 className="mt-8 text-2xl font-bold">1. Data yang Kami Kumpulkan</h2>
      <ul>
        <li><strong>Akun</strong>: nama, email, password (di-hash), nama bisnis</li>
        <li><strong>Operasional</strong>: knowledge base, kredensial WhatsApp API (terenkripsi)</li>
        <li><strong>Percakapan</strong>: pesan masuk/keluar antara Anda dan customer Anda</li>
        <li><strong>Teknis</strong>: log akses, IP address (untuk security & rate limit)</li>
      </ul>

      <h2 className="mt-8 text-2xl font-bold">2. Penggunaan Data</h2>
      <p>
        Data Anda kami gunakan eksklusif untuk menjalankan layanan: menyimpan percakapan,
        meng-generate balasan AI, dan mengirim pesan ke customer Anda via WhatsApp.
        <strong> Data Anda tidak dijual ke pihak ketiga.</strong>
      </p>

      <h2 className="mt-8 text-2xl font-bold">3. Pihak Ketiga yang Memproses Data</h2>
      <ul>
        <li><strong>Meta (WhatsApp Cloud API)</strong> — untuk mengirim/menerima pesan WA</li>
        <li><strong>Groq</strong> — untuk meng-generate balasan AI (data tidak disimpan oleh Groq untuk training)</li>
        <li><strong>Midtrans</strong> — untuk memproses pembayaran berlangganan</li>
      </ul>

      <h2 className="mt-8 text-2xl font-bold">4. Keamanan</h2>
      <ul>
        <li>Password di-hash dengan bcrypt</li>
        <li>Komunikasi terenkripsi TLS 1.3</li>
        <li>Kredensial WhatsApp disimpan terenkripsi at-rest</li>
        <li>Akses database dibatasi network internal</li>
        <li>Backup harian dengan retensi 30 hari</li>
      </ul>

      <h2 className="mt-8 text-2xl font-bold">5. Hak Anda (UU PDP)</h2>
      <p>
        Sesuai UU No. 27/2022 tentang Perlindungan Data Pribadi, Anda berhak:
      </p>
      <ul>
        <li>Mengakses data pribadi Anda</li>
        <li>Memperbarui atau memperbaiki data</li>
        <li>Menghapus data (right to be forgotten)</li>
        <li>Memperoleh salinan data dalam format terstruktur (data portability)</li>
        <li>Mencabut persetujuan sewaktu-waktu</li>
      </ul>

      <h2 className="mt-8 text-2xl font-bold">6. Retensi Data</h2>
      <p>
        Data percakapan disimpan selama langganan aktif. Setelah cancel, data dipertahankan
        30 hari untuk memberi waktu reactivation, lalu dihapus permanen.
      </p>

      <h2 className="mt-8 text-2xl font-bold">7. Kontak</h2>
      <p>
        Untuk permintaan terkait data (akses, koreksi, penghapusan), hubungi
        WhatsApp <strong>+62 821-1552-5327</strong>.
      </p>
    </>
  );
}
