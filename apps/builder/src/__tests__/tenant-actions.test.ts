import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { seedTestBuilderUser, cleanupTestBuilderUsers } from './helpers';
import { signToken } from '../lib/auth';
import { prisma } from '@wms/db';
import type { BuilderJwtPayload } from '@wms/types';

const mockCookieStore = { get: vi.fn() };
vi.mock('next/headers', () => ({ cookies: () => mockCookieStore }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { listTenants, createTenant, updateTenant, deactivateTenant } from '../lib/tenant-actions';

describe('tenant-actions', () => {
  let superAdminToken: string;

  beforeAll(async () => {
    const { user, tenant } = await seedTestBuilderUser({ email: 'test-ten-super@korber.com', is_super: true });
    superAdminToken = await signToken({ sub: user.id, tenant_id: tenant.id, email: user.email, name: user.name, role: 'admin' });
  });

  afterAll(async () => {
    await prisma.tenant.deleteMany({ where: { slug: { startsWith: 'test-ten-' } } });
    await cleanupTestBuilderUsers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieStore.get.mockReturnValue({ value: superAdminToken });
  });

  describe('listTenants', () => {
    it('returns all tenants for super admin', async () => {
      const tenants = await listTenants();
      expect(Array.isArray(tenants)).toBe(true);
      expect(tenants.length).toBeGreaterThan(0);
      const korber = tenants.find((t: any) => t.slug === 'korber-internal');
      expect(korber).toBeDefined();
    });
  });

  describe('createTenant', () => {
    it('creates a new tenant with slug', async () => {
      const tenant = await createTenant({ name: 'Test Partner Warehouse', slug: 'test-ten-partner-wh' });
      expect(tenant.name).toBe('Test Partner Warehouse');
      expect(tenant.slug).toBe('test-ten-partner-wh');
      expect(tenant.is_active).toBe(true);
    });

    it('rejects duplicate slug', async () => {
      await expect(createTenant({ name: 'Dup', slug: 'test-ten-partner-wh' })).rejects.toThrow();
    });

    it('rejects non-super admin', async () => {
      const { user, tenant } = await seedTestBuilderUser({ email: 'test-ten-nonsup@korber.com', is_super: false });
      const token = await signToken({ sub: user.id, tenant_id: tenant.id, email: user.email, name: user.name, role: 'admin' });
      mockCookieStore.get.mockReturnValue({ value: token });
      await expect(createTenant({ name: 'Fail', slug: 'test-ten-fail' })).rejects.toThrow('Super admin required');
    });
  });

  describe('updateTenant', () => {
    it('updates tenant name', async () => {
      mockCookieStore.get.mockReturnValue({ value: superAdminToken });
      const tenants = await listTenants();
      const partner = tenants.find((t: any) => t.slug === 'test-ten-partner-wh');
      const updated = await updateTenant(partner!.id, { name: 'Updated Partner WH' });
      expect(updated.name).toBe('Updated Partner WH');
    });
  });

  describe('deactivateTenant', () => {
    it('sets is_active to false', async () => {
      mockCookieStore.get.mockReturnValue({ value: superAdminToken });
      const tenants = await listTenants();
      const partner = tenants.find((t: any) => t.slug === 'test-ten-partner-wh');
      const deactivated = await deactivateTenant(partner!.id);
      expect(deactivated.is_active).toBe(false);
    });
  });
});
