import { getFlow, saveFlowDefinition } from '@/lib/actions';
import { FlowCanvas } from '@/components/FlowCanvas';
import { AISidebar } from '@/components/AISidebar';
import { notFound } from 'next/navigation';
import type { FlowDefinition } from '@wms/types';

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
    <div className="flex flex-col h-full">
      <div className="border-b bg-white px-6 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">{flow.display_name}</h2>
          <div className="text-sm text-gray-500">
            {flow.name} v{flow.version} &middot;
            <span className={`ml-1 ${flow.is_active ? 'text-green-600' : 'text-gray-400'}`}>
              {flow.is_active ? 'Active' : 'Inactive'}
            </span>
            &middot; {flow.environment.toUpperCase()}
          </div>
        </div>
      </div>
      <div className="flex-1">
        <FlowCanvas flow={definition} flowId={flow.id} onSave={handleSave} />
        <AISidebar flowJson={JSON.stringify(definition)} />
      </div>
    </div>
  );
}
