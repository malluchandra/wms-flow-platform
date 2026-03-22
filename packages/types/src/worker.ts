export type WorkerRole = 'picker' | 'supervisor' | 'admin';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: Date;
}

export interface Worker {
  id: string;
  tenant_id: string;
  name: string;
  badge_id: string;
  role: WorkerRole;
  is_active: boolean;
  created_at: Date;
}
