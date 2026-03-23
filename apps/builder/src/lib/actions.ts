'use server';

import { prisma } from './db';
import { revalidatePath } from 'next/cache';
import type { FlowDefinition } from '@wms/types';

// For MVP, use the first tenant (korber-internal)
async function getDefaultTenantId(): Promise<string> {
  const tenant = await prisma.tenant.findFirst();
  return tenant!.id;
}

export async function getFlows() {
  const tenantId = await getDefaultTenantId();
  return prisma.flowDefinition.findMany({
    where: { tenant_id: tenantId },
    orderBy: { created_at: 'desc' },
  });
}

export async function getFlow(id: string) {
  return prisma.flowDefinition.findUnique({ where: { id } });
}

export async function createFlow(data: {
  name: string;
  display_name: string;
  version: string;
  environment: string;
  definition: FlowDefinition;
}) {
  const tenantId = await getDefaultTenantId();
  const flow = await prisma.flowDefinition.create({
    data: {
      tenant_id: tenantId,
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
  await prisma.flowDefinition.update({
    where: { id },
    data: { definition: definition as any },
  });
  revalidatePath('/');
  revalidatePath(`/flows/${id}`);
}

export async function toggleFlowActive(id: string) {
  const flow = await prisma.flowDefinition.findUnique({ where: { id } });
  if (!flow) return;
  await prisma.flowDefinition.update({
    where: { id },
    data: { is_active: !flow.is_active },
  });
  revalidatePath('/');
}

export async function deleteFlow(id: string) {
  await prisma.flowDefinition.delete({ where: { id } });
  revalidatePath('/');
}
