import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp, authHeader, prisma } from './helpers.js';

describe('POST /scans/validate', () => {
  let app: FastifyInstance;
  let auth: string;

  beforeAll(async () => {
    app = await buildTestApp();
    auth = await authHeader(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('validates a known UPC and returns item data', async () => {
    // WIDGET-A has UPC ['100000000001', '100000000002']
    const res = await app.inject({
      method: 'POST',
      url: '/scans/validate',
      headers: { authorization: auth },
      payload: { barcode: '100000000001' },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.sku).toBe('WIDGET-A');
    expect(body.name).toBe('Widget Alpha');
  });

  it('validates against expected_sku when provided', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/scans/validate',
      headers: { authorization: auth },
      payload: { barcode: '100000000001', expected_sku: 'WIDGET-A' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('returns 422 when UPC matches wrong SKU', async () => {
    // UPC 100000000001 is WIDGET-A, not WIDGET-B
    const res = await app.inject({
      method: 'POST',
      url: '/scans/validate',
      headers: { authorization: auth },
      payload: { barcode: '100000000001', expected_sku: 'WIDGET-B' },
    });
    expect(res.statusCode).toBe(422);
    const body = JSON.parse(res.payload);
    expect(body.error).toContain('Expected WIDGET-B');
  });

  it('returns 422 for unknown barcode', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/scans/validate',
      headers: { authorization: auth },
      payload: { barcode: '999999999999' },
    });
    expect(res.statusCode).toBe(422);
  });

  it('logs scan event for valid scan', async () => {
    const beforeCount = await prisma.scanEvent.count();
    await app.inject({
      method: 'POST',
      url: '/scans/validate',
      headers: { authorization: auth },
      payload: { barcode: '100000000001' },
    });
    const afterCount = await prisma.scanEvent.count();
    expect(afterCount).toBeGreaterThan(beforeCount);
  });

  it('logs scan event for invalid scan', async () => {
    const beforeCount = await prisma.scanEvent.count();
    await app.inject({
      method: 'POST',
      url: '/scans/validate',
      headers: { authorization: auth },
      payload: { barcode: '999999999999' },
    });
    const afterCount = await prisma.scanEvent.count();
    expect(afterCount).toBeGreaterThan(beforeCount);
  });
});
