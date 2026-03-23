import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;

beforeAll(async () => {
  const { buildApp } = await import('../app.js');
  app = await buildApp({ logger: false });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('POST /generate/flow', () => {
  it('returns 503 when API key is not configured', async () => {
    // The default .env has placeholder key 'sk-ant-your-key-here'
    const res = await app.inject({
      method: 'POST',
      url: '/generate/flow',
      payload: { description: 'Create a simple picking flow' },
    });
    expect(res.statusCode).toBe(503);
    const body = JSON.parse(res.payload);
    expect(body.error).toContain('not configured');
  });

  it('returns 400 when description is missing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/generate/flow',
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('POST /generate/step', () => {
  it('returns 503 when API key is not configured', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/generate/step',
      payload: { description: 'Add a scan step for item barcode' },
    });
    expect(res.statusCode).toBe(503);
  });

  it('returns 400 when description is missing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/generate/step',
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });
});
