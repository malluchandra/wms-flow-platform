import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

interface LoginBody {
  tenant_slug: string;
  badge_id: string;
}

export default async function authRoutes(app: FastifyInstance) {
  app.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['tenant_slug', 'badge_id'],
        properties: {
          tenant_slug: { type: 'string' },
          badge_id: { type: 'string' },
        },
      },
    },
  }, async (req: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
    const { tenant_slug, badge_id } = req.body;

    // 1. Find tenant by slug
    const tenant = await app.prisma.tenant.findUnique({
      where: { slug: tenant_slug },
    });
    if (!tenant || !tenant.is_active) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    // 2. Find worker by tenant + badge
    const worker = await app.prisma.worker.findUnique({
      where: {
        tenant_id_badge_id: {
          tenant_id: tenant.id,
          badge_id,
        },
      },
    });
    if (!worker || !worker.is_active) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    // 3. Issue JWT
    const token = app.jwt.sign({
      sub: worker.id,
      tenant_id: tenant.id,
      role: worker.role,
      badge_id: worker.badge_id,
    });

    return {
      token,
      worker: {
        id: worker.id,
        name: worker.name,
        role: worker.role,
      },
    };
  });
}
