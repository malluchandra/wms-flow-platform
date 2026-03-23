import type { FlowDefinition, FlowStep, ExtensionMode } from '@wms/types';

interface CreateFromBaseOptions {
  name: string;
  display_name: string;
}

export function createFromBase(
  base: FlowDefinition,
  mode: ExtensionMode,
  opts: CreateFromBaseOptions
): FlowDefinition {
  const child: FlowDefinition = {
    id: '',
    name: opts.name,
    version: '1.0.0',
    display_name: opts.display_name,
    extends: base.id,
    extension_mode: mode,
    context_schema: structuredClone(base.context_schema),
    entry_step: '',
    steps: [],
  };

  switch (mode) {
    case 'use':
      child.base_version = base.version;
      child.entry_step = '';
      child.steps = [];
      break;

    case 'extend':
    case 'override':
      child.base_version = base.version;
      child.entry_step = base.entry_step;
      child.steps = structuredClone(base.steps).map((step) => ({
        ...step,
        _source: 'base' as const,
      }));
      break;

    case 'fork':
      child.entry_step = base.entry_step;
      child.steps = structuredClone(base.steps).map((step) => {
        const { extension_point, _source, _injected_at, ...rest } = step;
        return rest;
      });
      break;
  }

  return child;
}

export function injectAtExtensionPoint(
  flow: FlowDefinition,
  pointName: string,
  newSteps: FlowStep[]
): FlowDefinition {
  const result = structuredClone(flow);
  const anchorIndex = result.steps.findIndex((s) => s.extension_point === pointName);
  if (anchorIndex === -1) {
    throw new Error(`Extension point "${pointName}" not found in flow`);
  }
  const anchorStep = result.steps[anchorIndex];
  const originalNext = getSuccessTarget(anchorStep);
  const markedSteps = newSteps.map((s) => ({
    ...s,
    _source: 'partner' as const,
    _injected_at: pointName,
  }));
  if (markedSteps.length > 0) {
    setSuccessTarget(anchorStep, markedSteps[0].id);
    const lastNew = markedSteps[markedSteps.length - 1];
    if (getSuccessTarget(lastNew) === '__continue__') {
      setSuccessTarget(lastNew, originalNext);
    }
  }
  result.steps.splice(anchorIndex + 1, 0, ...markedSteps);
  return result;
}

export function resolveUseMode(
  childFlow: FlowDefinition,
  baseFlow: FlowDefinition
): FlowDefinition {
  return {
    ...structuredClone(baseFlow),
    id: childFlow.id,
    name: childFlow.name,
    display_name: childFlow.display_name,
    extends: childFlow.extends,
    extension_mode: 'use',
    base_version: baseFlow.version,
  };
}

export function getExtensionPoints(flow: FlowDefinition): string[] {
  return flow.steps
    .filter((s) => s.extension_point)
    .map((s) => s.extension_point!);
}

// ─── Helpers (must be exported for tests) ─────────────────────

export function getSuccessTarget(step: FlowStep): string {
  const field = step.on_success ?? step.on_confirm;
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (Array.isArray(field)) {
    return (field as { next_step: string }[])[0]?.next_step ?? '';
  }
  return (field as { next_step: string }).next_step ?? '';
}

function setSuccessTarget(step: FlowStep, target: string): void {
  const fieldName = step.on_success !== undefined ? 'on_success' : 'on_confirm';
  const field = step[fieldName];
  if (!field) return;
  if (typeof field === 'string') {
    (step as any)[fieldName] = target;
  } else if (Array.isArray(field)) {
    for (const branch of field as { next_step: string }[]) {
      branch.next_step = target;
    }
  } else if (typeof field === 'object') {
    (field as { next_step: string }).next_step = target;
  }
}
