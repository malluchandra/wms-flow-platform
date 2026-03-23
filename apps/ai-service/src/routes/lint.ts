import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { FlowDefinition } from '@wms/types';
import { validateFlow } from '@wms/flow-engine';

interface LintBody {
  flow: FlowDefinition;
}

export default async function lintRoutes(app: FastifyInstance) {
  // POST /lint/flow — deterministic flow validation
  app.post('/flow', {
    schema: {
      body: {
        type: 'object',
        required: ['flow'],
        properties: {
          flow: { type: 'object' },
        },
      },
    },
  }, async (req: FastifyRequest<{ Body: LintBody }>, _reply: FastifyReply) => {
    const { flow } = req.body;
    const errors = validateFlow(flow as FlowDefinition);

    return {
      valid: errors.length === 0,
      errors,
      error_count: errors.length,
    };
  });
}
