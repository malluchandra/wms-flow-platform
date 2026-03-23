// ─── Extension Modes ──────────────────────────────────────────

/**
 * How a partner flow relates to its base flow:
 * - use:      Run base flow unchanged. Child has no steps.
 * - extend:   Base steps locked. Partner injects at extension points.
 * - override: Base steps editable. Partner can replace any step.
 * - fork:     Full independent copy. No inheritance tracking.
 */
export type ExtensionMode = 'use' | 'extend' | 'override' | 'fork';

/**
 * Step origin metadata (added by resolver, used by builder UI).
 * - base:     Step inherited from the base flow (locked in extend mode)
 * - partner:  Step added by the partner (always editable)
 * - override: Base step modified by the partner (in override mode)
 */
export type StepSource = 'base' | 'partner' | 'override';
