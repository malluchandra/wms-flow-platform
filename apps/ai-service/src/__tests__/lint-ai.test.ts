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

const TEST_FLOW = {
  id: 'test', name: 'test', version: '1.0.0', display_name: 'Test',
  extends: null, context_schema: {}, entry_step: 'step-1',
  steps: [
    { id: 'step-1', type: 'scan', prompt: 'Scan', on_success: '__exit__', on_exception: 'exception-handler' },
    { id: 'exception-handler', type: 'menu_select', prompt: 'Exception',
      options: [{ label: 'Cancel', value: 'cancel', next_step: '__abandon__' }] },
  ],
};

describe('POST /lint/ai', () => {
  it('returns AI lint results (or graceful error without API key)', async () => {
    const res = await app.inject({
      method: 'POST', url: '/lint/ai', payload: { flow: TEST_FLOW },
    });
    // Without ANTHROPIC_API_KEY, returns 503
    // With key but bad/missing key, returns 502
    // With valid key, returns 200 with issues array
    expect([200, 502, 503]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      const body = JSON.parse(res.payload);
      expect(Array.isArray(body.issues)).toBe(true);
    }
  });

  it('returns 400 for missing flow', async () => {
    const res = await app.inject({
      method: 'POST', url: '/lint/ai', payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it('includes deterministic lint results alongside AI results', async () => {
    const res = await app.inject({
      method: 'POST', url: '/lint/ai', payload: { flow: TEST_FLOW },
    });
    // All non-400 responses include deterministic results (200, 502, 503)
    if ([200, 502, 503].includes(res.statusCode)) {
      const body = JSON.parse(res.payload);
      expect(body.deterministic).toBeDefined();
      expect(typeof body.deterministic.valid).toBe('boolean');
    }
  });
});
