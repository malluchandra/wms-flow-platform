import { createFlow } from '@/lib/actions';
import { redirect } from 'next/navigation';
import type { FlowDefinition } from '@wms/types';
import Link from 'next/link';

export default function NewFlowPage() {
  async function handleCreate(formData: FormData) {
    'use server';
    const name = formData.get('name') as string;
    const displayName = formData.get('display_name') as string;
    const version = (formData.get('version') as string) || '1.0.0';
    const environment = (formData.get('environment') as string) || 'dev';

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
          options: [{ label: 'Cancel', value: 'cancel', next_step: '__exit__' }],
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
    <div style={{ padding: '32px', maxWidth: '480px', margin: '0 auto' }}>
      {/* Back link */}
      <Link
        href="/"
        className="flex items-center gap-1 mb-4"
        style={{ fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'none' }}
      >
        <span className="ms" style={{ fontSize: '14px' }}>arrow_back</span>
        Back to Flows
      </Link>

      <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand)', marginBottom: '20px' }}>
        New Flow
      </h2>

      <form action={handleCreate} className="flex flex-col gap-4">
        <div>
          <div className="prop-label" style={{ marginBottom: '6px' }}>Name (kebab-case)</div>
          <input
            name="name"
            required
            placeholder="outbound-picking"
            className="prop-input"
            style={{ fontSize: '12px' }}
          />
        </div>
        <div>
          <div className="prop-label" style={{ marginBottom: '6px' }}>Display Name</div>
          <input
            name="display_name"
            required
            placeholder="Outbound Picking"
            className="prop-input"
            style={{ fontSize: '12px' }}
          />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="prop-label" style={{ marginBottom: '6px' }}>Version</div>
            <input
              name="version"
              defaultValue="1.0.0"
              className="prop-input"
              style={{ fontSize: '12px' }}
            />
          </div>
          <div className="flex-1">
            <div className="prop-label" style={{ marginBottom: '6px' }}>Environment</div>
            <select name="environment" defaultValue="dev" className="prop-input" style={{ fontSize: '12px' }}>
              <option value="dev">DEV</option>
              <option value="qa">QA</option>
              <option value="prod">PROD</option>
            </select>
          </div>
        </div>
        <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
          Create Flow
        </button>
      </form>
    </div>
  );
}
