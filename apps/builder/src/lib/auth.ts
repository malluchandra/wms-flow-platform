import bcrypt from 'bcrypt';
import { SignJWT, jwtVerify } from 'jose';
import type { BuilderJwtPayload } from '@wms/types';

const BCRYPT_ROUNDS = 10;
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'change-me-in-production'
);
const JWT_EXPIRY = '8h';
export const COOKIE_NAME = 'wms_builder_token';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(
  payload: BuilderJwtPayload
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyToken(
  token: string
): Promise<BuilderJwtPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload as unknown as BuilderJwtPayload;
}
