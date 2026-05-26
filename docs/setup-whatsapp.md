# Setup WhatsApp Cloud API

Panduan lengkap untuk menghubungkan nomor WhatsApp Business ke aplikasi via Meta Cloud API (resmi, tidak akan ke-banned).

## 1. Buat Meta App

1. Buka https://developers.facebook.com/apps → **Create App**
2. Pilih **Business** type → klik **Next**
3. Isi nama app (contoh: "WA Admin AI Dev") & email → **Create App**

## 2. Tambah Produk WhatsApp

1. Di dashboard app, scroll ke **Add products to your app**
2. Cari **WhatsApp** → klik **Set up**
3. Pilih atau buat **Business Portfolio** (Meta Business Account)
4. Anda akan diarahkan ke **API Setup** page

## 3. Ambil Kredensial

Di halaman **WhatsApp → API Setup**:

- **Temporary Access Token** (24 jam, untuk test): tombol di atas
- **Phone Number ID**: di section "From"
- **WhatsApp Business Account ID** (WABA): di paling atas

**Untuk production / pakai jangka panjang**, buat **System User Token** (permanent):
1. https://business.facebook.com → Settings → Users → System Users
2. Create System User → kasih role Admin
3. Add Assets → pilih WhatsApp App Anda
4. Generate Token → pilih scope: `whatsapp_business_messaging`, `whatsapp_business_management`
5. **Set expiration: Never** → Generate Token → **copy & simpan** (tidak bisa dilihat lagi!)

## 4. Daftarkan Test Number (Gratis)

Di **API Setup** ada test number gratis dari Meta:
- Bisa kirim ke **5 nomor recipient yang sudah didaftarkan**
- Cukup untuk dev & demo ke client

Tambah recipient di section "To" → klik "Manage phone number list" → masukkan nomor HP Anda → verifikasi via OTP.

## 5. Setup Webhook

1. Di app dashboard → **WhatsApp** → **Configuration**
2. **Webhook section** → klik **Edit**
3. Isi:
   - **Callback URL**: `https://your-ngrok-url.ngrok.io/api/whatsapp/webhook`
   - **Verify token**: nilai dari `WHATSAPP_VERIFY_TOKEN` di `.env` Anda (default contoh: `your-webhook-verify-token`)
4. Klik **Verify and save** → Meta akan ping GET ke server Anda, harus return 200

5. Setelah verified, klik **Manage** di webhook fields → subscribe ke:
   - ✅ `messages` (wajib — pesan masuk)
   - ✅ `message_template_status_update` (opsional)

## 6. Expose Localhost dengan ngrok (untuk dev)

```bash
# Install ngrok (download di https://ngrok.com/download)
# atau via choco/scoop di Windows

# Authenticate dengan token Anda (dapat di dashboard ngrok)
ngrok config add-authtoken <YOUR_NGROK_TOKEN>

# Expose port API (3001) — bukan port web (3000)
ngrok http 3001
```

Output ngrok contoh:
```
Forwarding   https://abc12345.ngrok-free.app -> http://localhost:3001
```

Pakai URL `https://abc12345.ngrok-free.app/api/whatsapp/webhook` di field Callback URL Meta.

## 7. Connect di Dashboard Aplikasi

1. Login ke http://localhost:3000
2. Sidebar → **WhatsApp**
3. Tempel **Phone Number ID** & **Access Token** dari step 3
4. Klik **Hubungkan Nomor**
5. Kalau sukses, status `active` muncul

## 8. Test Pesan Masuk

1. Dari HP Anda (nomor yang sudah didaftarkan di test recipient), kirim WA ke test number Meta
2. Cek terminal `apps/api` — log akan muncul: `[Whatsapp] Inbound from 628xxxx: <pesan>`
3. Cek database (Prisma Studio: `pnpm db:studio`) → tabel `conversation` & `message` akan ada datanya

## Troubleshooting

| Masalah | Solusi |
|---|---|
| Verify webhook gagal | Cek `WHATSAPP_VERIFY_TOKEN` di `.env` sama persis dengan yang diisi di Meta. Restart API setelah ubah `.env`. |
| 403 invalid signature | `WHATSAPP_APP_SECRET` salah, atau **kosongkan dulu** untuk skip signature check selama dev |
| "Phone number not registered" | Nomor recipient belum diverifikasi di Meta test recipients |
| Token expired | Temporary token cuma 24 jam — pakai System User token untuk permanen |
| ngrok URL berubah tiap restart | Pakai paid plan untuk static domain, atau update Webhook URL tiap restart |
