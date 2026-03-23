import Anthropic from '@anthropic-ai/sdk';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { FLOW_SYSTEM_PROMPT, buildFlowPrompt, buildStepPrompt } from '../prompts.js';

interface GenerateFlowBody {
  description: string;
}

interface GenerateStepBody {
  description: string;
  existing_step_ids: string[];
}

export default async function generateRoutes(app: FastifyInstance) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // POST /generate/flow — NL → full flow JSON
  app.post('/flow', {
    schema: {
      body: {
        type: 'object',
        required: ['description'],
        properties: {
          description: { type: 'string' },
        },
      },
    },
  }, async (req: FastifyRequest<{ Body: GenerateFlowBody }>, reply: FastifyReply) => {
    if (!apiKey || apiKey === 'sk-ant-your-key-here') {
      return reply.code(503).send({ error: 'Anthropic API key not configured' });
    }

    const client = new Anthropic({ apiKey });
    const { description } = req.body;

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: FLOW_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildFlowPrompt(description) }],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';

      // Try to parse as JSON
      try {
        const flow = JSON.parse(text);
        return { flow, raw: text };
      } catch {
        return { flow: null, raw: text, error: 'Generated output was not valid JSON' };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return reply.code(502).send({ error: `Claude API error: ${message}` });
    }
  });

  // POST /generate/step — NL → single step JSON
  app.post('/step', {
    schema: {
      body: {
        type: 'object',
        required: ['description'],
        properties: {
          description: { type: 'string' },
          existing_step_ids: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  }, async (req: FastifyRequest<{ Body: GenerateStepBody }>, reply: FastifyReply) => {
    if (!apiKey || apiKey === 'sk-ant-your-key-here') {
      return reply.code(503).send({ error: 'Anthropic API key not configured' });
    }

    const client = new Anthropic({ apiKey });
    const { description, existing_step_ids = [] } = req.body;

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: FLOW_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildStepPrompt(description, existing_step_ids) }],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';

      try {
        const step = JSON.parse(text);
        return { step, raw: text };
      } catch {
        return { step: null, raw: text, error: 'Generated output was not valid JSON' };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return reply.code(502).send({ error: `Claude API error: ${message}` });
    }
  });
}
