import { describe, it, expect } from 'vitest';
import { createFromBase, injectAtExtensionPoint, resolveUseMode, getExtensionPoints, getSuccessTarget } from '../resolver.js';
import type { FlowDefinition, FlowStep } from '@wms/types';

const BASE_FLOW: FlowDefinition = {
  id: 'base-picking-v1',
  name: 'outbound-picking',
  version: '1.0.0',
  display_name: 'Outbound Picking',
  extends: null,
  context_schema: {
    task_id: 'uuid',
    item_sku: 'string',
    qty_picked: 'number',
  },
  entry_step: 'scan-location',
  steps: [
    {
      id: 'scan-location',
      type: 'scan',
      prompt: 'Scan Location',
      extension_point: 'after-location-scan',
      on_success: 'scan-item',
      on_exception: 'exception-handler',
    },
    {
      id: 'scan-item',
      type: 'scan',
      prompt: 'Scan Item',
      extension_point: 'after-item-scan',
      on_success: 'confirm-pick',
      on_failure: 'exception-handler',
      on_exception: 'exception-handler',
    },
    {
      id: 'confirm-pick',
      type: 'confirm',
      prompt: 'Confirm Pick',
      on_confirm: '__exit__',
      on_back: 'scan-item',
      on_exception: 'exception-handler',
    },
    {
      id: 'exception-handler',
      type: 'menu_select',
      prompt: 'Exception',
      options: [
        { label: 'Retry', value: 'retry', next_step: '{{caller_step}}' },
        { label: 'Cancel', value: 'cancel', next_step: '__abandon__' },
      ],
    },
  ],
};

describe('createFromBase', () => {
  describe('Use mode', () => {
    it('creates a child with empty steps and references base', () => {
      const child = createFromBase(BASE_FLOW, 'use', { name: 'partner-picking', display_name: 'Partner Picking' });
      expect(child.extends).toBe(BASE_FLOW.id);
      expect(child.extension_mode).toBe('use');
      expect(child.base_version).toBe('1.0.0');
      expect(child.steps).toHaveLength(0);
      expect(child.entry_step).toBe('');
      expect(child.context_schema).toEqual(BASE_FLOW.context_schema);
    });
  });

  describe('Extend mode', () => {
    it('copies all base steps with _source=base', () => {
      const child = createFromBase(BASE_FLOW, 'extend', { name: 'partner-picking', display_name: 'Partner Picking' });
      expect(child.extension_mode).toBe('extend');
      expect(child.extends).toBe(BASE_FLOW.id);
      expect(child.base_version).toBe('1.0.0');
      expect(child.steps).toHaveLength(4);
      expect(child.steps.every((s) => s._source === 'base')).toBe(true);
      expect(child.entry_step).toBe('scan-location');
    });

    it('preserves extension_point markers on base steps', () => {
      const child = createFromBase(BASE_FLOW, 'extend', { name: 'p', display_name: 'P' });
      const scanLoc = child.steps.find((s) => s.id === 'scan-location');
      expect(scanLoc?.extension_point).toBe('after-location-scan');
    });

    it('deep-clones steps (no shared references)', () => {
      const child = createFromBase(BASE_FLOW, 'extend', { name: 'p', display_name: 'P' });
      child.steps[0].prompt = 'MODIFIED';
      expect(BASE_FLOW.steps[0].prompt).toBe('Scan Location');
    });
  });

  describe('Override mode', () => {
    it('copies all base steps with _source=base', () => {
      const child = createFromBase(BASE_FLOW, 'override', { name: 'partner-picking', display_name: 'Partner Picking' });
      expect(child.extension_mode).toBe('override');
      expect(child.steps).toHaveLength(4);
      expect(child.steps.every((s) => s._source === 'base')).toBe(true);
    });
  });

  describe('Fork mode', () => {
    it('creates a full independent copy', () => {
      const child = createFromBase(BASE_FLOW, 'fork', { name: 'partner-picking', display_name: 'Partner Picking' });
      expect(child.extension_mode).toBe('fork');
      expect(child.extends).toBe(BASE_FLOW.id);
      expect(child.base_version).toBeUndefined();
      expect(child.steps).toHaveLength(4);
    });

    it('strips extension_point markers from forked steps', () => {
      const child = createFromBase(BASE_FLOW, 'fork', { name: 'p', display_name: 'P' });
      expect(child.steps.every((s) => s.extension_point === undefined)).toBe(true);
    });

    it('does not set _source on forked steps', () => {
      const child = createFromBase(BASE_FLOW, 'fork', { name: 'p', display_name: 'P' });
      expect(child.steps.every((s) => s._source === undefined)).toBe(true);
    });
  });
});

