import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from './auth';
import type { BuilderJwtPayload, BuilderRole } from '@wms/types';

export async function requireAuth(): Promise<BuilderJwtPayload> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) {
    throw new Error('Unauthorized');
  }
  return verifyToken(token);
}

export async function requireRole(
  ...roles: BuilderRole[]
): Promise<BuilderJwtPayload> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new Error('Forbidden');
  }
  return user;
}
