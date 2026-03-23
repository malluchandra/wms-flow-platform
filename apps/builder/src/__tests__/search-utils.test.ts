import { describe, it, expect } from 'vitest';
import { searchFlow, filterStepsByType } from '../lib/search-utils';
import type { FlowDefinition } from '@wms/types';

const FLOW: FlowDefinition = {
  id: 'test', name: 'test', version: '1.0.0', display_name: 'Test',
  extends: null, context_schema: {}, entry_step: 'scan-location',
  steps: [
    { id: 'scan-location', type: 'scan', prompt: 'Scan Location Barcode' },
    { id: 'scan-item', type: 'scan', prompt: 'Scan Item Barcode' },
    { id: 'enter-quantity', type: 'number_input', prompt: 'Enter Quantity' },
    { id: 'confirm-pick', type: 'confirm', prompt: 'Confirm Pick' },
    { id: 'exception-handler', type: 'menu_select', prompt: 'Exception' },
  ],
};

describe('searchFlow', () => {
  it('matches step IDs (case-insensitive)', () => {
    const results = searchFlow(FLOW, 'scan');
    expect(results.map((r) => r.stepId)).toEqual(['scan-location', 'scan-item']);
  });

  it('matches prompt text', () => {
    const results = searchFlow(FLOW, 'quantity');
    expect(results).toHaveLength(1);
    expect(results[0].stepId).toBe('enter-quantity');
  });

  it('matches step type', () => {
    const results = searchFlow(FLOW, 'menu_select');
    expect(results).toHaveLength(1);
    expect(results[0].stepId).toBe('exception-handler');
    expect(results[0].matchType).toBe('type');
  });

  it('returns empty for no matches', () => {
    expect(searchFlow(FLOW, 'nonexistent')).toHaveLength(0);
  });

  it('returns all steps for empty query', () => {
    expect(searchFlow(FLOW, '')).toHaveLength(5);
  });
});

describe('filterStepsByType', () => {
  it('filters to matching types only', () => {
    const ids = filterStepsByType(FLOW, ['scan']);
    expect(ids).toEqual(['scan-location', 'scan-item']);
  });
});
