import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

const PROTECTED_DASHBOARD = ['/dashboard', '/onboarding'];

// Host yang dianggap "admin subdomain" — semua request rewrite ke /admin
const ADMIN_HOSTS = ['admin.autobalas.my.id', 'admin.localhost:3000'];

// Path yang TIDAK perlu rewrite di admin host (login, api, static).
// Login & register dilakukan di main domain karena session cookie shared.
const ADMIN_PASSTHROUGH = ['/login', '/register', '/api', '/_next', '/favicon.ico'];

export function middleware(req: NextRequest) {
  const host = (req.headers.get('host') ?? '').toLowerCase();
  const { pathname, search } = req.nextUrl;
  const isAdminHost = ADMIN_HOSTS.some(
    (h) => host === h || host.startsWith(`${h.split(':')[0]}:`),
  );

  // === Admin subdomain handling ===
  if (isAdminHost) {
    // Pass-through untuk login/register/api/static — biar tidak infinite redirect
    const isPassthrough = ADMIN_PASSTHROUGH.some((p) => pathname.startsWith(p));
    if (isPassthrough) return NextResponse.next();

    const session = getSessionCookie(req);
    if (!session) {
      // Redirect ke main domain untuk login, lalu balik ke admin setelah login
      const mainLogin = new URL('https://autobalas.my.id/login');
      mainLogin.searchParams.set('redirect', `https://admin.autobalas.my.id${pathname}${search}`);
      return NextResponse.redirect(mainLogin);
    }

    // Rewrite root URL ke /admin
    if (pathname === '/' || pathname === '') {
      const url = req.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.rewrite(url);
    }
    // Path /xxx → /admin/xxx (kecuali sudah /admin*)
    if (!pathname.startsWith('/admin')) {
      const url = req.nextUrl.clone();
      url.pathname = `/admin${pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // === Main domain ===
  // Block /admin access from main domain — redirect ke admin subdomain
  if (pathname.startsWith('/admin') && process.env.NODE_ENV === 'production') {
    return NextResponse.redirect(new URL('https://admin.autobalas.my.id'));
  }

  if (PROTECTED_DASHBOARD.some((p) => pathname.startsWith(p))) {
    const session = getSessionCookie(req);
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
