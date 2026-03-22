// ─── Step Types ───────────────────────────────────────────────
export type StepType =
  | 'navigate'
  | 'scan'
  | 'number_input'
  | 'confirm'
  | 'menu_select'
  | 'message'
  | 'camera_input'
  | 'api_call'
  | 'print';

export type Severity = 'info' | 'error' | 'success';

// ─── Transition Types ─────────────────────────────────────────

/** Simple string shorthand: "next-step-id" */
export type TransitionTarget = string;

/** Values in set_context can be template strings, booleans, or numbers per spec section 6.1 */
export type ContextValue = string | number | boolean;

/** Explicit transition with optional side effects */
export interface TransitionHandler {
  set_context?: Record<string, ContextValue>;
  api_call?: ApiCallConfig;
  next_step: string;
  on_api_failure?: string;
}

/** Conditional transition — evaluated top-to-bottom, first match wins */
export interface ConditionalTransition {
  condition: string;
  set_context?: Record<string, ContextValue>;
  next_step: string;
}

/** A transition value can be a string shorthand, handler object, or conditional array */
export type TransitionValue =
  | TransitionTarget
  | TransitionHandler
  | ConditionalTransition[];

// ─── API Call Config ──────────────────────────────────────────

export interface ApiCallConfig {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload?: Record<string, string>;
}

// ─── Validation Config ────────────────────────────────────────

export interface ValidationConfig {
  type?: 'exact_match' | 'api_lookup' | 'regex';
  endpoint?: string;
  payload?: Record<string, string>;
  error_message?: string;
  min?: number | string;
  max?: number | string;
  short_pick_threshold?: number;
}

// ─── Menu Option ──────────────────────────────────────────────

export interface MenuOption {
  label: string;
  value: string;
  next_step: string;
}

// ─── Flow Step ────────────────────────────────────────────────

export interface FlowStep {
  id: string;
  type: StepType;
  prompt: string;

  // Display fields (navigate, message)
  display?: Record<string, string>;
  body?: string;
  severity?: Severity;

  // Scan fields
  expected_value?: string;
  validation?: ValidationConfig;

  // Number input fields
  uom?: string;
  target?: string;

  // Confirm fields
  summary_fields?: string[];

  // Menu select fields
  options?: MenuOption[];

  // API call fields (for type: api_call)
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload?: Record<string, string>;

  // ─── Transition handlers ─────────────────────
  on_success?: TransitionValue;
  on_failure?: TransitionValue;
  on_confirm?: TransitionValue;
  on_back?: TransitionValue;
  on_dismiss?: TransitionValue;
  on_skip?: TransitionValue;
  on_exception?: TransitionValue;
  on_short_pick?: TransitionValue;
  on_api_failure?: TransitionValue;
}

// ─── Context Schema ───────────────────────────────────────────

export type ContextSchemaValue =
  | 'string'
  | 'number'
  | 'boolean'
  | 'uuid'
  | { [key: string]: ContextSchemaValue };

export type ContextSchema = Record<string, ContextSchemaValue>;

// ─── Flow Definition ──────────────────────────────────────────

export interface FlowDefinition {
  id: string;
  name: string;
  version: string;
  display_name: string;
  extends: string | null;
  context_schema: ContextSchema;
  entry_step: string;
  steps: FlowStep[];
}

// ─── Flow Context ─────────────────────────────────────────────

/**
 * Runtime state object for a worker session.
 * All {{context.*}} template expressions resolve against this.
 */
export interface FlowContext {
  [key: string]: unknown;
  __caller_stack?: string[];
}
