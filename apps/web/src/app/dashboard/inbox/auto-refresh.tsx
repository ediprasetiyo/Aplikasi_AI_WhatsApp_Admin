'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Drop di halaman server component yang butuh polling auto-refresh.
 * Pakai router.refresh() yang lebih efisien dari full reload (Next.js cuma
 * re-fetch server data, tidak reload semua JS).
 */
export function AutoRefresh({ intervalMs = 5000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    let active = true;
    const tick = () => {
      if (!active) return;
      // Cuma refresh kalau tab aktif & visible
      if (document.visibilityState === 'visible') {
        router.refresh();
      }
    };
    const interval = setInterval(tick, intervalMs);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [router, intervalMs]);

  return null;
}
