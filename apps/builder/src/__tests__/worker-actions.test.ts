import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { seedTestBuilderUser, cleanupTestBuilderUsers } from './helpers';
import { signToken } from '../lib/auth';
import { prisma } from '@wms/db';
import type { BuilderJwtPayload } from '@wms/types';

const mockCookieStore = { get: vi.fn() };
vi.mock('next/headers', () => ({ cookies: () => mockCookieStore }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { listWorkers, createWorker, updateWorker, deactivateWorker } from '../lib/worker-actions';

describe('worker-actions', () => {
  let adminToken: string;
  let tenantId: string;

  beforeAll(async () => {
    const { user, tenant } = await seedTestBuilderUser({ email: 'test-wrk-admin@korber.com' });
    tenantId = tenant.id;
    adminToken = await signToken({ sub: user.id, tenant_id: tenant.id, email: user.email, name: user.name, role: 'admin' });
  });

  afterAll(async () => {
    await prisma.worker.deleteMany({ where: { badge_id: { startsWith: 'TEST-WRK-' } } });
    await cleanupTestBuilderUsers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieStore.get.mockReturnValue({ value: adminToken });
  });

  describe('listWorkers', () => {
    it('returns workers for current tenant', async () => {
      const workers = await listWorkers();
      expect(Array.isArray(workers)).toBe(true);
      expect(workers.length).toBeGreaterThan(0);
    });
  });

  describe('createWorker', () => {
    it('creates a worker with badge_id and role', async () => {
      const worker = await createWorker({ name: 'Test Picker', badge_id: 'TEST-WRK-001', role: 'picker' });
      expect(worker.name).toBe('Test Picker');
      expect(worker.badge_id).toBe('TEST-WRK-001');
      expect(worker.role).toBe('picker');
      expect(worker.tenant_id).toBe(tenantId);
    });

    it('rejects duplicate badge_id within same tenant', async () => {
      await expect(createWorker({ name: 'Dup', badge_id: 'TEST-WRK-001', role: 'picker' })).rejects.toThrow();
    });
  });

  describe('updateWorker', () => {
    it('updates worker name and role', async () => {
      const workers = await listWorkers();
      const picker = workers.find((w: any) => w.badge_id === 'TEST-WRK-001');
      const updated = await updateWorker(picker!.id, { name: 'Updated Picker', role: 'supervisor' });
      expect(updated.name).toBe('Updated Picker');
      expect(updated.role).toBe('supervisor');
    });
  });

  describe('deactivateWorker', () => {
    it('sets is_active to false', async () => {
      const workers = await listWorkers();
      const picker = workers.find((w: any) => w.badge_id === 'TEST-WRK-001');
      const deactivated = await deactivateWorker(picker!.id);
      expect(deactivated.is_active).toBe(false);
    });
  });

  describe('authorization', () => {
    it('non-admin cannot create workers', async () => {
      const { user: reviewer, tenant } = await seedTestBuilderUser({ email: 'test-wrk-reviewer@korber.com', role: 'reviewer' });
      const token = await signToken({ sub: reviewer.id, tenant_id: tenant.id, email: reviewer.email, name: reviewer.name, role: 'reviewer' });
      mockCookieStore.get.mockReturnValue({ value: token });
      await expect(createWorker({ name: 'Fail', badge_id: 'TEST-WRK-FAIL', role: 'picker' })).rejects.toThrow('Forbidden');
    });
  });
});
