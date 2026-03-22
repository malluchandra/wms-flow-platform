export type SessionStatus = 'active' | 'completed' | 'abandoned';

export interface WorkerSession {
  id: string;
  worker_id: string;
  flow_id: string;
  task_id: string | null;
  step_index: number;
  state_data: Record<string, unknown>;
  status: SessionStatus;
  device_id: string | null;
  started_at: Date;
  updated_at: Date;
}
