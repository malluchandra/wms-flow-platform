'use client';

import type { StepPreviewConfig } from '@/lib/step-preview';

interface StepPreviewProps {
  config: StepPreviewConfig;
}

export function StepPreview({ config }: StepPreviewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header bar */}
      <div style={{
        padding: '24px 16px 12px', background: 'var(--brand)', color: '#fff',
        fontSize: '14px', fontWeight: 600, textAlign: 'center',
      }}>
        {config.header}
      </div>

      {/* Content area */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {config.elements.map((el, i) => (
          <PreviewElement key={i} element={el} />
        ))}
      </div>

      {/* Button bar */}
      {config.buttons.length > 0 && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
          {config.buttons.map((btn, i) => (
            <button key={i} style={{
              flex: 1, padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'default',
              background: btn.style === 'primary' ? 'var(--brand)' : btn.style === 'danger' ? 'var(--err)' : 'var(--bg-muted)',
              color: btn.style === 'secondary' ? 'var(--text)' : '#fff',
            }}>
              {btn.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PreviewElement({ element }: { element: { kind: string; [key: string]: unknown } }) {
  switch (element.kind) {
    case 'scan-input':
      return (
        <div style={{ border: '2px dashed var(--accent)', borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
          <span className="ms" style={{ fontSize: '32px', color: 'var(--accent)' }}>barcode_scanner</span>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>{element.placeholder as string}</p>
        </div>
      );
    case 'location-card': {
      const fields = element.fields as Record<string, string>;
      return (
        <div style={{ background: 'var(--accent-lt)', borderRadius: '8px', padding: '16px' }}>
          {Object.entries(fields).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{k}</span>
              <span style={{ fontWeight: 600, color: 'var(--brand)' }}>{v}</span>
            </div>
          ))}
        </div>
      );
    }
    case 'number-keypad':
      return (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--brand)', padding: '16px' }}>0</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Target: {element.target as string} {element.uom as string}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', marginTop: '12px' }}>
            {[1,2,3,4,5,6,7,8,9,'.',0,'⌫'].map((n) => (
              <div key={n} style={{ padding: '10px', background: 'var(--bg-muted)', borderRadius: '4px', textAlign: 'center', fontSize: '14px', fontWeight: 500 }}>{n}</div>
            ))}
          </div>
        </div>
      );
    case 'summary-card': {
      const fields = element.fields as Record<string, string>;
      return (
        <div style={{ background: 'var(--bg-subtle)', borderRadius: '8px', padding: '16px', border: '1px solid var(--border)' }}>
          {Object.entries(fields).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', borderBottom: '1px solid var(--bg-muted)' }}>
              <span style={{ color: 'var(--text-muted)' }}>{k.replace(/_/g, ' ')}</span>
              <span className="mono" style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      );
    }
    case 'option-list':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {(element.items as string[]).map((item, i) => (
            <div key={i} style={{ padding: '12px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px', fontWeight: 500 }}>
              {item}
            </div>
          ))}
        </div>
      );
    case 'message-body': {
      const sev = element.severity as string;
      const bgMap: Record<string, string> = { error: 'var(--err-lt)', success: 'var(--success-lt)', info: 'var(--accent-lt)' };
      const colorMap: Record<string, string> = { error: 'var(--err)', success: 'var(--success)', info: 'var(--accent)' };
      return (
        <div style={{ background: bgMap[sev] ?? bgMap.info, borderRadius: '8px', padding: '16px', color: colorMap[sev] ?? colorMap.info, fontSize: '13px', lineHeight: 1.5 }}>
          {element.text as string}
        </div>
      );
    }
    case 'camera-viewfinder':
      return (
        <div style={{ border: '2px dashed var(--text-xmuted)', borderRadius: '8px', padding: '40px', textAlign: 'center', background: 'var(--bg-muted)' }}>
          <span className="ms" style={{ fontSize: '36px', color: 'var(--text-xmuted)' }}>photo_camera</span>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>Camera viewfinder</p>
        </div>
      );
    case 'loading-spinner':
      return (
        <div style={{ textAlign: 'center', padding: '32px' }}>
          <span className="ms" style={{ fontSize: '32px', color: 'var(--accent)', animation: 'spin 1s linear infinite' }}>sync</span>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>Calling API...</p>
        </div>
      );
    case 'printer-status':
      return (
        <div style={{ textAlign: 'center', padding: '32px' }}>
          <span className="ms" style={{ fontSize: '32px', color: 'var(--text-muted)' }}>print</span>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>Sending to printer...</p>
        </div>
      );
    case 'hint':
      return <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>{element.text as string}</p>;
    default:
      return null;
  }
}
