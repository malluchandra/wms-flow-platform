export function TabShellEnvHub() {
  const envCards = [
    {
      env: 'DEV',
      cls: 'env-dev',
      borderColor: 'var(--success)',
      version: 'v1.0.0-dev.14',
      updated: '12 min ago',
      status: 'Healthy',
      workers: 0,
      extra: 'Linter: \u2713',
    },
    {
      env: 'QA',
      cls: 'env-qa',
      borderColor: 'var(--warn)',
      version: 'v0.9.2',
      updated: '2 days ago',
      status: 'Healthy',
      workers: 3,
      extra: 'Tests: 24/24',
    },
    {
      env: 'PROD',
      cls: 'env-prod',
      borderColor: 'var(--err)',
      version: 'v0.9.1',
      updated: '8 days ago',
      status: 'Live',
      workers: 8,
      extra: 'Picks: 2,847',
    },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2.5"
        style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}
      >
        <span className="ms" style={{ fontSize: '18px', color: 'var(--brand)' }}>hub</span>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brand)' }}>Environment Hub</span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Read-only view of all deployed environments
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '24px' }}>
        <div className="grid grid-cols-3 gap-4">
          {envCards.map((card) => (
            <div key={card.env} className="stat-card" style={{ borderTop: `3px solid ${card.borderColor}` }}>
              <div className="flex items-center justify-between mb-2.5">
                <span className={`env-badge ${card.cls}`}>{card.env}</span>
                <span
                  className="flex items-center gap-1"
                  style={{ fontSize: '10px', fontWeight: 700, color: 'var(--success)' }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--success)',
                      display: 'inline-block',
                    }}
                  />
                  {card.status}
                </span>
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--brand)', marginBottom: '2px' }}>
                {card.version}
              </div>
              <div className="mono" style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                {card.updated}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div style={{ background: 'var(--bg-subtle)', padding: '8px', borderRadius: '3px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand)' }}>{card.workers}</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Workers</div>
                </div>
                <div style={{ background: 'var(--bg-subtle)', padding: '8px', borderRadius: '3px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--success)' }}>{card.extra.split(': ')[1]}</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{card.extra.split(': ')[0]}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Version History Table */}
        <div className="mt-6">
          <div
            className="flex items-center gap-1.5"
            style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand)', marginBottom: '10px' }}
          >
            <span className="ms" style={{ fontSize: '16px' }}>history</span>
            Version History
          </div>
          <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Version</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Environment</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Deployed</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>By</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Linter</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}></th>
              </tr>
            </thead>
            <tbody>
              {[
                { ver: 'v1.0.0-dev.14', env: 'DEV', envCls: 'env-dev', when: '12 min ago', by: 'You', lint: true, status: 'Draft' },
                { ver: 'v0.9.2', env: 'QA', envCls: 'env-qa', when: '2 days ago', by: 'Jordan', lint: true, status: 'Testing' },
                { ver: 'v0.9.1', env: 'PROD', envCls: 'env-prod', when: '8 days ago', by: 'Alex', lint: true, status: 'Live' },
                { ver: 'v0.9.0', env: 'PROD', envCls: 'env-prod', when: '21 days ago', by: 'Alex', lint: true, status: 'Rolled back' },
                { ver: 'v0.8.5', env: 'QA', envCls: 'env-qa', when: '30 days ago', by: 'Casey', lint: true, status: 'Archived' },
                { ver: 'v0.8.0', env: 'PROD', envCls: 'env-prod', when: '45 days ago', by: 'Alex', lint: true, status: 'Archived' },
              ].map((row) => (
                <tr key={row.ver} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="mono" style={{ padding: '8px 12px', fontWeight: 600 }}>{row.ver}</td>
                  <td style={{ padding: '8px 12px' }}><span className={`env-badge ${row.envCls}`}>{row.env}</span></td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{row.when}</td>
                  <td style={{ padding: '8px 12px' }}>{row.by}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span className="ms-fill" style={{ fontSize: '14px', color: 'var(--success)' }}>check_circle</span>
                  </td>
                  <td style={{ padding: '8px 12px' }}>{row.status}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <button className="btn btn-sm" style={{ fontSize: '10px' }}>Diff</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Runtime Services Health Grid */}
        <div className="mt-6">
          <div
            className="flex items-center gap-1.5"
            style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand)', marginBottom: '10px' }}
          >
            <span className="ms" style={{ fontSize: '16px' }}>dns</span>
            Runtime Services
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { name: 'runtime-api', icon: 'api', pods: '3/3', latency: '12ms', status: 'Healthy' },
              { name: 'realtime', icon: 'sensors', pods: '2/2', latency: '4ms', status: 'Healthy' },
              { name: 'ai-service', icon: 'smart_toy', pods: '1/1', latency: '340ms', status: 'Healthy' },
              { name: 'PostgreSQL', icon: 'database', pods: '1 primary', latency: '3ms', status: 'Healthy' },
            ].map((svc) => (
              <div key={svc.name} className="stat-card">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="ms" style={{ fontSize: '16px', color: 'var(--brand)' }}>{svc.icon}</span>
                  <span style={{ fontSize: '11px', fontWeight: 600 }}>{svc.name}</span>
                  <span
                    style={{
                      marginLeft: 'auto',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--success)',
                      display: 'inline-block',
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Pods: <strong>{svc.pods}</strong></div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Latency: <strong>{svc.latency}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Link to Operations Dashboard */}
        <div className="mt-6 flex justify-end">
          <a
            href="/ops-dashboard"
            className="btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span className="ms" style={{ fontSize: '14px' }}>open_in_new</span>
            Operations Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
