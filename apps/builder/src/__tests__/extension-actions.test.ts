import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { seedTestBuilderUser, cleanupTestBuilderUsers } from './helpers';
import { signToken } from '../lib/auth';
import { prisma } from '@wms/db';
import type { BuilderJwtPayload } from '@wms/types';

const mockCookieStore = { get: vi.fn() };
vi.mock('next/headers', () => ({
  cookies: () => mockCookieStore,
}));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { getBaseFlows, createFlowFromBase } from '../lib/extension-actions';

describe('extension-actions', () => {
  let adminToken: string;
  let tenantId: string;

  beforeAll(async () => {
    const { user, tenant } = await seedTestBuilderUser({ email: 'test-ext-admin@korber.com' });
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
    await prisma.flowDefinition.deleteMany({
      where: { name: { startsWith: 'test-ext-' } },
    });
    await cleanupTestBuilderUsers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieStore.get.mockReturnValue({ value: adminToken });
  });

  describe('getBaseFlows', () => {
    it('returns flows with no base_flow_id (root flows)', async () => {
      const bases = await getBaseFlows();
      expect(Array.isArray(bases)).toBe(true);
      const picking = bases.find((f: any) => f.name === 'outbound-picking');
      expect(picking).toBeDefined();
      expect(picking!.base_flow_id).toBeNull();
    });
  });

  describe('createFlowFromBase', () => {
    it('creates an extend-mode flow from a base', async () => {
      const bases = await getBaseFlows();
      const base = bases.find((f: any) => f.name === 'outbound-picking')!;
      const child = await createFlowFromBase({
        baseFlowId: base.id,
        mode: 'extend',
        name: 'test-ext-partner-picking',
        displayName: 'Test Partner Picking',
      });
      expect(child.name).toBe('test-ext-partner-picking');
      expect(child.base_flow_id).toBe(base.id);
      const def = child.definition as any;
      expect(def.extension_mode).toBe('extend');
      expect(def.extends).toBe(base.id);
      expect(def.base_version).toBe('1.0.0');
      expect(def.steps.length).toBeGreaterThan(0);
      expect(def.steps.every((s: any) => s._source === 'base')).toBe(true);
    });

    it('creates a fork-mode flow (no extension points)', async () => {
      const bases = await getBaseFlows();
      const base = bases.find((f: any) => f.name === 'outbound-picking')!;
      const child = await createFlowFromBase({
        baseFlowId: base.id,
        mode: 'fork',
        name: 'test-ext-forked-picking',
        displayName: 'Forked Picking',
      });
      const def = child.definition as any;
      expect(def.extension_mode).toBe('fork');
      expect(def.steps.every((s: any) => !s.extension_point)).toBe(true);
      expect(def.steps.every((s: any) => !s._source)).toBe(true);
    });

    it('creates a use-mode flow (empty steps)', async () => {
      const bases = await getBaseFlows();
      const base = bases.find((f: any) => f.name === 'outbound-picking')!;
      const child = await createFlowFromBase({
        baseFlowId: base.id,
        mode: 'use',
        name: 'test-ext-use-picking',
        displayName: 'Use Picking',
      });
      const def = child.definition as any;
      expect(def.extension_mode).toBe('use');
      expect(def.steps).toHaveLength(0);
    });

    it('rejects non-existent base flow', async () => {
      await expect(
        createFlowFromBase({
          baseFlowId: '00000000-0000-0000-0000-000000000000',
          mode: 'extend',
          name: 'test-ext-fail',
          displayName: 'Fail',
        })
      ).rejects.toThrow('Base flow not found');
    });

    it('requires admin or flow-author role', async () => {
      const { user: reviewer, tenant } = await seedTestBuilderUser({
        email: 'test-ext-reviewer@korber.com',
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
      const bases = await prisma.flowDefinition.findFirst({
        where: { name: 'outbound-picking', base_flow_id: null },
      });
      await expect(
        createFlowFromBase({
          baseFlowId: bases!.id,
          mode: 'extend',
          name: 'test-ext-unauth',
          displayName: 'Unauth',
        })
      ).rejects.toThrow('Forbidden');
    });
  });
});
