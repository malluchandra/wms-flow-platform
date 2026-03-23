import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

interface CompleteLineBody {
  qty_picked: number;
  lot_number?: string;
}

interface EscalateBody {
  worker_id: string;
  step_id: string;
}

export default async function taskRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate);

  // GET /tasks/assigned/:workerId — get current assigned tasks
  app.get('/assigned/:workerId', async (
    req: FastifyRequest<{ Params: { workerId: string } }>,
    reply: FastifyReply
  ) => {
    const { workerId } = req.params;
    const tenantId = req.user.tenant_id;

    const tasks = await app.prisma.task.findMany({
      where: {
        tenant_id: tenantId,
        assigned_to: workerId,
        status: { in: ['assigned', 'in_progress'] },
      },
      include: {
        task_lines: {
          include: {
            item: { select: { sku: true, name: true, uom: true } },
            location: { select: { barcode: true, zone: true, aisle: true, bay: true, level: true } },
          },
        },
      },
      orderBy: { priority: 'asc' },
    });

    return tasks;
  });

  // POST /tasks/:id/lines/:lineId/complete — complete a task line
  app.post('/:id/lines/:lineId/complete', {
    schema: {
      body: {
        type: 'object',
        required: ['qty_picked'],
        properties: {
          qty_picked: { type: 'number' },
          lot_number: { type: 'string' },
        },
      },
    },
  }, async (req: FastifyRequest<{
    Params: { id: string; lineId: string };
    Body: CompleteLineBody;
  }>, reply: FastifyReply) => {
    const { id: taskId, lineId } = req.params;
    const { qty_picked, lot_number } = req.body;
    const workerId = req.user.sub;
    const tenantId = req.user.tenant_id;

    const taskLine = await app.prisma.taskLine.findFirst({
      where: { id: lineId, task_id: taskId },
    });

    if (!taskLine) {
      return reply.code(404).send({ error: 'Task line not found' });
    }

    const isComplete = qty_picked >= Number(taskLine.qty_required);
    const lineStatus = isComplete ? 'complete' : 'short';

    // Update task line
    const updatedLine = await app.prisma.taskLine.update({
      where: { id: lineId },
      data: {
        qty_picked,
        status: lineStatus,
        picked_by: workerId,
        picked_at: new Date(),
        lot_number: lot_number ?? taskLine.lot_number,
      },
    });

    // Update order line qty_picked
    await app.prisma.orderLine.update({
      where: { id: taskLine.order_line_id },
      data: {
        qty_picked: { increment: qty_picked },
        status: isComplete ? 'complete' : 'partial',
      },
    });

    // Decrement inventory
    const inventory = await app.prisma.inventory.findFirst({
      where: {
        tenant_id: tenantId,
        item_id: taskLine.item_id,
        location_id: taskLine.location_id,
      },
    });

    if (inventory) {
      await app.prisma.inventory.update({
        where: { id: inventory.id },
        data: {
          qty_on_hand: { decrement: qty_picked },
        },
      });
    }

    // Audit log
    await app.prisma.auditLog.create({
      data: {
        tenant_id: tenantId,
        actor_id: workerId,
        action: 'task_line.complete',
        entity_type: 'task_line',
        entity_id: lineId,
        after_data: { qty_picked, lot_number, status: lineStatus },
      },
    });

    return updatedLine;
  });

  // POST /tasks/:id/complete — complete entire task
  app.post('/:id/complete', async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    const { id } = req.params;
    const tenantId = req.user.tenant_id;
    const workerId = req.user.sub;

    const task = await app.prisma.task.findFirst({
      where: { id, tenant_id: tenantId },
    });

    if (!task) {
      return reply.code(404).send({ error: 'Task not found' });
    }

    const updated = await app.prisma.task.update({
      where: { id },
      data: {
        status: 'complete',
        completed_at: new Date(),
      },
    });

    // Audit log
    await app.prisma.auditLog.create({
      data: {
        tenant_id: tenantId,
        actor_id: workerId,
        action: 'task.complete',
        entity_type: 'task',
        entity_id: id,
        before_data: { status: task.status },
        after_data: { status: 'complete' },
      },
    });

    // Publish Redis event (if redis is available — tests run with skipRedis)
    if (app.redis) {
      await app.redis.publish(
        `tenant:${tenantId}:supervisor`,
        JSON.stringify({
          type: 'task_completed',
          task_id: id,
          worker_id: workerId,
          tenant_id: tenantId,
          timestamp: new Date().toISOString(),
        })
      );
    }

    return updated;
  });

  // POST /tasks/:id/escalate — escalate to supervisor
  app.post('/:id/escalate', {
    schema: {
      body: {
        type: 'object',
        required: ['worker_id', 'step_id'],
        properties: {
          worker_id: { type: 'string' },
          step_id: { type: 'string' },
        },
      },
    },
  }, async (req: FastifyRequest<{
    Params: { id: string };
    Body: EscalateBody;
  }>, reply: FastifyReply) => {
    const { id: taskId } = req.params;
    const { worker_id, step_id } = req.body;
    const tenantId = req.user.tenant_id;

    // Audit log
    await app.prisma.auditLog.create({
      data: {
        tenant_id: tenantId,
        actor_id: worker_id,
        action: 'task.escalate',
        entity_type: 'task',
        entity_id: taskId,
        after_data: { step_id, escalated_at: new Date().toISOString() },
      },
    });

    // Publish Redis event (if redis is available)
    if (app.redis) {
      await app.redis.publish(
        `tenant:${tenantId}:exceptions`,
        JSON.stringify({
          type: 'exception_escalated',
          task_id: taskId,
          worker_id,
          step_id,
          tenant_id: tenantId,
          timestamp: new Date().toISOString(),
        })
      );
    }

    return { acknowledged: true, task_id: taskId };
  });
}
