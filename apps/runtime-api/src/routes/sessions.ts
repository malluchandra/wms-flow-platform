import { randomUUID } from 'node:crypto';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

interface CreateSessionBody {
  flow_id: string;
  task_id?: string;
  device_id?: string;
}

interface CommitStepBody {
  step_id: string;
  state_data: Record<string, unknown>;
}

export default async function sessionRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate);

  // POST /sessions — create worker session
  app.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['flow_id'],
        properties: {
          flow_id: { type: 'string' },
          task_id: { type: 'string' },
          device_id: { type: 'string' },
        },
      },
    },
  }, async (req: FastifyRequest<{ Body: CreateSessionBody }>, reply: FastifyReply) => {
    const { flow_id, task_id, device_id } = req.body;
    const workerId = req.user.sub;
    const tenantId = req.user.tenant_id;

    // Verify the flow belongs to this tenant
    const flow = await app.prisma.flowDefinition.findFirst({
      where: { id: flow_id, tenant_id: tenantId },
    });
    if (!flow) {
      return reply.code(404).send({ error: 'Flow not found' });
    }

    // Check for existing active session (prevent duplicates)
    const existingSession = await app.prisma.workerSession.findFirst({
      where: { worker_id: workerId, status: 'active' },
    });
    if (existingSession) {
      return reply.code(409).send({ error: 'Worker already has an active session', session_id: existingSession.id });
    }

    // Pre-generate UUID so we can include session_id in state_data in a single insert
    const sessionId = randomUUID();

    // Build initial state_data with first task line
    const stateData: Record<string, unknown> = {
      worker_id: workerId,
      session_id: sessionId,
    };

    if (task_id) {
      stateData.task_id = task_id;

      // Load task lines with expanded item/location data
      const taskLines = await app.prisma.taskLine.findMany({
        where: { task_id },
        include: {
          item: { select: { sku: true, name: true, uom: true } },
          location: { select: { barcode: true, zone: true, aisle: true, bay: true, level: true } },
        },
        orderBy: { id: 'asc' },
      });

      stateData.total_lines = taskLines.length;
      stateData.current_line_index = 0;

      if (taskLines.length > 0) {
        const line = taskLines[0];
        stateData.task_line = {
          id: line.id,
          qty_required: Number(line.qty_required),
          status: line.status,
          item: line.item,
          location: line.location,
        };
      }

      // Mark task as in_progress (scoped to tenant for safety)
      await app.prisma.task.updateMany({
        where: { id: task_id, tenant_id: tenantId },
        data: { assigned_to: workerId, status: 'in_progress', assigned_at: new Date() },
      });
    }

    const session = await app.prisma.workerSession.create({
      data: {
        id: sessionId,
        worker_id: workerId,
        flow_id,
        task_id: task_id ?? null,
        state_data: stateData,
        status: 'active',
        device_id: device_id ?? null,
      },
    });

    return reply.code(201).send(session);
  });

  // GET /sessions/:workerId/active — crash recovery lookup
  app.get('/:workerId/active', async (
    req: FastifyRequest<{ Params: { workerId: string } }>,
    reply: FastifyReply
  ) => {
    const { workerId } = req.params;
    const tenantId = req.user.tenant_id;

    const session = await app.prisma.workerSession.findFirst({
      where: {
        worker_id: workerId,
        status: 'active',
        worker: { tenant_id: tenantId },  // tenant isolation
      },
      include: {
        flow: true,
      },
      orderBy: { started_at: 'desc' },
    });

    if (!session) {
      return reply.code(404).send({ error: 'No active session' });
    }

    return session;
  });

  // POST /sessions/:id/step — commit step completion
  app.post('/:id/step', {
    schema: {
      body: {
        type: 'object',
        required: ['step_id'],
        properties: {
          step_id: { type: 'string' },
          state_data: { type: 'object' },
        },
      },
    },
  }, async (req: FastifyRequest<{
    Params: { id: string };
    Body: CommitStepBody;
  }>, reply: FastifyReply) => {
    const { id } = req.params;
    const { step_id, state_data } = req.body;

    const session = await app.prisma.workerSession.findUnique({
      where: { id },
    });

    if (!session) {
      return reply.code(404).send({ error: 'Session not found' });
    }

    // Ownership check
    if (session.worker_id !== req.user.sub) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    // Merge new state_data into existing, and persist the last committed step_id
    const existingState = session.state_data as Record<string, unknown>;
    const mergedState = { ...existingState, ...state_data, last_step_id: step_id };

    const updated = await app.prisma.workerSession.update({
      where: { id },
      data: {
        step_index: session.step_index + 1,
        state_data: mergedState,
      },
    });

    return updated;
  });

  // POST /sessions/:id/advance-line — advance to next task line
  app.post('/:id/advance-line', async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    const { id } = req.params;

    const session = await app.prisma.workerSession.findUnique({
      where: { id },
    });

    if (!session) {
      return reply.code(404).send({ error: 'Session not found' });
    }

    // Ownership check
    if (session.worker_id !== req.user.sub) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const stateData = session.state_data as Record<string, unknown>;
    const currentIndex = (stateData.current_line_index as number) ?? 0;
    const taskId = stateData.task_id as string;

    if (!taskId) {
      return reply.code(400).send({ error: 'Session has no associated task' });
    }

    // Load all task lines for this task
    const taskLines = await app.prisma.taskLine.findMany({
      where: { task_id: taskId },
      include: {
        item: { select: { sku: true, name: true, uom: true } },
        location: { select: { barcode: true, zone: true, aisle: true, bay: true, level: true } },
      },
      orderBy: { id: 'asc' },
    });

    const nextIndex = currentIndex + 1;
    const hasMore = nextIndex < taskLines.length;

    if (hasMore) {
      const line = taskLines[nextIndex];
      const nextTaskLine = {
        id: line.id,
        qty_required: Number(line.qty_required),
        status: line.status,
        item: line.item,
        location: line.location,
      };

      // Update session state
      await app.prisma.workerSession.update({
        where: { id },
        data: {
          state_data: {
            ...stateData,
            current_line_index: nextIndex,
            task_line: nextTaskLine,
          },
        },
      });

      return { has_more: true, current_line_index: nextIndex, next_task_line: nextTaskLine };
    }

    // No more lines — mark session complete
    await app.prisma.workerSession.update({
      where: { id },
      data: {
        status: 'completed',
        state_data: { ...stateData, current_line_index: nextIndex },
      },
    });

    return { has_more: false, current_line_index: nextIndex, next_task_line: null };
  });

  // POST /sessions/:id/abandon — abandon session, return task to pool
  app.post('/:id/abandon', async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    const { id } = req.params;

    const session = await app.prisma.workerSession.findUnique({
      where: { id },
    });

    if (!session) {
      return reply.code(404).send({ error: 'Session not found' });
    }

    // Ownership check
    if (session.worker_id !== req.user.sub) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    // Mark session abandoned
    const updated = await app.prisma.workerSession.update({
      where: { id },
      data: { status: 'abandoned' },
    });

    // Return task to unassigned pool
    if (session.task_id) {
      await app.prisma.task.update({
        where: { id: session.task_id },
        data: { status: 'unassigned', assigned_to: null, assigned_at: null },
      });
    }

    return updated;
  });
}
