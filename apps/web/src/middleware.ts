import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hasToken = request.cookies.has('admin_token');
  const pathname = request.nextUrl.pathname;
  const isDashboard = pathname.startsWith('/dashboard');
  const isChangePassword = pathname === '/change-password';

  // Protect dashboard — require token
  if (isDashboard && !hasToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Protect change-password — require token (user must be logged in)
  if (isChangePassword && !hasToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/change-password'],
};
