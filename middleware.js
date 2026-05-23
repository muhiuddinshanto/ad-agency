import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, verifySessionToken } from './lib/auth';

const publicPaths = ['/api/auth/login', '/api/auth/logout', '/api/cron/daily-spend'];
const accountantPages = ['/transactions'];

function isPublicPath(pathname) {
  return publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname) || pathname.startsWith('/_next') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  const session = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const user = await verifySessionToken(session);
  const isAuthenticated = Boolean(user);

  if (pathname === '/login') {
    return isAuthenticated ? NextResponse.redirect(new URL('/', request.url)) : NextResponse.next();
  }

  if (isAuthenticated) {
    if (user.role === 'accountant' && !pathname.startsWith('/api/') && !accountantPages.includes(pathname)) {
      return NextResponse.redirect(new URL('/transactions', request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
