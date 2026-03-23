import type { FlowDefinition } from '@wms/types';

/**
 * System prompt that teaches Claude the WMS flow JSON format.
 * Used by both /generate/flow and /generate/step.
 */
export const FLOW_SYSTEM_PROMPT = `You are a WMS (Warehouse Management System) flow designer. You generate flow definitions in JSON format for a metadata-driven mobile warehouse platform.

A flow definition is a directed graph of steps. Each step has:
- id: unique string identifier (kebab-case)
- type: one of: navigate, scan, number_input, confirm, menu_select, message, api_call
- prompt: display text shown to the warehouse worker
- Transition handlers: on_success, on_failure, on_confirm, on_back, on_dismiss, on_skip, on_exception, on_short_pick

Step types and their fields:
- navigate: display (zone/aisle/bay/level), on_confirm, on_skip
- scan: expected_value, validation (type: exact_match|api_lookup|regex), on_success, on_failure
- number_input: uom, target, validation (min/max/short_pick_threshold), on_success, on_short_pick
- confirm: summary_fields, on_confirm, on_back
- menu_select: options [{label, value, next_step}]
- message: body, severity (info|error|success), on_dismiss
- api_call: endpoint, method, payload, on_success, on_failure

Transition values can be:
- String shorthand: "next-step-id"
- Handler object: { set_context: {...}, next_step: "id" }
- Handler with API call: { api_call: {...}, next_step: "id", on_api_failure: "error-step" }
- Conditional array: [{ condition: "...", next_step: "id" }, ...]

Template syntax: {{context.variable}} for context references, {{input}} for user input, {{response.field}} for API response.

Required rules:
1. Every flow MUST have a step with id "exception-handler"
2. Every flow MUST have at least one path to "__exit__" or "__abandon__"
3. All step references must point to existing step IDs
4. All {{context.*}} variables must be declared in context_schema

Return ONLY valid JSON. No markdown, no explanation, no code fences.`;

/**
 * Build the user prompt for full flow generation.
 */
export function buildFlowPrompt(description: string): string {
  return `Generate a complete WMS flow definition JSON for the following workflow:

${description}

Return a complete FlowDefinition JSON object with: id, name, version, display_name, extends (null), context_schema, entry_step, and steps array.`;
}

/**
 * Build the user prompt for single step generation.
 */
export function buildStepPrompt(description: string, existingStepIds: string[]): string {
  return `Generate a single flow step JSON object for the following:

${description}

Existing step IDs in the flow (you can reference these in transitions): ${existingStepIds.join(', ')}

Return a single step JSON object with: id, type, prompt, and appropriate transition handlers.`;
}

// Re-export FlowDefinition so it can be used if needed
export type { FlowDefinition };
