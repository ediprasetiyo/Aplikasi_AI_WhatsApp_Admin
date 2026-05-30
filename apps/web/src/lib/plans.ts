/**
 * Definisi paket berlangganan. Ubah sini = semua limit ter-update.
 */
export const PLANS = {
  trial: {
    name: 'Trial',
    tagline: 'Coba semua fitur 14 hari',
    priceIdr: 0,
    maxWorkspaces: 1,
    maxWhatsappAccounts: 1,
    maxKnowledgeEntries: 50,
    maxMessagesPerMonth: 1000,
    features: ['Semua fitur Pro selama 14 hari', 'Tanpa kartu kredit'],
  },
  starter: {
    name: 'Starter',
    tagline: 'Solo / UMKM Kecil',
    priceIdr: 299_000,
    maxWorkspaces: 1,
    maxWhatsappAccounts: 1,
    maxKnowledgeEntries: 10,
    maxMessagesPerMonth: 1000,
    features: [
      '1 workspace',
      '1 nomor WhatsApp',
      '1.000 chat AI/bulan',
      '10 entri knowledge base',
      '1 admin user',
      'Email support',
    ],
  },
  pro: {
    name: 'Pro',
    tagline: 'Tim 2-5 orang',
    priceIdr: 599_000,
    maxWorkspaces: 2,
    maxWhatsappAccounts: 2,
    maxKnowledgeEntries: -1,
    maxMessagesPerMonth: 5000,
    features: [
      '2 workspace',
      '2 nomor WhatsApp',
      '5.000 chat AI/bulan',
      'Unlimited knowledge base',
      '5 admin user',
      'Custom persona AI',
      'WhatsApp support',
    ],
  },
  business: {
    name: 'Business',
    tagline: 'Multi-cabang / scale-up',
    priceIdr: 1_499_000,
    maxWorkspaces: 10,
    maxWhatsappAccounts: 5,
    maxKnowledgeEntries: -1,
    maxMessagesPerMonth: -1,
    features: [
      '10 workspace',
      '5 nomor WhatsApp',
      'Unlimited chat AI',
      'Unlimited knowledge base',
      'Unlimited admin user',
      'Priority support',
      'Custom integration',
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getPlan(key: string | null | undefined) {
  if (key && key in PLANS) return PLANS[key as PlanKey];
  return PLANS.trial;
}

/**
 * Hitung berapa workspace user sudah punya (count membership), lalu compare
 * dengan max dari plan tertinggi yang dimiliki user di salah satu org-nya.
 */
export function isUnlimited(value: number): boolean {
  return value === -1;
}
