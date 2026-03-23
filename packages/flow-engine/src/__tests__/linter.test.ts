import { describe, it, expect } from 'vitest';
import { validateFlow } from '../linter.js';
import type { FlowDefinition } from '@wms/types';
import { validPickingFlow } from './fixtures/valid-picking-flow.js';

describe('validateFlow — valid flow', () => {
  it('returns no errors for the valid Outbound Picking flow', () => {
    const errors = validateFlow(validPickingFlow);
    expect(errors).toHaveLength(0);
  });
});

describe('validateFlow — MISSING_EXCEPTION_HANDLER', () => {
  it('errors when no step with id exception-handler exists', () => {
    const flow: FlowDefinition = {
      ...validPickingFlow,
      steps: validPickingFlow.steps.filter(
        (s) => s.id !== 'exception-handler'
      ),
    };
    const errors = validateFlow(flow);
    expect(errors.some((e) => e.code === 'MISSING_EXCEPTION_HANDLER')).toBe(
      true
    );
  });
});

describe('validateFlow — NO_EXIT_PATH', () => {
  it('errors when no step can reach __exit__ or __abandon__', () => {
    // Remove all __exit__ and __abandon__ references from the flow
    const flow: FlowDefinition = {
      ...validPickingFlow,
      steps: validPickingFlow.steps.map((s) => {
        const step = { ...s };

        // Replace string transition values
        for (const key of [
          'on_confirm',
          'on_dismiss',
          'on_back',
          'on_skip',
          'on_success',
          'on_failure',
          'on_exception',
          'on_short_pick',
        ] as const) {
          const val = step[key];
          if (typeof val === 'string' && (val === '__exit__' || val === '__abandon__')) {
            (step as Record<string, unknown>)[key] = 'exception-handler';
          } else if (
            val &&
            typeof val === 'object' &&
            !Array.isArray(val) &&
            'next_step' in val
          ) {
            const handler = val as { next_step: string; [k: string]: unknown };
            if (
              handler.next_step === '__exit__' ||
              handler.next_step === '__abandon__'
            ) {
              (step as Record<string, unknown>)[key] = {
                ...handler,
                next_step: 'exception-handler',
              };
            }
          } else if (Array.isArray(val)) {
            (step as Record<string, unknown>)[key] = val.map((item) => {
              if (
                item &&
                typeof item === 'object' &&
                'next_step' in item &&
                (item.next_step === '__exit__' || item.next_step === '__abandon__')
              ) {
                return { ...item, next_step: 'exception-handler' };
              }
              return item;
            });
          }
        }

        return step;
      }),
    };
    const errors = validateFlow(flow);
    expect(errors.some((e) => e.code === 'NO_EXIT_PATH')).toBe(true);
  });
});

describe('validateFlow — UNDEFINED_STEP_REFERENCE', () => {
  it('errors when on_confirm references a non-existent step', () => {
    const flow: FlowDefinition = {
      ...validPickingFlow,
      steps: validPickingFlow.steps.map((s) =>
        s.id === 'navigate-to-location'
          ? { ...s, on_confirm: 'totally-made-up-step' }
          : s
      ),
    };
    const errors = validateFlow(flow);
    expect(errors.some((e) => e.code === 'UNDEFINED_STEP_REFERENCE')).toBe(
      true
    );
    expect(
      errors.find((e) => e.code === 'UNDEFINED_STEP_REFERENCE')?.message
    ).toContain('totally-made-up-step');
  });

  it('does not error for __exit__ or __abandon__ sentinel references', () => {
    const errors = validateFlow(validPickingFlow);
    expect(errors.some((e) => e.code === 'UNDEFINED_STEP_REFERENCE')).toBe(
      false
    );
  });
});

describe('validateFlow — UNDECLARED_CONTEXT_VAR', () => {
  it('errors when a step uses {{context.undeclared_var}} not in context_schema', () => {
    const flow: FlowDefinition = {
      ...validPickingFlow,
      steps: validPickingFlow.steps.map((s) =>
        s.id === 'navigate-to-location'
          ? { ...s, prompt: 'Go to {{context.ghost_variable}}' }
          : s
      ),
    };
    const errors = validateFlow(flow);
    expect(errors.some((e) => e.code === 'UNDECLARED_CONTEXT_VAR')).toBe(true);
    expect(
      errors.find((e) => e.code === 'UNDECLARED_CONTEXT_VAR')?.message
    ).toContain('ghost_variable');
  });

  it('does not error for response.* variables (only available in on_success)', () => {
    const errors = validateFlow(validPickingFlow);
    expect(errors.some((e) => e.code === 'UNDECLARED_CONTEXT_VAR')).toBe(
      false
    );
  });
});

