import type { ContextSchema, ContextSchemaValue } from '@wms/types';

const SAMPLE_VALUES: Record<string, unknown> = {
  string: 'SAMPLE-VALUE',
  number: 42,
  boolean: true,
  uuid: '00000000-0000-0000-0000-000000000001',
};

/**
 * Generate sample context values from a context_schema.
 * Used by the UI Designer to preview template expressions.
 */
export function generateSampleContext(
  schema: ContextSchema
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schema)) {
    result[key] = generateValue(key, value);
  }
  return result;
}

function generateValue(key: string, schema: ContextSchemaValue): unknown {
  if (typeof schema === 'string') {
    // Primitive type — use key name as hint for better samples
    if (schema === 'string') {
      if (key.includes('sku')) return 'WIDGET-A';
      if (key.includes('name')) return 'Widget Alpha';
      if (key.includes('barcode') || key.includes('location')) return 'A-01-01-A';
      if (key.includes('zone')) return 'A';
      if (key.includes('uom')) return 'EA';
      return 'SAMPLE-VALUE';
    }
    return SAMPLE_VALUES[schema] ?? null;
  }
  // Nested object
  const obj: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(schema)) {
    obj[k] = generateValue(k, v as ContextSchemaValue);
  }
  return obj;
}
