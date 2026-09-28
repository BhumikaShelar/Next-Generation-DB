import { NextResponse } from 'next/server';

export function middleware(request) {
  const session = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  // Allow static assets, favicon, and Next.js internal files
  const isStatic = pathname.includes('.') || pathname.startsWith('/_next') || pathname === '/favicon.ico';
  
  // Allow authentication APIs to bypass middleware
  const isAuthApi = pathname.startsWith('/api/auth');

  if (isStatic || isAuthApi) {
    return NextResponse.next();
  }

  const isLoginPage = pathname === '/login';

  // If there is no session cookie and they are trying to access protected page
  if (!session && !isLoginPage) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If accessing an admin route, check role
  if (pathname.startsWith('/admin')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    try {
      const parts = session.split('.');
      if (parts.length === 3) {
        const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = atob(payloadBase64);
        const payload = JSON.parse(jsonPayload);
        
        if (payload.role !== 'admin') {
          const homeUrl = new URL('/', request.url);
          return NextResponse.redirect(homeUrl);
        }
      } else {
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
      }
    } catch (err) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If session cookie exists and they try to visit the login page
  if (session && isLoginPage) {
    const dashboardUrl = new URL('/', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
