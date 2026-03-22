import type {
  FlowDefinition,
  FlowStep,
  TransitionValue,
  TransitionHandler,
  ConditionalTransition,
  ContextSchema,
  ContextSchemaValue,
  MenuOption,
} from '@wms/types';

// ─── Public Types ─────────────────────────────────────────────

export interface LintError {
  code: string;
  message: string;
  step_id?: string;
}

// ─── Sentinel Values ──────────────────────────────────────────

const SENTINELS = new Set(['__exit__', '__abandon__']);

/** Template expressions that are valid step references (not real step IDs) */
const TEMPLATE_STEP_REFS = new Set(['{{caller_step}}']);

/**
 * Runtime-injected context variables that are not declared in context_schema.
 * These are special magic variables provided by the flow engine at runtime.
 */
const RUNTIME_CONTEXT_VARS = new Set(['caller_step']);

// ─── Public API ───────────────────────────────────────────────

/**
 * Validates a FlowDefinition against 5 deterministic rules:
 * 1. MISSING_EXCEPTION_HANDLER — must have a step with id "exception-handler"
 * 2. NO_EXIT_PATH — at least one step must reach __exit__ or __abandon__
 * 3. UNDEFINED_STEP_REFERENCE — no transition may reference an undefined step ID
 * 4. UNDECLARED_CONTEXT_VAR — all {{context.*}} vars must be in context_schema
 * 5. DUPLICATE_STEP_ID — no two steps may share the same id
 */
export function validateFlow(flow: FlowDefinition): LintError[] {
  const errors: LintError[] = [];
  const stepIds = new Set(flow.steps.map((s) => s.id));

  // Rule 1: MISSING_EXCEPTION_HANDLER
  if (!stepIds.has('exception-handler')) {
    errors.push({
      code: 'MISSING_EXCEPTION_HANDLER',
      message:
        'Flow must have a step with id "exception-handler". Every flow needs an exception handling path.',
    });
  }

  // Rule 2: NO_EXIT_PATH
  {
    let hasExitPath = false;
    for (const step of flow.steps) {
      const refs = extractStepReferences(step);
      if (refs.some((r) => SENTINELS.has(r))) {
        hasExitPath = true;
        break;
      }
    }
    if (!hasExitPath) {
      errors.push({
        code: 'NO_EXIT_PATH',
        message:
          'Flow has no path to __exit__ or __abandon__. At least one step must transition to a terminal sentinel.',
      });
    }
  }

  // Rule 3: UNDEFINED_STEP_REFERENCE
  for (const step of flow.steps) {
    const refs = extractStepReferences(step);
    for (const ref of refs) {
      if (
        !SENTINELS.has(ref) &&
        !TEMPLATE_STEP_REFS.has(ref) &&
        !stepIds.has(ref)
      ) {
        errors.push({
          code: 'UNDEFINED_STEP_REFERENCE',
          message: `Step "${step.id}" references undefined step "${ref}"`,
          step_id: step.id,
        });
      }
    }
  }

  // Rule 4: UNDECLARED_CONTEXT_VAR
  for (const step of flow.steps) {
    const vars = extractContextVars(step);
    for (const varPath of vars) {
      if (!isInContextSchema(varPath, flow.context_schema)) {
        errors.push({
          code: 'UNDECLARED_CONTEXT_VAR',
          message: `Step "${step.id}" uses undeclared context variable "{{context.${varPath}}}" — not found in context_schema`,
          step_id: step.id,
        });
      }
    }
  }

  // Rule 5: DUPLICATE_STEP_ID
  {
    const seen = new Set<string>();
    for (const step of flow.steps) {
      if (seen.has(step.id)) {
        errors.push({
          code: 'DUPLICATE_STEP_ID',
          message: `Duplicate step id "${step.id}" — each step must have a unique id`,
          step_id: step.id,
        });
      }
      seen.add(step.id);
    }
  }

  return errors;
}

// ─── Helpers ──────────────────────────────────────────────────

/**
 * Extracts all step ID references from all transition fields of a step.
 * Handles: string shorthand, TransitionHandler, ConditionalTransition[],
 * menu options, and embedded api_call handlers.
 */
function extractStepReferences(step: FlowStep): string[] {
  const refs: string[] = [];

  // Transition fields
  const transitionKeys: (keyof FlowStep)[] = [
    'on_success',
    'on_failure',
    'on_confirm',
    'on_back',
    'on_dismiss',
    'on_skip',
    'on_exception',
    'on_short_pick',
    'on_api_failure',
  ];

  for (const key of transitionKeys) {
    const value = step[key] as TransitionValue | undefined;
    if (value != null) {
      extractRefsFromTransition(value, refs);
    }
  }

  // Menu options
  if (step.options) {
    for (const option of step.options) {
      refs.push(option.next_step);
    }
  }

  return refs;
}

/**
 * Recursively extracts step ID references from a transition value.
 */
function extractRefsFromTransition(
  value: TransitionValue,
  refs: string[]
): void {
  if (typeof value === 'string') {
    refs.push(value);
  } else if (Array.isArray(value)) {
    // ConditionalTransition[]
    for (const item of value as ConditionalTransition[]) {
      refs.push(item.next_step);
    }
  } else if (typeof value === 'object' && value !== null) {
    // TransitionHandler
    const handler = value as TransitionHandler;
    if (handler.next_step) {
      refs.push(handler.next_step);
    }
    if (handler.on_api_failure) {
      extractRefsFromTransition(
        handler.on_api_failure as unknown as TransitionValue,
        refs
      );
    }
  }
}

/**
 * Extracts all {{context.*}} variable paths from all string values in a step.
 * Skips {{response.*}} (only available in on_success handlers).
 * Skips {{input}} and {{caller_step}}.
 * Returns the full dotted path after "context." (e.g., "task_line.location.zone").
 */
function extractContextVars(step: FlowStep): string[] {
  const vars: string[] = [];
  const seen = new Set<string>();

  function walk(value: unknown): void {
    if (typeof value === 'string') {
      const regex = /\{\{context\.([^}]+)\}\}/g;
      let match;
      while ((match = regex.exec(value)) !== null) {
        const varPath = match[1].trim();
        // Skip runtime-injected vars (e.g., caller_step) not in context_schema
        const topLevel = varPath.split('.')[0];
        if (RUNTIME_CONTEXT_VARS.has(topLevel)) continue;
        if (!seen.has(varPath)) {
          seen.add(varPath);
          vars.push(varPath);
        }
      }
    } else if (Array.isArray(value)) {
      for (const item of value) {
        walk(item);
      }
    } else if (value !== null && typeof value === 'object') {
      for (const v of Object.values(value as Record<string, unknown>)) {
        walk(v);
      }
    }
  }

  walk(step);
  return vars;
}

/**
 * Checks if a context variable path is declared in the context schema.
 * Uses the first segment (top-level key) for the lookup.
 *
 * Examples:
 * - "task_line.location.zone" → checks "task_line" exists in schema
 * - "qty_picked" → checks "qty_picked" exists in schema
 */
function isInContextSchema(
  varPath: string,
  schema: ContextSchema
): boolean {
  const segments = varPath.split('.');
  let current: ContextSchema | ContextSchemaValue = schema;

  for (const segment of segments) {
    if (typeof current !== 'object' || current === null) return false;
    if (!(segment in current)) return false;
    current = (current as Record<string, ContextSchemaValue>)[segment];
  }

  return true;
}
