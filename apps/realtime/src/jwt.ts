import jwt from 'jsonwebtoken';

export interface TokenPayload {
  sub: string;
  tenant_id: string;
  role: string;
  badge_id: string;
}

export function verifyToken(
  authHeader: string | undefined,
  secret: string
): TokenPayload | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, secret) as TokenPayload;
    return payload;
  } catch {
    return null;
  }
}
