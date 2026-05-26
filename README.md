# AI WhatsApp Admin

SaaS auto-reply WhatsApp untuk UMKM — bantu owner kurangi beban admin & jangan sampai customer hilang gara-gara chat lambat dibalas.

## Stack

- **Monorepo**: Turborepo + pnpm
- **Web**: Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui
- **API**: NestJS + TypeScript
- **DB**: PostgreSQL + Prisma (multi-tenant)
- **Queue**: Redis + BullMQ
- **Auth**: Better-Auth (multi-tenant: User ↔ Organization ↔ Membership)
- **AI**: Groq (Llama 3.3 70B — free tier)
- **WhatsApp**: WhatsApp Cloud API (Meta resmi)

## Prasyarat

- Node.js >= 20
- pnpm >= 9 (`npm install -g pnpm` atau `corepack enable`)
- Docker (untuk Postgres + Redis lokal)

## Setup awal

```bash
# 1. Install deps
pnpm install

# 2. Copy env
cp .env.example .env

# 3. Start Postgres + Redis
pnpm docker:up

# 4. Generate Prisma client + migrate DB
pnpm db:generate
pnpm db:migrate

# 5. Jalankan semua (web + api) paralel
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:3001
- Prisma Studio: `pnpm db:studio`

## Struktur

```
apps/
  web/          # Next.js 15 dashboard + landing
  api/          # NestJS backend (WA webhook, AI, queue)
packages/
  db/           # Prisma schema + client
  shared/       # Shared types & utilities
```

## Roadmap

- [x] Multi-tenant auth + onboarding (MVP fase 1)
- [x] Connect WhatsApp Cloud API per tenant ([panduan setup](docs/setup-whatsapp.md))
- [ ] AI auto-reply dengan knowledge base
- [ ] Inbox + customer list + tag
- [ ] Billing (Midtrans)

## Setup WhatsApp

Lihat [docs/setup-whatsapp.md](docs/setup-whatsapp.md) — panduan langkah demi langkah:
buat Meta App, dapatkan Phone Number ID + Access Token, setup webhook dengan ngrok.
