import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, signToken, COOKIE_NAME } from '@/lib/auth';
import type { BuilderJwtPayload, BuilderLoginResponse } from '@wms/types';

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    );
  }

  const user = await prisma.builderUser.findFirst({
    where: { email },
    include: { tenant: true },
  });

  if (!user || !user.is_active || !user.tenant.is_active) {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }

  const payload: BuilderJwtPayload = {
    sub: user.id,
    tenant_id: user.tenant_id,
    email: user.email,
    name: user.name,
    role: user.role as BuilderJwtPayload['role'],
  };
  const token = await signToken(payload);

  const responseBody: BuilderLoginResponse = {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as BuilderJwtPayload['role'],
    },
  };

  const response = NextResponse.json(responseBody);
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
