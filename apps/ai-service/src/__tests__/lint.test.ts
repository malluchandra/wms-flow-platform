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

describe('POST /lint/flow', () => {
  it('returns valid for a well-formed flow', async () => {
    const validFlow = {
      id: 'test-flow',
      name: 'test',
      version: '1.0.0',
      display_name: 'Test Flow',
      extends: null,
      context_schema: { item: 'string' },
      entry_step: 'start',
      steps: [
        { id: 'start', type: 'message', prompt: 'Hello', body: 'Welcome', severity: 'info', on_dismiss: '__exit__', on_exception: 'exception-handler' },
        { id: 'exception-handler', type: 'menu_select', prompt: 'Error', options: [{ label: 'Cancel', value: 'cancel', next_step: '__exit__' }] },
      ],
    };

    const res = await app.inject({
      method: 'POST',
      url: '/lint/flow',
      payload: { flow: validFlow },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.valid).toBe(true);
    expect(body.errors).toEqual([]);
  });

  it('returns errors for flow missing exception-handler', async () => {
    const badFlow = {
      id: 'bad-flow',
      name: 'bad',
      version: '1.0.0',
      display_name: 'Bad Flow',
      extends: null,
      context_schema: {},
      entry_step: 'start',
      steps: [
        { id: 'start', type: 'message', prompt: 'Hello', body: 'Bye', severity: 'info', on_dismiss: '__exit__' },
      ],
    };

    const res = await app.inject({
      method: 'POST',
      url: '/lint/flow',
      payload: { flow: badFlow },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.valid).toBe(false);
    expect(body.errors.some((e: { code: string }) => e.code === 'MISSING_EXCEPTION_HANDLER')).toBe(true);
  });

  it('catches undefined step references', async () => {
    const flow = {
      id: 'ref-flow',
      name: 'ref',
      version: '1.0.0',
      display_name: 'Ref Flow',
      extends: null,
      context_schema: {},
      entry_step: 'start',
      steps: [
        { id: 'start', type: 'message', prompt: 'Go', body: 'Go', severity: 'info', on_dismiss: 'nonexistent-step' },
        { id: 'exception-handler', type: 'menu_select', prompt: 'Error', options: [{ label: 'Exit', value: 'exit', next_step: '__exit__' }] },
      ],
    };

    const res = await app.inject({
      method: 'POST',
      url: '/lint/flow',
      payload: { flow },
    });
    const body = JSON.parse(res.payload);
    expect(body.valid).toBe(false);
    expect(body.errors.some((e: { code: string }) => e.code === 'UNDEFINED_STEP_REFERENCE')).toBe(true);
  });
});
