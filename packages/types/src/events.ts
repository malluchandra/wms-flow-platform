// ─── Scan Event ───────────────────────────────────────────────

export type ScanResult = 'valid' | 'invalid' | 'override';
export type BarcodeType = 'GS1-128' | 'Code128' | 'QR' | 'DataMatrix';

export interface ScanEvent {
  id: string;
  tenant_id: string;
  worker_id: string;
  task_id: string | null;
  flow_id: string | null;
  step_id: string | null;
  barcode_raw: string;
  barcode_type: BarcodeType | null;
  parsed_data: Record<string, unknown> | null;
  result: ScanResult;
  rejection_reason: string | null;
  device_id: string | null;
  timestamp: Date;
}

// ─── Realtime Events (SSE) ───────────────────────────────────

export interface TaskAssignedEvent {
  type: 'task_assigned';
  task_id: string;
  worker_id: string;
  flow_id: string;
  tenant_id: string;
}

export interface TaskReassignedEvent {
  type: 'task_reassigned';
  task_id: string;
  from_worker_id: string;
  to_worker_id: string;
  tenant_id: string;
}

export interface SupervisorMessageEvent {
  type: 'supervisor_message';
  worker_id: string;
  message: string;
  tenant_id: string;
}

export interface WaveReleasedEvent {
  type: 'wave_released';
  wave_id: string;
  tenant_id: string;
  task_count: number;
}

export interface StepChangedEvent {
  type: 'step_changed';
  session_id: string;
  worker_id: string;
  step_id: string;
  tenant_id: string;
}

export type RealtimeEvent =
  | TaskAssignedEvent
  | TaskReassignedEvent
  | SupervisorMessageEvent
  | WaveReleasedEvent
  | StepChangedEvent;
