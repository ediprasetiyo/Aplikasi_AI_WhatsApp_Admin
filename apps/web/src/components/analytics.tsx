import Script from 'next/script';

/**
 * Google Analytics 4 + Meta Pixel injection.
 * Hanya muncul kalau env var-nya ada di Vercel — kalau tidak, no-op.
 *
 * Set di Vercel → Settings → Environment Variables:
 *   - NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX (dari Google Analytics)
 *   - NEXT_PUBLIC_META_PIXEL_ID=XXXXXXXXXX (dari Facebook Business)
 *
 * Trigger redeploy setelah set env.
 */
export function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <>
      {/* Google Analytics 4 */}
      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}', {
                page_path: window.location.pathname,
              });
            `}
          </Script>
        </>
      )}

      {/* Meta Pixel (Facebook/Instagram ads tracking) */}
      {pixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window,document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  );
}

/**
 * Helper untuk track custom events dari client component.
 * Pakai di tombol penting (Daftar, Demo, Hubungi).
 *
 * Contoh:
 *   <button onClick={() => trackEvent('click_register_hero')}>
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number>,
) {
  if (typeof window === 'undefined') return;
  // GA4
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (gtag) {
    gtag('event', eventName, params);
  }
  // Meta Pixel
  const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
  if (fbq) {
    fbq('trackCustom', eventName, params);
  }
}
