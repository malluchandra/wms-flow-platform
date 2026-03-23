import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { verifyToken } from '../jwt.js';

const SECRET = 'test-secret';

describe('verifyToken', () => {
  it('returns payload for valid token', () => {
    const token = jwt.sign(
      { sub: 'worker-1', tenant_id: 'tenant-1', role: 'picker', badge_id: 'PICK-001' },
      SECRET
    );
    const result = verifyToken(`Bearer ${token}`, SECRET);
    expect(result).not.toBeNull();
    expect(result!.sub).toBe('worker-1');
    expect(result!.tenant_id).toBe('tenant-1');
  });

  it('returns null for invalid token', () => {
    expect(verifyToken('Bearer invalid', SECRET)).toBeNull();
  });

  it('returns null for missing header', () => {
    expect(verifyToken(undefined, SECRET)).toBeNull();
  });

  it('returns null for non-Bearer scheme', () => {
    expect(verifyToken('Basic abc', SECRET)).toBeNull();
  });
});
