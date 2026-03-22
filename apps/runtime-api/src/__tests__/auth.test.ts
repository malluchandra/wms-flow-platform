import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp } from './helpers.js';

describe('POST /auth/login', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns JWT and worker info for valid badge', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { tenant_slug: 'korber-internal', badge_id: 'PICK-001' },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.token).toBeDefined();
    expect(body.worker.name).toBe('Jordan Picker');
    expect(body.worker.role).toBe('picker');
  });

  it('returns 401 for unknown badge_id', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { tenant_slug: 'korber-internal', badge_id: 'UNKNOWN-999' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 for unknown tenant', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { tenant_slug: 'nonexistent-tenant', badge_id: 'PICK-001' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 when payload is missing fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });
});
