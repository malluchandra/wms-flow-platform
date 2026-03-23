'use client';

import { useState } from 'react';
import { STEP_TYPES_LIST } from '@/lib/step-meta';
import type { FlowStep } from '@wms/types';

interface StepDetailPanelProps {
  step: FlowStep;
  onUpdate: (updated: FlowStep) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export function StepDetailPanel({ step, onUpdate, onDelete, onDuplicate }: StepDetailPanelProps) {
  const [editing, setEditing] = useState<FlowStep>({ ...step });
  const [showRaw, setShowRaw] = useState(false);

  function handleChange(field: string, value: unknown) {
    setEditing((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    onUpdate(editing);
  }

  const transitionKeys = [
    'on_success', 'on_failure', 'on_confirm', 'on_back',
    'on_dismiss', 'on_skip', 'on_exception', 'on_short_pick',
  ] as const;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
        <div className="prop-label">Selected Step</div>
        <div className="mono" style={{ fontSize: '12px', color: 'var(--brand)', fontWeight: 600 }}>
          {editing.id || '\u2014 click a node \u2014'}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Type */}
        <div className="prop-row">
          <div className="prop-label">Type</div>
          <select
            value={editing.type}
            onChange={(e) => handleChange('type', e.target.value)}
            className="prop-input"
          >
            {STEP_TYPES_LIST.map((m) => (
              <option key={m.type} value={m.type}>{m.type}</option>
            ))}
          </select>
        </div>

        {/* Step ID */}
        <div className="prop-row">
          <div className="prop-label">Step ID</div>
          <input
            className="prop-input"
            value={editing.id}
            onChange={(e) => handleChange('id', e.target.value)}
          />
        </div>

        {/* Prompt */}
        <div className="prop-row">
          <div className="prop-label">Prompt</div>
          <input
            className="prop-input"
            value={editing.prompt}
            onChange={(e) => handleChange('prompt', e.target.value)}
          />
        </div>

        {/* Message-specific: body, severity */}
        {editing.type === 'message' && (
          <>
            <div className="prop-row">
              <div className="prop-label">Body</div>
              <textarea
                className="prop-input"
                style={{ height: '60px', resize: 'none' }}
                value={editing.body ?? ''}
                onChange={(e) => handleChange('body', e.target.value)}
              />
            </div>
            <div className="prop-row">
              <div className="prop-label">Severity</div>
              <select
                className="prop-input"
                value={editing.severity ?? 'info'}
                onChange={(e) => handleChange('severity', e.target.value)}
              >
                <option value="info">info</option>
                <option value="error">error</option>
                <option value="success">success</option>
              </select>
            </div>
          </>
        )}

        {/* Scan-specific: expected_value, validation */}
        {editing.type === 'scan' && (
          <>
            <div className="prop-row">
              <div className="prop-label">Expected Value</div>
              <input
                className="prop-input"
                value={editing.expected_value ?? ''}
                onChange={(e) => handleChange('expected_value', e.target.value)}
                placeholder="{{context.task_line.location.barcode}}"
              />
            </div>
            {editing.validation && (
              <div className="prop-row">
                <div className="prop-label">Validation</div>
                <div className="prop-val">{editing.validation.type ?? 'none'}</div>
                {editing.validation.endpoint && (
                  <div className="prop-val" style={{ marginTop: '2px' }}>{editing.validation.endpoint}</div>
                )}
              </div>
            )}
          </>
        )}

        {/* Number input-specific */}
        {editing.type === 'number_input' && (
          <>
            <div className="prop-row">
              <div className="prop-label">UOM</div>
              <input
                className="prop-input"
                value={editing.uom ?? ''}
                onChange={(e) => handleChange('uom', e.target.value)}
              />
            </div>
            <div className="prop-row">
              <div className="prop-label">Target</div>
              <input
                className="prop-input"
                value={editing.target ?? ''}
                onChange={(e) => handleChange('target', e.target.value)}
              />
            </div>
          </>
        )}

        {/* Navigate-specific: display */}
        {editing.type === 'navigate' && editing.display && (
          <div className="prop-row">
            <div className="prop-label">Display Fields</div>
            {Object.entries(editing.display).map(([k, v]) => (
              <div key={k} className="flex justify-between" style={{ fontSize: '10px', marginTop: '2px' }}>
                <span style={{ color: 'var(--text-xmuted)' }}>{k}:</span>
                <span className="mono prop-val">{v}</span>
              </div>
            ))}
          </div>
        )}

        {/* API call-specific */}
        {editing.type === 'api_call' && (
          <>
            <div className="prop-row">
              <div className="prop-label">Method</div>
              <select
                className="prop-input"
                value={editing.method ?? 'POST'}
                onChange={(e) => handleChange('method', e.target.value)}
              >
                {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="prop-row">
              <div className="prop-label">Endpoint</div>
              <input
                className="prop-input"
                value={editing.endpoint ?? ''}
                onChange={(e) => handleChange('endpoint', e.target.value)}
              />
            </div>
          </>
        )}

        {/* Menu select options */}
        {editing.type === 'menu_select' && editing.options && (
          <div className="prop-row">
            <div className="prop-label">Options</div>
            {editing.options.map((opt, i) => (
              <div key={i} className="flex justify-between" style={{ fontSize: '10px', marginTop: '3px' }}>
                <span style={{ color: 'var(--text)' }}>{opt.label}</span>
                <span className="mono" style={{ color: 'var(--text-xmuted)', fontSize: '9px' }}>{opt.next_step}</span>
              </div>
            ))}
          </div>
        )}

        {/* Confirm summary fields */}
        {editing.type === 'confirm' && editing.summary_fields && (
          <div className="prop-row">
            <div className="prop-label">Summary Fields</div>
            <div className="mono prop-val">{editing.summary_fields.join(', ')}</div>
          </div>
        )}

        {/* Transitions */}
        <div style={{ borderTop: '1px solid var(--border)', marginTop: '4px' }}>
          {transitionKeys.map((key) => {
            const val = editing[key];
            if (!val) return null;
            const colorMap: Record<string, string> = {
              on_success: 'var(--success)',
              on_confirm: 'var(--success)',
              on_dismiss: 'var(--success)',
              on_failure: 'var(--err)',
              on_exception: 'var(--err)',
              on_back: 'var(--text-muted)',
              on_skip: 'var(--accent)',
              on_short_pick: 'var(--warn)',
            };
            return (
              <div key={key} className="prop-row">
                <div className="prop-label">{key.replace('on_', 'On ').replace('_', ' ')}</div>
                <div className="prop-val" style={{ color: colorMap[key] ?? 'var(--text)' }}>
                  {typeof val === 'string' ? val : JSON.stringify(val, null, 2)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Raw JSON */}
        <div className="prop-row" style={{ borderBottom: 'none' }}>
          <button
            onClick={() => setShowRaw(!showRaw)}
            style={{
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              color: 'var(--text-xmuted)',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: 0,
            }}
          >
            {showRaw ? '\u25BC' : '\u25B6'} Raw JSON
          </button>
          {showRaw && (
            <pre
              className="mono"
              style={{
                fontSize: '9px',
                background: 'var(--bg-muted)',
                padding: '10px',
                borderRadius: '3px',
                marginTop: '6px',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.7,
                maxHeight: '200px',
                overflowY: 'auto',
              }}
            >
              {JSON.stringify(editing, null, 2)}
            </pre>
          )}
        </div>
      </div>

      {/* Footer buttons */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
        <button className="btn-ghost btn-sm" style={{ flex: 1 }} onClick={onDuplicate}>
          Duplicate
        </button>
        <button className="btn-primary btn-sm" style={{ flex: 1 }} onClick={handleSave}>
          Save
        </button>
      </div>
      <div style={{ padding: '0 14px 12px' }}>
        <button className="btn-danger btn-sm" style={{ width: '100%' }} onClick={onDelete}>
          Delete Step
        </button>
      </div>
    </div>
  );
}
