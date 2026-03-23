import { getFlows, toggleFlowActive, deleteFlow } from '@/lib/actions';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function FlowsPage() {
  const flows = await getFlows();

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
            <rect width="20" height="20" rx="3" fill="#324155" />
            <path d="M5 6h10M5 10h6M5 14h8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand)' }}>Infios Flow Designer</h1>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Manage warehouse workflow definitions</p>
          </div>
        </div>
        <Link href="/flows/new" className="btn-primary" style={{ textDecoration: 'none' }}>
          + New Flow
        </Link>
      </div>

      {flows.length === 0 ? (
        <div
          className="stat-card flex flex-col items-center justify-center"
          style={{ height: '200px', gap: '12px' }}
        >
          <span className="ms" style={{ fontSize: '36px', color: 'var(--text-xmuted)' }}>account_tree</span>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No flows yet. Create one to get started.</p>
          <Link href="/flows/new" className="btn-primary" style={{ textDecoration: 'none' }}>
            + Create First Flow
          </Link>
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)' }}>
                {['Name', 'Version', 'Environment', 'Status', 'Steps', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="prop-label"
                    style={{
                      padding: '10px 14px',
                      textAlign: h === 'Actions' ? 'right' : 'left',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {flows.map((flow) => {
                const def = flow.definition as any;
                const stepCount = def?.steps?.length ?? 0;
                return (
                  <tr
                    key={flow.id}
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <td style={{ padding: '10px 14px' }}>
                      <Link
                        href={`/flows/${flow.id}`}
                        style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}
                      >
                        {flow.display_name}
                      </Link>
                      <div className="mono" style={{ fontSize: '10px', color: 'var(--text-xmuted)', marginTop: '1px' }}>
                        {flow.name}
                      </div>
                    </td>
                    <td className="mono" style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                      {flow.version}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span
                        className={`env-badge ${
                          flow.environment === 'prod'
                            ? 'env-prod'
                            : flow.environment === 'qa'
                              ? 'env-qa'
                              : 'env-dev'
                        }`}
                      >
                        {flow.environment.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <form
                        action={async () => {
                          'use server';
                          await toggleFlowActive(flow.id);
                        }}
                      >
                        <button
                          type="submit"
                          className={`env-badge ${flow.is_active ? 'env-dev' : ''}`}
                          style={
                            !flow.is_active
                              ? {
                                  background: 'var(--bg-muted)',
                                  color: 'var(--text-muted)',
                                  border: '1px solid var(--border)',
                                }
                              : {}
                          }
                        >
                          {flow.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </form>
                    </td>
                    <td className="mono" style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                      {stepCount}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <Link
                        href={`/flows/${flow.id}`}
                        className="btn-ghost btn-sm"
                        style={{ textDecoration: 'none', marginRight: '8px' }}
                      >
                        Edit
                      </Link>
                      <form
                        action={async () => {
                          'use server';
                          await deleteFlow(flow.id);
                        }}
                        style={{ display: 'inline' }}
                      >
                        <button type="submit" className="btn-danger btn-sm">
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
