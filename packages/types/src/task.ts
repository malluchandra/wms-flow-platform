export type TaskType = 'pick' | 'putaway' | 'replenish' | 'count' | 'receive';
export type TaskStatus = 'unassigned' | 'assigned' | 'in_progress' | 'complete' | 'exception';
export type TaskLineStatus = 'open' | 'complete' | 'short' | 'skipped';
export type OrderStatus = 'new' | 'released' | 'picking' | 'packed' | 'shipped';
export type OrderLineStatus = 'open' | 'partial' | 'complete' | 'short';
export type WaveStatus = 'planning' | 'released' | 'active' | 'complete';

export interface TaskLineExpanded {
  id: string;
  task_id: string;
  order_line_id: string;
  item: {
    sku: string;
    name: string;
    uom: string;
  };
  location: {
    barcode: string;
    zone: string;
    aisle: string | null;
    bay: string | null;
    level: string | null;
  };
  lot_number: string | null;
  qty_required: number;
  qty_picked: number;
  status: TaskLineStatus;
}

export interface TaskLine {
  id: string;
  task_id: string;
  order_line_id: string;
  item_id: string;
  location_id: string;
  lot_number: string | null;
  qty_required: number;
  qty_picked: number;
  status: TaskLineStatus;
  picked_by: string | null;
  picked_at: Date | null;
}

export interface Task {
  id: string;
  tenant_id: string;
  wave_id: string | null;
  type: TaskType;
  status: TaskStatus;
  priority: number;
  assigned_to: string | null;
  assigned_at: Date | null;
  completed_at: Date | null;
  source_location_id: string | null;
  dest_location_id: string | null;
  created_at: Date;
}

export interface Wave {
  id: string;
  tenant_id: string;
  status: WaveStatus;
  released_at: Date | null;
  released_by: string | null;
}
