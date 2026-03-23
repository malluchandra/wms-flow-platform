import type { FlowDefinition, FlowStep, TransitionHandler, ConditionalTransition } from '@wms/types';

export interface FlowGroup {
  id: string;
  label: string;
  color: string;
  bgColor: string;
  stepIds: string[];
}

export function analyzeFlowGroups(flow: FlowDefinition): FlowGroup[] {
  if (flow.steps.length === 0) return [];

  const stepById = new Map(flow.steps.map((s) => [s.id, s]));

  // 1. Walk main path
  const mainPathIds: string[] = [];
  const visited = new Set<string>();
  let current = flow.entry_step;
  while (current && stepById.has(current) && !visited.has(current)) {
    visited.add(current);
    mainPathIds.push(current);
    const step = stepById.get(current)!;
    const next = getFirstSuccessTarget(step);
    current = next && next !== '__exit__' && next !== '__abandon__' && next !== '__continue__' ? next : '';
  }

  // 2. Error handlers
  const errorIds: string[] = [];
  for (const step of flow.steps) {
    if (visited.has(step.id)) continue;
    if (
      step.id.includes('exception') ||
      step.id.includes('error') ||
      step.id.includes('wrong') ||
      step.severity === 'error' ||
      (step.type === 'menu_select' && step.id.includes('exception'))
    ) {
      errorIds.push(step.id);
      visited.add(step.id);
    }
  }

  // 3. Everything else
  const secondaryIds: string[] = [];
  for (const step of flow.steps) {
    if (!visited.has(step.id)) {
      secondaryIds.push(step.id);
      visited.add(step.id);
    }
  }

  const groups: FlowGroup[] = [];

  if (mainPathIds.length > 0) {
    groups.push({
      id: 'main-path',
      label: 'Main Path',
      color: '#2563eb',
      bgColor: 'rgba(37, 99, 235, 0.04)',
      stepIds: mainPathIds,
    });
  }

  if (errorIds.length > 0) {
    groups.push({
      id: 'error-handlers',
      label: 'Error Handling',
      color: '#dc2626',
      bgColor: 'rgba(220, 38, 38, 0.04)',
      stepIds: errorIds,
    });
  }

  if (secondaryIds.length > 0) {
    groups.push({
      id: 'secondary',
      label: 'Secondary Paths',
      color: '#d97706',
      bgColor: 'rgba(217, 119, 6, 0.04)',
      stepIds: secondaryIds,
    });
  }

  return groups;
}

function getFirstSuccessTarget(step: FlowStep): string {
  const field = step.on_success ?? step.on_confirm ?? step.on_dismiss;
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (Array.isArray(field)) {
    return (field as ConditionalTransition[])[0]?.next_step ?? '';
  }
  return (field as TransitionHandler).next_step ?? '';
}
