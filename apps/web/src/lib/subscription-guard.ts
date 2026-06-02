import { redirect } from 'next/navigation';
import { getActiveOrgId } from '@/lib/session';
import { getSubscriptionInfo } from '@/lib/subscription';

/**
 * Guard server-side untuk page yang butuh subscription aktif.
 * Kalau locked, redirect ke /dashboard/billing dengan pesan.
 * Pakai di awal page function: `await requireActiveSubscription();`
 */
export async function requireActiveSubscription() {
  const orgId = await getActiveOrgId();
  if (!orgId) return;
  const sub = await getSubscriptionInfo(orgId);
  if (sub.isLocked) {
    redirect('/dashboard/billing?reason=expired');
  }
}
