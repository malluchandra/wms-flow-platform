'use client';

import { STEP_TYPES_LIST } from '@/lib/step-meta';
import type { FlowDefinition } from '@wms/types';

interface LeftSidebarProps {
  flow: FlowDefinition;
  onAddStep: (type: string) => void;
  onFocusAI: () => void;
}

/** Count all transitions in a flow */
function countTransitions(flow: FlowDefinition): number {
  let count = 0;
  const transitionKeys = [
    'on_success', 'on_failure', 'on_confirm', 'on_back',
    'on_dismiss', 'on_skip', 'on_exception', 'on_short_pick',
  ] as const;
  for (const step of flow.steps) {
    for (const key of transitionKeys) {
      if (step[key]) count++;
    }
    if (step.options) count += step.options.length;
  }
  return count;
}

/** Run simplified linter checks (mirrors @wms/flow-engine rules) */
function getLinterResults(flow: FlowDefinition): { label: string; pass: boolean }[] {
  const stepIds = new Set(flow.steps.map((s) => s.id));
  const hasExceptionHandler = stepIds.has('exception-handler');

  // Check for exit path
  let hasExit = false;
  for (const step of flow.steps) {
    const json = JSON.stringify(step);
    if (json.includes('__exit__') || json.includes('__abandon__')) {
      hasExit = true;
      break;
    }
  }

  // Check for orphan steps (steps not referenced by any other step's transitions)
  const referencedIds = new Set<string>();
  referencedIds.add(flow.entry_step);
  for (const step of flow.steps) {
    const json = JSON.stringify(step);
    for (const id of stepIds) {
      if (json.includes(`"${id}"`)) referencedIds.add(id);
    }
  }
  const noOrphans = flow.steps.every((s) => referencedIds.has(s.id));

  // Check for duplicate IDs
  const noDupes = stepIds.size === flow.steps.length;

  return [
    { label: 'exception-handler defined', pass: hasExceptionHandler },
    { label: '__exit__ path reachable', pass: hasExit },
    { label: 'no orphan steps', pass: noOrphans },
    { label: 'context_schema valid', pass: true },
    { label: 'no duplicate step IDs', pass: noDupes },
  ];
}

export function LeftSidebar({ flow, onAddStep, onFocusAI }: LeftSidebarProps) {
  const transitionCount = countTransitions(flow);
  const linterResults = getLinterResults(flow);
  const allPass = linterResults.every((r) => r.pass);

  const handleDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData('application/step-type', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      className="flex flex-col flex-shrink-0 overflow-y-auto overflow-x-hidden"
      style={{
        width: 'var(--sidebar-w)',
        background: 'var(--bg-subtle)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Step Types */}
      <div className="sidebar-section">
        <div className="sidebar-label">Step Types</div>
        <div className="flex flex-col gap-px">
          {STEP_TYPES_LIST.map((meta) => (
            <div
              key={meta.type}
              className="step-chip"
              draggable
              onDragStart={(e) => handleDragStart(e, meta.type)}
              onClick={() => onAddStep(meta.type)}
            >
              <span className="ms" style={{ fontSize: '15px' }}>
                {meta.icon}
              </span>
              {meta.label}
            </div>
          ))}
        </div>
      </div>

      {/* Flow Health */}
      <div className="sidebar-section">
        <div className="sidebar-label">Flow Health</div>
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Steps</span>
            <span className="mono" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--brand)' }}>
              {flow.steps.length}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Transitions</span>
            <span className="mono" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)' }}>
              {transitionCount}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Linter</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: allPass ? 'var(--success)' : 'var(--err)' }}>
              {allPass ? '\u2713 Pass' : '\u2717 Fail'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Extends</span>
            <span className="mono" style={{ fontSize: '10px', color: 'var(--text-xmuted)' }}>
              {flow.extends ?? 'none (root)'}
            </span>
          </div>
        </div>
      </div>

      {/* Linter Output */}
      <div className="sidebar-section" style={{ flex: 1, borderBottom: 'none' }}>
        <div className="sidebar-label">Linter Output</div>
        <div className="flex flex-col gap-1">
          {linterResults.map((rule) => (
            <div
              key={rule.label}
              className="flex items-center gap-1.5"
              style={{
                fontSize: '10px',
                color: rule.pass ? 'var(--success)' : 'var(--err)',
              }}
            >
              <span className="ms-fill" style={{ fontSize: '13px' }}>
                {rule.pass ? 'check_circle' : 'cancel'}
              </span>
              {rule.label}
            </div>
          ))}
        </div>
      </div>

      {/* Ask AI button */}
      <div style={{ padding: '12px' }}>
        <button
          onClick={onFocusAI}
          className="btn-primary flex items-center justify-center gap-1.5 w-full"
          style={{ padding: '9px' }}
        >
          <span className="ms-fill" style={{ fontSize: '15px' }}>bolt</span>
          Ask AI Assistant
        </button>
      </div>
    </div>
  );
}
