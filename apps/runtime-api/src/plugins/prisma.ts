import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { prisma, type PrismaClient } from '@wms/db';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

export default fp(async (app: FastifyInstance) => {
  app.decorate('prisma', prisma);

  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
});
