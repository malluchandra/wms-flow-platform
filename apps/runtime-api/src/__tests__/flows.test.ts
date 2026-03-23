import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp, authHeader, prisma } from './helpers.js';

describe('Flow routes', () => {
  let app: FastifyInstance;
  let auth: string;
  let flowId: string;

  beforeAll(async () => {
    app = await buildTestApp();
    auth = await authHeader(app);

    // Get the seeded flow ID
    const flow = await prisma.flowDefinition.findFirst({
      where: { name: 'outbound-picking' },
    });
    flowId = flow!.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /flows/:id', () => {
    it('returns flow definition for valid ID', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/flows/${flowId}`,
        headers: { authorization: auth },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.name).toBe('outbound-picking');
      expect(body.definition).toBeDefined();
      expect(body.definition.entry_step).toBe('navigate-to-location');
    });

    it('returns 404 for non-existent flow', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/flows/00000000-0000-0000-0000-000000000000',
        headers: { authorization: auth },
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 401 without auth', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/flows/${flowId}`,
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /flows/active/:name', () => {
    it('returns active flow by name for tenant', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/flows/active/outbound-picking',
        headers: { authorization: auth },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.name).toBe('outbound-picking');
      expect(body.is_active).toBe(true);
    });

    it('returns 404 for unknown flow name', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/flows/active/nonexistent-flow',
        headers: { authorization: auth },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('Use mode resolution', () => {
    let baseFlowId: string;
    let useFlowId: string;

    beforeAll(async () => {
      const base = await prisma.flowDefinition.findFirst({
        where: { name: 'outbound-picking' },
      });
      baseFlowId = base!.id;
      const tenant = await prisma.tenant.findUnique({
        where: { slug: 'korber-internal' },
      });
      const useFlow = await prisma.flowDefinition.create({
        data: {
          tenant_id: tenant!.id,
          name: 'use-mode-picking',
          display_name: 'Use Mode Picking',
          base_flow_id: baseFlowId,
          version: '1.0.0',
          environment: 'dev',
          definition: {
            id: '',
            name: 'use-mode-picking',
            version: '1.0.0',
            display_name: 'Use Mode Picking',
            extends: baseFlowId,
            extension_mode: 'use',
            base_version: '1.0.0',
            context_schema: {},
            entry_step: '',
            steps: [],
          },
          is_active: true,
        },
      });
      useFlowId = useFlow.id;
    });

    afterAll(async () => {
      await prisma.flowDefinition.delete({ where: { id: useFlowId } });
    });

    it('GET /flows/:id resolves Use mode with base flow steps', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/flows/${useFlowId}`,
        headers: { authorization: auth },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      const def = body.definition;
      expect(def.extension_mode).toBe('use');
      expect(def.name).toBe('use-mode-picking');
      expect(def.steps.length).toBeGreaterThan(0);
      expect(def.entry_step).toBe('navigate-to-location');
    });

    it('GET /flows/active/use-mode-picking resolves Use mode', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/flows/active/use-mode-picking',
        headers: { authorization: auth },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.definition.steps.length).toBeGreaterThan(0);
    });
  });
});
