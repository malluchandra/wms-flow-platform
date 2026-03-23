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
    // Reset any tasks that were marked in_progress during session creation
    await prisma.task.updateMany({
      where: { assigned_to: workerId },
      data: { status: 'unassigned', assigned_to: null, assigned_at: null },
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

      // Clean up session and reset task state
      await prisma.workerSession.delete({ where: { id: body.id } });
      await prisma.task.update({
        where: { id: taskId },
        data: { status: 'unassigned', assigned_to: null, assigned_at: null },
      });
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

    it('returns 404 if flow does not belong to tenant', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/sessions',
        headers: { authorization: `Bearer ${token}` },
        payload: { flow_id: '00000000-0000-0000-0000-000000000000', task_id: taskId },
      });
      expect(res.statusCode).toBe(404);
      const body = JSON.parse(res.payload);
      expect(body.error).toBe('Flow not found');
    });

    it('returns 409 if worker already has an active session', async () => {
      // Create first session
      const firstRes = await app.inject({
        method: 'POST',
        url: '/sessions',
        headers: { authorization: `Bearer ${token}` },
        payload: { flow_id: flowId },
      });
      expect(firstRes.statusCode).toBe(201);
      const firstSession = JSON.parse(firstRes.payload);

      // Attempt to create a second session while first is active
      const secondRes = await app.inject({
        method: 'POST',
        url: '/sessions',
        headers: { authorization: `Bearer ${token}` },
        payload: { flow_id: flowId },
      });
      expect(secondRes.statusCode).toBe(409);
      const body = JSON.parse(secondRes.payload);
      expect(body.session_id).toBe(firstSession.id);

      // Clean up
      await prisma.workerSession.delete({ where: { id: firstSession.id } });
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

      // Clean up session and reset task state
      await prisma.workerSession.delete({ where: { id: session.id } });
      await prisma.task.update({
        where: { id: taskId },
        data: { status: 'unassigned', assigned_to: null, assigned_at: null },
      });
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
      expect(body.state_data.last_step_id).toBe('navigate-to-location');

      // Clean up session and reset task state
      await prisma.workerSession.delete({ where: { id: session.id } });
      await prisma.task.update({
        where: { id: taskId },
        data: { status: 'unassigned', assigned_to: null, assigned_at: null },
      });
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

      // Clean up session and reset task state
      await prisma.workerSession.delete({ where: { id: session.id } });
      await prisma.task.update({
        where: { id: taskId },
        data: { status: 'unassigned', assigned_to: null, assigned_at: null },
      });
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
