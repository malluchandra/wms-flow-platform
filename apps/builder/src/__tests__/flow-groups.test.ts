import { describe, it, expect } from 'vitest';
import { analyzeFlowGroups } from '../lib/flow-groups';
import type { FlowDefinition } from '@wms/types';

const FLOW: FlowDefinition = {
  id: 'test', name: 'test', version: '1.0.0', display_name: 'Test',
  extends: null, context_schema: {}, entry_step: 'scan-location',
  steps: [
    { id: 'scan-location', type: 'scan', prompt: 'Scan Location', on_success: 'scan-item', on_exception: 'exception-handler' },
    { id: 'scan-item', type: 'scan', prompt: 'Scan Item', on_success: 'confirm-pick', on_failure: 'wrong-item', on_exception: 'exception-handler' },
    { id: 'confirm-pick', type: 'confirm', prompt: 'Confirm', on_confirm: '__exit__', on_back: 'scan-item', on_exception: 'exception-handler' },
    { id: 'wrong-item', type: 'message', prompt: 'Wrong Item', severity: 'error', on_dismiss: 'scan-item' },
    { id: 'exception-handler', type: 'menu_select', prompt: 'Exception',
      options: [
        { label: 'Retry', value: 'retry', next_step: '{{caller_step}}' },
        { label: 'Cancel', value: 'cancel', next_step: '__abandon__' },
      ] },
  ],
};

describe('analyzeFlowGroups', () => {
  it('identifies the main path (entry → exit chain)', () => {
    const groups = analyzeFlowGroups(FLOW);
    const mainPath = groups.find((g) => g.id === 'main-path');
    expect(mainPath).toBeDefined();
    expect(mainPath!.stepIds).toEqual(['scan-location', 'scan-item', 'confirm-pick']);
  });

  it('identifies error handler group', () => {
    const groups = analyzeFlowGroups(FLOW);
    const errorGroup = groups.find((g) => g.id === 'error-handlers');
    expect(errorGroup).toBeDefined();
    expect(errorGroup!.stepIds).toContain('exception-handler');
    expect(errorGroup!.stepIds).toContain('wrong-item');
  });

  it('returns empty groups for empty flow', () => {
    const emptyFlow: FlowDefinition = {
      id: 'empty', name: 'empty', version: '1.0.0', display_name: 'Empty',
      extends: null, context_schema: {}, entry_step: '', steps: [],
    };
    const groups = analyzeFlowGroups(emptyFlow);
    expect(groups).toHaveLength(0);
  });

  it('every step belongs to exactly one group', () => {
    const groups = analyzeFlowGroups(FLOW);
    const allStepIds = groups.flatMap((g) => g.stepIds);
    const uniqueIds = new Set(allStepIds);
    expect(uniqueIds.size).toBe(allStepIds.length);
    expect(uniqueIds.size).toBe(FLOW.steps.length);
  });
});
