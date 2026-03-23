import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { seedTestBuilderUser, cleanupTestBuilderUsers } from './helpers';

const mockCookieStore = {
  get: vi.fn(),
};
vi.mock('next/headers', () => ({
  cookies: () => mockCookieStore,
}));

import { requireAuth, requireRole } from '../lib/auth-guard';
import { signToken } from '../lib/auth';
import type { BuilderJwtPayload } from '@wms/types';

describe('requireAuth', () => {
  let validToken: string;

  beforeAll(async () => {
    const { user, tenant } = await seedTestBuilderUser();
    validToken = await signToken({
      sub: user.id,
      tenant_id: tenant.id,
      email: user.email,
      name: user.name,
      role: user.role as BuilderJwtPayload['role'],
    });
  });

  afterAll(async () => {
    await cleanupTestBuilderUsers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns user payload for valid cookie', async () => {
    mockCookieStore.get.mockReturnValue({ value: validToken });
    const user = await requireAuth();
    expect(user.email).toBe('test-admin@korber.com');
    expect(user.role).toBe('admin');
  });

  it('throws for missing cookie', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    await expect(requireAuth()).rejects.toThrow('Unauthorized');
  });

  it('throws for invalid token in cookie', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'garbage-token' });
    await expect(requireAuth()).rejects.toThrow();
  });
});

describe('requireRole', () => {
  beforeAll(async () => {
    await seedTestBuilderUser();
  });

  afterAll(async () => {
    await cleanupTestBuilderUsers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes when user has the required role', async () => {
    const { user, tenant } = await seedTestBuilderUser({ role: 'admin' });
    const token = await signToken({
      sub: user.id,
      tenant_id: tenant.id,
      email: user.email,
      name: user.name,
      role: 'admin',
    });
    mockCookieStore.get.mockReturnValue({ value: token });

    const payload = await requireRole('admin');
    expect(payload.role).toBe('admin');
  });

  it('throws Forbidden when user lacks the required role', async () => {
    const { user, tenant } = await seedTestBuilderUser({
      email: 'test-reviewer@korber.com',
      role: 'reviewer',
    });
    const token = await signToken({
      sub: user.id,
      tenant_id: tenant.id,
      email: user.email,
      name: user.name,
      role: 'reviewer',
    });
    mockCookieStore.get.mockReturnValue({ value: token });

    await expect(requireRole('admin')).rejects.toThrow('Forbidden');
  });
});
