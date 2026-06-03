'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

/**
 * Watcher di sidebar — bandingkan jumlah unread sekarang vs render sebelumnya.
 * Kalau bertambah (= ada chat baru masuk), play beep + toast notif.
 * Diam saat tab tidak visible (biar tidak mengganggu kalau user sedang lihat tab lain
 * — tetapi browser tab title bisa kasih notif visual via document.title).
 *
 * Audio pakai Web Audio API generate tone, tidak butuh file asset.
 */
export function NewMessageNotifier({
  unreadCount,
  soundEnabled,
}: {
  unreadCount: number;
  soundEnabled: boolean;
}) {
  // Track count sebelumnya — useRef supaya re-render tidak reset
  const prevCount = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Minta permission desktop notification sekali saat mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      // Tidak push langsung — tunggu first interaction biar tidak intrusive
      const askOnce = () => {
        Notification.requestPermission().catch(() => {});
        window.removeEventListener('click', askOnce);
      };
      window.addEventListener('click', askOnce, { once: true });
      return () => window.removeEventListener('click', askOnce);
    }
  }, []);

  useEffect(() => {
    // Mount pertama: simpan saja, jangan trigger notif
    if (prevCount.current === null) {
      prevCount.current = unreadCount;
      return;
    }

    if (unreadCount > prevCount.current) {
      const delta = unreadCount - prevCount.current;

      // Visual: toast + ubah title tab biar terlihat walau di tab lain
      toast.info(`${delta} pesan baru masuk`, {
        description: 'Cek menu Inbox untuk balas.',
        duration: 5000,
      });
      const originalTitle = document.title;
      document.title = `(${unreadCount}) Auto Balas — pesan baru!`;
      const resetTitle = () => {
        if (document.visibilityState === 'visible') {
          document.title = originalTitle;
          document.removeEventListener('visibilitychange', resetTitle);
        }
      };
      document.addEventListener('visibilitychange', resetTitle);

      // Desktop notification (muncul walau tab di-minimize)
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted' &&
        document.visibilityState !== 'visible'
      ) {
        try {
          const n = new Notification('Auto Balas — pesan baru', {
            body: `${delta} chat baru menunggu. Klik untuk buka Inbox.`,
            icon: '/favicon.ico',
            tag: 'autobalas-new-chat', // dedup — kalau ada beberapa, tidak menumpuk
          });
          n.onclick = () => {
            window.focus();
            window.location.href = '/dashboard/inbox';
            n.close();
          };
        } catch (e) {
          console.debug('notif blocked:', e);
        }
      }

      // Audio: beep dua nada cepat (whatsapp-like)
      if (soundEnabled) {
        try {
          if (!audioCtxRef.current) {
            const AC =
              window.AudioContext ??
              (window as unknown as { webkitAudioContext: typeof AudioContext })
                .webkitAudioContext;
            audioCtxRef.current = new AC();
          }
          const ctx = audioCtxRef.current;
          // Tone 1
          playTone(ctx, 880, 0.08, 0);
          // Tone 2 (lebih tinggi)
          playTone(ctx, 1320, 0.12, 0.1);
        } catch (e) {
          // Browser block autoplay — abaikan, user belum interact
          console.debug('audio blocked:', e);
        }
      }
    }

    prevCount.current = unreadCount;
  }, [unreadCount, soundEnabled]);

  return null;
}

function playTone(ctx: AudioContext, freq: number, duration: number, delaySec: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  const startTime = ctx.currentTime + delaySec;
  osc.frequency.value = freq;
  osc.type = 'sine';

  // Envelope: fade in cepat, hold, fade out — supaya tidak ada "klik" di awal/akhir
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.15, startTime + 0.01);
  gain.gain.setValueAtTime(0.15, startTime + duration - 0.02);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);

  osc.start(startTime);
  osc.stop(startTime + duration);
}
