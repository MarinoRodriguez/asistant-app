import { NextRequest, NextResponse } from 'next/server';

// Rutas públicas
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/api/auth/login',
  '/api/auth/register',
  '/_next',
  '/_static',
  '/favicon',
  '/templates',
];

function isPublic(path: string) {
  return PUBLIC_PATHS.some(p => path === p || path.startsWith(p));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname) || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const session = req.cookies.get('session')?.value;
  if (!session) {
    if (pathname !== '/login') {
      const url = new URL('/login', req.url);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  try {
    const data = JSON.parse(session) as { exp?: number };
    if (!data.exp || Date.now() > data.exp) {
      const res = NextResponse.redirect(new URL('/login', req.url));
      res.cookies.set('session', '', { httpOnly: true, path: '/', maxAge: 0 });
      return res;
    }
  } catch {
    const res = NextResponse.redirect(new URL('/login', req.url));
    res.cookies.set('session', '', { httpOnly: true, path: '/', maxAge: 0 });
    return res;
  }

  if (pathname === '/login' || pathname === '/register') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

