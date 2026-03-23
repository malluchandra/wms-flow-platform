import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { seedTestBuilderUser, cleanupTestBuilderUsers } from './helpers';
import { signToken } from '../lib/auth';
import type { BuilderJwtPayload } from '@wms/types';

const mockCookieStore = { get: vi.fn() };
vi.mock('next/headers', () => ({
  cookies: () => mockCookieStore,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import {
  listBuilderUsers,
  createBuilderUser,
  updateBuilderUser,
  deactivateBuilderUser,
} from '../lib/admin-actions';
import { prisma } from './helpers';

describe('admin-actions', () => {
  let adminToken: string;
  let tenantId: string;

  beforeAll(async () => {
    const { user, tenant } = await seedTestBuilderUser({ email: 'test-adm-admin@korber.com' });
    tenantId = tenant.id;
    adminToken = await signToken({
      sub: user.id,
      tenant_id: tenant.id,
      email: user.email,
      name: user.name,
      role: 'admin',
    });
  });

  afterAll(async () => {
    await cleanupTestBuilderUsers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieStore.get.mockReturnValue({ value: adminToken });
  });

  describe('listBuilderUsers', () => {
    it('returns users for the current tenant', async () => {
      const users = await listBuilderUsers();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
      expect(users[0].email).toBeDefined();
      expect((users[0] as any).password_hash).toBeUndefined();
    });
  });

  describe('createBuilderUser', () => {
    it('creates a new user in the current tenant', async () => {
      const newUser = await createBuilderUser({
        email: 'test-adm-new-author@korber.com',
        name: 'New Author',
        password: 'secure-password',
        role: 'flow-author',
      });
      expect(newUser.email).toBe('test-adm-new-author@korber.com');
      expect(newUser.role).toBe('flow-author');
      expect(newUser.tenant_id).toBe(tenantId);
    });

    it('rejects duplicate email within same tenant', async () => {
      await expect(
        createBuilderUser({
          email: 'test-adm-new-author@korber.com',
          name: 'Duplicate',
          password: 'secure-password',
          role: 'flow-author',
        })
      ).rejects.toThrow();
    });
  });

  describe('updateBuilderUser', () => {
    it('updates user name and role', async () => {
      const users = await listBuilderUsers();
      const author = users.find((u) => u.email === 'test-adm-new-author@korber.com');
      expect(author).toBeDefined();

      const updated = await updateBuilderUser(author!.id, {
        name: 'Updated Author',
        role: 'reviewer',
      });
      expect(updated.name).toBe('Updated Author');
      expect(updated.role).toBe('reviewer');
    });
  });

  describe('deactivateBuilderUser', () => {
    it('sets is_active to false', async () => {
      const users = await listBuilderUsers();
      const author = users.find((u) => u.email === 'test-adm-new-author@korber.com');
      expect(author).toBeDefined();

      const deactivated = await deactivateBuilderUser(author!.id);
      expect(deactivated.is_active).toBe(false);
    });
  });

  describe('authorization', () => {
    it('non-admin cannot create users', async () => {
      const { user: reviewer, tenant } = await seedTestBuilderUser({
        email: 'test-adm-reviewer@korber.com',
        role: 'reviewer',
      });
      const reviewerToken = await signToken({
        sub: reviewer.id,
        tenant_id: tenant.id,
        email: reviewer.email,
        name: reviewer.name,
        role: 'reviewer',
      });
      mockCookieStore.get.mockReturnValue({ value: reviewerToken });

      await expect(
        createBuilderUser({
          email: 'test-adm-should-fail@korber.com',
          name: 'Should Fail',
          password: 'test',
          role: 'flow-author',
        })
      ).rejects.toThrow('Forbidden');
    });
  });
});
