/**
 * Definisi paket berlangganan. Ubah sini = semua limit ter-update.
 */
export const PLANS = {
  trial: {
    name: 'Trial',
    priceIdr: 0,
    maxWorkspaces: 1,
    maxWhatsappAccounts: 1,
    maxKnowledgeEntries: 50,
    maxMessagesPerMonth: 1000,
  },
  starter: {
    name: 'Starter',
    priceIdr: 299_000,
    maxWorkspaces: 1,
    maxWhatsappAccounts: 1,
    maxKnowledgeEntries: 10,
    maxMessagesPerMonth: 1000,
  },
  pro: {
    name: 'Pro',
    priceIdr: 599_000,
    maxWorkspaces: 1,
    maxWhatsappAccounts: 2,
    maxKnowledgeEntries: -1, // unlimited
    maxMessagesPerMonth: 5000,
  },
  business: {
    name: 'Business',
    priceIdr: 1_499_000,
    maxWorkspaces: 10,
    maxWhatsappAccounts: 5,
    maxKnowledgeEntries: -1,
    maxMessagesPerMonth: -1, // unlimited
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
