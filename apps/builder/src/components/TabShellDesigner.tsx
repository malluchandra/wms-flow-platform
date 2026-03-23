export function TabShellDesigner() {
  return (
    <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--bg-muted)' }}>
      <div className="text-center" style={{ maxWidth: '400px' }}>
        <span className="ms" style={{ fontSize: '48px', color: 'var(--text-xmuted)' }}>
          phone_android
        </span>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--brand)', marginTop: '12px' }}>
          UI Designer
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.6 }}>
          Visual phone emulator preview for each step type. Edit screen layouts, button labels,
          and field arrangements without touching JSON.
        </p>
        <div
          className="mt-4 inline-block"
          style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-xmuted)',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '6px 14px',
          }}
        >
          Coming in Phase 2
        </div>
      </div>
    </div>
  );
}
