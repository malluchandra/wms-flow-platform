import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Duplicated from lib/auth.ts because middleware runs on Edge runtime
// where bcrypt (native module) cannot be imported. jose is edge-compatible.
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'change-me-in-production'
);

const COOKIE_NAME = 'wms_builder_token';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' });
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!login|api/auth|_next/static|_next/image|favicon\\.ico).*)',
  ],
};
