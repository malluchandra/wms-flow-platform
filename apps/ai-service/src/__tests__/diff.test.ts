import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../app.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp({ logger: false });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

const FLOW_A = {
  id: 'a', name: 'test', version: '1.0.0', display_name: 'Test',
  extends: null, context_schema: {}, entry_step: 's1',
  steps: [
    { id: 's1', type: 'scan', prompt: 'Scan' },
    { id: 'exception-handler', type: 'menu_select', prompt: 'Exc',
      options: [{ label: 'Cancel', value: 'c', next_step: '__abandon__' }] },
  ],
};

describe('POST /diff/flows', () => {
  it('returns diff result for two flows', async () => {
    const flowB = { ...FLOW_A, steps: [
      { id: 's1', type: 'scan', prompt: 'Scan Item' },
      { id: 's2', type: 'message', prompt: 'New' },
      { id: 'exception-handler', type: 'menu_select', prompt: 'Exc',
        options: [{ label: 'Cancel', value: 'c', next_step: '__abandon__' }] },
    ]};
    const res = await app.inject({
      method: 'POST',
      url: '/diff/flows',
      payload: { flowA: FLOW_A, flowB },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.summary.added).toBe(1);
    expect(body.summary.modified).toBe(1);
  });

  it('returns 400 for missing flows', async () => {
    const res = await app.inject({
      method: 'POST', url: '/diff/flows', payload: { flowA: FLOW_A },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns empty diff for identical flows', async () => {
    const res = await app.inject({
      method: 'POST', url: '/diff/flows', payload: { flowA: FLOW_A, flowB: FLOW_A },
    });
    const body = JSON.parse(res.payload);
    expect(body.summary.added).toBe(0);
    expect(body.summary.removed).toBe(0);
    expect(body.summary.modified).toBe(0);
  });
});
