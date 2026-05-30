import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

const PROTECTED_DASHBOARD = ['/dashboard', '/onboarding'];

// Host yang dianggap "admin subdomain" — semua request rewrite ke /admin
const ADMIN_HOSTS = ['admin.autobalas.my.id', 'admin.localhost:3000'];

export function middleware(req: NextRequest) {
  const host = (req.headers.get('host') ?? '').toLowerCase();
  const { pathname, search } = req.nextUrl;
  const isAdminHost = ADMIN_HOSTS.some((h) => host === h || host.startsWith(`${h.split(':')[0]}:`));

  // === Admin subdomain handling ===
  if (isAdminHost) {
    const session = getSessionCookie(req);
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', `${pathname}${search}`);
      return NextResponse.redirect(url);
    }
    // Rewrite root URL ke /admin
    if (pathname === '/' || pathname === '') {
      const url = req.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.rewrite(url);
    }
    // Path /xxx → /admin/xxx (kecuali sudah /admin* atau static asset)
    if (
      !pathname.startsWith('/admin') &&
      !pathname.startsWith('/_next') &&
      !pathname.startsWith('/api') &&
      !pathname.includes('.')
    ) {
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
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static
     * - _next/image
     * - favicon.ico
     * - images/icons (any .ext)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
