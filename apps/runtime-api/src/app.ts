import Fastify, { type FastifyInstance } from 'fastify';
import prismaPlugin from './plugins/prisma.js';
import jwtPlugin from './plugins/jwt.js';
import redisPlugin from './plugins/redis.js';
import authRoutes from './routes/auth.js';
import flowRoutes from './routes/flows.js';
import sessionRoutes from './routes/sessions.js';
import scanRoutes from './routes/scans.js';
import taskRoutes from './routes/tasks.js';

export interface BuildAppOptions {
  logger?: boolean;
  skipRedis?: boolean;
}

export async function buildApp(opts: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? true });

  // Plugins
  await app.register(prismaPlugin);
  await app.register(jwtPlugin);
  if (!opts.skipRedis) {
    await app.register(redisPlugin);
  }

  // Health check (unauthenticated)
  app.get('/health', async () => ({
    status: 'ok',
    service: 'runtime-api',
    timestamp: new Date().toISOString(),
  }));

  // Routes
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(flowRoutes, { prefix: '/flows' });
  await app.register(sessionRoutes, { prefix: '/sessions' });
  await app.register(scanRoutes, { prefix: '/scans' });
  await app.register(taskRoutes, { prefix: '/tasks' });

  return app;
}
