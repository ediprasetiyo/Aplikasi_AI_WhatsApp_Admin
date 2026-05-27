# Deploy Worker Baileys ke VPS (Biznet Gio)

Panduan setup Baileys worker di VPS Linux. Total waktu: ~30-45 menit.

## Prasyarat

- VPS Biznet Gio (atau lainnya) — minimum 1 vCPU, 1GB RAM, Ubuntu 22.04/24.04
- Domain atau subdomain (untuk HTTPS) — bisa subdomain dari domain `.my.id` Anda
- Akses SSH ke VPS

## Step 1: Beli VPS Biznet Gio

1. Login ke https://portal.biznetgio.com
2. **NEO Lite** (paling murah ~Rp 65rb/bulan) — pilih:
   - **OS**: Ubuntu 24.04 LTS
   - **Region**: Jakarta
   - **vCPU**: 1, RAM 1GB, SSD 20GB
3. Setelah aktif, catat: **IP Public, username (root), password**

## Step 2: Setup DNS

1. Beli/pakai domain Anda (mis. `wa-ai-admin.my.id`)
2. Tambah A record:
   - Host: `worker` (jadi `worker.wa-ai-admin.my.id`)
   - Value: IP VPS Anda
   - TTL: 300
3. Tunggu propagasi ~5-15 menit. Test:
   ```bash
   ping worker.wa-ai-admin.my.id
   ```
   Harus reply dari IP VPS.

## Step 3: SSH ke VPS & Setup Awal

Dari laptop:

```bash
ssh root@<IP_VPS>
# password yang dikirim Biznet
```

Setelah masuk:

```bash
# Update sistem
apt update && apt upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs git build-essential

# Verify
node --version  # harus v20.x
npm --version

# Install PM2 (process manager — biar worker auto-restart)
npm install -g pm2

# Install Caddy (auto-HTTPS reverse proxy)
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install -y caddy

# Firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

## Step 4: Clone Repo & Build Worker

```bash
cd /opt
git clone https://github.com/ediprasetiyo/Aplikasi_AI_WhatsApp_Admin.git autobalas
cd autobalas

# Install deps (semua workspace)
npm install --legacy-peer-deps

# Build worker
npm run build -w @wa-admin/worker
```

## Step 5: Buat .env untuk Worker

```bash
nano apps/worker/.env
```

Isi:

```
PORT=4000
NODE_ENV=production
LOG_LEVEL=info
WORKER_ID=worker-jakarta-1

DATABASE_URL=postgresql://neondb_owner:npg_xxxx@ep-young-union-aojuxs98.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Generate random 32+ char (sama dengan yang dipasang di Vercel)
WORKER_AUTH_SECRET=ganti-jadi-random-32-char-secret

WEB_ORIGIN=https://autobalas.vercel.app
WEB_URL=https://autobalas.vercel.app
INTERNAL_WEBHOOK_SECRET=ganti-jadi-secret-lain-32-char
```

Save: `Ctrl+O` → Enter → `Ctrl+X`

## Step 6: Generate Prisma Client di VPS

```bash
cd /opt/autobalas
npm run db:generate
```

## Step 7: Start Worker dengan PM2

```bash
cd /opt/autobalas/apps/worker
pm2 start dist/main.js --name autobalas-worker --time
pm2 save
pm2 startup  # ikuti instruksi yang muncul (biasanya 1 command yang harus di-copy-paste)
```

Test:
```bash
curl http://localhost:4000/health
# harus respond: {"status":"ok","sessions":0,...}
```

## Step 8: Setup Caddy (Auto HTTPS)

```bash
nano /etc/caddy/Caddyfile
```

Ganti isi jadi:

```
worker.wa-ai-admin.my.id {
    reverse_proxy localhost:4000
}
```

(Ganti domain dengan domain Anda)

Restart Caddy:
```bash
systemctl restart caddy
systemctl status caddy  # harus "active (running)"
```

Caddy akan otomatis dapat SSL dari Let's Encrypt dalam ~30 detik.

Test:
```bash
curl https://worker.wa-ai-admin.my.id/health
# harus respond JSON
```

## Step 9: Update Env Vercel

Tambah 3 env baru di Vercel project `autobalas`:

| Key | Value |
|---|---|
| `WORKER_URL` | `https://worker.wa-ai-admin.my.id` |
| `WORKER_AUTH_SECRET` | (sama persis dengan yang di .env worker) |
| `INTERNAL_WEBHOOK_SECRET` | (sama persis dengan yang di .env worker) |

Lalu **Redeploy** project Vercel.

## Step 10: Test End-to-End

1. Buka https://autobalas.vercel.app/dashboard/whatsapp
2. Tab **"Scan QR (Cepat)"** → klik **Generate QR Code**
3. QR muncul — scan dari WhatsApp di HP Anda:
   - Menu → Perangkat tertaut → Tautkan perangkat
4. Setelah scan, status berubah jadi **Connected** dengan nomor Anda
5. Test: minta teman/HP lain kirim WA ke nomor Anda → cek **Inbox** di dashboard

## Update Worker (saat ada perubahan code)

```bash
cd /opt/autobalas
git pull
npm install --legacy-peer-deps
npm run build -w @wa-admin/worker
pm2 restart autobalas-worker
```

## Troubleshooting

| Masalah | Cek |
|---|---|
| Worker tidak respond | `pm2 logs autobalas-worker` |
| Caddy 502 | `systemctl status caddy` & cek port 4000 jalan |
| QR tidak muncul | Cek WORKER_URL di Vercel, harus HTTPS dengan SSL valid |
| Auth gagal | WORKER_AUTH_SECRET di Vercel & VPS harus PERSIS SAMA |
| Memori penuh | `pm2 monit` — kalau heap > 500MB, restart: `pm2 restart all` |
