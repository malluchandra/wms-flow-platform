import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp, loginAsWorker, prisma } from './helpers.js';

describe('Session routes', () => {
  let app: FastifyInstance;
  let token: string;
  let workerId: string;
  let flowId: string;
  let taskId: string;

  beforeAll(async () => {
    app = await buildTestApp();
    const login = await loginAsWorker(app);
    token = login.token;
    workerId = login.workerId;

    const flow = await prisma.flowDefinition.findFirst({
      where: { name: 'outbound-picking' },
    });
    flowId = flow!.id;

    const task = await prisma.task.findFirst({
      where: { status: 'unassigned' },
      include: { task_lines: true },
    });
    taskId = task!.id;
  });

  afterAll(async () => {
    // Clean up any sessions created during tests
    await prisma.workerSession.deleteMany({
      where: { worker_id: workerId },
    });
    await app.close();
  });

  describe('POST /sessions', () => {
    it('creates a new session with initial context', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/sessions',
        headers: { authorization: `Bearer ${token}` },
        payload: { flow_id: flowId, task_id: taskId },
      });
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body.id).toBeDefined();
      expect(body.status).toBe('active');
      expect(body.step_index).toBe(0);
      expect(body.state_data.task_id).toBe(taskId);
      expect(body.state_data.task_line).toBeDefined();
      expect(body.state_data.task_line.item).toBeDefined();
      expect(body.state_data.task_line.location).toBeDefined();

      // Clean up
      await prisma.workerSession.delete({ where: { id: body.id } });
    });

    it('returns 400 if flow_id is missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/sessions',
        headers: { authorization: `Bearer ${token}` },
        payload: { task_id: taskId },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /sessions/:workerId/active', () => {
    it('returns active session for worker', async () => {
      // Create a session first
      const createRes = await app.inject({
        method: 'POST',
        url: '/sessions',
        headers: { authorization: `Bearer ${token}` },
        payload: { flow_id: flowId, task_id: taskId },
      });
      const session = JSON.parse(createRes.payload);

      const res = await app.inject({
        method: 'GET',
        url: `/sessions/${workerId}/active`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.id).toBe(session.id);
      expect(body.status).toBe('active');
      expect(body.flow).toBeDefined();

      // Clean up
      await prisma.workerSession.delete({ where: { id: session.id } });
    });

    it('returns 404 when no active session exists', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/sessions/${workerId}/active`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /sessions/:id/step', () => {
    it('commits step and advances step_index', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/sessions',
        headers: { authorization: `Bearer ${token}` },
        payload: { flow_id: flowId, task_id: taskId },
      });
      const session = JSON.parse(createRes.payload);

      const res = await app.inject({
        method: 'POST',
        url: `/sessions/${session.id}/step`,
        headers: { authorization: `Bearer ${token}` },
        payload: {
          step_id: 'navigate-to-location',
          state_data: { location_confirmed: false },
        },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.step_index).toBe(1);
      expect(body.state_data.location_confirmed).toBe(false);

      // Clean up
      await prisma.workerSession.delete({ where: { id: session.id } });
    });
  });

  describe('POST /sessions/:id/advance-line', () => {
    it('advances to next task line when more lines exist', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/sessions',
        headers: { authorization: `Bearer ${token}` },
        payload: { flow_id: flowId, task_id: taskId },
      });
      const session = JSON.parse(createRes.payload);

      const res = await app.inject({
        method: 'POST',
        url: `/sessions/${session.id}/advance-line`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      // Response shape matches what the flow JSON expects
      expect(typeof body.has_more).toBe('boolean');
      expect(typeof body.current_line_index).toBe('number');

      // Clean up
      await prisma.workerSession.delete({ where: { id: session.id } });
    });
  });

  describe('POST /sessions/:id/abandon', () => {
    it('marks session as abandoned and returns task to pool', async () => {
      // Assign the task to the worker first
      await prisma.task.update({
        where: { id: taskId },
        data: { assigned_to: workerId, status: 'in_progress' },
      });

      const createRes = await app.inject({
        method: 'POST',
        url: '/sessions',
        headers: { authorization: `Bearer ${token}` },
        payload: { flow_id: flowId, task_id: taskId },
      });
      const session = JSON.parse(createRes.payload);

      const res = await app.inject({
        method: 'POST',
        url: `/sessions/${session.id}/abandon`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.status).toBe('abandoned');

      // Task should be returned to unassigned
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      expect(task!.status).toBe('unassigned');
      expect(task!.assigned_to).toBeNull();

      // Clean up session
      await prisma.workerSession.delete({ where: { id: session.id } });
    });
  });
});
