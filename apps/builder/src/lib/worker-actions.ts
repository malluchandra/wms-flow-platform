'use server';

import { prisma } from './db';
import { revalidatePath } from 'next/cache';
import { requireRole } from './auth-guard';

export async function listWorkers() {
  const user = await requireRole('admin');
  return prisma.worker.findMany({
    where: { tenant_id: user.tenant_id },
    orderBy: { created_at: 'desc' },
    select: { id: true, tenant_id: true, name: true, badge_id: true, role: true, is_active: true, created_at: true },
  });
}

export async function createWorker(data: { name: string; badge_id: string; role: string }) {
  const user = await requireRole('admin');
  const worker = await prisma.worker.create({
    data: { tenant_id: user.tenant_id, name: data.name, badge_id: data.badge_id, role: data.role, is_active: true },
    select: { id: true, tenant_id: true, name: true, badge_id: true, role: true, is_active: true, created_at: true },
  });
  revalidatePath('/admin/workers');
  return worker;
}

export async function updateWorker(workerId: string, data: { name?: string; role?: string }) {
  const user = await requireRole('admin');
  const target = await prisma.worker.findFirst({ where: { id: workerId, tenant_id: user.tenant_id } });
  if (!target) throw new Error('Worker not found');
  const updated = await prisma.worker.update({
    where: { id: workerId },
    data: { ...(data.name !== undefined && { name: data.name }), ...(data.role !== undefined && { role: data.role }) },
    select: { id: true, tenant_id: true, name: true, badge_id: true, role: true, is_active: true, created_at: true },
  });
  revalidatePath('/admin/workers');
  return updated;
}

export async function deactivateWorker(workerId: string) {
  const user = await requireRole('admin');
  const target = await prisma.worker.findFirst({ where: { id: workerId, tenant_id: user.tenant_id } });
  if (!target) throw new Error('Worker not found');
  const deactivated = await prisma.worker.update({
    where: { id: workerId },
    data: { is_active: false },
    select: { id: true, tenant_id: true, name: true, badge_id: true, role: true, is_active: true, created_at: true },
  });
  revalidatePath('/admin/workers');
  return deactivated;
}
