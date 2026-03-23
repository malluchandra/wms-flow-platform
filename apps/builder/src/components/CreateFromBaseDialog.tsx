'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { ExtensionMode } from '@wms/types';

interface BaseFlow {
  id: string;
  name: string;
  display_name: string;
  version: string;
}

const MODE_INFO: Record<ExtensionMode, { label: string; desc: string; icon: string }> = {
  use: { label: 'Use', desc: 'Run base flow unchanged. Always tracks latest version.', icon: 'link' },
  extend: { label: 'Extend', desc: 'Add steps at extension points. Base steps locked.', icon: 'add_circle' },
  override: { label: 'Override', desc: 'Replace or modify any step. Full editing access.', icon: 'edit' },
  fork: { label: 'Fork', desc: 'Full independent copy. No base flow tracking.', icon: 'fork_right' },
};

interface Props { open: boolean; onClose: () => void; }

export function CreateFromBaseDialog({ open, onClose }: Props) {
  const router = useRouter();
  const [baseFlows, setBaseFlows] = useState<BaseFlow[]>([]);
  const [selectedBase, setSelectedBase] = useState('');
  const [mode, setMode] = useState<ExtensionMode>('extend');
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      fetch('/api/extensions/base-flows')
        .then((r) => r.json())
        .then((data) => setBaseFlows(data.flows ?? []))
        .catch(() => setError('Failed to load base flows'));
    }
  }, [open]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/extensions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseFlowId: selectedBase, mode, name, displayName }),
      });
      if (!res.ok) { const body = await res.json(); throw new Error(body.error || 'Failed'); }
      const { flow } = await res.json();
      router.push(`/flows/${flow.id}`);
      router.refresh();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div style={{ width: '520px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--brand)', marginBottom: '16px' }}>Create from Base Flow</h2>
        {error && <div style={{ padding: '8px 12px', marginBottom: '12px', background: 'var(--err-lt)', border: '1px solid var(--err)', borderRadius: '4px', color: 'var(--err)', fontSize: '12px' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Base Flow</label>
            <select value={selectedBase} onChange={(e) => setSelectedBase(e.target.value)} required style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg)' }}>
              <option value="">Select a base flow...</option>
              {baseFlows.map((f) => <option key={f.id} value={f.id}>{f.display_name} (v{f.version})</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>Extension Mode</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {(Object.entries(MODE_INFO) as [ExtensionMode, typeof MODE_INFO['use']][]).map(([key, info]) => (
                <button key={key} type="button" onClick={() => setMode(key)}
                  style={{ padding: '10px 12px', border: `2px solid ${mode === key ? 'var(--accent)' : 'var(--border)'}`, borderRadius: '6px', background: mode === key ? 'var(--accent-lt)' : 'var(--bg)', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span className="ms" style={{ fontSize: '16px', color: mode === key ? 'var(--accent)' : 'var(--text-muted)' }}>{info.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: mode === key ? 'var(--accent)' : 'var(--text)' }}>{info.label}</span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>{info.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Flow Name (slug)</label>
              <input value={name} onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} required placeholder="partner-picking" style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg)', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Display Name</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required placeholder="Partner Picking" style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg)', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg)', cursor: 'pointer', color: 'var(--text)' }}>Cancel</button>
            <button type="submit" disabled={loading || !selectedBase} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, border: 'none', borderRadius: '4px', background: loading ? 'var(--brand-lt)' : 'var(--brand)', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer' }}>{loading ? 'Creating...' : 'Create Flow'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
