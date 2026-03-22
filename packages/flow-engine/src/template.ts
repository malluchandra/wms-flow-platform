import type { FlowContext } from '@wms/types';

export function resolveTemplate(
  template: string,
  context: FlowContext,
  entryStep?: string,
  input?: string
): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, path: string) => {
    const trimmed = path.trim();

    if (trimmed === 'caller_step') {
      const stack = context.__caller_stack ?? [];
      return stack.length > 0
        ? String(stack[stack.length - 1])
        : (entryStep ?? '');
    }

    if (trimmed === 'input') {
      return input ?? '';
    }

    if (trimmed.startsWith('context.')) {
      const contextPath = trimmed.slice('context.'.length);
      const value = getNestedValue(context, contextPath);
      return value != null ? String(value) : '';
    }

    return '';
  });
}

export function resolveObject(
  obj: Record<string, string>,
  context: FlowContext,
  entryStep?: string,
  input?: string
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = resolveTemplate(value, context, entryStep, input);
  }
  return result;
}

function getNestedValue(obj: unknown, path: string): unknown {
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}
