// ==========================================
// CurrículoPRO — Auth Middleware
// ==========================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'curriculopro_session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that do not require authentication
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.includes('favicon.ico')
  ) {
    return NextResponse.next();
  }

  // Server-to-server access (e.g. PriveAgent) to the resumes API via a shared
  // API key, bypassing the browser session cookie requirement.
  const apiKey = process.env.PRIVEAGENT_API_KEY;
  if (pathname.startsWith('/api/resumes') && apiKey && request.headers.get('x-api-key') === apiKey) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
