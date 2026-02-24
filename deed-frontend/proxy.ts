import { NextRequest, NextResponse } from 'next/server';

const protectedPaths = ['/dashboard', '/deeds', '/notifications', '/admin', '/profile'];

export function proxy(request: NextRequest) {
  const token = request.cookies.get('deed_token')?.value;
  const { pathname } = request.nextUrl;

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/deeds/:path*', '/notifications/:path*', '/admin/:path*', '/profile/:path*', '/login', '/register'],
};
