import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import Anthropic from '@anthropic-ai/sdk';
import type { FlowDefinition } from '@wms/types';
import { validateFlow } from '@wms/flow-engine';
import { LINT_AI_SYSTEM_PROMPT, buildLintAiPrompt } from '../prompts.js';

interface LintAiBody {
  flow: FlowDefinition;
}

export default async function lintAiRoutes(app: FastifyInstance) {
  app.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['flow'],
        properties: {
          flow: { type: 'object' },
        },
      },
    },
  }, async (req: FastifyRequest<{ Body: LintAiBody }>, reply: FastifyReply) => {
    const { flow } = req.body;
    if (!flow) {
      return reply.code(400).send({ error: 'Flow definition is required' });
    }

    // 1. Always run deterministic linter
    const deterministicErrors = validateFlow(flow as FlowDefinition);
    const deterministic = {
      valid: deterministicErrors.length === 0,
      errors: deterministicErrors,
      error_count: deterministicErrors.length,
    };

    // 2. Try AI lint (graceful degradation if no API key)
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return reply.code(503).send({
        error: 'ANTHROPIC_API_KEY not configured',
        deterministic,
      });
    }

    try {
      const client = new Anthropic({ apiKey });
      const flowJson = JSON.stringify(flow, null, 2);

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: LINT_AI_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildLintAiPrompt(flowJson) }],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '[]';
      let issues: unknown[];
      try {
        issues = JSON.parse(text);
      } catch {
        issues = [{ severity: 'info', step_id: null, message: 'AI analysis completed but response was not parseable', recommendation: text }];
      }

      return {
        issues,
        deterministic,
        ai_model: 'claude-sonnet-4-20250514',
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return reply.code(502).send({
        error: `AI service error: ${message}`,
        deterministic,
      });
    }
  });
}
