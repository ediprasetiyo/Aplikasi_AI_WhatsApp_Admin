import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

const PROTECTED = ['/dashboard', '/onboarding'];

export function middleware(req: NextRequest) {
  const session = getSessionCookie(req);
  const { pathname } = req.nextUrl;

  if (PROTECTED.some((p) => pathname.startsWith(p)) && !session) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding'],
};
