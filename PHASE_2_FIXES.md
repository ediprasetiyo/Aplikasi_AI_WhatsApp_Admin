# Phase 2 Setup Steps

## 1. Apply DB changes ke Neon (jalankan SQL ini di Neon SQL Editor)

```sql
-- Set customerJid untuk data lama (semua dari LID system)
UPDATE conversation
SET "customerJid" = "customerPhone" || '@lid'
WHERE "customerJid" IS NULL;
```

## 2. Migrasi schema baru ke Neon

Di laptop:
```bash
DATABASE_URL="postgresql://neondb_owner:npg_UobVF5aucnS7@ep-young-union-aojuxs98.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" npx prisma db push --schema=packages/db/prisma/schema.prisma --accept-data-loss
```

## 3. Deploy worker ke VPS

```bash
ssh -i /d/ssh-keys/autobalas-key.pem ediprasetiyo@103.127.138.41
cd /opt/autobalas
git pull
npm run build -w @wa-admin/db
npm run build -w @wa-admin/worker
pm2 restart autobalas-worker
pm2 logs autobalas-worker --lines 10 --nostream
```
