'use client';

import { useState, useMemo } from 'react';
import { PhoneFrame } from './PhoneFrame';
import { StepPreview } from './StepPreview';
import { getStepPreviewConfig } from '@/lib/step-preview';
import { generateSampleContext } from '@/lib/sample-context';
import { STEP_META } from '@/lib/step-meta';
import type { FlowDefinition, FlowStep } from '@wms/types';

interface UIDesignerPanelProps {
  flow: FlowDefinition;
  selectedStepId: string | null;
  onSelectStep: (stepId: string) => void;
}

export function UIDesignerPanel({ flow, selectedStepId, onSelectStep }: UIDesignerPanelProps) {
  const sampleContext = useMemo(
    () => generateSampleContext(flow.context_schema),
    [flow.context_schema]
  );

  const currentStep = selectedStepId
    ? flow.steps.find((s) => s.id === selectedStepId)
    : flow.steps[0];

  const currentIndex = currentStep ? flow.steps.indexOf(currentStep) : 0;

  const previewConfig = currentStep
    ? getStepPreviewConfig(currentStep, sampleContext)
    : null;

  return (
    <div className="flex-1 flex" style={{ background: 'var(--bg-muted)' }}>
      {/* Left: Step selector list */}
      <div style={{
        width: '220px', background: 'var(--bg)', borderRight: '1px solid var(--border)',
        overflowY: 'auto', padding: '12px 0',
      }}>
        <div style={{ padding: '0 12px 8px', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Steps ({flow.steps.length})
        </div>
        {flow.steps.map((step, i) => {
          const meta = STEP_META[step.type];
          const active = step.id === currentStep?.id;
          return (
            <button
              key={step.id}
              onClick={() => onSelectStep(step.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                padding: '8px 12px', border: 'none', cursor: 'pointer', textAlign: 'left',
                background: active ? 'var(--accent-lt)' : 'transparent',
                borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
              }}
            >
              <span style={{ fontSize: '10px', color: 'var(--text-xmuted)', width: '16px' }}>{i + 1}</span>
              <span className="ms" style={{ fontSize: '14px', color: active ? 'var(--accent)' : 'var(--text-muted)' }}>
                {meta?.icon ?? 'help'}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="mono" style={{ fontSize: '10px', color: active ? 'var(--accent)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {step.id}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {step.prompt}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Center: Phone preview */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        {previewConfig ? (
          <div>
            <PhoneFrame>
              <StepPreview config={previewConfig} />
            </PhoneFrame>
            {/* Step navigation */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '16px' }}>
              <button
                onClick={() => currentIndex > 0 && onSelectStep(flow.steps[currentIndex - 1].id)}
                disabled={currentIndex === 0}
                style={{
                  padding: '6px 16px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '4px',
                  background: 'var(--bg)', cursor: currentIndex === 0 ? 'default' : 'pointer',
                  color: currentIndex === 0 ? 'var(--text-xmuted)' : 'var(--text)',
                }}
              >
                ← Previous
              </button>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '32px' }}>
                {currentIndex + 1} / {flow.steps.length}
              </span>
              <button
                onClick={() => currentIndex < flow.steps.length - 1 && onSelectStep(flow.steps[currentIndex + 1].id)}
                disabled={currentIndex >= flow.steps.length - 1}
                style={{
                  padding: '6px 16px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '4px',
                  background: 'var(--bg)', cursor: currentIndex >= flow.steps.length - 1 ? 'default' : 'pointer',
                  color: currentIndex >= flow.steps.length - 1 ? 'var(--text-xmuted)' : 'var(--text)',
                }}
              >
                Next →
              </button>
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No steps in this flow</p>
        )}
      </div>

      {/* Right: Step info panel */}
      <div style={{ width: '240px', background: 'var(--bg)', borderLeft: '1px solid var(--border)', padding: '16px', overflowY: 'auto' }}>
        {currentStep ? (
          <>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
              Step Properties
            </div>
            <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>ID</div>
                <div className="mono" style={{ fontWeight: 600, color: 'var(--brand)' }}>{currentStep.id}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>Type</div>
                <div>{currentStep.type}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>Prompt</div>
                <div>{currentStep.prompt}</div>
              </div>
              {currentStep.body && (
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>Body</div>
                  <div>{currentStep.body}</div>
                </div>
              )}
              {currentStep.severity && (
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>Severity</div>
                  <div>{currentStep.severity}</div>
                </div>
              )}
              {currentStep.extension_point && (
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>Extension Point</div>
                  <div style={{ color: 'var(--success)' }}>{currentStep.extension_point}</div>
                </div>
              )}
            </div>
          </>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Select a step to view properties</p>
        )}
      </div>
    </div>
  );
}
