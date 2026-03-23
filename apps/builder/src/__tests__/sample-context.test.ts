import { describe, it, expect } from 'vitest';
import { generateSampleContext } from '../lib/sample-context';
import type { ContextSchema } from '@wms/types';

describe('generateSampleContext', () => {
  it('generates string sample values', () => {
    const schema: ContextSchema = { item_sku: 'string', location: 'string' };
    const ctx = generateSampleContext(schema);
    expect(typeof ctx.item_sku).toBe('string');
    expect(typeof ctx.location).toBe('string');
  });

  it('generates number sample values', () => {
    const schema: ContextSchema = { qty_picked: 'number', total_lines: 'number' };
    const ctx = generateSampleContext(schema);
    expect(typeof ctx.qty_picked).toBe('number');
    expect(typeof ctx.total_lines).toBe('number');
  });

  it('generates nested object samples', () => {
    const schema: ContextSchema = {
      task_line: {
        id: 'uuid',
        item: { sku: 'string', name: 'string' },
      },
    };
    const ctx = generateSampleContext(schema);
    expect(ctx.task_line).toBeDefined();
    expect(typeof (ctx.task_line as any).item.sku).toBe('string');
  });

  it('returns empty object for empty schema', () => {
    expect(generateSampleContext({})).toEqual({});
  });
});
