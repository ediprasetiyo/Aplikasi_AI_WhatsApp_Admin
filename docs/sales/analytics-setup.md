# Setup Google Analytics 4 + Meta Pixel

## Kenapa ini penting

Tanpa analytics, Anda **buta**. Tidak tahu:
- Dari mana visitor datang (IG, FB, organic search?)
- Berapa % visitor klik "Daftar"?
- Apakah video di Reels efektif?
- Kalau iklan, apakah CPL (cost per lead) masuk akal?

Dengan analytics, Anda bisa data-driven decision: double down ke channel yang berhasil, stop yang boros.

---

## 1. Setup Google Analytics 4 (gratis, 10 menit)

### Step 1: Buat akun GA
1. Buka https://analytics.google.com/
2. Login Google → klik **"Start measuring"**
3. **Account name**: "Auto Balas"
4. **Property name**: "autobalas.my.id"
5. **Reporting time zone**: Indonesia (Jakarta)
6. **Currency**: IDR (Rupiah)
7. **Industry**: Technology
8. **Business size**: Small (1-10 employees)
9. Klik **Create**

### Step 2: Setup data stream
1. Pilih **Web**
2. **Website URL**: `https://autobalas.my.id`
3. **Stream name**: "Auto Balas Web"
4. Klik **Create stream**
5. **Copy MEASUREMENT ID** — format `G-XXXXXXXXXX`

### Step 3: Pasang di Vercel
1. Buka https://vercel.com → project autobalas
2. **Settings** → **Environment Variables**
3. Klik **Add New**:
   - **Name**: `NEXT_PUBLIC_GA_ID`
   - **Value**: `G-XXXXXXXXXX` (paste dari step 2)
   - **Environment**: Production + Preview + Development (semua)
4. Klik **Save**
5. **Deployments** → klik deployment terbaru → ⋯ → **Redeploy**

### Step 4: Verify
1. Buka autobalas.my.id di browser
2. Kembali ke Google Analytics → **Reports → Realtime**
3. Harusnya muncul 1 user aktif (= Anda). Kalau ada = sukses ✓

---

## 2. Setup Meta Pixel (untuk track FB/IG ads & retargeting)

### Step 1: Buat Meta Business Account
1. Buka https://business.facebook.com/
2. Klik **Create account**
3. Isi nama bisnis "Auto Balas"
4. Email & negara Indonesia

### Step 2: Buat Pixel
1. **Events Manager** → **Connect data sources** → **Web**
2. Pilih **Meta Pixel** → **Connect**
3. **Pixel name**: "Auto Balas Pixel"
4. **Website URL**: `https://autobalas.my.id`
5. Klik **Continue**
6. **COPY PIXEL ID** — format `XXXXXXXXXX` (10-15 digit)

### Step 3: Pasang di Vercel (sama seperti GA)
1. Vercel → Settings → Environment Variables
2. **Add New**:
   - **Name**: `NEXT_PUBLIC_META_PIXEL_ID`
   - **Value**: `XXXXXXXXXX`
   - **Environment**: Production + Preview + Development
3. **Save** → Redeploy

### Step 4: Verify
1. Install **Meta Pixel Helper** Chrome extension
2. Buka autobalas.my.id
3. Klik icon Meta Pixel Helper di toolbar → harusnya tampil "Pixel found ✓"

---

## 3. Set Goals / Conversions di GA4

Setelah pixel jalan, tentukan **kejadian apa yang dianggap berhasil**:

### Custom events yang sudah disiapkan di kode:

Pakai `trackEvent('nama_event')` dari `@/components/analytics`:

```tsx
import { trackEvent } from '@/components/analytics';

<button onClick={() => trackEvent('click_register_hero')}>
  Daftar 14 Hari Gratis
</button>
```

### Event paling penting di-track:

