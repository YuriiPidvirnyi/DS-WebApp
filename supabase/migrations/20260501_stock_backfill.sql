-- Phase 1 backfill: 3-tier topology seed + opening-balance document.
--
-- Runs AFTER 20260501_stock_posting_primitive.sql.
-- Idempotent — safe to run multiple times.
--
-- Q1 lock: 1 main + 3 cabinets + N doctor satellites (one per is_active doctor).
-- Q5 caveat: opening lots use unit_cost=0 (no historical cost data).

BEGIN;

-- 1) Main warehouse
INSERT INTO stock_warehouses (name_uk, kind, is_main, sort_order)
SELECT 'Головний склад', 'main', true, 0
WHERE NOT EXISTS (SELECT 1 FROM stock_warehouses WHERE kind = 'main');

-- 2) Three treatment cabinets (Q1: exactly 3)
INSERT INTO stock_warehouses (name_uk, kind, is_main, sort_order)
SELECT v.name, 'cabinet', false, v.sort
  FROM (VALUES
    ('Кабінет 1', 10),
    ('Кабінет 2', 11),
    ('Кабінет 3', 12)
  ) AS v(name, sort)
 WHERE NOT EXISTS (SELECT 1 FROM stock_warehouses WHERE kind = 'cabinet' AND name_uk = v.name);

-- 3) One satellite per active doctor
--    doctors table has no full_name column — compose from last_name + first_name.
INSERT INTO stock_warehouses (name_uk, kind, is_main, doctor_id, sort_order)
SELECT 'Склад ' || CONCAT_WS(' ', d.last_name, d.first_name),
       'doctor',
       false,
       d.id,
       100 + ROW_NUMBER() OVER (ORDER BY d.last_name, d.first_name)
  FROM doctors d
 WHERE d.is_active = true
   AND NOT EXISTS (SELECT 1 FROM stock_warehouses sw WHERE sw.kind = 'doctor' AND sw.doctor_id = d.id);

-- 4) Route legacy material_inventory rows (warehouse_id IS NULL) to main warehouse.
WITH main_wh AS (SELECT id FROM stock_warehouses WHERE is_main ORDER BY sort_order LIMIT 1)
UPDATE material_inventory mi
   SET warehouse_id = (SELECT id FROM main_wh)
 WHERE mi.warehouse_id IS NULL;

-- 5) Synthetic opening-balance incoming document on main warehouse.
WITH main_wh AS (SELECT id FROM stock_warehouses WHERE is_main ORDER BY sort_order LIMIT 1),
     first_super AS (SELECT id FROM admin_users WHERE role = 'superadmin' ORDER BY created_at LIMIT 1),
     opening AS (
       INSERT INTO stock_documents (
         id, doc_type, doc_number, status, posted_at, posted_by,
         warehouse_to_id, supplier_id, responsible_user_id, doc_date,
         comment, total_amount
       )
       SELECT
         gen_random_uuid(),
         'incoming',
         'OPEN-' || to_char(CURRENT_DATE, 'YYYY-MM-DD'),
         'posted',
         now(),
         (SELECT id FROM first_super),
         (SELECT id FROM main_wh),
         NULL,
         (SELECT id FROM first_super),
         CURRENT_DATE,
         'Synthetic opening balance — created by 20260501_stock_backfill.sql',
         0
       WHERE NOT EXISTS (SELECT 1 FROM stock_documents WHERE doc_number LIKE 'OPEN-%')
       RETURNING id, warehouse_to_id
     )
INSERT INTO stock_document_items (stock_document_id, material_id, pack_qty, unit_qty, unit_cost, line_total)
SELECT o.id, mi.material_id, 0, mi.current_quantity, 0, 0
  FROM opening o, material_inventory mi
 WHERE mi.current_quantity > 0 AND mi.warehouse_id = o.warehouse_to_id;

-- 6) Seed stock_lots from opening document.
INSERT INTO stock_lots (material_id, warehouse_id, source_document_id, unit_cost, qty_initial, qty_remaining, received_at)
SELECT sdi.material_id, sd.warehouse_to_id, sd.id, 0, sdi.unit_qty, sdi.unit_qty, sd.posted_at
  FROM stock_documents sd
  JOIN stock_document_items sdi ON sdi.stock_document_id = sd.id
 WHERE sd.doc_number LIKE 'OPEN-%'
   AND sdi.unit_qty > 0
   AND NOT EXISTS (SELECT 1 FROM stock_lots sl WHERE sl.source_document_id = sd.id AND sl.material_id = sdi.material_id);

-- 7) Audit-log the backfill.
INSERT INTO admin_audit_logs (actor_id, action, entity_type, entity_id, metadata)
SELECT sd.posted_by,
       'stock_backfill.opening_balance',
       'stock_documents',
       sd.id,
       jsonb_build_object(
         'item_count', (SELECT COUNT(*) FROM stock_document_items WHERE stock_document_id = sd.id),
         'run_at', now()
       )
  FROM stock_documents sd
 WHERE sd.doc_number LIKE 'OPEN-%'
ON CONFLICT DO NOTHING;

COMMIT;
