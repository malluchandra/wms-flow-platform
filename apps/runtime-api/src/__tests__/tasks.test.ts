import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp, loginAsWorker, prisma } from './helpers.js';

describe('Task routes', () => {
  let app: FastifyInstance;
  let token: string;
  let workerId: string;

  beforeAll(async () => {
    app = await buildTestApp();
    const login = await loginAsWorker(app);
    token = login.token;
    workerId = login.workerId;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /tasks/assigned/:workerId', () => {
    it('returns tasks assigned to worker', async () => {
      // Assign a task to this worker
      const task = await prisma.task.findFirst({ where: { status: 'unassigned' } });
      await prisma.task.update({
        where: { id: task!.id },
        data: { assigned_to: workerId, status: 'assigned' },
      });

      const res = await app.inject({
        method: 'GET',
        url: `/tasks/assigned/${workerId}`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.length).toBeGreaterThanOrEqual(1);
      expect(body[0].assigned_to).toBe(workerId);

      // Clean up
      await prisma.task.update({
        where: { id: task!.id },
        data: { assigned_to: null, status: 'unassigned' },
      });
    });

    it('returns empty array when no tasks assigned', async () => {
      // Ensure no tasks assigned to this worker
      await prisma.task.updateMany({
        where: { assigned_to: workerId },
        data: { assigned_to: null, status: 'unassigned' },
      });

      const res = await app.inject({
        method: 'GET',
        url: `/tasks/assigned/${workerId}`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body).toEqual([]);
    });
  });

  describe('POST /tasks/:id/lines/:lineId/complete', () => {
    it('completes a task line and updates inventory', async () => {
      const task = await prisma.task.findFirst({
        where: { status: 'unassigned' },
        include: { task_lines: { include: { item: true, location: true } } },
      });
      const line = task!.task_lines[0];

      // Ensure inventory exists for this item+location
      const inventory = await prisma.inventory.findFirst({
        where: { item_id: line.item_id, location_id: line.location_id },
      });

      // Pick the full qty_required so the line is marked complete
      const qtyToPick = Number(line.qty_required);

      const res = await app.inject({
        method: 'POST',
        url: `/tasks/${task!.id}/lines/${line.id}/complete`,
        headers: { authorization: `Bearer ${token}` },
        payload: { qty_picked: qtyToPick },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(Number(body.qty_picked)).toBe(qtyToPick);
      expect(body.status).toBe('complete');
      expect(body.picked_by).toBe(workerId);

      // Verify inventory was decremented (if inventory record existed)
      if (inventory) {
        const updatedInv = await prisma.inventory.findFirst({
          where: { id: inventory.id },
        });
        expect(Number(updatedInv!.qty_on_hand)).toBe(
          Number(inventory.qty_on_hand) - qtyToPick
        );
      }

      // Reset task line for other tests
      await prisma.taskLine.update({
        where: { id: line.id },
        data: { qty_picked: 0, status: 'open', picked_by: null, picked_at: null },
      });
      if (inventory) {
        await prisma.inventory.update({
          where: { id: inventory.id },
          data: { qty_on_hand: inventory.qty_on_hand },
        });
      }
    });

    it('returns 404 for non-existent line', async () => {
      const task = await prisma.task.findFirst();
      const res = await app.inject({
        method: 'POST',
        url: `/tasks/${task!.id}/lines/00000000-0000-0000-0000-000000000000/complete`,
        headers: { authorization: `Bearer ${token}` },
        payload: { qty_picked: 1 },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /tasks/:id/complete', () => {
    it('marks task as complete', async () => {
      const task = await prisma.task.findFirst({ where: { status: 'unassigned' } });
      // Assign first
      await prisma.task.update({
        where: { id: task!.id },
        data: { assigned_to: workerId, status: 'in_progress' },
      });

      const res = await app.inject({
        method: 'POST',
        url: `/tasks/${task!.id}/complete`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.status).toBe('complete');
      expect(body.completed_at).toBeDefined();

      // Reset
      await prisma.task.update({
        where: { id: task!.id },
        data: { status: 'unassigned', assigned_to: null, completed_at: null },
      });
    });
  });

  describe('POST /tasks/:id/escalate', () => {
    it('creates escalation and returns acknowledgment', async () => {
      const task = await prisma.task.findFirst();

      const res = await app.inject({
        method: 'POST',
        url: `/tasks/${task!.id}/escalate`,
        headers: { authorization: `Bearer ${token}` },
        payload: { worker_id: workerId, step_id: 'scan-item' },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.acknowledged).toBe(true);
    });
  });
});
