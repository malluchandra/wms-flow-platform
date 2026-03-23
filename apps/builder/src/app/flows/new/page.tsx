import { createFlow } from '@/lib/actions';
import { redirect } from 'next/navigation';
import type { FlowDefinition } from '@wms/types';

export default function NewFlowPage() {
  async function handleCreate(formData: FormData) {
    'use server';
    const name = formData.get('name') as string;
    const displayName = formData.get('display_name') as string;
    const version = formData.get('version') as string || '1.0.0';
    const environment = formData.get('environment') as string || 'dev';

    const emptyFlow: FlowDefinition = {
      id: `${name}-v${version}`,
      name,
      version,
      display_name: displayName,
      extends: null,
      context_schema: {},
      entry_step: 'start',
      steps: [
        {
          id: 'start',
          type: 'message',
          prompt: 'Start',
          body: 'Flow started',
          severity: 'info',
          on_dismiss: '__exit__',
        },
        {
          id: 'exception-handler',
          type: 'menu_select',
          prompt: 'Exception',
          options: [
            { label: 'Cancel', value: 'cancel', next_step: '__exit__' },
          ],
        },
      ],
    };

    const flow = await createFlow({
      name,
      display_name: displayName,
      version,
      environment,
      definition: emptyFlow,
    });
    redirect(`/flows/${flow.id}`);
  }

  return (
    <div className="p-8 max-w-lg">
      <h2 className="text-2xl font-bold mb-6">New Flow</h2>
      <form action={handleCreate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name (kebab-case)</label>
          <input name="name" required placeholder="outbound-picking"
            className="w-full border rounded p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Display Name</label>
          <input name="display_name" required placeholder="Outbound Picking"
            className="w-full border rounded p-2" />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Version</label>
            <input name="version" defaultValue="1.0.0" className="w-full border rounded p-2" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Environment</label>
            <select name="environment" defaultValue="dev" className="w-full border rounded p-2">
              <option value="dev">DEV</option>
              <option value="qa">QA</option>
              <option value="prod">PROD</option>
            </select>
          </div>
        </div>
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          Create Flow
        </button>
      </form>
    </div>
  );
}
