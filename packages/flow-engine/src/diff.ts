import type { FlowDefinition, FlowStep } from '@wms/types';

export interface FieldChange {
  field: string;
  before: unknown;
  after: unknown;
}

export interface StepDiff {
  stepId: string;
  changes: FieldChange[];
}

export interface FlowDiffResult {
  added: string[];
  removed: string[];
  modified: StepDiff[];
  unchanged: string[];
  metadataChanges: FieldChange[];
  summary: {
    added: number;
    removed: number;
    modified: number;
    unchanged: number;
  };
}

/**
 * Compute a structural diff between two flow definitions.
 * Compares steps by ID, then checks each field for changes.
 */
export function diffFlows(
  flowA: FlowDefinition,
  flowB: FlowDefinition
): FlowDiffResult {
  const stepsA = new Map(flowA.steps.map((s) => [s.id, s]));
  const stepsB = new Map(flowB.steps.map((s) => [s.id, s]));

  const added: string[] = [];
  const removed: string[] = [];
  const modified: StepDiff[] = [];
  const unchanged: string[] = [];

  // Check A→B: removed or modified
  for (const [id, stepA] of stepsA) {
    const stepB = stepsB.get(id);
    if (!stepB) {
      removed.push(id);
      continue;
    }
    const changes = diffStep(stepA, stepB);
    if (changes.length > 0) {
      modified.push({ stepId: id, changes });
    } else {
      unchanged.push(id);
    }
  }

  // Check B for new steps
  for (const id of stepsB.keys()) {
    if (!stepsA.has(id)) {
      added.push(id);
    }
  }

  // Metadata changes
  const metadataChanges: FieldChange[] = [];
  if (flowA.entry_step !== flowB.entry_step) {
    metadataChanges.push({ field: 'entry_step', before: flowA.entry_step, after: flowB.entry_step });
  }
  if (flowA.version !== flowB.version) {
    metadataChanges.push({ field: 'version', before: flowA.version, after: flowB.version });
  }
  if (JSON.stringify(flowA.context_schema) !== JSON.stringify(flowB.context_schema)) {
    metadataChanges.push({ field: 'context_schema', before: flowA.context_schema, after: flowB.context_schema });
  }

  return {
    added,
    removed,
    modified,
    unchanged,
    metadataChanges,
    summary: {
      added: added.length,
      removed: removed.length,
      modified: modified.length,
      unchanged: unchanged.length,
    },
  };
}

function diffStep(a: FlowStep, b: FlowStep): FieldChange[] {
  const changes: FieldChange[] = [];
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);

  for (const key of keys) {
    if (key.startsWith('_')) continue; // skip metadata fields
    const va = (a as unknown as Record<string, unknown>)[key];
    const vb = (b as unknown as Record<string, unknown>)[key];
    if (JSON.stringify(va) !== JSON.stringify(vb)) {
      changes.push({ field: key, before: va, after: vb });
    }
  }

  return changes;
}
