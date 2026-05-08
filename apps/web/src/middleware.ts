import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value || request.headers.get('Authorization');
  
  // Note: Since we use localStorage in the client, we also check for a cookie
  // for SSR/Middleware protection if possible, but primarily we'll rely on 
  // client-side checks for now or use a cookie-based approach.
  const hasToken = request.cookies.has('admin_token');
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard');

  if (isDashboard && !hasToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
