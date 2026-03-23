import Fastify, { type FastifyInstance } from 'fastify';
import generateRoutes from './routes/generate.js';
import lintRoutes from './routes/lint.js';

export async function buildApp(opts: { logger?: boolean } = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? true });

  app.get('/health', async () => ({
    status: 'ok',
    service: 'ai-service',
    timestamp: new Date().toISOString(),
  }));

  await app.register(generateRoutes, { prefix: '/generate' });
  await app.register(lintRoutes, { prefix: '/lint' });

  return app;
}
