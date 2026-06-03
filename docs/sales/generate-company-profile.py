"""
Generate Company Profile PDF untuk Auto Balas.
Output: docs/sales/AutoBalas-Company-Profile.pdf
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    PageBreak,
    Table,
    TableStyle,
    KeepTogether,
    Image,
)
from reportlab.pdfgen import canvas

# === Brand colors ===
BRAND = HexColor('#10B981')       # green-500
BRAND_DARK = HexColor('#059669')  # green-600
GRAY_900 = HexColor('#111827')
GRAY_700 = HexColor('#374151')
GRAY_500 = HexColor('#6B7280')
GRAY_200 = HexColor('#E5E7EB')
GRAY_50 = HexColor('#F9FAFB')
BG_HERO = HexColor('#ECFDF5')     # green-50
YELLOW_50 = HexColor('#FEF3C7')

OUTPUT = 'AutoBalas-Company-Profile.pdf'


# === Page decorators ===
def page_header_footer(canvas_obj: canvas.Canvas, doc):
    canvas_obj.saveState()
    width, height = A4

    # Header: brand strip
    canvas_obj.setFillColor(BRAND)
    canvas_obj.rect(0, height - 8 * mm, width, 8 * mm, fill=1, stroke=0)

    # Footer
    canvas_obj.setFillColor(GRAY_500)
    canvas_obj.setFont('Helvetica', 8)
    canvas_obj.drawString(20 * mm, 12 * mm, 'Auto Balas — AI WhatsApp Admin untuk UMKM Indonesia')
    canvas_obj.drawRightString(width - 20 * mm, 12 * mm, f'Halaman {doc.page}')
    canvas_obj.setFillColor(GRAY_200)
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(20 * mm, 15 * mm, width - 20 * mm, 15 * mm)

    canvas_obj.restoreState()


def cover_page(canvas_obj: canvas.Canvas, doc):
    """Custom layout for cover - tidak pakai header/footer normal."""
    canvas_obj.saveState()
    width, height = A4

    # Background gradient effect (solid fill atas, putih bawah)
    canvas_obj.setFillColor(BG_HERO)
    canvas_obj.rect(0, height * 0.4, width, height * 0.6, fill=1, stroke=0)

    # Logo placeholder (text-based)
    canvas_obj.setFillColor(BRAND_DARK)
    canvas_obj.setFont('Helvetica-Bold', 36)
    canvas_obj.drawCentredString(width / 2, height - 80 * mm, 'Auto Balas')

    canvas_obj.setFillColor(GRAY_700)
    canvas_obj.setFont('Helvetica', 14)
    canvas_obj.drawCentredString(width / 2, height - 95 * mm, 'AI WhatsApp Admin untuk UMKM Indonesia')

    # Tagline
    canvas_obj.setFillColor(GRAY_500)
    canvas_obj.setFont('Helvetica-Oblique', 11)
    canvas_obj.drawCentredString(
        width / 2,
        height - 115 * mm,
        '"Customer chat WhatsApp tidak terbalas? Hilang duitnya."',
    )

    # Big tagline
    canvas_obj.setFillColor(GRAY_900)
    canvas_obj.setFont('Helvetica-Bold', 22)
    canvas_obj.drawCentredString(width / 2, height / 2 - 10 * mm, 'COMPANY PROFILE')

    canvas_obj.setFillColor(GRAY_500)
    canvas_obj.setFont('Helvetica', 11)
    canvas_obj.drawCentredString(width / 2, height / 2 - 22 * mm, '2026 Edition')

    # Bottom contact
    canvas_obj.setFillColor(GRAY_900)
    canvas_obj.setFont('Helvetica-Bold', 11)
    canvas_obj.drawCentredString(width / 2, 50 * mm, 'autobalas.my.id')

    canvas_obj.setFillColor(GRAY_500)
    canvas_obj.setFont('Helvetica', 10)
    canvas_obj.drawCentredString(width / 2, 42 * mm, 'WhatsApp: +62 821-1552-5327')
    canvas_obj.drawCentredString(width / 2, 34 * mm, 'Email: edi.prasetiyo1994@gmail.com')

    canvas_obj.setFillColor(GRAY_500)
    canvas_obj.setFont('Helvetica-Oblique', 9)
    canvas_obj.drawCentredString(width / 2, 20 * mm, 'Made in Indonesia — Created by Edi Prasetiyo')

    canvas_obj.restoreState()


# === Styles ===
styles = getSampleStyleSheet()

h1 = ParagraphStyle(
    'CustomH1',
    parent=styles['Heading1'],
    fontSize=22,
    leading=28,
    textColor=GRAY_900,
    spaceAfter=12,
    spaceBefore=6,
)
h2 = ParagraphStyle(
    'CustomH2',
    parent=styles['Heading2'],
    fontSize=15,
    leading=20,
    textColor=BRAND_DARK,
    spaceAfter=10,
    spaceBefore=14,
)
h3 = ParagraphStyle(
    'CustomH3',
    parent=styles['Heading3'],
    fontSize=12,
    leading=16,
    textColor=GRAY_900,
    spaceAfter=6,
    spaceBefore=8,
)
body = ParagraphStyle(
    'CustomBody',
    parent=styles['BodyText'],
    fontSize=10,
    leading=15,
    textColor=GRAY_700,
    alignment=TA_JUSTIFY,
    spaceAfter=8,
)
bullet = ParagraphStyle(
    'CustomBullet',
    parent=body,
    leftIndent=18,
    bulletIndent=6,
    spaceAfter=4,
)
quote = ParagraphStyle(
    'Quote',
    parent=body,
    fontSize=11,
    leading=16,
    textColor=GRAY_900,
    leftIndent=18,
    rightIndent=18,
    fontName='Helvetica-Oblique',
    borderColor=BRAND,
    borderWidth=0,
    backColor=BG_HERO,
)
caption = ParagraphStyle(
    'Caption',
    parent=body,
    fontSize=9,
    textColor=GRAY_500,
    alignment=TA_CENTER,
    spaceBefore=4,
)


# === Content blocks ===
def make_story():
    s = []

    # Cover (handled by cover_page canvas) — pakai PageBreak setelahnya
    s.append(Spacer(1, 1))  # placeholder, halaman pertama di-render manual
    s.append(PageBreak())

    # ===== HALAMAN 2: Tentang Kami =====
    s.append(Paragraph('Tentang Auto Balas', h1))
    s.append(Paragraph(
        'Auto Balas adalah platform <b>AI WhatsApp Admin</b> yang dirancang khusus untuk '
        'kebutuhan UMKM Indonesia. Kami membantu pemilik bisnis kecil & menengah membalas chat '
        'customer secara otomatis 24 jam — tanpa perlu menambah admin, tanpa lembur tengah malam, '
        'dan tanpa kehilangan calon pembeli karena slow response.',
        body,
    ))
    s.append(Paragraph(
        'Dibuat oleh praktisi developer Indonesia yang memahami struggle UMKM lokal: customer '
        'banyak nanya di luar jam kerja, owner pegang HP sambil makan, dan kompetitor langsung '
        'ambil customer yang tidak kita balas.',
        body,
    ))

    s.append(Spacer(1, 6))
    s.append(Paragraph('Visi', h3))
    s.append(Paragraph(
        'Setiap UMKM Indonesia punya akses ke teknologi AI kelas enterprise — dengan harga UMKM.',
        body,
    ))
    s.append(Paragraph('Misi', h3))
    s.append(Paragraph(
        'Mengotomasi customer service WhatsApp untuk 10.000 UMKM Indonesia dalam 2 tahun, '
        'membantu mereka hemat 3-5 jam per hari dan meningkatkan closing rate 20-40%.',
        body,
    ))

    s.append(Spacer(1, 10))
    s.append(Paragraph('Kenapa Auto Balas?', h2))

    # Table 3 kolom: pakai konvensional, custom WhatsApp Cloud API, pakai Cloud API + AI
    comparison = [
        ['', 'Admin Manual', 'Bot Unofficial', 'Auto Balas'],
        ['Balas 24 jam', '❌', '✓', '✓'],
        ['Aman dari banned', '✓', '❌', '✓'],
        ['Pakai AI cerdas', '❌', '❌', '✓'],
        ['Biaya/bulan', 'Rp 2-5 juta', 'Rp 100-300rb', 'Rp 299-1499rb'],
        ['Setup waktu', '1-2 hari', '1-2 jam', '5 menit'],
    ]
    tbl = Table(comparison, colWidths=[40 * mm, 35 * mm, 35 * mm, 40 * mm])
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BRAND),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (0, 1), (0, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, GRAY_200),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, GRAY_50]),
        ('BACKGROUND', (3, 1), (3, -1), BG_HERO),
        ('TEXTCOLOR', (3, 1), (3, -1), BRAND_DARK),
        ('FONTNAME', (3, 1), (3, -1), 'Helvetica-Bold'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    s.append(tbl)
    s.append(Spacer(1, 8))

    s.append(PageBreak())

    # ===== HALAMAN 3: Masalah & Solusi =====
    s.append(Paragraph('Masalah yang Kami Selesaikan', h1))

    s.append(Paragraph(
        '<b>68% customer pindah ke kompetitor</b> karena chat WhatsApp lambat dibalas. '
        'Padahal 1 customer hilang = potensi penjualan ratusan ribu sampai jutaan rupiah.',
        body,
    ))

    s.append(Paragraph('Pain Point UMKM yang sering kami temukan:', h3))
    pains = [
        '<b>Owner kelelahan balas chat sendiri</b> — pegang HP saat makan, mandi, bahkan ibadah.',
        '<b>Pertanyaan berulang yang melelahkan</b> — "Buka sampai jam berapa?", "Berapa harganya?", "Bisa COD?" — diulang puluhan kali sehari.',
        '<b>Customer chat tengah malam</b> — pas owner tidur, customer akhirnya pindah ke kompetitor yang balas duluan.',
        '<b>Slow response = lost sale</b> — survei menunjukkan customer expect balasan dalam 5 menit, tapi rata-rata admin baru balas 30+ menit.',
        '<b>Admin tambahan mahal</b> — gaji admin 1 orang Rp 3-5 juta + BPJS + kursi & meja. Kalau admin sakit/resign, repot lagi.',
        '<b>Bot unofficial berisiko</b> — pakai WA bot bajakan = nomor di-banned WhatsApp, semua kontak hilang.',
    ]
    for p in pains:
        s.append(Paragraph(f'• {p}', bullet))
    s.append(Spacer(1, 6))

    s.append(Paragraph('Solusi Auto Balas', h2))
    s.append(Paragraph(
        'Kami menggabungkan <b>WhatsApp Cloud API resmi Meta</b> (aman, tidak ke-banned) '
        'dengan <b>AI Llama 3.3 70B</b> (cerdas, paham konteks Bahasa Indonesia) untuk memberikan '
        'pengalaman customer service profesional 24 jam tanpa lembur.',
        body,
    ))

    s.append(Spacer(1, 6))
    s.append(Paragraph('Cara Kerja (3 Langkah)', h3))
    steps = [
        ('1. Daftar & Setup (5 menit)', 'Buat workspace di autobalas.my.id, connect nomor WhatsApp via QR scan atau Meta Cloud API.'),
        ('2. Isi Knowledge Base', 'Upload jam buka, harga produk, FAQ, kebijakan refund, dll. AI akan jawab customer berdasarkan info ini.'),
        ('3. AI Mulai Balas', 'Customer chat → AI balas dengan personalisasi dalam <2 detik. Anda bisa pantau & ambil alih kapan saja dari Dashboard.'),
    ]
    for title, desc in steps:
        s.append(Paragraph(f'<b>{title}</b>', body))
        s.append(Paragraph(desc, body))

    s.append(PageBreak())

    # ===== HALAMAN 4: Fitur Unggulan =====
    s.append(Paragraph('Fitur Unggulan', h1))

    features = [
        ('AI Auto-Reply 24 Jam', 'Latih AI dengan FAQ bisnis Anda. AI menjawab pertanyaan customer dengan akurat dan ramah, kapanpun.'),
        ('Pakai WhatsApp Resmi Meta', 'Cloud API resmi dari Meta. Bukan bot unofficial. Nomor Anda aman, tetap bisa dipakai normal.'),
        ('Inbox Tim Multi-User', 'Semua chat di satu dashboard. Invite admin lain, kelola bersama, dengan kontrol role-based.'),
        ('Multi Workspace', 'Punya beberapa cabang/divisi? Kelola semua dalam satu akun, data tetap terpisah & aman.'),
        ('Knowledge Base Tak Terbatas', 'Upload info bisnis: jam buka, harga, alamat, FAQ. AI selalu jawab konsisten sesuai info Anda.'),
        ('Custom Persona AI', 'Atur gaya bahasa AI: santai, profesional, formal, atau khas bisnis Anda. Customer merasa di-handle manusia.'),
        ('Anti-Spam Otomatis', 'AI deteksi customer yang spam (pesan berulang) dan auto-ban biar tidak ganggu inbox utama.'),
        ('Audit & Log Lengkap', 'Semua chat tercatat, bisa diaudit kapan saja untuk kebutuhan internal/legal.'),
    ]

    feat_data = []
    for i in range(0, len(features), 2):
        row = []
        for j in range(2):
            if i + j < len(features):
                title, desc = features[i + j]
                cell = Paragraph(f'<b>{title}</b><br/><font size="9" color="#6B7280">{desc}</font>', body)
                row.append(cell)
            else:
                row.append('')
        feat_data.append(row)

    feat_tbl = Table(feat_data, colWidths=[80 * mm, 80 * mm])
    feat_tbl.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('BACKGROUND', (0, 0), (-1, -1), GRAY_50),
        ('GRID', (0, 0), (-1, -1), 1, white),
    ]))
    s.append(feat_tbl)

    s.append(Spacer(1, 10))
    s.append(Paragraph('Industri yang Sudah Memakai', h2))
    industries = '🏥 Klinik &nbsp;·&nbsp; 💇 Salon &nbsp;·&nbsp; 💈 Barbershop &nbsp;·&nbsp; 🚗 Dealer &nbsp;·&nbsp; ' \
                 '✈️ Travel &nbsp;·&nbsp; 🧺 Laundry &nbsp;·&nbsp; ☕ Cafe / Resto &nbsp;·&nbsp; 🛍️ Toko Online &nbsp;·&nbsp; ' \
                 '🏘️ Property &nbsp;·&nbsp; 🎓 Kursus &nbsp;·&nbsp; 🏋️ Gym &nbsp;·&nbsp; 💊 Apotek'
    s.append(Paragraph(industries, body))

    s.append(PageBreak())

    # ===== HALAMAN 5: Harga =====
    s.append(Paragraph('Pilihan Paket', h1))
    s.append(Paragraph(
        'Harga sederhana, hasil cepat. ROI biasanya 1-2 minggu — 1 customer yang tidak hilang sudah balik modal.',
        body,
    ))
    s.append(Spacer(1, 8))

    pricing = [
        ['', 'STARTER', 'PRO (Populer)', 'BUSINESS'],
        ['Cocok untuk', 'Solo / UMKM Kecil', 'Tim 2-5 orang', 'Multi-cabang / Scale-up'],
        ['Harga / bulan', 'Rp 299.000', 'Rp 599.000', 'Rp 1.499.000'],
        ['Workspace', '1', '2', '10'],
        ['Nomor WhatsApp', '1', '2', '5'],
        ['Chat AI / bulan', '1.000', '5.000', 'Unlimited'],
        ['Knowledge base', '10 entri', 'Unlimited', 'Unlimited'],
        ['Admin user', '1', '5', 'Unlimited'],
        ['Custom persona AI', '—', '✓', '✓'],
        ['Priority support', '—', 'WhatsApp', 'Dedicated'],
        ['Custom integration', '—', '—', '✓'],
    ]
    ptbl = Table(pricing, colWidths=[42 * mm, 38 * mm, 38 * mm, 38 * mm])
    ptbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), GRAY_900),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BACKGROUND', (2, 0), (2, 0), BRAND),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0, 1), (0, -1), GRAY_700),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (0, 1), (0, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, GRAY_200),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, GRAY_50]),
        ('BACKGROUND', (2, 1), (2, -1), BG_HERO),
        ('FONTNAME', (2, 2), (2, 2), 'Helvetica-Bold'),
        ('FONTSIZE', (2, 2), (2, 2), 11),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
    ]))
    s.append(ptbl)
    s.append(Spacer(1, 6))
    s.append(Paragraph(
        '<i>Semua paket include: Trial 14 hari gratis · Setup gratis · Tanpa kontrak · '
        'Cancel kapan saja · Pakai WhatsApp Cloud API resmi Meta</i>',
        caption,
    ))

    s.append(Spacer(1, 10))
    s.append(Paragraph('Cara Pembayaran', h3))
    s.append(Paragraph(
        'Transfer Bank BCA atau DANA. Konfirmasi pembayaran lewat WhatsApp ke +62 821-1552-5327, '
        'akun langsung aktif maksimal 1×24 jam. Tidak ada kontrak panjang.',
        body,
    ))

    s.append(Spacer(1, 10))
    s.append(Paragraph('Promo Early User', h3))
    promo_box = Table(
        [[Paragraph(
            '<b>🎁 BONUS untuk yang langganan minggu ini:</b><br/>'
            '• Setup & training gratis (nilai Rp 500rb)<br/>'
            '• Template knowledge base 30+ industri<br/>'
            '• Garansi uang kembali 7 hari<br/>'
            '• Lock-in harga selamanya — tidak akan naik selama berlangganan',
            body,
        )]],
        colWidths=[156 * mm],
    )
    promo_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), YELLOW_50),
        ('LEFTPADDING', (0, 0), (-1, -1), 14),
        ('RIGHTPADDING', (0, 0), (-1, -1), 14),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('BOX', (0, 0), (-1, -1), 1.5, HexColor('#F59E0B')),
    ]))
    s.append(promo_box)

    s.append(PageBreak())

    # ===== HALAMAN 6: Keamanan & Legalitas =====
    s.append(Paragraph('Keamanan & Legalitas', h1))
    s.append(Paragraph(
        'Kami serius soal keamanan data customer dan compliance terhadap regulasi Indonesia. '
        'Bisnis Anda di tangan yang benar.',
        body,
    ))

    trust = [
        ('🛡️ WhatsApp Cloud API Resmi Meta',
         'Kami pakai API resmi Meta — bukan bot unofficial yang berisiko nomor di-banned. '
         'Aman untuk operasional jangka panjang.'),
        ('🔒 Data Terenkripsi End-to-End',
         'Semua percakapan, knowledge base, dan kredensial dienkripsi at-rest (database) dan '
         'in-transit (TLS 1.3). Hanya Anda yang punya akses.'),
        ('📋 Compliant UU PDP RI No. 27/2022',
         'Mengikuti standar UU Perlindungan Data Pribadi Indonesia. Data customer milik Anda — '
         'kami hanya processor, bukan owner data.'),
        ('🏆 Lisensi Komersial Resmi',
         'Lisensi resmi untuk pemakaian komersial. Bisa dipakai untuk bisnis tanpa khawatir '
         'aspek legalitas.'),
        ('☁️ Infrastruktur Cloud Berkelas Dunia',
         'Hosting di Vercel (USA) untuk web, Neon Database (Singapore) untuk data, dan VPS '
         'Indonesia untuk WhatsApp gateway. Uptime SLA 99.9%.'),
        ('📊 Audit Log Lengkap',
         'Semua aktivitas tercatat (workspace, pembayaran, koneksi WhatsApp, chat) untuk '
         'kebutuhan audit internal/external Anda.'),
    ]
    for title, desc in trust:
        s.append(Paragraph(f'<b>{title}</b>', body))
        s.append(Paragraph(desc, body))
        s.append(Spacer(1, 4))

    s.append(PageBreak())

    # ===== HALAMAN 7: FAQ + Kontak =====
    s.append(Paragraph('Pertanyaan Umum', h1))

    faqs = [
        ('Apakah nomor WhatsApp saya akan ke-banned?',
         'Tidak. Kami pakai WhatsApp Cloud API resmi dari Meta — bukan bot unofficial. '
         'Nomor Anda aman, tetap bisa dipakai normal untuk chat pribadi maupun bisnis.'),
        ('Berapa lama setup-nya?',
         'Sekitar 5-15 menit. Anda perlu daftar Meta Business (gratis) dan dapat Phone Number ID '
         '+ Access Token, lalu paste ke dashboard kami. Untuk paket Pro & Business, kami bantu '
         'setup gratis sampai jalan.'),
        ('AI-nya bisa belajar bisnis saya?',
         'Ya. Anda tinggal isi knowledge base: jam buka, harga, menu, FAQ, kebijakan refund, '
         'dll. AI akan menjawab customer berdasarkan info yang Anda kasih — bukan mengarang.'),
        ('Kalau AI tidak bisa jawab, gimana?',
         'AI bisa diinstruksikan untuk forward ke admin manusia kalau tidak yakin. Anda dan '
         'tim juga bisa lihat semua chat di Inbox dashboard dan reply manual kapan saja.'),
        ('Bisa dipakai banyak nomor WhatsApp?',
         'Bisa. Paket Pro dapat 2 nomor, Business dapat 5 nomor. Cocok untuk yang punya '
         'beberapa cabang atau divisi terpisah.'),
        ('Bagaimana cara bayar?',
         'Transfer Bank BCA atau DANA. Konfirmasi pembayaran lewat WhatsApp, akun langsung aktif. '
         'Tidak ada kontrak panjang — bisa berhenti kapan saja.'),
        ('Kalau saya berhenti langganan, data saya gimana?',
         'Data tetap aman di akun Anda selama 30 hari. Kalau mau pakai lagi, tinggal bayar lagi, '
         'data dan setting kembali. Setelah 30 hari, data bisa kami hapus permanen sesuai request.'),
        ('Bisa custom integration?',
         'Paket Business support custom integration: webhook ke CRM Anda, integrasi marketplace '
         '(Tokopedia/Shopee/Lazada), API custom, dll. Hubungi kami untuk diskusi kebutuhan.'),
    ]
    for q, a in faqs:
        s.append(Paragraph(f'<b>{q}</b>', body))
        s.append(Paragraph(a, body))
        s.append(Spacer(1, 6))

    s.append(Spacer(1, 10))

    # CTA box
    cta_box = Table(
        [[Paragraph(
            '<b><font size="14" color="#10B981">Siap Otomasi Chat WhatsApp Anda?</font></b><br/><br/>'
            'Daftar trial 14 hari gratis sekarang. Tidak perlu kartu kredit. '
            'Bisa cancel kapan saja.<br/><br/>'
            '<b>Website:</b> autobalas.my.id<br/>'
            '<b>WhatsApp:</b> +62 821-1552-5327<br/>'
            '<b>Email:</b> edi.prasetiyo1994@gmail.com<br/><br/>'
            '<i>Atau scan QR code di halaman terakhir untuk langsung daftar.</i>',
            body,
        )]],
        colWidths=[160 * mm],
    )
    cta_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BG_HERO),
        ('LEFTPADDING', (0, 0), (-1, -1), 20),
        ('RIGHTPADDING', (0, 0), (-1, -1), 20),
        ('TOPPADDING', (0, 0), (-1, -1), 20),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 20),
        ('BOX', (0, 0), (-1, -1), 2, BRAND),
    ]))
    s.append(cta_box)

    s.append(PageBreak())

    # ===== HALAMAN 8: About Founder =====
    s.append(Paragraph('Tentang Pendiri', h1))
    s.append(Paragraph(
        '<b>Edi Prasetiyo</b> — Software Engineer & Founder Auto Balas.',
        body,
    ))
    s.append(Paragraph(
        'Berpengalaman membangun aplikasi web dan mobile untuk UMKM dan korporasi di Indonesia. '
        'Mempunyai pengalaman langsung membantu pemilik UMKM mengotomasi proses bisnis mereka — '
        'dari sistem pembayaran iuran, sistem inventory, hingga otomasi customer service.',
        body,
    ))
    s.append(Paragraph(
        'Auto Balas lahir dari kebutuhan langsung yang dilihat di lapangan: pemilik UMKM '
        'kelelahan balas chat customer sendiri, kehilangan penjualan karena slow response, dan '
        'tidak punya budget untuk hire admin tambahan. Dengan AI yang sudah tersedia (Llama 3.3, '
        'Groq, dll), solusi ini menjadi affordable & dalam jangkauan UMKM.',
        body,
    ))

    s.append(Spacer(1, 8))
    s.append(Paragraph('Kontak Langsung', h3))
    s.append(Paragraph('WhatsApp: <b>+62 821-1552-5327</b>', body))
    s.append(Paragraph('Email: <b>edi.prasetiyo1994@gmail.com</b>', body))
    s.append(Paragraph('Website: <b>autobalas.my.id</b>', body))

    s.append(Spacer(1, 14))
    s.append(Paragraph('Komitmen Kami', h2))
    commitments = [
        '<b>Response cepat</b> — pertanyaan dijawab dalam <2 jam (Senin-Sabtu, 08:00-22:00 WIB)',
        '<b>Update rutin</b> — fitur baru tiap bulan, tidak ada biaya tambahan',
        '<b>Tidak ada hidden cost</b> — harga di awal = harga seterusnya, tidak ada upselling paksa',
        '<b>Data milik Anda</b> — bisa export kapan saja, bisa minta dihapus permanen',
        '<b>Indonesia-first</b> — dibuat untuk UMKM lokal, support Bahasa Indonesia, paham budaya bisnis lokal',
    ]
    for c in commitments:
        s.append(Paragraph(f'• {c}', bullet))

    s.append(Spacer(1, 20))
    s.append(Paragraph(
        '<i>"Saya percaya teknologi AI seharusnya bukan privilege perusahaan besar. '
        'Setiap UMKM Indonesia berhak punya admin AI yang bekerja 24 jam — '
        'dengan harga yang masih masuk akal."</i>',
        quote,
    ))
    s.append(Paragraph('— Edi Prasetiyo, Founder Auto Balas', caption))

    return s


# === Build PDF ===
class CoverDocTemplate(SimpleDocTemplate):
    """Template dengan cover page custom, rest pakai header/footer biasa."""

    def handle_pageBegin(self):
        self._handle_pageBegin()
        if self.page == 1:
            # Override cover - draw langsung
            pass


def build():
    doc = SimpleDocTemplate(
        OUTPUT,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=22 * mm,
        title='Auto Balas — Company Profile 2026',
        author='Edi Prasetiyo',
        subject='AI WhatsApp Admin untuk UMKM Indonesia',
    )

    story = make_story()

    def first_page(canvas_obj, doc):
        cover_page(canvas_obj, doc)

    def later_pages(canvas_obj, doc):
        page_header_footer(canvas_obj, doc)

    doc.build(story, onFirstPage=first_page, onLaterPages=later_pages)
    print(f'Generated: {OUTPUT}')


if __name__ == '__main__':
    build()
