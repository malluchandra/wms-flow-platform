import fp from 'fastify-plugin';
import fjwt from '@fastify/jwt';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export interface JwtPayload {
  sub: string;        // worker_id
  tenant_id: string;
  role: string;
  badge_id: string;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(async (app: FastifyInstance) => {
  app.register(fjwt, {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
    sign: { expiresIn: '8h' },
  });

  app.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
    } catch {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });
});
