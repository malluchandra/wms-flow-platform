import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import { Redis } from 'ioredis';

const PORT = 4099;
const SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';
const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

function makeToken(overrides: Record<string, string> = {}): string {
  return jwt.sign(
    {
      sub: overrides.sub ?? 'worker-1',
      tenant_id: overrides.tenant_id ?? 'tenant-1',
      role: overrides.role ?? 'picker',
      badge_id: overrides.badge_id ?? 'PICK-001',
    },
    SECRET
  );
}

function sseRequest(
  path: string,
  token: string
): Promise<{ statusCode: number; events: string[]; close: () => void }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: 'localhost', port: PORT, path, headers: { authorization: `Bearer ${token}` } },
      (res) => {
        const events: string[] = [];
        res.on('data', (chunk: Buffer) => {
          events.push(chunk.toString());
        });
        resolve({ statusCode: res.statusCode!, events, close: () => req.destroy() });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

describe('Realtime SSE service', () => {
  let server: http.Server & { subscriber: { close: () => Promise<void> } };
  let publisher: Redis;

  beforeAll(async () => {
    const mod = await import('../index.js');
    server = await mod.startServer(PORT);
    publisher = new Redis(REDIS_URL);
  });

  afterAll(async () => {
    // Let in-flight SSE connection cleanups (unsubscribes) settle
    await new Promise(r => setTimeout(r, 100));
    await publisher.quit();
    await server.subscriber.close();
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it('health endpoint returns 200', async () => {
    const res = await fetch(`http://localhost:${PORT}/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('realtime');
  });

  it('returns 401 for unauthenticated SSE request', async () => {
    const res = await fetch(`http://localhost:${PORT}/events/worker/worker-1`);
    expect(res.status).toBe(401);
  });

  it('returns 404 for unknown paths', async () => {
    const res = await fetch(`http://localhost:${PORT}/unknown`);
    expect(res.status).toBe(404);
  });

  it('establishes worker SSE connection and receives events', async () => {
    const token = makeToken({ sub: 'worker-1', tenant_id: 'tenant-1' });
    const { statusCode, events, close } = await sseRequest('/events/worker/worker-1', token);
    expect(statusCode).toBe(200);

    // Wait for Redis subscription to be ready
    await new Promise(r => setTimeout(r, 300));

    // Publish to worker channel
    await publisher.publish(
      'worker:worker-1',
      JSON.stringify({ type: 'task_assigned', task_id: 't-1', worker_id: 'worker-1', flow_id: 'f-1', tenant_id: 'tenant-1' })
    );

    // Wait for event propagation
    await new Promise(r => setTimeout(r, 300));

    const allData = events.join('');
    expect(allData).toContain('event: task_assigned');
    expect(allData).toContain('t-1');
    close();
  });

  it('worker receives broadcast events', async () => {
    const token = makeToken({ sub: 'worker-2', tenant_id: 'tenant-1' });
    const { statusCode, events, close } = await sseRequest('/events/worker/worker-2', token);
    expect(statusCode).toBe(200);

    await new Promise(r => setTimeout(r, 300));

    // Publish to broadcast channel
    await publisher.publish(
      'tenant:tenant-1:broadcast',
      JSON.stringify({ type: 'wave_released', wave_id: 'w-1', tenant_id: 'tenant-1', task_count: 10 })
    );

    await new Promise(r => setTimeout(r, 300));

    const allData = events.join('');
    expect(allData).toContain('event: wave_released');
    expect(allData).toContain('w-1');
    close();
  });

  it('establishes supervisor SSE and receives events', async () => {
    const token = makeToken({ sub: 'sup-1', tenant_id: 'tenant-1', role: 'supervisor' });
    const { statusCode, events, close } = await sseRequest('/events/supervisor/tenant-1', token);
    expect(statusCode).toBe(200);

    await new Promise(r => setTimeout(r, 300));

    await publisher.publish(
      'tenant:tenant-1:supervisor',
      JSON.stringify({ type: 'task_completed', task_id: 't-1', worker_id: 'w-1', tenant_id: 'tenant-1' })
    );

    await new Promise(r => setTimeout(r, 300));

    const allData = events.join('');
    expect(allData).toContain('event: task_completed');
    close();
  });

  it('supervisor receives exception events', async () => {
    const token = makeToken({ sub: 'sup-1', tenant_id: 'tenant-1', role: 'supervisor' });
    const { statusCode, events, close } = await sseRequest('/events/supervisor/tenant-1', token);
    expect(statusCode).toBe(200);

    await new Promise(r => setTimeout(r, 300));

    await publisher.publish(
      'tenant:tenant-1:exceptions',
      JSON.stringify({ type: 'exception_escalated', task_id: 't-2', worker_id: 'w-2', step_id: 'scan-item', tenant_id: 'tenant-1' })
    );

    await new Promise(r => setTimeout(r, 300));

    const allData = events.join('');
    expect(allData).toContain('event: exception_escalated');
    close();
  });
});
