import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  const pathname = request.nextUrl.pathname;
  
  const isDashboard = pathname.startsWith('/dashboard');
  const isChangePassword = pathname === '/change-password';

  // Protect dashboard — require token
  if (isDashboard && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Protect change-password — require token
  if (isChangePassword && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/change-password'],
};
