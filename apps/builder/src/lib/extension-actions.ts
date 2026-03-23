'use server';

import { prisma } from './db';
import { revalidatePath } from 'next/cache';
import { requireAuth, requireRole } from './auth-guard';
import { createFromBase } from '@wms/flow-engine';
import type { FlowDefinition, ExtensionMode } from '@wms/types';

export async function getBaseFlows() {
  const user = await requireAuth();
  return prisma.flowDefinition.findMany({
    where: {
      base_flow_id: null,
      is_active: true,
      OR: [
        { tenant_id: user.tenant_id },
        { tenant: { slug: 'korber-internal' } },
      ],
    },
    orderBy: { display_name: 'asc' },
  });
}

interface CreateFromBaseInput {
  baseFlowId: string;
  mode: ExtensionMode;
  name: string;
  displayName: string;
}

export async function createFlowFromBase(input: CreateFromBaseInput) {
  const user = await requireRole('admin', 'flow-author');
  const baseRecord = await prisma.flowDefinition.findUnique({
    where: { id: input.baseFlowId },
  });
  if (!baseRecord) throw new Error('Base flow not found');
  const baseDef = {
    ...(baseRecord.definition as unknown as FlowDefinition),
    id: baseRecord.id,
  };
  const childDef = createFromBase(baseDef, input.mode, {
    name: input.name,
    display_name: input.displayName,
  });
  const flow = await prisma.flowDefinition.create({
    data: {
      tenant_id: user.tenant_id,
      name: input.name,
      display_name: input.displayName,
      base_flow_id: input.baseFlowId,
      version: '1.0.0',
      environment: 'dev',
      definition: childDef as any,
      is_active: false,
    },
  });
  revalidatePath('/');
  return flow;
}
