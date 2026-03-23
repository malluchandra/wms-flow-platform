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
});