| Event Name | Tempat | Arti |
|-----------|--------|------|
| `click_register_hero` | Tombol "Daftar" di hero | Lead intent tinggi |
| `click_demo` | Tombol "Lihat AI Balas" | Curious visitor |
| `click_business_wa` | Tombol "Hubungi Kami" Business | Enterprise lead |
| `click_pricing_starter` | Tombol pricing Starter | Considering paid |
| `click_pricing_pro` | Tombol pricing Pro | Considering paid |
| `submit_register_form` | Form daftar submit | Lead acquired |
| `complete_onboarding` | Setelah workspace dibuat | Activated user |
| `submit_payment` | Submit pembayaran | Pre-customer |
| `payment_approved` | Admin approve payment | **PAID CUSTOMER 🎉** |

### Cara setup di GA4:
1. **Admin → Events** → klik event yang sudah masuk
2. Toggle **Mark as conversion**
3. Setelah jadi conversion, bisa lihat di **Reports → Conversions**

---

## 4. Setup UTM parameters untuk tracking source

Setiap kali share link, **selalu pakai UTM** biar tahu darimana traffic-nya:

```
# Dari Instagram bio
https://autobalas.my.id?utm_source=instagram&utm_medium=bio&utm_campaign=launch

# Dari TikTok bio
https://autobalas.my.id?utm_source=tiktok&utm_medium=bio&utm_campaign=launch

# Dari WhatsApp Status
https://autobalas.my.id?utm_source=whatsapp&utm_medium=status&utm_campaign=launch

# Dari outreach personal
https://autobalas.my.id?utm_source=whatsapp&utm_medium=personal_outreach&utm_campaign=cold

# Dari iklan IG
https://autobalas.my.id?utm_source=instagram&utm_medium=paid_ads&utm_campaign=jakarta_klinik
```

Pakai **UTM Builder** Google: https://ga-dev-tools.google/campaign-url-builder/

Setelah 1 minggu, di GA4 lihat **Acquisition → Traffic acquisition** — bisa langsung tahu channel mana yang convert paling baik.

---

## 5. Dashboard sederhana yang harus dipantau

Minimal cek **3 metric** seminggu sekali:

| Metric | Target Bulan 1 | Where to find |
|--------|----------------|---------------|
| **Visitor unik** | 200-500 | Realtime + Reports → Acquisition |
| **Conversion rate** (visitor → register) | 3-5% | Reports → Engagement → Events |
| **Source terbaik** | Identifikasi 1 | Acquisition → Traffic acquisition |

**Bulan 2 onwards:**
- Cost per Lead (CPL) kalau pakai iklan
- Lifetime value (LTV) customer pertama
- Churn rate (% customer yang stop bayar)

---

## 6. Setup tambahan (optional tapi powerful)

### Microsoft Clarity (gratis) — record session visitor
Anda bisa lihat **rekaman aktual** visitor mouse-nya gerak kemana, scroll sampai mana, klik apa.

1. https://clarity.microsoft.com/ → Sign up
2. **Add new project** → Auto Balas → autobalas.my.id
3. Copy tracking code → tambah ke `Analytics` component sama seperti GA
4. Setelah 1-2 hari ada data, **lihat rekaman 5-10 session** — Anda akan kaget melihat di mana visitor stuck/bingung

### Cloudflare Web Analytics (gratis, privacy-friendly)
Alternatif GA4 yang lebih ringan & tidak butuh cookie consent.

---

## Action Now

**Yang harus Anda lakukan hari ini (10 menit):**

1. ✅ Login Google Analytics → buat property Auto Balas
2. ✅ Copy `G-XXXXX` ID
3. ✅ Pasang di Vercel Environment Variables
4. ✅ Redeploy
5. ✅ Verify di Realtime Reports

**Setelah analytics jalan**, Anda bisa data-driven:
- Post Reels minggu ini → lihat berapa visitor dari Instagram
- Kirim 30 outreach WA → lihat berapa yang akhirnya daftar
- Boost iklan FB Rp 100rb/hari → hitung CPL real

Tanpa analytics = nembak dalam gelap. Dengan analytics = nembak dengan scope.
