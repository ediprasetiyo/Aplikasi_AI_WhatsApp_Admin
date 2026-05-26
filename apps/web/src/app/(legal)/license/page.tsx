export const metadata = { title: 'Lisensi · WA Admin AI' };

export default function LicensePage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Lisensi Komersial</h1>
      <p className="text-sm text-gray-500">Berlaku efektif: 1 Januari 2026</p>

      <div className="mt-6 rounded-lg border bg-white p-6 not-prose">
        <h2 className="font-semibold text-lg">Ringkasan Hak Anda sebagai Pengguna</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li>✅ <strong>Pakai untuk bisnis komersial</strong> — tanpa batasan jenis usaha (UMKM, perusahaan, multi-cabang).</li>
          <li>✅ <strong>Data milik Anda</strong> — percakapan, knowledge base, customer list bisa di-export kapan saja.</li>
          <li>✅ <strong>Tidak ada vendor lock-in</strong> — cancel kapan saja, data tersedia 30 hari setelah cancel.</li>
          <li>✅ <strong>White-label opsional</strong> — paket Business bisa custom branding (hubungi kami).</li>
          <li>✅ <strong>Update gratis</strong> — semua fitur baru otomatis tersedia untuk semua pelanggan aktif.</li>
        </ul>
      </div>

      <h2 className="mt-10 text-2xl font-bold">1. Hak Pakai (License Grant)</h2>
      <p>
        Dengan berlangganan paket berbayar (Starter, Pro, atau Business), Anda mendapatkan
        lisensi <strong>non-eksklusif, non-transferable</strong>, dan dapat dicabut, untuk
        mengakses dan menggunakan Layanan WA Admin AI sesuai paket yang dipilih.
      </p>

      <h2 className="mt-8 text-2xl font-bold">2. Yang Boleh Anda Lakukan</h2>
      <ul>
        <li>Menggunakan Layanan untuk operasional bisnis Anda sendiri</li>
        <li>Menghubungkan multiple nomor WhatsApp Business (sesuai limit paket)</li>
        <li>Mengundang tim/karyawan Anda sebagai admin workspace</li>
        <li>Meng-export semua data Anda kapan saja melalui dashboard</li>
        <li>Menggunakan API kami untuk integrasi dengan sistem Anda (tersedia di paket Business)</li>
      </ul>

      <h2 className="mt-8 text-2xl font-bold">3. Yang Tidak Boleh</h2>
      <ul>
        <li>Menjual ulang akses (reselling) tanpa perjanjian reseller resmi dengan kami</li>
        <li>Reverse engineering atau memodifikasi platform</li>
        <li>Menggunakan untuk spam, phishing, atau aktivitas ilegal</li>
        <li>Mengirim pesan yang melanggar kebijakan WhatsApp Business Platform</li>
      </ul>

      <h2 className="mt-8 text-2xl font-bold">4. Garansi Uptime</h2>
      <p>
        Kami berkomitmen menjaga uptime <strong>99.5%</strong> per bulan (tidak termasuk
        maintenance terjadwal). Jika tidak tercapai, Anda berhak atas service credit
        sesuai SLA paket.
      </p>

      <h2 className="mt-8 text-2xl font-bold">5. Pembatalan & Refund</h2>
      <p>
        Anda dapat membatalkan langganan kapan saja melalui dashboard. Jika dibatalkan dalam
        <strong> 7 hari pertama</strong> setelah pembayaran pertama, kami berikan refund penuh
        (kecuali biaya setup). Setelah 7 hari, langganan berakhir di akhir periode billing yang
        sudah dibayar.
      </p>

      <h2 className="mt-8 text-2xl font-bold">6. Tanggung Jawab</h2>
      <p>
        Anda bertanggung jawab atas konten knowledge base & pesan yang dikirim atas nama bisnis Anda.
        WA Admin AI sebagai platform tidak bertanggung jawab atas isi pesan yang dihasilkan AI
        berdasarkan knowledge base yang Anda input.
      </p>

      <h2 className="mt-8 text-2xl font-bold">7. Pemilik Lisensi</h2>
      <p>
        Layanan WA Admin AI dioperasikan oleh <strong>Edi Prasetiyo</strong>, berbasis di
        Indonesia. Untuk pertanyaan terkait lisensi atau perjanjian khusus (enterprise, reseller),
        hubungi WhatsApp <strong>+62 821-1552-5327</strong>.
      </p>

      <p className="mt-10 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-900 not-prose">
        💡 Butuh perjanjian lisensi khusus untuk perusahaan/instansi (PKS, NDA)?
        Hubungi kami via WhatsApp.
      </p>
    </>
  );
}
