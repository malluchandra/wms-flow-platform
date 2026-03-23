import type { FlowDefinition, StepType } from '@wms/types';

export interface SearchResult {
  stepId: string;
  matchType: 'id' | 'prompt' | 'type';
  text: string;
}

export function searchFlow(
  flow: FlowDefinition,
  query: string
): SearchResult[] {
  if (!query.trim()) {
    return flow.steps.map((s) => ({
      stepId: s.id,
      matchType: 'id' as const,
      text: s.id,
    }));
  }

  const q = query.toLowerCase();
  const results: SearchResult[] = [];

  for (const step of flow.steps) {
    if (step.id.toLowerCase().includes(q)) {
      results.push({ stepId: step.id, matchType: 'id', text: step.id });
    } else if (step.prompt.toLowerCase().includes(q)) {
      results.push({ stepId: step.id, matchType: 'prompt', text: step.prompt });
    } else if (step.type.toLowerCase().includes(q)) {
      results.push({ stepId: step.id, matchType: 'type', text: step.type });
    }
  }

  return results;
}

export function filterStepsByType(
  flow: FlowDefinition,
  types: StepType[]
): string[] {
  const typeSet = new Set(types);
  return flow.steps
    .filter((s) => typeSet.has(s.type))
    .map((s) => s.id);
}
