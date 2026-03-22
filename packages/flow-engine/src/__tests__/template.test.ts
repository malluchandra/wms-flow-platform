import { describe, it, expect } from 'vitest';
import { resolveTemplate, resolveObject } from '../template.js';
import type { FlowContext } from '@wms/types';

const ctx: FlowContext = {
  task_line: {
    location: { zone: 'A', aisle: '01', bay: '03', level: '01' },
    item: { sku: 'WIDGET-001', name: 'Widget A', uom: 'EA' },
    qty_required: 5,
    id: 'tl-uuid-1',
  },
  qty_picked: 3,
  location_barcode: 'A-01-03-01',
  item_sku: 'WIDGET-001',
  __caller_stack: ['scan-item'],
  session_id: 'sess-uuid-1',
  task_id: 'task-uuid-1',
  worker_id: 'worker-uuid-1',
};

describe('resolveTemplate', () => {
  it('returns the original string when no templates present', () => {
    expect(resolveTemplate('Go to Zone A', ctx)).toBe('Go to Zone A');
  });

  it('resolves a simple top-level context path', () => {
    expect(resolveTemplate('{{context.qty_picked}}', ctx)).toBe('3');
  });

  it('resolves a deeply nested context path', () => {
    expect(resolveTemplate('{{context.task_line.location.zone}}', ctx)).toBe('A');
  });

  it('returns empty string for a missing path (display field behavior)', () => {
    expect(resolveTemplate('{{context.missing_field}}', ctx)).toBe('');
  });

  it('returns empty string for a partially missing path', () => {
    expect(resolveTemplate('{{context.task_line.nonexistent.zone}}', ctx)).toBe('');
  });

  it('resolves multiple templates in a single string', () => {
    expect(
      resolveTemplate(
        'Zone {{context.task_line.location.zone}}, Aisle {{context.task_line.location.aisle}}',
        ctx
      )
    ).toBe('Zone A, Aisle 01');
  });

  it('resolves {{caller_step}} from top of __caller_stack', () => {
    expect(resolveTemplate('{{caller_step}}', ctx, 'navigate-to-location')).toBe('scan-item');
  });

  it('falls back to entry_step for {{caller_step}} when stack is empty', () => {
    const emptyCtx: FlowContext = { ...ctx, __caller_stack: [] };
    expect(resolveTemplate('{{caller_step}}', emptyCtx, 'navigate-to-location')).toBe('navigate-to-location');
  });

  it('resolves numeric values as strings', () => {
    expect(resolveTemplate('Qty: {{context.task_line.qty_required}}', ctx)).toBe('Qty: 5');
  });

  it('resolves {{input}} to the provided input value', () => {
    expect(resolveTemplate('You scanned {{input}}', ctx, undefined, '1234567890')).toBe('You scanned 1234567890');
  });
});

describe('resolveObject', () => {
  it('resolves all string values in a plain object', () => {
    const template = {
      zone: '{{context.task_line.location.zone}}',
      aisle: '{{context.task_line.location.aisle}}',
      label: 'Bay {{context.task_line.location.bay}}',
    };
    expect(resolveObject(template, ctx)).toEqual({
      zone: 'A',
      aisle: '01',
      label: 'Bay 03',
    });
  });
});
