'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { STEP_META, getTagClass } from '@/lib/step-meta';

interface StepNodeData {
  label: string;
  stepType: string;
  stepId: string;
  isEntry?: boolean;
  severity?: string;
  transitions?: Array<{ key: string; display: string; target?: string }>;
  stepSource?: 'base' | 'partner' | 'override';
  extensionPoint?: string;
  dimmed?: boolean;
  [key: string]: unknown;
}

export const StepNode = memo(function StepNode({ data, selected }: NodeProps) {
  const d = data as StepNodeData;
  const meta = STEP_META[d.stepType] ?? STEP_META.message;
  const transitions = d.transitions ?? [];

  // Determine node modifier for border-top color
  let borderTopColor = meta.borderColor;
  let bgExtra = '';
  if (d.isEntry) {
    borderTopColor = '#2563eb'; // accent blue for entry
  }
  if (d.severity === 'error' || d.stepId.includes('error')) {
    borderTopColor = '#dc2626';
  }
  if (d.severity === 'success' || d.stepId.includes('complete')) {
    borderTopColor = '#16a34a';
    bgExtra = '#f0fdf4';
  }
  if (d.stepType === 'menu_select' && d.stepId.includes('exception')) {
    borderTopColor = '#dc2626';
  }
  if (d.stepType === 'menu_select' && d.stepId.includes('short')) {
    borderTopColor = '#d97706';
  }

  // Badge extra label (entry/error/exit/exception)
  let badgeExtra = '';
  if (d.isEntry) badgeExtra = ' \u00b7 entry';
  if (d.severity === 'error' || d.stepId.includes('error')) badgeExtra = ' \u00b7 error';
  if (d.severity === 'success' || d.stepId.includes('complete')) badgeExtra = ' \u00b7 terminal';
  if (d.stepId.includes('exception')) badgeExtra = ' \u00b7 exception';

  // Badge class override for error/exit nodes
  let badgeClass = meta.badgeClass;
  if (d.severity === 'error' || d.stepId.includes('error')) badgeClass = 'badge-err';
  if (d.severity === 'success' || d.stepId.includes('complete')) badgeClass = 'badge-ok';

  return (
    <div
      className="flow-node"
      style={{
        borderTopColor,
        background: bgExtra || undefined,
        opacity: d.dimmed ? 0.25 : 1,
        transition: 'opacity 0.15s',
        ...(selected
          ? {
              borderColor: '#2563eb',
              borderTopColor: '#2563eb',
              boxShadow: '0 0 0 2px #dbeafe, 0 2px 8px rgba(37,99,235,0.12)',
            }
          : {}),
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#94a3b8', width: 6, height: 6 }} />

      {/* Source indicator dot */}
      {d.stepSource && (
        <div style={{
          position: 'absolute', top: '4px', left: '4px',
          width: '8px', height: '8px', borderRadius: '50%',
          background: d.stepSource === 'base' ? 'var(--text-xmuted)'
            : d.stepSource === 'partner' ? 'var(--accent)' : 'var(--warn)',
        }} title={`Source: ${d.stepSource}`} />
      )}

      {/* Extension point badge */}
      {d.extensionPoint && (
        <div style={{
          position: 'absolute', bottom: '-10px', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--success)', color: '#fff', fontSize: '9px', fontWeight: 700,
          padding: '1px 6px', borderRadius: '3px', whiteSpace: 'nowrap',
        }}>
          + {d.extensionPoint}
        </div>
      )}

      {/* Badge */}
      <span className={`node-badge ${badgeClass}`}>
        <span className="ms" style={{ fontSize: '10px' }}>{meta.icon}</span>
        {' '}{meta.type}{badgeExtra}
      </span>

      {/* Step ID */}
      <div className="node-id">{d.stepId}</div>

      {/* Prompt */}
      <div className="node-prompt">{d.label}</div>

      {/* Transition tags */}
      {transitions.length > 0 && (
        <div className="node-tags">
          {transitions.map((t) => (
            <span key={t.key} className={`node-tag ${getTagClass(t.key, t.target)}`}>
              {t.display}
            </span>
          ))}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={{ background: '#94a3b8', width: 6, height: 6 }} />
    </div>
  );
});
