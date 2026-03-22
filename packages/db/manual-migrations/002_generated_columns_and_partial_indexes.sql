-- qty_available computed column (spec section 5.3)
-- Prisma cannot express PostgreSQL generated columns — must be raw SQL
ALTER TABLE core.inventory
  ADD COLUMN IF NOT EXISTS qty_available DECIMAL(12,4)
  GENERATED ALWAYS AS (qty_on_hand - qty_reserved) STORED;

-- Partial unique indexes on inventory for lot/non-lot uniqueness (spec section 5.3)
-- Without these, concurrent picks can create duplicate rows → phantom inventory
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_unique_non_lot
  ON core.inventory(tenant_id, item_id, location_id)
  WHERE lot_number IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_unique_lot
  ON core.inventory(tenant_id, item_id, location_id, lot_number)
  WHERE lot_number IS NOT NULL;

-- Partial index for fast active session lookup on re-login (spec section 5.2)
CREATE INDEX IF NOT EXISTS idx_worker_sessions_active
  ON flow.worker_sessions(worker_id, status)
  WHERE status = 'active';

-- Partial index for assigned task lookup — hot path (spec section 5.3)
CREATE INDEX IF NOT EXISTS idx_tasks_assigned
  ON core.tasks(assigned_to, status)
  WHERE status IN ('assigned', 'in_progress');
