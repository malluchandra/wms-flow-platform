import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default async function flowRoutes(app: FastifyInstance) {
  // All flow routes require authentication
  app.addHook('onRequest', app.authenticate);

  // GET /flows/active/:name — get active flow by name for caller's tenant
  // Registered before /:id so "active" is not treated as a UUID
  app.get('/active/:name', async (
    req: FastifyRequest<{ Params: { name: string } }>,
    reply: FastifyReply
  ) => {
    const { name } = req.params;
    const tenantId = req.user.tenant_id;

    const flow = await app.prisma.flowDefinition.findFirst({
      where: {
        tenant_id: tenantId,
        name,
        is_active: true,
      },
    });

    if (!flow) {
      return reply.code(404).send({ error: 'Flow not found' });
    }

    return flow;
  });

  // GET /flows/:id — serve flow definition by ID
  app.get('/:id', async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    const { id } = req.params;
    const tenantId = req.user.tenant_id;

    const flow = await app.prisma.flowDefinition.findFirst({
      where: { id, tenant_id: tenantId },
    });

    if (!flow) {
      return reply.code(404).send({ error: 'Flow not found' });
    }

    return flow;
  });
}
