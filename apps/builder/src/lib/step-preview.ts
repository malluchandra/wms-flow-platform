import type { FlowStep } from '@wms/types';

export interface PreviewElement {
  kind: string;
  [key: string]: unknown;
}

export interface StepPreviewConfig {
  type: string;
  header: string;
  elements: PreviewElement[];
  buttons: Array<{ label: string; style: 'primary' | 'secondary' | 'danger' }>;
}

/**
 * Generate a preview config for a step, with templates resolved against sample context.
 */
export function getStepPreviewConfig(
  step: FlowStep,
  sampleContext: Record<string, unknown>
): StepPreviewConfig {
  const header = resolveTemplates(step.prompt, sampleContext);
  const elements: PreviewElement[] = [];
  const buttons: StepPreviewConfig['buttons'] = [];

  switch (step.type) {
    case 'scan':
      elements.push({ kind: 'scan-input', placeholder: 'Scan barcode or enter manually' });
      if (step.expected_value) {
        elements.push({ kind: 'hint', text: `Expected: ${resolveTemplates(step.expected_value, sampleContext)}` });
      }
      buttons.push({ label: 'Submit', style: 'primary' });
      break;

    case 'navigate':
      if (step.display) {
        const resolved: Record<string, string> = {};
        for (const [k, v] of Object.entries(step.display)) {
          resolved[k] = resolveTemplates(v, sampleContext);
        }
        elements.push({ kind: 'location-card', fields: resolved });
      }
      buttons.push({ label: "I'm Here", style: 'primary' });
      if (step.on_skip) buttons.push({ label: 'Skip', style: 'secondary' });
      break;

    case 'number_input':
      elements.push({
        kind: 'number-keypad',
        uom: step.uom ? resolveTemplates(step.uom, sampleContext) : 'EA',
        target: step.target ? resolveTemplates(step.target, sampleContext) : '',
      });
      buttons.push({ label: 'Submit', style: 'primary' });
      break;

    case 'confirm':
      if (step.summary_fields) {
        const fields: Record<string, string> = {};
        for (const field of step.summary_fields) {
          const val = sampleContext[field];
          fields[field] = val !== undefined ? String(val) : `{{context.${field}}}`;
        }
        elements.push({ kind: 'summary-card', fields });
      }
      buttons.push({ label: 'Confirm', style: 'primary' });
      buttons.push({ label: 'Back', style: 'secondary' });
      break;

    case 'menu_select':
      if (step.options) {
        elements.push({
          kind: 'option-list',
          items: step.options.map((o) => o.label),
        });
      }
      break;

    case 'message':
      elements.push({
        kind: 'message-body',
        text: step.body ? resolveTemplates(step.body, sampleContext) : '',
        severity: step.severity ?? 'info',
      });
      buttons.push({ label: 'Dismiss', style: step.severity === 'error' ? 'danger' : 'primary' });
      break;

    case 'camera_input':
      elements.push({ kind: 'camera-viewfinder' });
      buttons.push({ label: 'Capture', style: 'primary' });
      break;

    case 'api_call':
      elements.push({ kind: 'loading-spinner', endpoint: step.endpoint ?? '' });
      break;

    case 'print':
      elements.push({ kind: 'printer-status' });
      break;
  }

  return { type: step.type, header, elements, buttons };
}

function resolveTemplates(text: string, ctx: Record<string, unknown>): string {
  return text.replace(/\{\{context\.([^}]+)\}\}/g, (_, path: string) => {
    const parts = path.trim().split('.');
    let current: unknown = ctx;
    for (const part of parts) {
      if (current == null || typeof current !== 'object') return `{{context.${path}}}`;
      current = (current as Record<string, unknown>)[part];
    }
    return current != null ? String(current) : `{{context.${path}}}`;
  });
}
