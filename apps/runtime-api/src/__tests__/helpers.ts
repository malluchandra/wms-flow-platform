import { buildApp } from '../app.js';
import type { FastifyInstance } from 'fastify';
import { prisma } from '@wms/db';

/**
 * Build a test Fastify app with Redis disabled.
 * Call app.close() in afterAll.
 */
export async function buildTestApp(): Promise<FastifyInstance> {
  const app = await buildApp({ logger: false, skipRedis: true });
  await app.ready();
  return app;
}

/**
 * Login as a seeded worker and return the JWT.
 * Relies on seed data: tenant 'korber-internal', badge 'PICK-001'.
 */
export async function loginAsWorker(
  app: FastifyInstance,
  badgeId = 'PICK-001',
  tenantSlug = 'korber-internal'
): Promise<{ token: string; workerId: string }> {
  const res = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { tenant_slug: tenantSlug, badge_id: badgeId },
  });
  const body = JSON.parse(res.payload);
  return { token: body.token, workerId: body.worker.id };
}

/**
 * Convenience: returns Authorization header value.
 */
export async function authHeader(
  app: FastifyInstance,
  badgeId = 'PICK-001'
): Promise<string> {
  const { token } = await loginAsWorker(app, badgeId);
  return `Bearer ${token}`;
}

export { prisma };
