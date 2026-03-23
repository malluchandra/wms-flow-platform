'use server';

import { prisma } from './db';
import { revalidatePath } from 'next/cache';
import { requireAuth, requireRole } from './auth-guard';
import type { FlowDefinition } from '@wms/types';

export async function getFlows() {
  const user = await requireAuth();
  return prisma.flowDefinition.findMany({
    where: { tenant_id: user.tenant_id },
    orderBy: { created_at: 'desc' },
  });
}

export async function getFlow(id: string) {
  const user = await requireAuth();
  return prisma.flowDefinition.findFirst({
    where: { id, tenant_id: user.tenant_id },
  });
}

export async function createFlow(data: {
  name: string;
  display_name: string;
  version: string;
  environment: string;
  definition: FlowDefinition;
}) {
  const user = await requireRole('admin', 'flow-author');
  const flow = await prisma.flowDefinition.create({
    data: {
      tenant_id: user.tenant_id,
      name: data.name,
      display_name: data.display_name,
      version: data.version,
      environment: data.environment,
      definition: data.definition as any,
      is_active: false,
    },
  });
  revalidatePath('/');
  return flow;
}

export async function saveFlowDefinition(id: string, definition: FlowDefinition) {
  const user = await requireRole('admin', 'flow-author');
  const flow = await prisma.flowDefinition.findFirst({
    where: { id, tenant_id: user.tenant_id },
  });
  if (!flow) throw new Error('Flow not found');

  await prisma.flowDefinition.update({
    where: { id },
    data: { definition: definition as any },
  });
  revalidatePath('/');
  revalidatePath(`/flows/${id}`);
}

export async function toggleFlowActive(id: string) {
  const user = await requireRole('admin', 'flow-author');
  const flow = await prisma.flowDefinition.findFirst({
    where: { id, tenant_id: user.tenant_id },
  });
  if (!flow) return;

  await prisma.flowDefinition.update({
    where: { id },
    data: { is_active: !flow.is_active },
  });
  revalidatePath('/');
}

export async function deleteFlow(id: string) {
  const user = await requireRole('admin');
  const flow = await prisma.flowDefinition.findFirst({
    where: { id, tenant_id: user.tenant_id },
  });
  if (!flow) throw new Error('Flow not found');

  await prisma.flowDefinition.delete({ where: { id } });
  revalidatePath('/');
}
