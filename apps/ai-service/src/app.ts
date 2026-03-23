import Fastify, { type FastifyInstance } from 'fastify';
import generateRoutes from './routes/generate.js';
import lintRoutes from './routes/lint.js';
import diffRoutes from './routes/diff.js';
import lintAiRoutes from './routes/lint-ai.js';

export async function buildApp(opts: { logger?: boolean } = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? true });

  app.get('/health', async () => ({
    status: 'ok',
    service: 'ai-service',
    timestamp: new Date().toISOString(),
  }));

  await app.register(generateRoutes, { prefix: '/generate' });
  await app.register(lintRoutes, { prefix: '/lint' });
  await app.register(diffRoutes, { prefix: '/diff' });
  await app.register(lintAiRoutes, { prefix: '/lint/ai' });

  return app;
}
