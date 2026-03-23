import { describe, it, expect } from 'vitest';
import { getStepPreviewConfig } from '../lib/step-preview';
import type { FlowStep } from '@wms/types';

describe('getStepPreviewConfig', () => {
  it('returns scan preview with prompt and input field', () => {
    const step: FlowStep = { id: 'scan-item', type: 'scan', prompt: 'Scan Item Barcode' };
    const config = getStepPreviewConfig(step, {});
    expect(config.type).toBe('scan');
    expect(config.header).toBe('Scan Item Barcode');
    expect(config.elements).toContainEqual(expect.objectContaining({ kind: 'scan-input' }));
  });

  it('returns navigate preview with location display', () => {
    const step: FlowStep = {
      id: 'nav', type: 'navigate', prompt: 'Go to Location',
      display: { zone: '{{context.zone}}', aisle: '{{context.aisle}}' },
    };
    const config = getStepPreviewConfig(step, { zone: 'A', aisle: '01' });
    expect(config.type).toBe('navigate');
    expect(config.elements).toContainEqual(expect.objectContaining({ kind: 'location-card' }));
  });

  it('returns confirm preview with summary fields', () => {
    const step: FlowStep = {
      id: 'confirm', type: 'confirm', prompt: 'Confirm Pick',
      summary_fields: ['item_sku', 'qty_picked'],
    };
    const config = getStepPreviewConfig(step, { item_sku: 'WIDGET-A', qty_picked: 5 });
    expect(config.elements).toContainEqual(expect.objectContaining({ kind: 'summary-card' }));
  });

  it('returns menu_select preview with options', () => {
    const step: FlowStep = {
      id: 'menu', type: 'menu_select', prompt: 'Choose Action',
      options: [
        { label: 'Option 1', value: 'opt1', next_step: 'step-1' },
        { label: 'Option 2', value: 'opt2', next_step: 'step-2' },
      ],
    };
    const config = getStepPreviewConfig(step, {});
    expect(config.elements).toContainEqual(expect.objectContaining({ kind: 'option-list', items: ['Option 1', 'Option 2'] }));
  });

  it('returns message preview with severity styling', () => {
    const step: FlowStep = { id: 'msg', type: 'message', prompt: 'Error', body: 'Something went wrong', severity: 'error' };
    const config = getStepPreviewConfig(step, {});
    expect(config.elements).toContainEqual(expect.objectContaining({ kind: 'message-body', severity: 'error' }));
  });

  it('resolves template expressions with sample context', () => {
    const step: FlowStep = {
      id: 'nav', type: 'navigate', prompt: 'Go to {{context.zone}}',
      display: { zone: '{{context.zone}}' },
    };
    const config = getStepPreviewConfig(step, { zone: 'B' });
    expect(config.header).toBe('Go to B');
  });
});