describe('injectAtExtensionPoint', () => {
  it('injects steps after the anchor step', () => {
    const child = createFromBase(BASE_FLOW, 'extend', { name: 'p', display_name: 'P' });
    const photoStep: FlowStep = {
      id: 'photo-capture', type: 'camera_input', prompt: 'Take Photo of Item', on_success: '__continue__',
    };
    const result = injectAtExtensionPoint(child, 'after-item-scan', [photoStep]);
    expect(result.steps[2].id).toBe('photo-capture');
    expect(result.steps[2]._source).toBe('partner');
    expect(result.steps[2]._injected_at).toBe('after-item-scan');
  });

  it('rewires transitions: anchor → new step → original next', () => {
    const child = createFromBase(BASE_FLOW, 'extend', { name: 'p', display_name: 'P' });
    const photoStep: FlowStep = {
      id: 'photo-capture', type: 'camera_input', prompt: 'Take Photo', on_success: '__continue__',
    };
    const result = injectAtExtensionPoint(child, 'after-item-scan', [photoStep]);
    const scanItem = result.steps.find((s) => s.id === 'scan-item')!;
    expect(getSuccessTarget(scanItem)).toBe('photo-capture');
    const photo = result.steps.find((s) => s.id === 'photo-capture')!;
    expect(getSuccessTarget(photo)).toBe('confirm-pick');
  });

  it('handles multiple steps injected at the same point', () => {
    const child = createFromBase(BASE_FLOW, 'extend', { name: 'p', display_name: 'P' });
    const steps: FlowStep[] = [
      { id: 'weigh-item', type: 'number_input', prompt: 'Enter Weight', on_success: 'photo-capture' },
      { id: 'photo-capture', type: 'camera_input', prompt: 'Take Photo', on_success: '__continue__' },
    ];
    const result = injectAtExtensionPoint(child, 'after-item-scan', steps);
    expect(result.steps[2].id).toBe('weigh-item');
    expect(result.steps[3].id).toBe('photo-capture');
    expect(getSuccessTarget(result.steps[3])).toBe('confirm-pick');
  });

  it('handles TransitionHandler object (preserves set_context)', () => {
    const child = createFromBase(BASE_FLOW, 'extend', { name: 'p', display_name: 'P' });
    const scanLoc = child.steps.find((s) => s.id === 'scan-location')!;
    scanLoc.on_success = { set_context: { location_confirmed: true }, next_step: 'scan-item' };
    const photoStep: FlowStep = {
      id: 'photo-location', type: 'camera_input', prompt: 'Photo Location', on_success: '__continue__',
    };
    const result = injectAtExtensionPoint(child, 'after-location-scan', [photoStep]);
    const rewiredScanLoc = result.steps.find((s) => s.id === 'scan-location')!;
    const handler = rewiredScanLoc.on_success as { next_step: string; set_context: any };
    expect(handler.next_step).toBe('photo-location');
    expect(handler.set_context).toEqual({ location_confirmed: true });
  });

  it('throws for unknown extension point', () => {
    const child = createFromBase(BASE_FLOW, 'extend', { name: 'p', display_name: 'P' });
    expect(() => injectAtExtensionPoint(child, 'nonexistent-point', [])).toThrow('Extension point "nonexistent-point" not found');
  });
});

describe('resolveUseMode', () => {
  it('returns base flow with child metadata', () => {
    const child = createFromBase(BASE_FLOW, 'use', { name: 'partner-picking', display_name: 'Partner Picking' });
    child.id = 'child-uuid-123';
    const resolved = resolveUseMode(child, BASE_FLOW);
    expect(resolved.id).toBe('child-uuid-123');
    expect(resolved.name).toBe('partner-picking');
    expect(resolved.display_name).toBe('Partner Picking');
    expect(resolved.steps).toHaveLength(4);
    expect(resolved.entry_step).toBe('scan-location');
    expect(resolved.extension_mode).toBe('use');
  });
});

describe('getExtensionPoints', () => {
  it('returns all extension point names from a flow', () => {
    const points = getExtensionPoints(BASE_FLOW);
    expect(points).toEqual(['after-location-scan', 'after-item-scan']);
  });

  it('returns empty array for flow with no extension points', () => {
    const noPoints: FlowDefinition = {
      ...BASE_FLOW,
      steps: BASE_FLOW.steps.map(({ extension_point, ...rest }) => rest),
    };
    expect(getExtensionPoints(noPoints)).toEqual([]);
  });
});
