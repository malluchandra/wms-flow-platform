import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { verifyToken } from './jwt.js';
import { SseConnection } from './sse.js';
import type { RedisSubscriber } from './subscriber.js';

export function createRouter(subscriber: RedisSubscriber, jwtSecret: string) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    const url = req.url ?? '/';

    if (url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', service: 'realtime', timestamp: new Date().toISOString() }));
      return;
    }

    const workerMatch = url.match(/^\/events\/worker\/([^/]+)$/);
    const supervisorMatch = url.match(/^\/events\/supervisor\/([^/]+)$/);

    if (!workerMatch && !supervisorMatch) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }

    const authHeader = req.headers.authorization;
    const payload = verifyToken(authHeader, jwtSecret);
    if (!payload) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    if (workerMatch) {
      const workerId = workerMatch[1];
      const tenantId = payload.tenant_id;
      const channels = [`worker:${workerId}`, `tenant:${tenantId}:broadcast`];
      const conn = new SseConnection(randomUUID(), res, channels, (c) => { subscriber.removeConnection(c); });
      await subscriber.addConnection(conn);
      return;
    }

    if (supervisorMatch) {
      const tenantId = supervisorMatch[1];
      const channels = [`tenant:${tenantId}:supervisor`, `tenant:${tenantId}:exceptions`];
      const conn = new SseConnection(randomUUID(), res, channels, (c) => { subscriber.removeConnection(c); });
      await subscriber.addConnection(conn);
      return;
    }
  };
}
