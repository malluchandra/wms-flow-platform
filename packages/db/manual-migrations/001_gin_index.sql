-- GIN index for fast barcode array search on items.upc
-- Cannot be expressed in Prisma schema — applied via manual migration
-- Enables: WHERE upc @> ARRAY[$1::text] without table scan
CREATE INDEX IF NOT EXISTS idx_items_upc ON core.items USING GIN(upc);
