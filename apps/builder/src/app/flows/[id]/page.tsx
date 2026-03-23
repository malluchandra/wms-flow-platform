import { getFlow, saveFlowDefinition } from '@/lib/actions';
import { notFound } from 'next/navigation';
import type { FlowDefinition } from '@wms/types';
import { FlowEditorClient } from './FlowEditorClient';

export const dynamic = 'force-dynamic';

export default async function FlowEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const flow = await getFlow(id);
  if (!flow) notFound();

  const definition = flow.definition as unknown as FlowDefinition;

  async function handleSave(updatedDefinition: FlowDefinition) {
    'use server';
    await saveFlowDefinition(id, updatedDefinition);
  }

  return (
    <FlowEditorClient
      flowId={flow.id}
      flowName={flow.name}
      flowVersion={flow.version}
      displayName={flow.display_name}
      environment={flow.environment}
      initialFlow={definition}
      onSave={handleSave}
    />
  );
}
