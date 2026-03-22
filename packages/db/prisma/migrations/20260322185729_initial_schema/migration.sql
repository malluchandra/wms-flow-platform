-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "core";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "events";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "flow";

-- CreateTable
CREATE TABLE "auth"."tenants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."workers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "badge_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "upc" TEXT[],
    "uom" TEXT NOT NULL DEFAULT 'EA',
    "weight_kg" DECIMAL(10,4),
    "lot_tracked" BOOLEAN NOT NULL DEFAULT false,
    "serial_tracked" BOOLEAN NOT NULL DEFAULT false,
    "velocity_class" TEXT,
    "storage_type" TEXT NOT NULL DEFAULT 'ambient',
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."locations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "barcode" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "aisle" TEXT,
    "bay" TEXT,
    "level" TEXT,
    "position" TEXT,
    "type" TEXT NOT NULL DEFAULT 'rack',
    "status" TEXT NOT NULL DEFAULT 'active',
    "max_lpns" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."inventory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "lot_number" TEXT,
    "expiry_date" DATE,
    "qty_on_hand" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "qty_reserved" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "order_number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "ship_by" TIMESTAMPTZ,
    "carrier" TEXT,
    "ship_to" JSONB,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."order_lines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "qty_ordered" DECIMAL(12,4) NOT NULL,
    "qty_picked" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "qty_shipped" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'open',

    CONSTRAINT "order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."waves" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planning',
    "released_at" TIMESTAMPTZ,
    "released_by" UUID,

    CONSTRAINT "waves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."wave_orders" (
    "wave_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,

    CONSTRAINT "wave_orders_pkey" PRIMARY KEY ("wave_id","order_id")
);

-- CreateTable
CREATE TABLE "core"."tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "wave_id" UUID,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unassigned',
    "priority" INTEGER NOT NULL DEFAULT 5,
    "assigned_to" UUID,
    "assigned_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "source_location_id" UUID,
    "dest_location_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."task_lines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "task_id" UUID NOT NULL,
    "order_line_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "lot_number" TEXT,
    "qty_required" DECIMAL(12,4) NOT NULL,
    "qty_picked" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'open',
    "picked_by" UUID,
    "picked_at" TIMESTAMPTZ,

    CONSTRAINT "task_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events"."scan_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "worker_id" UUID NOT NULL,
    "task_id" UUID,
    "flow_id" UUID,
    "step_id" TEXT,
    "barcode_raw" TEXT NOT NULL,
    "barcode_type" TEXT,
    "parsed_data" JSONB,
    "result" TEXT NOT NULL,
    "rejection_reason" TEXT,
    "device_id" TEXT,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scan_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events"."audit_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID,
    "before_data" JSONB,
    "after_data" JSONB,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flow"."flow_definitions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "base_flow_id" UUID,
    "version" TEXT NOT NULL,
    "definition" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "environment" TEXT NOT NULL,
    "created_by" UUID,
    "deployed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flow_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flow"."worker_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "worker_id" UUID NOT NULL,
    "flow_id" UUID NOT NULL,
    "task_id" UUID,
    "step_index" INTEGER NOT NULL DEFAULT 0,
    "state_data" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'active',
    "device_id" TEXT,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "worker_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "auth"."tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "workers_tenant_id_badge_id_key" ON "auth"."workers"("tenant_id", "badge_id");

-- CreateIndex
CREATE UNIQUE INDEX "items_tenant_id_sku_key" ON "core"."items"("tenant_id", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "locations_tenant_id_barcode_key" ON "core"."locations"("tenant_id", "barcode");

-- CreateIndex
CREATE UNIQUE INDEX "orders_tenant_id_order_number_key" ON "core"."orders"("tenant_id", "order_number");

-- CreateIndex
CREATE INDEX "order_lines_tenant_id_idx" ON "core"."order_lines"("tenant_id");

-- CreateIndex
CREATE INDEX "tasks_assigned_to_status_idx" ON "core"."tasks"("assigned_to", "status");

-- CreateIndex
CREATE INDEX "task_lines_task_id_idx" ON "core"."task_lines"("task_id");

-- CreateIndex
CREATE UNIQUE INDEX "flow_definitions_tenant_id_name_version_environment_key" ON "flow"."flow_definitions"("tenant_id", "name", "version", "environment");

-- CreateIndex
CREATE INDEX "worker_sessions_worker_id_status_idx" ON "flow"."worker_sessions"("worker_id", "status");

-- AddForeignKey
ALTER TABLE "auth"."workers" ADD CONSTRAINT "workers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "auth"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."items" ADD CONSTRAINT "items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "auth"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."locations" ADD CONSTRAINT "locations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "auth"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."inventory" ADD CONSTRAINT "inventory_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "auth"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."inventory" ADD CONSTRAINT "inventory_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "core"."items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."inventory" ADD CONSTRAINT "inventory_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "core"."locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."orders" ADD CONSTRAINT "orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "auth"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."order_lines" ADD CONSTRAINT "order_lines_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "auth"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."order_lines" ADD CONSTRAINT "order_lines_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "core"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."order_lines" ADD CONSTRAINT "order_lines_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "core"."items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."waves" ADD CONSTRAINT "waves_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "auth"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."waves" ADD CONSTRAINT "waves_released_by_fkey" FOREIGN KEY ("released_by") REFERENCES "auth"."workers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."wave_orders" ADD CONSTRAINT "wave_orders_wave_id_fkey" FOREIGN KEY ("wave_id") REFERENCES "core"."waves"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."wave_orders" ADD CONSTRAINT "wave_orders_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "core"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."tasks" ADD CONSTRAINT "tasks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "auth"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."tasks" ADD CONSTRAINT "tasks_wave_id_fkey" FOREIGN KEY ("wave_id") REFERENCES "core"."waves"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."tasks" ADD CONSTRAINT "tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."workers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."tasks" ADD CONSTRAINT "tasks_source_location_id_fkey" FOREIGN KEY ("source_location_id") REFERENCES "core"."locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."tasks" ADD CONSTRAINT "tasks_dest_location_id_fkey" FOREIGN KEY ("dest_location_id") REFERENCES "core"."locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."task_lines" ADD CONSTRAINT "task_lines_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "core"."tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."task_lines" ADD CONSTRAINT "task_lines_order_line_id_fkey" FOREIGN KEY ("order_line_id") REFERENCES "core"."order_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."task_lines" ADD CONSTRAINT "task_lines_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "core"."items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."task_lines" ADD CONSTRAINT "task_lines_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "core"."locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."task_lines" ADD CONSTRAINT "task_lines_picked_by_fkey" FOREIGN KEY ("picked_by") REFERENCES "auth"."workers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events"."scan_events" ADD CONSTRAINT "scan_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "auth"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events"."scan_events" ADD CONSTRAINT "scan_events_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "auth"."workers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events"."audit_log" ADD CONSTRAINT "audit_log_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "auth"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events"."audit_log" ADD CONSTRAINT "audit_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "auth"."workers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flow"."flow_definitions" ADD CONSTRAINT "flow_definitions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "auth"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flow"."flow_definitions" ADD CONSTRAINT "flow_definitions_base_flow_id_fkey" FOREIGN KEY ("base_flow_id") REFERENCES "flow"."flow_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flow"."flow_definitions" ADD CONSTRAINT "flow_definitions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."workers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flow"."worker_sessions" ADD CONSTRAINT "worker_sessions_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "auth"."workers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flow"."worker_sessions" ADD CONSTRAINT "worker_sessions_flow_id_fkey" FOREIGN KEY ("flow_id") REFERENCES "flow"."flow_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