describe('validateFlow — DUPLICATE_STEP_ID', () => {
  it('errors when two steps share the same id', () => {
    const flow: FlowDefinition = {
      ...validPickingFlow,
      steps: [
        ...validPickingFlow.steps,
        { ...validPickingFlow.steps[0] }, // duplicate first step
      ],
    };
    const errors = validateFlow(flow);
    expect(errors.some((e) => e.code === 'DUPLICATE_STEP_ID')).toBe(true);
  });
});

describe('extension-specific rules', () => {
  it('EXTEND_LOCKED_STEP_MODIFIED — detects modified base step in extend mode', () => {
    const flow: FlowDefinition = {
      id: 'test', name: 'test', version: '1.0.0', display_name: 'Test',
      extends: 'base-id', extension_mode: 'extend',
      context_schema: {}, entry_step: 'step-1',
      steps: [
        { id: 'step-1', type: 'scan', prompt: 'Modified prompt', _source: 'override', on_success: '__exit__' },
        { id: 'exception-handler', type: 'menu_select', prompt: 'Exception', _source: 'base',
          options: [{ label: 'Cancel', value: 'cancel', next_step: '__abandon__' }] },
      ],
    };
    const errors = validateFlow(flow);
    const extendError = errors.find((e) => e.code === 'EXTEND_LOCKED_STEP_MODIFIED');
    expect(extendError).toBeDefined();
    expect(extendError!.step_id).toBe('step-1');
  });

  it('no EXTEND_LOCKED_STEP_MODIFIED for override mode', () => {
    const flow: FlowDefinition = {
      id: 'test', name: 'test', version: '1.0.0', display_name: 'Test',
      extends: 'base-id', extension_mode: 'override',
      context_schema: {}, entry_step: 'step-1',
      steps: [
        { id: 'step-1', type: 'scan', prompt: 'Modified', _source: 'override', on_success: '__exit__' },
        { id: 'exception-handler', type: 'menu_select', prompt: 'Exception', _source: 'base',
          options: [{ label: 'Cancel', value: 'cancel', next_step: '__abandon__' }] },
      ],
    };
    const errors = validateFlow(flow);
    expect(errors.find((e) => e.code === 'EXTEND_LOCKED_STEP_MODIFIED')).toBeUndefined();
  });

  it('ORPHANED_INJECTION — partner step references nonexistent extension point', () => {
    const flow: FlowDefinition = {
      id: 'test', name: 'test', version: '1.0.0', display_name: 'Test',
      extends: 'base-id', extension_mode: 'extend',
      context_schema: {}, entry_step: 'step-1',
      steps: [
        { id: 'step-1', type: 'scan', prompt: 'Scan', _source: 'base', on_success: 'custom-step', on_exception: 'exception-handler' },
        { id: 'custom-step', type: 'message', prompt: 'Custom', _source: 'partner', _injected_at: 'nonexistent-point', on_dismiss: '__exit__' },
        { id: 'exception-handler', type: 'menu_select', prompt: 'Exception', _source: 'base',
          options: [{ label: 'Cancel', value: 'cancel', next_step: '__abandon__' }] },
      ],
    };
    const errors = validateFlow(flow);
    const orphanError = errors.find((e) => e.code === 'ORPHANED_INJECTION');
    expect(orphanError).toBeDefined();
    expect(orphanError!.step_id).toBe('custom-step');
  });

  it('no extension errors for base flows (no extension_mode)', () => {
    const flow: FlowDefinition = {
      id: 'test', name: 'test', version: '1.0.0', display_name: 'Test',
      extends: null,
      context_schema: {}, entry_step: 'step-1',
      steps: [
        { id: 'step-1', type: 'scan', prompt: 'Scan', on_success: '__exit__', on_exception: 'exception-handler' },
        { id: 'exception-handler', type: 'menu_select', prompt: 'Exception',
          options: [{ label: 'Cancel', value: 'cancel', next_step: '__abandon__' }] },
      ],
    };
    const errors = validateFlow(flow);
    expect(errors.find((e) => e.code === 'EXTEND_LOCKED_STEP_MODIFIED')).toBeUndefined();
    expect(errors.find((e) => e.code === 'ORPHANED_INJECTION')).toBeUndefined();
  });
});
