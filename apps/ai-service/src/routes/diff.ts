import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { FlowDefinition } from '@wms/types';
import { diffFlows } from '@wms/flow-engine';

interface DiffBody {
  flowA: FlowDefinition;
  flowB: FlowDefinition;
}

export default async function diffRoutes(app: FastifyInstance) {
  app.post('/flows', {
    schema: {
      body: {
        type: 'object',
        required: ['flowA', 'flowB'],
        properties: {
          flowA: { type: 'object' },
          flowB: { type: 'object' },
        },
      },
    },
  }, async (req: FastifyRequest<{ Body: DiffBody }>, reply: FastifyReply) => {
    const { flowA, flowB } = req.body;
    if (!flowA || !flowB) {
      return reply.code(400).send({ error: 'Both flowA and flowB are required' });
    }
    const result = diffFlows(flowA as FlowDefinition, flowB as FlowDefinition);
    return result;
  });
}
