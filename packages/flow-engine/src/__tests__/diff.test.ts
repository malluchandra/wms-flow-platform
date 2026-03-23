import { describe, it, expect } from 'vitest';
import { diffFlows } from '../diff.js';
import type { FlowDefinition, ContextSchemaValue } from '@wms/types';

const FLOW_A: FlowDefinition = {
  id: 'flow-a', name: 'picking', version: '1.0.0', display_name: 'Picking',
  extends: null, context_schema: { item_sku: 'string' }, entry_step: 'step-1',
  steps: [
    { id: 'step-1', type: 'scan', prompt: 'Scan Item' },
    { id: 'step-2', type: 'confirm', prompt: 'Confirm' },
    { id: 'exception-handler', type: 'menu_select', prompt: 'Exception',
      options: [{ label: 'Cancel', value: 'cancel', next_step: '__abandon__' }] },
  ],
};

describe('diffFlows', () => {
  it('returns no changes for identical flows', () => {
    const diff = diffFlows(FLOW_A, FLOW_A);
    expect(diff.added).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
    expect(diff.modified).toHaveLength(0);
    expect(diff.unchanged).toHaveLength(3);
  });

  it('detects added steps', () => {
    const flowB = {
      ...FLOW_A,
      steps: [
        ...FLOW_A.steps,
        { id: 'step-3', type: 'message' as const, prompt: 'Done' },
      ],
    };
    const diff = diffFlows(FLOW_A, flowB);
    expect(diff.added).toEqual(['step-3']);
    expect(diff.removed).toHaveLength(0);
  });

  it('detects removed steps', () => {
    const flowB = {
      ...FLOW_A,
      steps: FLOW_A.steps.filter((s) => s.id !== 'step-2'),
    };
    const diff = diffFlows(FLOW_A, flowB);
    expect(diff.removed).toEqual(['step-2']);
    expect(diff.added).toHaveLength(0);
  });

  it('detects modified steps (prompt changed)', () => {
    const flowB = {
      ...FLOW_A,
      steps: FLOW_A.steps.map((s) =>
        s.id === 'step-1' ? { ...s, prompt: 'Scan Item Barcode' } : s
      ),
    };
    const diff = diffFlows(FLOW_A, flowB);
    expect(diff.modified).toHaveLength(1);
    expect(diff.modified[0].stepId).toBe('step-1');
    expect(diff.modified[0].changes).toContainEqual(
      expect.objectContaining({ field: 'prompt', before: 'Scan Item', after: 'Scan Item Barcode' })
    );
  });

  it('detects modified steps (type changed)', () => {
    const flowB = {
      ...FLOW_A,
      steps: FLOW_A.steps.map((s) =>
        s.id === 'step-1' ? { ...s, type: 'navigate' as const } : s
      ),
    };
    const diff = diffFlows(FLOW_A, flowB);
    expect(diff.modified[0].changes).toContainEqual(
      expect.objectContaining({ field: 'type' })
    );
  });

  it('detects entry_step change in metadata', () => {
    const flowB = { ...FLOW_A, entry_step: 'step-2' };
    const diff = diffFlows(FLOW_A, flowB);
    expect(diff.metadataChanges).toContainEqual(
      expect.objectContaining({ field: 'entry_step', before: 'step-1', after: 'step-2' })
    );
  });

  it('detects context_schema changes', () => {
    const flowB = { ...FLOW_A, context_schema: { item_sku: 'string' as ContextSchemaValue, qty: 'number' as ContextSchemaValue } };
    const diff = diffFlows(FLOW_A, flowB);
    expect(diff.metadataChanges).toContainEqual(
      expect.objectContaining({ field: 'context_schema' })
    );
  });

  it('provides summary counts', () => {
    const flowB = {
      ...FLOW_A,
      steps: [
        { id: 'step-1', type: 'scan' as const, prompt: 'Scan Item Barcode' },
        { id: 'step-3', type: 'message' as const, prompt: 'New Step' },
        { id: 'exception-handler', type: 'menu_select' as const, prompt: 'Exception',
          options: [{ label: 'Cancel', value: 'cancel', next_step: '__abandon__' }] },
      ],
    };
    const diff = diffFlows(FLOW_A, flowB);
    expect(diff.summary).toEqual({
      added: 1,
      removed: 1,
      modified: 1,
      unchanged: 1,
    });
  });
});
