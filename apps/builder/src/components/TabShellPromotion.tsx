export function TabShellPromotion() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2.5"
        style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}
      >
        <span className="ms" style={{ fontSize: '18px', color: 'var(--brand)' }}>rocket_launch</span>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brand)' }}>Promotion Pipeline</span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>
          Promotion requires linter pass + 2 approvals
        </span>
      </div>

      {/* Three-column pipeline */}
      <div className="flex-1 flex overflow-hidden">
        {/* DEV */}
        <div className="env-col">
          <div className="env-col-header">
            <span className="env-badge env-dev" style={{ marginBottom: '10px', display: 'inline-block' }}>DEV</span>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--brand)' }}>v1.0.0-dev</div>
            <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Latest draft
            </div>
          </div>
          <div className="flex-1 p-4 flex flex-col gap-2.5 overflow-y-auto">
            <div className="stat-card" style={{ borderLeft: '3px solid var(--success)' }}>
              <div className="prop-label">Linter</div>
              <div className="flex items-center gap-1" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--success)' }}>
                <span className="ms-fill" style={{ fontSize: '16px' }}>check_circle</span>
                Pass
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-num">0</div>
              <div className="stat-lbl">Workers active (dev)</div>
            </div>
          </div>
        </div>

        {/* Arrow DEV->QA */}
        <div className="promote-arrow">
          <span className="ms" style={{ fontSize: '20px', color: 'var(--text-xmuted)' }}>arrow_forward</span>
          <button className="btn-primary" style={{ whiteSpace: 'nowrap' }}>Promote to QA</button>
          <span style={{ fontSize: '9px', color: 'var(--text-xmuted)', textAlign: 'center', maxWidth: '80px', lineHeight: 1.4 }}>
            Linter + GitHub Actions auto-run
          </span>
        </div>

        {/* QA */}
        <div className="env-col">
          <div className="env-col-header">
            <span className="env-badge env-qa" style={{ marginBottom: '10px', display: 'inline-block' }}>QA</span>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--brand)' }}>v0.9.2</div>
            <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
              2 days ago
            </div>
          </div>
          <div className="flex-1 p-4 flex flex-col gap-2.5 overflow-y-auto">
            <div className="stat-card" style={{ borderLeft: '3px solid var(--success)' }}>
              <div className="prop-label">Device Tests</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--success)' }}>24 / 24 passed</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">3</div>
              <div className="stat-lbl">QA workers validating</div>
            </div>
          </div>
        </div>

        {/* Arrow QA->PROD */}
        <div className="promote-arrow">
          <span className="ms" style={{ fontSize: '20px', color: 'var(--text-xmuted)' }}>arrow_forward</span>
          <button className="btn-danger" style={{ whiteSpace: 'nowrap' }}>Promote to PROD</button>
          <span style={{ fontSize: '9px', color: 'var(--text-xmuted)', textAlign: 'center', maxWidth: '80px', lineHeight: 1.4 }}>
            Requires 2 approvals
          </span>
        </div>

        {/* PROD */}
        <div className="env-col" style={{ borderRight: 'none' }}>
          <div className="env-col-header">
            <span className="env-badge env-prod" style={{ marginBottom: '10px', display: 'inline-block' }}>PROD</span>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--brand)' }}>v0.9.1</div>
            <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
              8 days ago
            </div>
          </div>
          <div className="flex-1 p-4 flex flex-col gap-2.5 overflow-y-auto">
            <div className="stat-card" style={{ borderLeft: '3px solid var(--success)' }}>
              <div className="prop-label">Status</div>
              <div className="flex items-center gap-1.5" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--success)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
                LIVE
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-num">8</div>
              <div className="stat-lbl">Live warehouse workers</div>
            </div>
            <button className="btn-ghost flex items-center justify-center gap-1.5 mt-auto">
              <span className="ms" style={{ fontSize: '16px' }}>undo</span>
              Instant Rollback
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
