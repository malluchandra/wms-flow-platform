import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, signToken, verifyToken } from '../lib/auth';
import type { BuilderJwtPayload } from '@wms/types';

describe('hashPassword / verifyPassword', () => {
  it('hashes a password to a bcrypt string', async () => {
    const hash = await hashPassword('my-secret');
    expect(hash).not.toBe('my-secret');
    expect(hash).toMatch(/^\$2[aby]?\$/);
  });

  it('verifyPassword returns true for correct password', async () => {
    const hash = await hashPassword('my-secret');
    const ok = await verifyPassword('my-secret', hash);
    expect(ok).toBe(true);
  });

  it('verifyPassword returns false for wrong password', async () => {
    const hash = await hashPassword('my-secret');
    const ok = await verifyPassword('wrong-password', hash);
    expect(ok).toBe(false);
  });
});

describe('signToken / verifyToken', () => {
  const payload: BuilderJwtPayload = {
    sub: '00000000-0000-0000-0000-000000000001',
    tenant_id: '00000000-0000-0000-0000-000000000002',
    email: 'admin@korber.com',
    name: 'Admin User',
    role: 'admin',
  };

  it('signToken returns a JWT string', async () => {
    const token = await signToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('verifyToken decodes a valid token', async () => {
    const token = await signToken(payload);
    const decoded = await verifyToken(token);
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.tenant_id).toBe(payload.tenant_id);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe('admin');
  });

  it('verifyToken throws for invalid token', async () => {
    await expect(verifyToken('invalid.token.here')).rejects.toThrow();
  });

  it('verifyToken throws for tampered token', async () => {
    const token = await signToken(payload);
    const tampered = token.slice(0, -5) + 'XXXXX';
    await expect(verifyToken(tampered)).rejects.toThrow();
  });
});
