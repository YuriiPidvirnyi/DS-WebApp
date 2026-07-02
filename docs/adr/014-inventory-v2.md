# ADR-014: Inventory & Warehouse Module v2 — Evolve to CliniCards Parity

**Status:** Proposed
**Date:** 2026-04-22
**Author:** @Yurii (implementation), with extensive CliniCards reverse-engineering pass
**Deciders:** @Yurii
**Branch target:** `feature/inventory-v2-*` → `develop`
**Supersedes:** v1 and v2 drafts from the 2026-04-22 session

---

## 1. Evidence base

This ADR is grounded in:

- **Full repository audit** of our existing inventory system: 5 Supabase tables (`materials`, `material_inventory`, `material_orders`, `material_order_items`, `treatment_materials_used`), 6 API routes, 2 admin views, `deduct_inventory`/`add_inventory` SQL functions, 8-role RBAC with `inventory_manager` + `analyst`, 87 unit/E2E tests. See [§A](#appendix-a-existing-system-snapshot).
- **All 17 CliniCards Warehouse help articles** read end-to-end (IDs 550, 545, 506, 507, 508, 509, 510, 511, 512, 513, 515, 516, 517, 518, 519, 520, 521, 522, 523).
- **62 CliniCards in-app tooltip entries harvested** via `POST /cabinet/tooltips/get/{id}` — the same content that displays when a user clicks the little "i" icon on any field, column header, or section. These surface what the help docs gloss over: exact field semantics, dependency chains between settings, and edge-case behaviour. The full catalogue with ID cross-references is [§B](#appendix-b-cliniccards-tooltip-catalogue).
- **Live walk-through** of every Warehouse screen in the production CliniCards instance registered to "Dental Story" (logged in as Марта):
  - Settings sub-tabs: Склади, Бренди, Товари, Контрагенти, Списання матеріалів, Шаблони актів списання матеріалів, ⚙ Додаткові налаштування
  - Мої склади (daily card grid)
  - Моя інвентаризація (personal per-warehouse stock check)
  - Заявки від співробітників (internal requisitions — tooltip 463 reveals this is still in public-beta rollout at CliniCards)
  - Замовлення контрагентам (supplier POs)
  - Накладні — all 5 invoice types + the full create-invoice editor (Прихідна)
  - Інвентаризація audit list + wizard (scope picker)
  - Звіти — all 10 reports inspected, two detail forms captured (Залишки, Собівартість послуг, Замовлення товарів з критичним залишком)

Screenshots saved to disk during inspection. Negative-balance filter option in the Залишки report (`Всі / >0 / <0 / =0`) confirms CliniCards permits negative balances with a clinic-level toggle — a detail only visible live, not in help docs.

---

## 2. Core model gaps vs. CliniCards (tooltip-referenced)

| #   | Capability                                                                                                                                                               | Today                                  | CliniCards                                                                                                                                                                                                                                                        | Ref                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| 1   | Multi-warehouse with `main`/`cabinet`/`doctor` taxonomy                                                                                                                  | `storage_location` string, no UI       | First-class `stock_warehouses` with drag-reorder, archive-never-delete-if-has-docs                                                                                                                                                                                | 407, 432                          |
| 2   | Document posting primitive (draft → posted → optional cancel-post)                                                                                                       | None                                   | 5 doc types, each draft-then-post; write-offs uniquely also support _un-posting_ via separate permission 474                                                                                                                                                      | 422–426, 442, 474                 |
| 3   | FIFO for write-off/consumption, LIFO for supplier returns                                                                                                                | None                                   | Explicit (help article 506)                                                                                                                                                                                                                                       | 422, 423, 425                     |
| 4   | Two-tier unit-of-measure: pack format × in-pack quantity                                                                                                                 | Flat enum                              | `Формат упаковки` (box, jar, pack) + `В упаковці` (pcs, ml, g)                                                                                                                                                                                                    | 438, 439                          |
| 5   | Auto-consumption via calculation cards on service completion (3 modes: none/manual/auto)                                                                                 | Manual `treatment_materials_used` only | Tooltip 417 spells out tri-mode; 458 covers permissions; 486 describes linking via `Акт`                                                                                                                                                                          | 414, 415, 417, 458, 486           |
| 6   | Inventory audits with scope picker (warehouses × categories × brands × products), auto-produces a `Коректування` invoice on post                                         | None                                   | Full workflow; post creates immutable adjustment doc                                                                                                                                                                                                              | 428, 426, 476, 477                |
| 7   | Two-tier requisitioning: internal `Заявки` vs supplier `Замовлення контрагентам`                                                                                         | Conflated in `material_orders`         | Separate flows; staff creates заявка, head nurse bundles into замовлення; on supplier delivery creates incoming invoice (note: CliniCards is still rolling this out — tooltip 463/464/465 all say "Розділи Заявки та Замовлення будуть доступі найближчим часом") | 430, 463–465                      |
| 8   | Supplier / brand / category directories                                                                                                                                  | Denormalised on `materials`            | Standalone tables with archive; suppliers shared with Cash module                                                                                                                                                                                                 | 408, 410, 435                     |
| 9   | Barcodes (multi, comma-separated, scanner-driven)                                                                                                                        | None                                   | First-class `Штрихкод` field on product card                                                                                                                                                                                                                      | 437                               |
| 10  | Per-warehouse critical stock thresholds + per-warehouse default reorder qty                                                                                              | Global `min_stock_level`               | Matrix per `(material_id, warehouse_id)`: `Ліміт` (triggers yellow/red UI state) + `Замовлення` (default qty pre-filled on PO)                                                                                                                                    | 411                               |
| 11  | Per-warehouse visibility (`Відображати на складах`)                                                                                                                      | None                                   | Materials only appear on warehouses staff work with                                                                                                                                                                                                               | 412                               |
| 12  | Granular per-warehouse RBAC (base + 14 per-invoice-type flags)                                                                                                           | 2 flat permissions                     | Fine-grained matrix `(user × warehouse × flag)`                                                                                                                                                                                                                   | 413, 452–477                      |
| 13  | Accounting integration: auto-create supplier A/P bill on incoming doc post, grouped by expense category                                                                  | None                                   | Clinic-wide toggle; default category if product unlabelled                                                                                                                                                                                                        | 420, 459                          |
| 14  | Free-text product search + global `Фільтр по товару/бренду/артикулу` present on every document list                                                                      | Basic list filter                      | Universal                                                                                                                                                                                                                                                         | 445                               |
| 15  | 10 built-in reports (Balances, Revaluation, Product History, Deliveries, Transfers, Service Cost, Supplier Profile, Who-can-supply-X, Critical-stock Reorder, Write-off) | 0                                      | Full suite, period-scoped, Excel export                                                                                                                                                                                                                           | —                                 |
| 16  | Product image upload                                                                                                                                                     | Already have                           | Same                                                                                                                                                                                                                                                              | —                                 |
| 17  | Invoice attachment (scan of supplier invoice)                                                                                                                            | None                                   | "Завантажити фото/файли" on every invoice header                                                                                                                                                                                                                  | —                                 |
| 18  | Negative-balance tolerance                                                                                                                                               | Not supported                          | Clinic-level option; report has `<0` filter                                                                                                                                                                                                                       | Empirical, from Залишки report UI |
| 19  | Quick actions from warehouse card (Списати / Перемістити / Заявка) with on-screen side-cart                                                                              | None                                   | Mobile-first daily workflow                                                                                                                                                                                                                                       | 430                               |
| 20  | Drag-reorder warehouses for UI convenience                                                                                                                               | N/A                                    | Yes                                                                                                                                                                                                                                                               | 407                               |
| 21  | Bulk material substitution (`Заміна товару`) across all calculation cards when a product is discontinued                                                                 | None                                   | Single-click substitute everywhere                                                                                                                                                                                                                                | 415                               |
| 22  | Moя інвентаризація: per-user per-warehouse quick stock-take workbench, distinct from formal audit                                                                        | None                                   | Yes; can be toggled off for the whole clinic (418)                                                                                                                                                                                                                | 418                               |
| 23  | Auto invoice-number scheme per type-year (e.g. `2604-0000000001`)                                                                                                        | None (UUID only)                       | First-class human-readable numbers                                                                                                                                                                                                                                | 441 (+ live UI)                   |
| 24  | Copy any invoice (posted or not) to start a similar one                                                                                                                  | None                                   | "Копіювати" button on every invoice                                                                                                                                                                                                                               | 442                               |

---

## 3. Decision

Evolve in place. Keep the `materials` / `material_inventory` / `material_orders` tables (extend them) and layer in a new posting primitive + supporting tables. Build in 8 phases on `develop` behind a `inventory_v2` feature flag. Ship Phase 1 (the posting primitive) before anything else — every downstream capability depends on it.

We reject Option B (replace with CliniCards) because it would split the audit trail between our treatment/RBAC/patient stack and their warehouse stack — tooltip 486 (`Акт`) makes clear that CliniCards' calculation-card auto-consumption is only first-class when the **act** of treatment lives in the same system. Embedding them means forfeiting our clinical↔inventory coupling, which is our differentiation.

We reject Option C (outsource FIFO to a library) because the math is ~200 lines of plpgsql; no JS/TS library targets dental clinics' dual-unit semantics.

---

## 4. Phase 1 — Posting primitive + multi-warehouse (the keystone)

### 4.1 Database migration

File: `supabase/migrations/20260501_stock_posting_primitive.sql`. Follows the established `BEGIN;`/`COMMIT;`/`IF NOT EXISTS`/RLS pattern from `20260321_clinical_and_inventory.sql`. Extract:

```sql
BEGIN;

-- 1) Warehouses
CREATE TABLE IF NOT EXISTS public.stock_warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_uk TEXT NOT NULL, name_en TEXT, name_pl TEXT,
  -- Locked topology (Q1, 2026-04-22): 3-tier hierarchy.
  --   kind='main'    → central clinic storeroom, exactly 1 row, is_main=true
  --   kind='cabinet' → physical treatment cabinets, exactly 3 rows (clinic has 3 cabinets)
  --   kind='doctor'  → per-doctor personal satellite, N rows (N = active doctors)
  --   kind='other'   → reserved for future (e.g. lab, external consignment)
  kind TEXT NOT NULL CHECK (kind IN ('main','cabinet','doctor','other')),
  is_main BOOLEAN NOT NULL DEFAULT false,     -- exactly one TRUE allowed (partial unique index below)
  responsible_user_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  cabinet_id UUID,                            -- required when kind='cabinet' (FK resolved when cabinets table lands, Phase 2)
  doctor_id  UUID REFERENCES public.doctors(id) ON DELETE SET NULL, -- required when kind='doctor'
  sort_order INT NOT NULL DEFAULT 0,          -- drag-reorder per tooltip 407
  comment TEXT,                               -- every entity has a comment (tooltip 433)
  is_archived BOOLEAN NOT NULL DEFAULT false, -- archive-never-delete-if-has-docs (tooltip 434)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- 3-tier invariants (Q1 lock):
  CONSTRAINT wh_main_shape     CHECK (kind <> 'main'    OR (is_main = true  AND doctor_id IS NULL  AND cabinet_id IS NULL)),
  CONSTRAINT wh_cabinet_shape  CHECK (kind <> 'cabinet' OR (is_main = false AND doctor_id IS NULL)),
  CONSTRAINT wh_doctor_shape   CHECK (kind <> 'doctor'  OR (is_main = false AND doctor_id IS NOT NULL AND cabinet_id IS NULL))
);
-- Enforce exactly one main warehouse across the clinic.
CREATE UNIQUE INDEX IF NOT EXISTS uq_stock_warehouses_single_main
  ON public.stock_warehouses ((true)) WHERE is_main = true AND is_archived = false;
-- Enforce one warehouse per doctor (a doctor cannot own two satellite warehouses).
CREATE UNIQUE INDEX IF NOT EXISTS uq_stock_warehouses_doctor
  ON public.stock_warehouses (doctor_id) WHERE kind = 'doctor' AND is_archived = false;

-- 2) Documents: THE posting primitive
CREATE TABLE IF NOT EXISTS public.stock_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_type TEXT NOT NULL CHECK (doc_type IN ('incoming','writeoff','return','transfer','adjustment')),
  doc_number TEXT NOT NULL,                   -- per tooltip 441: human-readable, auto-generated
  status TEXT NOT NULL DEFAULT 'draft'        -- per tooltip 442
    CHECK (status IN ('draft','posted','void')),
  posted_at TIMESTAMPTZ,
  posted_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  warehouse_from_id UUID REFERENCES public.stock_warehouses(id) ON DELETE RESTRICT,
  warehouse_to_id   UUID REFERENCES public.stock_warehouses(id) ON DELETE RESTRICT,
  supplier_id       UUID REFERENCES public.material_suppliers(id) ON DELETE SET NULL,
  responsible_user_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  doc_date DATE NOT NULL DEFAULT CURRENT_DATE,
  comment TEXT,
  image_url TEXT,                             -- per live UI: "Завантажити фото/файли" on every header
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  supplier_order_id UUID REFERENCES public.material_orders(id) ON DELETE SET NULL,
  treatment_record_id UUID REFERENCES public.treatment_records(id) ON DELETE SET NULL,
  inventory_audit_id UUID,                    -- FK resolved in Phase 6
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT doc_shape CHECK (
    (doc_type='incoming'   AND warehouse_to_id IS NOT NULL AND warehouse_from_id IS NULL AND supplier_id IS NOT NULL) OR
    (doc_type='writeoff'   AND warehouse_from_id IS NOT NULL AND warehouse_to_id IS NULL) OR
    (doc_type='return'     AND warehouse_from_id IS NOT NULL AND warehouse_to_id IS NULL AND supplier_id IS NOT NULL) OR
    (doc_type='transfer'   AND warehouse_from_id IS NOT NULL AND warehouse_to_id IS NOT NULL AND warehouse_from_id <> warehouse_to_id) OR
    (doc_type='adjustment' AND warehouse_from_id IS NOT NULL)
  ),
  UNIQUE (doc_type, doc_number)
);

-- 3) Line items
CREATE TABLE IF NOT EXISTS public.stock_document_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_document_id UUID NOT NULL REFERENCES public.stock_documents(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  pack_qty NUMERIC(14,4) NOT NULL DEFAULT 0,   -- per tooltip 438: optional, receive OR consume in pack or unit
  unit_qty NUMERIC(14,4) NOT NULL,             -- always derived, canonical unit
  unit_cost NUMERIC(14,4) NOT NULL DEFAULT 0,  -- on incoming: provided; on writeoff/return/transfer: FIFO-derived
  line_total NUMERIC(14,2) NOT NULL DEFAULT 0
);

-- 4) FIFO lot book (for tooltip 506's FIFO/LIFO semantics)
CREATE TABLE IF NOT EXISTS public.stock_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL REFERENCES public.stock_warehouses(id) ON DELETE RESTRICT,
  source_document_id UUID NOT NULL REFERENCES public.stock_documents(id) ON DELETE RESTRICT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unit_cost NUMERIC(14,4) NOT NULL CHECK (unit_cost >= 0),
  qty_initial NUMERIC(14,4) NOT NULL CHECK (qty_initial > 0),
  qty_remaining NUMERIC(14,4) NOT NULL CHECK (qty_remaining >= 0)
);
CREATE INDEX IF NOT EXISTS idx_lots_fifo
  ON public.stock_lots (material_id, warehouse_id, received_at) WHERE qty_remaining > 0;

-- 5) Consumption trail (per-lot which line consumed which qty — audit trail + report source)
CREATE TABLE IF NOT EXISTS public.stock_lot_consumption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_document_item_id UUID NOT NULL REFERENCES public.stock_document_items(id) ON DELETE CASCADE,
  lot_id UUID NOT NULL REFERENCES public.stock_lots(id) ON DELETE RESTRICT,
  unit_qty NUMERIC(14,4) NOT NULL CHECK (unit_qty > 0),
  unit_cost NUMERIC(14,4) NOT NULL
);

-- RLS: admin read/write, direct stock table writes forbidden outside RPC
ALTER TABLE public.stock_warehouses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_documents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_document_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_lots             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_lot_consumption  ENABLE ROW LEVEL SECURITY;

CREATE POLICY stock_docs_admin_rw    ON public.stock_documents FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY stock_items_admin_rw   ON public.stock_document_items FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY stock_wh_admin_rw      ON public.stock_warehouses FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY stock_lots_admin_r     ON public.stock_lots FOR SELECT USING (public.is_admin());
CREATE POLICY stock_lots_block_write ON public.stock_lots FOR INSERT WITH CHECK (false);
CREATE POLICY stock_lots_block_upd   ON public.stock_lots FOR UPDATE USING (false);
CREATE POLICY stock_cons_admin_r     ON public.stock_lot_consumption FOR SELECT USING (public.is_admin());
CREATE POLICY stock_cons_block_write ON public.stock_lot_consumption FOR INSERT WITH CHECK (false);

-- 6) Unblock negative balances at the storage layer.
-- The existing check `CHECK (current_quantity >= 0)` on material_inventory (from
-- 20260321_clinical_and_inventory.sql) is incompatible with Q5-locked
-- `allow_negative_balance=true`: post_stock_document() will decrement past zero
-- when the toggle is on, and the UPDATE would fail `check_violation` at the row
-- level BEFORE the RPC can write the ghost consumption row. Drop the hard check;
-- enforcement now lives inside post_stock_document() (see §13.2), which honours
-- the clinic toggle and raises only when allow_negative_balance=false.
ALTER TABLE public.material_inventory
  DROP CONSTRAINT IF EXISTS material_inventory_current_quantity_check;
-- Replace with a soft lower bound that still rules out absurd magnitudes but
-- allows the temporary ramp-up period for negative balances.
ALTER TABLE public.material_inventory
  ADD CONSTRAINT material_inventory_current_quantity_bounded
  CHECK (current_quantity > -1e9);

COMMIT;
```

### 4.2 The `post_stock_document()` RPC

Single entry point for all stock mutations. `SECURITY DEFINER`, bypasses the RLS write-blocks on `stock_lots` + `stock_lot_consumption`.

```sql
CREATE OR REPLACE FUNCTION public.post_stock_document(p_doc_id UUID)
RETURNS public.stock_documents
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE d public.stock_documents;
BEGIN
  SELECT * INTO d FROM stock_documents WHERE id = p_doc_id FOR UPDATE;
  IF d.status <> 'draft' THEN
    RAISE EXCEPTION 'Document % not in draft (status=%)', p_doc_id, d.status
      USING ERRCODE = 'check_violation';
  END IF;

  PERFORM 1 FROM material_inventory mi
   WHERE mi.warehouse_id IN (d.warehouse_from_id, d.warehouse_to_id)
     AND mi.material_id IN (SELECT material_id FROM stock_document_items WHERE stock_document_id = d.id)
   FOR UPDATE;                                                 -- locks balance rows

  IF d.doc_type = 'incoming' THEN
    INSERT INTO stock_lots (material_id, warehouse_id, source_document_id, unit_cost, qty_initial, qty_remaining)
    SELECT sdi.material_id, d.warehouse_to_id, d.id, sdi.unit_cost, sdi.unit_qty, sdi.unit_qty
      FROM stock_document_items sdi WHERE sdi.stock_document_id = d.id;

    INSERT INTO material_inventory (material_id, warehouse_id, current_quantity)
    SELECT sdi.material_id, d.warehouse_to_id, sdi.unit_qty
      FROM stock_document_items sdi WHERE sdi.stock_document_id = d.id
    ON CONFLICT (material_id, warehouse_id) DO UPDATE
      SET current_quantity = material_inventory.current_quantity + EXCLUDED.current_quantity,
          last_restocked_at = CURRENT_DATE;

  ELSIF d.doc_type IN ('writeoff','return') THEN
    PERFORM public._drain_lots(d.id, CASE d.doc_type WHEN 'writeoff' THEN 'FIFO' ELSE 'LIFO' END);

  ELSIF d.doc_type = 'transfer' THEN
    PERFORM public._transfer_lots(d.id);

  ELSIF d.doc_type = 'adjustment' THEN
    PERFORM public._adjust_lots(d.id);   -- positive: new lot at chosen cost; negative: FIFO drain
  END IF;

  UPDATE stock_documents
     SET status='posted', posted_at=now(), posted_by=auth.uid()
   WHERE id = p_doc_id
  RETURNING * INTO d;

  INSERT INTO admin_audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), 'stock_document.post', 'stock_documents', d.id,
          jsonb_build_object('doc_type', d.doc_type, 'doc_number', d.doc_number, 'total', d.total_amount));

  RETURN d;
END; $$;

REVOKE ALL ON FUNCTION public.post_stock_document FROM public;
GRANT  EXECUTE ON FUNCTION public.post_stock_document TO authenticated;
```

### 4.3 The one concession CliniCards made that we must mirror — un-post write-offs

Tooltip **474** ("Відміна проведених накладних списання") is explicit: a permissioned user _can_ un-post a posted write-off invoice. This contradicts "posted is immutable." The reason is the real-world frequency of write-off mistakes during a busy clinic day (wrong quantity, wrong material).

Design: add `unpost_writeoff_document(p_doc_id UUID, p_reason TEXT)` RPC. On call: (a) restore drained lots by replaying `stock_lot_consumption` in reverse, (b) increment balances, (c) set `status='draft'`, (d) log with action `stock_document.unpost` including reason. Guarded by new permission flag `stock_docs:unpost_writeoff`. No equivalent for incoming/transfer/return/adjustment — those keep the "posted-is-immutable" contract.

### 4.4 API (Phase 1)

```ts
POST   /api/stock/documents           body: { docType, warehouseFromId?, warehouseToId?, supplierId?, responsibleUserId, docDate?, comment?, imageUrl?, items: [{ materialId, packQty, unitCost? }] }
GET    /api/stock/documents           ?type=&status=&warehouseId=&supplierId=&from=&to=&q=
GET    /api/stock/documents/:id       full with items + lot_consumption join
PATCH  /api/stock/documents/:id       409 if posted
DELETE /api/stock/documents/:id       409 if posted
POST   /api/stock/documents/:id/post  → RPC call
POST   /api/stock/documents/:id/unpost body:{ reason } — writeoff only, 403 without flag

GET/POST/PATCH/DELETE /api/stock/warehouses  standard CRUD + sort_order PATCH

GET/POST/PATCH/DELETE /api/stock/brands       standard (Phase 2 scaffold)
GET/POST/PATCH/DELETE /api/stock/suppliers    standard (Phase 2 scaffold)
```

CSRF + rate-limit matches current `material-orders` routes: 30/min reads, 20/min writes.

### 4.5 Tests (Phase 1 acceptance)

pgTAP:

1. Post an incoming doc → balance + lot created.
2. Two parallel post() on the same (material, warehouse) → exactly one succeeds, one raises serialisation; balance correct.
3. Writeoff with insufficient lots → raises (unless `allow_negative_balance` clinic toggle on).
4. Unpost writeoff → replays lot consumption, balance restored, `status=draft`.
5. Attempt direct `UPDATE material_inventory` from non-RPC path → blocked by RLS.

Playwright: 6. Full UX: create incoming → add two items → post → balance page shows correct qty. 7. Create two warehouses, transfer → both balances reflect correctly.

---

## 5. Phase breakdown

| #   | Phase                                                                                              | Weeks | Key deliverables                                                                                                                                                                                                                                                                                                                                                             | Depends on  |
| --- | -------------------------------------------------------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 0   | Groundwork                                                                                         | 0.5   | ADR merged, epic in tracker, preprod seed (1 main + 3 cabinets + 2 sample doctor warehouses = 6 `stock_warehouses` rows; 5 brands; 4 suppliers; 50 products; 1 draft incoming), feature flag `inventory_v2` OFF in prod                                                                                                                                                      | —           |
| 1   | Posting primitive + multi-warehouse + full per-warehouse permission matrix                         | 3.5   | Migration (including 3-tier CHECK constraints + `stock_warehouse_permissions`), `post_stock_document` (honours `allow_negative_balance` toggle), `_drain_lots`/`_transfer_lots`/`_adjust_lots`, `unpost_writeoff_document`, Phase-1 APIs, `/admin/stock/documents` list + incoming-doc editor, **full `/admin/stock/permissions` matrix UI** (users × warehouses × 14 flags) | 0           |
| 2   | Directories: suppliers, brands, categories (tree)                                                  | 1.5   | `material_suppliers` (with full Ukrainian legal fields per UI: phone, website, email, 2 contacts, legal+actual address, ЄДРПОУ, bank details), `material_brands`, `material_categories` (tree), backfill from `materials` denormalised columns, migrate `materials.category` enum → `category_id` FK                                                                         | 1           |
| 3   | Product card enhancement: barcodes, pack/unit split, per-warehouse critical + reorder + visibility | 1.0   | `materials`: `pack_format_label`, `pack_size_numerator`, `pack_size_unit`, `barcodes TEXT[]`, `article_code`, `brand_id`, `default_supplier_id`, `image_url` (already have). `material_inventory`: `critical_level_unit_qty`, `default_reorder_unit_qty`, `is_visible`. Web BarcodeDetector API integration + USB keyboard-wedge fallback                                    | 1           |
| 4   | Write-off, transfer, return documents + Мої склади card grid (daily hot path)                      | 2.5   | UI: 5 invoice tabs with column-filters (matching CliniCards Накладні layout). Side-cart pattern for quick-writeoff/quick-transfer/quick-requisition from material cards. Link return-from-incoming (auto-fill supplier + items per tooltip 423)                                                                                                                              | 1, 3        |
| 5   | Calculation cards + hybrid auto-seed + manual-override write-off on treatment completion           | 2.0   | `service_calculation_cards` + `_items` (FK to `services`); clinic setting `writeoff_mode ∈ {none, draft_hybrid, auto}` (Q2 lock — `draft_hybrid` is the launch default: auto-seed draft from calc card, staff adds/edits/removes freely, posts manually); hook into treatment-status transition to `completed`; bulk `Заміна товару` substitute utility (tooltip 415)        | 4           |
| 6   | Inventory audits                                                                                   | 1.0   | `inventory_audits` + `_items`; scope-picker wizard matching CliniCards layout (warehouses × categories × brands × products checkboxes with search); auto-fill from current balances; colour-coded delta (green ↑ / red ↓); on post → generate `adjustment` stock_document                                                                                                    | 4           |
| 7   | Reports (core 5 of 10)                                                                             | 2.0   | Balances, Product history, Critical-stock reorder-suggest, Write-off, Cost of services (FIFO-based service margin)                                                                                                                                                                                                                                                           | 4, 5        |
| 8   | Deferred                                                                                           | —     | Revaluation, Supplier profile, Deliveries, Transfers, Who-can-supply, accounting A/P auto-bill (blocks on Cash module)                                                                                                                                                                                                                                                       | post-launch |

**Total to CliniCards parity: 14.0 calendar weeks for one full-time engineer.** (+0.5 week vs. initial estimate — permission matrix now ships in Phase 1 instead of Phase 4; net effort unchanged, risk profile improved.)

Flip `inventory_v2 = ON` in preprod after Phase 4, in prod after Phase 7.

---

## 6. RBAC — explicit expansion of `src/lib/permissions.ts`

### 6.1 New global permissions

```
stock_warehouses:manage           (Phase 1)
stock_brands:manage               (Phase 2)
stock_suppliers:manage            (Phase 2)
stock_categories:manage           (Phase 2)
stock_calc_cards:manage           (Phase 5)
stock_settings:manage             (clinic-wide, Phase 0)
stock_docs:unpost_writeoff        (Phase 1 — the sensitive one)
stock_docs:view_reports           (Phase 7)
stock_other_warehouse_balances    (tooltip 461 — hide cross-warehouse balance)
```

### 6.2 Per-warehouse permissions (new table `stock_warehouse_permissions`)

```
(user_id, warehouse_id, flags JSONB)

flags keys (matching CliniCards tooltips 462, 466-477):
  base_access                      (462 — master switch, "no row" = hidden)
  view_incoming, edit_incoming     (466, 467)
  view_writeoff, create_writeoff,
    edit_posted_writeoff,
    delete_draft_writeoff          (472, 473, 474, 475)
  view_return, edit_return         (468, 469)
  view_transfer, edit_transfer     (470, 471)
  view_audit, run_audit            (476, 477)
```

### 6.3 Default assignments (applied on role change + on warehouse create)

| Role                     | Global flags                         | Per-warehouse flags                                                                     |
| ------------------------ | ------------------------------------ | --------------------------------------------------------------------------------------- |
| superadmin, admin        | all                                  | all on all warehouses                                                                   |
| inventory_manager        | all `stock_*:manage`, `view_reports` | all per-warehouse flags, all warehouses                                                 |
| doctor                   | —                                    | `base_access`, `view_*`, `create_writeoff`, `run_audit` on their cabinet warehouse only |
| assistant                | —                                    | `base_access`, `view_*`, `create_writeoff` on assigned cabinet                          |
| receptionist             | —                                    | —                                                                                       |
| billing_manager, analyst | `view_reports`                       | `base_access` + `view_*` (read-only) on all                                             |

### 6.4 RLS on `stock_documents`

```sql
USING (
  public.is_admin() OR
  public.user_has_stock_flag(auth.uid(),
    COALESCE(warehouse_from_id, warehouse_to_id),
    CASE doc_type
      WHEN 'incoming'   THEN 'view_incoming'
      WHEN 'writeoff'   THEN 'view_writeoff'
      WHEN 'return'     THEN 'view_return'
      WHEN 'transfer'   THEN 'view_transfer'
      WHEN 'adjustment' THEN 'view_audit'
    END)
)
```

---

## 7. UI — Мої склади card, fully specified

The daily hot-path view. Reconstructed from tooltip 430 + screenshots of empty state + CSS conventions (blue/yellow/red semantics):

```
┌─ [≡] Головний склад          [Підвірна Марта ▾]      [Пошук]     [❗критичні] [+ заявка]  ┐
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ Сторона зліва: дерево категорій (Всі товари → Гігієна → Рукавички → …)                      │
│ Сторона центр: сітка карток товарів, 4–6 на ряд на desktop, 1 на mobile                     │
│ Сторона справа (sticky): швидкий-кошик — draft writeoff / draft transfer / draft requisition │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

Each card (matches tooltip 430 exactly):

```
┌────────────────────────────────────────┐
│  🖼 90×90 product image        Filtek Z250 A2   ← name colour:
│                                (Dental Supreme)     green = in stock
│  Нав. на цьому складі: 12.0 г               red   = 0 / below critical
│  Нав. на інших: 120 г   🟦 (synced tile colour:
│                          🟦 blue   = available elsewhere
│                          🟨 yellow = below critical elsewhere
│                          🟥 red    = zero everywhere)
│  Заявки (pending): 0 шт
│                                        │
│  [Списати ↓] [Перемістити ↔] [Заявка 🛒]  ← three quick actions
└────────────────────────────────────────┘
```

The right side-cart accumulates items from repeated card clicks (e.g., five `Списати` clicks → one write-off invoice with five lines). Side-cart has three drawers (one per action type), each shows items + totals + "Провести"/OK button. On OK: the draft invoice is posted atomically. Matches tooltip 430's final paragraph exactly.

---

## 8. Phase 5 — calculation cards, worked example with SQL

```sql
-- 8.1 Schema
CREATE TABLE public.service_calculation_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (service_id)
);

CREATE TABLE public.service_calculation_card_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.service_calculation_cards(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  default_unit_qty NUMERIC(14,4) NOT NULL CHECK (default_unit_qty > 0),
  is_replaceable BOOLEAN NOT NULL DEFAULT true      -- tooltip 458: clinician can adjust qty at act time
);

-- 8.2 Clinic settings (new row key — Q2 lock, 2026-04-22)
--   'none'         → no auto write-off (legacy behaviour, for clinics without calc cards)
--   'draft_hybrid' → LAUNCH DEFAULT. Auto-seed a draft writeoff from the service's calc card on
--                    treatment completion. Draft stays editable: staff can add/remove/edit any
--                    line before posting. `stock_document_items` does NOT track origin — once a
--                    row exists in the draft, it is an equal first-class citizen regardless of
--                    whether the calc-card seeded it or a human typed it in. This matches the
--                    clinic's real-world workflow: calc cards are a *starting point*, not a
--                    contract — assistants often swap a batch (different A2 shade, open kit),
--                    add consumables (extra матриця), or remove lines (service bundle reused a
--                    material already on tray).
--   'auto'         → seed + post in one transaction, no human review. Only enable once the
--                    calc-card catalogue is considered stable (usually >90 days after launch).
INSERT INTO clinic_settings (key, value) VALUES ('writeoff_mode', '"draft_hybrid"');
```

**Worked example.** Dr. Petrenko marks treatment `T-123` status=`completed`. Service is "Пломба світлова композитна". Its calc card has: 1 × Filtek Z250 A2, 2 × кофердам, 1 × матриця сект, 0.5 × бор алмазний. Clinic mode is `draft_hybrid` (launch default).

```ts
// app/api/treatment-records/[id]/route.ts  (pseudocode)
if (next.status === 'completed' && prev.status !== 'completed') {
  const mode = await getClinicSetting('writeoff_mode') // 'none' | 'draft_hybrid' | 'auto'
  if (mode === 'none') return
  // Both 'draft_hybrid' and 'auto' seed a draft identically.
  const doc = await supabase.rpc('create_writeoff_draft_for_treatment', {
    p_treatment_record_id: next.id,
    p_warehouse_id: resolveDoctorCabinetWarehouse(next.doctor_id),
    // lines come from resolve_calculation_card_lines() — see §17.2
  })
  if (mode === 'auto') {
    await supabase.rpc('post_stock_document', { p_doc_id: doc.id })
  }
  // draft_hybrid (default): doc stays in status='draft'; the treating doctor or assistant opens
  // /admin/stock/documents/[id], freely edits line items (add/remove/change qty or substitute a
  // material), then clicks Post. UI treats all rows identically — no badge distinguishes
  // calc-card-seeded vs. manually-added lines.
}
```

The writeoff draft contains one `stock_document_items` row per card item at seed time. Users can freely INSERT new rows or UPDATE/DELETE existing ones through `PATCH /api/stock/documents/[id]/items` while status='draft'. On post, `_drain_lots` iterates **every** current line in `received_at ASC` order, creating `stock_lot_consumption` rows until each line is satisfied. The resulting `total_amount` reflects the **actual FIFO cost** of that treatment as finally consumed — feeding the Собівартість послуг report directly. Because origin is not tracked, the cost report is honest: "what left stock for this treatment" rather than "what the calc card predicted."

---

## 9. Report SQL — the two that unlock P&L insight

### 9.1 Balances (`/admin/stock/reports/balances`)

```sql
SELECT m.id, m.name_uk, mc.name_uk AS category, mb.name AS brand,
       sw.id AS warehouse_id, sw.name_uk AS warehouse,
       mi.current_quantity AS qty,
       m.pack_size_numerator, m.pack_size_unit,
       mi.critical_level_unit_qty,
       CASE
         WHEN mi.current_quantity <= 0                           THEN 'out'
         WHEN mi.current_quantity < mi.critical_level_unit_qty    THEN 'critical'
         ELSE 'ok'
       END AS status,
       (SELECT SUM(sl.qty_remaining*sl.unit_cost) / NULLIF(SUM(sl.qty_remaining),0)
          FROM stock_lots sl
         WHERE sl.material_id=m.id AND sl.warehouse_id=sw.id AND sl.qty_remaining>0
       ) AS weighted_avg_cost
FROM   materials m
JOIN   material_categories mc ON mc.id=m.category_id
LEFT   JOIN material_brands mb ON mb.id=m.brand_id
JOIN   material_inventory mi ON mi.material_id=m.id
JOIN   stock_warehouses sw ON sw.id=mi.warehouse_id
WHERE  m.is_active AND NOT sw.is_archived
ORDER  BY sw.sort_order, mc.name_uk, m.name_uk;
```

Frontend filter surface (matches the CliniCards Залишки report screenshot): warehouse, category, brand, product, critical-only toggle, show-avg-cost toggle, balance-state (All/>0/<0/=0), period range.

### 9.2 Cost of services (`/admin/stock/reports/service-cost`)

```sql
SELECT s.name_uk                                      AS service,
       DATE_TRUNC('month', tr.created_at)             AS month,
       COUNT(*)                                       AS n_performed,
       AVG(tri.price_at_time)                         AS avg_price,
       AVG(COALESCE(mc.material_cost_sum, 0))         AS avg_material_cost,
       AVG(tri.price_at_time - COALESCE(mc.material_cost_sum, 0)) AS avg_margin,
       SUM(tri.price_at_time - COALESCE(mc.material_cost_sum, 0)) AS total_margin
FROM   treatment_records tr
JOIN   treatment_record_items tri ON tri.treatment_record_id=tr.id
JOIN   services s ON s.id=tri.service_id
LEFT   JOIN LATERAL (
         SELECT SUM(sdi.unit_qty*sdi.unit_cost) AS material_cost_sum
           FROM stock_documents sd
           JOIN stock_document_items sdi ON sdi.stock_document_id=sd.id
          WHERE sd.treatment_record_id=tr.id
            AND sd.doc_type='writeoff' AND sd.status='posted'
       ) mc ON true
WHERE  tr.status='completed'
GROUP  BY s.name_uk, DATE_TRUNC('month', tr.created_at)
ORDER  BY month DESC, total_margin DESC;
```

Analyst + billing_manager roles get a link from their dashboard.

---

## 10. Risks, mitigations

| Risk                                                                                   | L   | I   | Mitigation                                                                                                                                                                                                                                                                                                              |
| -------------------------------------------------------------------------------------- | --- | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FIFO edge cases (float, negative, partial lots)                                        | M   | H   | NUMERIC(14,4); 20+ pgTAP tests; `allow_negative_balance` clinic toggle for forgiving first-30-days                                                                                                                                                                                                                      |
| Treatment-completion hook breaks a visit save                                          | L   | H   | try/catch + retry via `notification_events`; show banner but never block `treatment_records` save                                                                                                                                                                                                                       |
| Granular per-warehouse permissions confuse staff                                       | M   | M   | Ship Phase 1 with role-driven defaults auto-applied (see §6.3) — superadmin/admin/inventory_manager get full grants, doctor gets their own cabinet + satellite, others are opt-in. Matrix UI is admin-only and hidden behind feature flag; onboarding deck walks head nurse through the 14 flag columns before go-live. |
| Backfill synthesises lots with cost=0 → margin look wrong for legacy data              | L   | M   | Let clinic input an "opening stock cost basis" per material during migration; default 0 with explicit banner in Service Cost report                                                                                                                                                                                     |
| Report scope creep                                                                     | H   | L   | Timebox Phase 7 at 2 weeks; defer 5 of 10 reports                                                                                                                                                                                                                                                                       |
| CliniCards Заявки/Замовлення rolls out during our build → clinic asks why ours differs | M   | L   | Not a risk — CliniCards' own tooltips (463–465) say "coming soon"; we ship them fully formed                                                                                                                                                                                                                            |
| Un-posting write-offs gets misused to fudge cost-of-services                           | L   | M   | `stock_docs:unpost_writeoff` permission + mandatory reason text + audit log row                                                                                                                                                                                                                                         |

---

## 11. Open questions

### Locked (2026-04-22)

1. **Topology — LOCKED: 3-tier `main / cabinet / doctor`, fixed 1 + 3 + N.** Exactly one `kind='main'` warehouse (central storeroom), exactly 3 `kind='cabinet'` warehouses (the clinic has 3 physical treatment cabinets), and N `kind='doctor'` warehouses where N = the current count of active doctors. Enforced at schema level via partial unique indexes (`uq_stock_warehouses_single_main`, `uq_stock_warehouses_doctor`) and CHECK constraints (`wh_main_shape`, `wh_cabinet_shape`, `wh_doctor_shape`). Aggregated "Мої склади" view for a doctor rolls up: own satellite → assigned cabinet → main. Per-warehouse visibility + permissions handled by `stock_warehouse_permissions` (see §6.2) without any schema churn.

2. **Write-off mode for launch — LOCKED: `draft_hybrid` (hybrid auto-seed + manual override).** On treatment `status=completed`, the system auto-creates a `writeoff` document in `status=draft`, pre-seeded from the service's calc card. Staff can add / edit / remove any line before posting; `stock_document_items` does not track origin. Launch default, not a 30-day trial — origin-less design means `draft_hybrid` is stable long-term. `auto` mode stays available as a clinic toggle once calc cards stabilise (recommend evaluation after 90 days). `none` preserved for clinics that opt out of calc cards entirely.

3. **Accounting timeline — LOCKED: defer `auto_ap_bill_on_incoming`.** Phase 2 ships supplier/brand/category directories and incoming-document invoice editor _without_ `expense_category_id` on `stock_documents`. Once the Cash / Витрати module ships, a follow-up additive migration adds `expense_category_id UUID REFERENCES expense_categories(id)` + the `auto_ap_bill_on_incoming BOOLEAN` clinic toggle (tooltip 420). This keeps Phase 2 scope tight and avoids dangling FKs to an unreleased module.

4. **Legacy data — LOCKED: hybrid of fresh + manual.** Preprod is seeded from scratch (Phase 0 seed script: 5 brands, 4 suppliers, 50 products — synthetic). For prod cutover, a curated manual seed of the real catalogue (~30–50 products, 4–6 suppliers, 4–6 brands) is entered directly through the Phase 2 admin UI by the head nurse at go-live. **No CSV bulk-import utility is scoped** — clinic size does not warrant it and a CliniCards export is not guaranteed. If a large export appears later, spec a one-off ETL script in a follow-up ADR. This choice lets Phase 2 focus on CRUD quality rather than import pipelines.

5. **Negative balance tolerance — LOCKED: `allow_negative_balance=true` for first 30–60 days.** Clinic setting seeded to `true` in Phase 0; `post_stock_document()` reads the flag and permits `qty_remaining < 0` when true (ghost stock). Preprod cutover plan: flip to `false` after a 30–60 day ramp-up where initial balances have been corrected via audits. Tooltip 474 exists precisely because CliniCards learned this lesson — blocking writeoffs during ramp-up makes staff file paper chits instead of using the system, defeating the whole point.

6. **Per-warehouse permission UI — LOCKED: full matrix shipped in Phase 1.** No "MVP grants everyone" shortcut. `stock_warehouse_permissions` table, `/admin/stock/permissions` matrix UI (rows = admin users, columns = warehouses × 14 flags per tooltips 452–477), RLS enforcement on `stock_documents` + `stock_lots`, and role-driven defaults (see §6.3) ship together in Phase 1. Rationale: "build everything fully, sufficiently, logically and super" — getting permissions right before any real posting happens is far cheaper than retrofitting later. Adds ~0.5 week to Phase 1 (revised total 3.5 weeks instead of 3.0).

---

## 12. Action items (next 2 weeks)

All 6 §11 questions locked 2026-04-22. Phase 0 PR unblocked.

1. [x] Lock §11 answers — topology (1+3+N, 3-tier), write-off mode (`draft_hybrid`), accounting auto-A/P (defer to Cash module), legacy data (fresh preprod + curated manual seed for prod cutover), negative-balance tolerance (`true` for first 30–60 days), per-warehouse permission UI (full matrix from Phase 1 — build it right the first time).
2. [ ] Epic "Inventory v2" in tracker + 8 sub-issues linked to this ADR.
3. [ ] Open Phase-0 PR against `develop`: feature flag `NEXT_PUBLIC_INVENTORY_V2_ENABLED=off`, preprod seed (1 main + 3 cabinets + 2 sample doctor warehouses, 5 brands, 4 suppliers, 50 products, `clinic_settings.writeoff_mode='draft_hybrid'`, `clinic_settings.allow_negative_balance=true`).
4. [ ] Open Phase-1 WIP PR: migration (including all 3-tier CHECK constraints + unique indexes), `post_stock_document` body, full per-warehouse permission matrix UI + RPC surface, pgTAP tests for concurrency + FIFO + un-post flow + 3-tier invariants + permission-matrix RLS. Review before any secondary UI work.
5. [ ] Add to CLAUDE.md: **"All stock mutations flow through `post_stock_document()` / `unpost_writeoff_document()`. Direct UPDATE of `material_inventory` / `stock_lots` is forbidden and enforced via RLS."**

---

## Appendix A — Existing system snapshot (2026-04-22)

Tables (source: `supabase/migrations/20260321_clinical_and_inventory.sql` + `20260407_materials_enhancement.sql`):

- `materials` — **14 columns**: `id`, `name_uk`, `name_en`, `name_pl`, `category TEXT` (CHECK-enum-lite: `general`/`composite`/`filling`/`instrument`/`implant`/`hygiene`/`anesthesia`/`other`), `unit`, `sku UNIQUE`, `min_stock_level NUMERIC(14,4)`, `is_active`, `supplier_name`, `supplier_contact`, `supplier_email`, `created_at`, `image_url` (added 2026-04-07). The category column is `TEXT NOT NULL DEFAULT 'general'` — a real enum type is **not** used.
- `material_inventory` — unique `(material_id, storage_location)`, `current_quantity NUMERIC(14,4)` with `CHECK (current_quantity >= 0)` (hard-stop; blocks the `allow_negative_balance=true` lock until Phase 1 replaces it), `min_stock_level`, `last_restocked_at`.
- `material_orders` — status enum: `draft→pending_approval→approved→ordered→delivered→cancelled`, urgency `low/normal/high/critical`, plus `approved_by` + `approved_at` (added 2026-04-07).
- `material_order_items` — `quantity_requested` + `quantity_delivered` for partial delivery.
- `treatment_materials_used` — linking layer `treatment_records ↔ materials`, populated manually today; unused in auto-consumption path (the Phase 5 writeoff-mode decision relinks it through `stock_documents.treatment_record_id`).

APIs: `app/api/materials/route.ts` (GET, POST), `.../[id]/route.ts` (PATCH, DELETE), `.../[id]/upload-image/route.ts` (upload to Supabase Storage `material-images` bucket), `app/api/material-orders/route.ts` (GET, POST), `.../[id]/route.ts` (GET, PATCH with on-delivery auto-apply via `applyInventoryForDeliveredOrder`, DELETE only if draft).

Admin UI: `app/admin/materials` (list + create/edit + image upload), `app/admin/orders` (PO workflow with color-coded urgency/status badges).

SQL functions: `deduct_inventory(material_id, qty, location)`, `add_inventory(material_id, qty, location)` — both atomic SQL, `GREATEST(0, ...)` protects against negative.

RBAC (8 roles, 26 permissions, defined in `src/lib/permissions.ts`): superadmin, admin, receptionist, doctor, assistant, billing_manager, inventory_manager, analyst. Permissions relevant to this module: `inventory:view`, `inventory:edit`, `orders:view`, `orders:create`, `orders:approve`, `orders:delete`.

Tests: 87 total; `src/lib/permissions.test.ts` (73 cases), `e2e/admin-materials.smoke.spec.ts` (3), `e2e/admin-rbac.spec.ts` (8 per-role). No concurrency, no FIFO-adjacent tests — these are gaps Phase 1 will close.

## Appendix B — CliniCards tooltip catalogue (62 entries)

Harvested 2026-04-22 via `POST /cabinet/tooltips/get/{id}`. Each row is: `[id] title — one-line meaning`. Use these IDs to cross-reference CliniCards' exact behaviour when specifying our equivalent.

Top-level tabs:

- **[407] Склади** — Warehouse directory. Drag-reorder supported. Staff have zero access on warehouse creation; must be granted `Базовий доступ`.
- **[408] Бренди** — Brand directory. Archive-never-delete-if-has-docs. Permissions via `Редагування брендів` (453).
- **[409] Товари** — Product catalogue inside a category tree (unlimited nesting). Root is "Всі товари", children inherit expense category.
- **[410] Постачальники** — Supplier/contractor directory, shared with Cash module. Required on incoming + return invoices.
- **[430] Мої склади** — Daily user workspace. Per-warehouse material cards with in-stock colour coding (white/green = in; grey/red = out), other-warehouse tile (blue/yellow/red), pending-requisition count, and 3 quick actions (writeoff/transfer/requisition). Cross-warehouse balance hides for users without `stock_other_warehouse_balances` (461).
- **[428] Інвентаризація** — Audit workspace. Scope picker: warehouses (multi), categories (tree multi), brands (multi), products (free-text). Auto-fill from current. Delta colour: green surplus, red shortage. On post: generates a Коректування (426).

The 5 invoice types:

- **[422] Прихідні** — Incoming. Increments stock. Required supplier. Can auto-create supplier A/P bill (420). Numbers auto-generated (441). Posted = immutable unless edit permission (467).
- **[423] Повернення** — Return to supplier. Decrements stock. Can be seeded from a prior incoming invoice (pulls supplier+items auto). LIFO cost basis (help article 506).
- **[424] Переміщення** — Transfer between warehouses. Atomic: decrements from-warehouse, increments to-warehouse at the same cost.
- **[425] Списання** — Write-off. Decrements stock at FIFO cost. Created manually OR auto from calculation cards on treatment completion (417).
- **[426] Коректування** — Adjustment. Auto-generated after posting an audit. Immutable by design — _cannot_ be edited or deleted.

Calculation cards / auto-consumption:

- **[414] Списання матеріалів** — Calc-card registry per price-list service. Lists materials consumed.
- **[415] Заміна товару** — Single-click substitute: when a material is discontinued, replace it across ALL calculation cards at once. We need this utility too.
- **[417] Тип автосписання** — Clinic-wide mode: `Без` (no link), `Ручне` (staff posts writeoff manually), `Автоматичне` (posted on act save). In auto mode, performers with (474) can adjust qty at post time.
- **[418]** Toggle to show/hide Моя інвентаризація menu clinic-wide.
- **[419] Використовувати права доступу** — Master permission-enforcement switch. If OFF, all staff have full access (dangerous). Default OFF in the demo account I inspected.
- **[486] Акт** — The "Act of works done" — our `treatment_records`. This is the pivot entity between clinical and inventory. CliniCards' calc-card auto-consumption fires off the act save.

Product card fields:

- **[435] Категорія товарів** — Tree-based (main → sub → leaf). Optional expense category per category (inherited by products).
- **[436] Артикул** — Alphanumeric SKU. Filterable.
- **[437] Штрихкод** — Barcodes (multiple, comma-separated). Scanner-driven input in invoices.
- **[438] Формат** — Required. The outer pack unit (upkg, jar, flask). Used across all invoices, audits, reports.
- **[439] Кількість в форматі** — Required. Inner unit (pcs, ml, g) × qty inside the pack. Incoming in pack, consumption in unit.
- **[440] Категорія витрат** — Expense category for cost accounting. Required for the A/P auto-bill feature (420).

Per-warehouse product settings (live UI screenshot of the product dialog):

- **[411] Критичний баланс** — Two per-warehouse sub-fields:
  - `Ліміт` — critical threshold. UI shows yellow when `qty < Ліміт`, red when `qty ≤ 0`.
  - `Замовлення` — default quantity pre-filled when creating a supplier PO for this material on this warehouse.
- **[412] Відображати на складах** — Per-warehouse visibility. Staff on warehouses not selected don't see the product at all.

Invoice column fields:

- **[441] Номер накладної** — Auto-generated (e.g. `2604-0000000001` = date prefix + sequence).
- **[442] Статус** — `Непроведена` (draft, auto-saved continuously, doesn't affect stock) / `Проведена` (posted, affects stock). Filter in every list. Copy/download work on both.
- **[443] Постачальник** — Filter + required on incoming + return.
- **[444] Склад** — Filter + required on all invoice types + audits.
- **[445] Фільтр по товару/бренду/артикулу** — Universal full-text search on every document list, finds docs containing the material.
- **[447] Зі складу**, **[448] На склад** — Transfer from/to.

Access-rights matrix — granular per warehouse (full list 452–477):

- General: edit warehouses (452), edit brands (453), edit products (454), edit categories (455), edit suppliers (456), manage permissions (457), manage calc cards (458), manage additional settings (459), view other-warehouse balances (461), base access (462).
- Per invoice type: view + edit for incoming (466/467), return (468/469), transfer (470/471). Write-off has more: view (472), create (473), cancel-posted (474) ← the un-post capability, delete-draft (475). Audit: view (476), post (477).

Clinic-wide toggles (`/cabinet#stock/settings/simple`):

- **[417]** writeoff mode, **[420]** auto-create supplier A/P bill + default expense category, **[418]** show Моя інвентаризація, **[419]** enforce per-user permissions.
- **[485] Використовувати склад** — Master on/off for the entire warehouse module.

Non-obvious semantics:

- **Tooltip 463/464/465**: "Розділи Заявки та Замовлення будуть доступі найближчим часом" — Заявки + Замовлення are still being rolled out at CliniCards as of this audit. The list screens exist, but create forms may not yet. We can leapfrog.
- **Tooltip 474 "Відміна проведених накладних списання"** — explicitly permits un-posting of write-offs with audit. This is why immutable-once-posted is _not_ a clinical-workflow contract; it's only a contract for incoming/transfer/return/adjustment.
- **Live Залишки report balance filter `<0`** — CliniCards permits negative balances. Matches our plan to ship with `allow_negative_balance=true` for first 30 days.
- **Tooltip 430 last paragraph**: `Мої склади` → card → 3 quick actions (writeoff, transfer, requisition) each auto-build a draft invoice in a side-cart. "OK" posts atomically. This UX pattern is what makes the whole system usable day-to-day.

---

## Appendix C — Screens captured

Saved screenshots during the walk-through document:

- Settings > Склади list (has one "Головний склад" row, dragreorder handle visible)
- "Додати склад" modal: Назва, Відповідальний, Головний склад (toggle), Коментар, Архів (toggle). Each has an "i" info icon.
- Product card "Додати товар" modal: left column (image, Категорія*, Назва*, Бренд* + "+", Артикул, Штрихкод, Формат упаковки*, В упаковці\* [qty+unit], Категорія витрат, Архів, Коментар) and right column (**per-warehouse** Критичний баланс Ліміт + Замовлення, per-warehouse `Відображати на складах` toggle).
- Incoming invoice editor (`#stock/invoices/edit/1676313`): header fields (Склад*, Відповідальний*, Контрагент*, Номери замовлень (multi), Номер накладної* [auto `2604-0000000001`], Дата\* [today], Статус `Непроведена`, Коментар, Upload photo/files), line items (Товар select2 with free-type and "+" quick-add, Кількість with +/− steppers, Ціна, Сума). Footer: Всього total, `Додати товар`, **`Провести`** green, Copy icon, Excel-download icon.
- Інвентаризація list (1 column: Номер акта, Статус, Відповідальний, Коментар, Дата).
- Інвентаризація `init` wizard: Дата, Відповідальний, Склад (checkbox tree with "Всі склади" root), Категорія (searchable tree), Бренд (multi), Товар (search), Коментар. Big green `Створити`.
- Замовлення контрагентам list (tabs: Всі / Невиконані / Виконані / Замовлені; filters: співробітники, склади, date range).
- Заявки від співробітників list (same tabbed + filtered shape as Замовлення).
- Накладні list: 5 tabs (Прихідні / Повернення / Переміщення / Списання / Коректування) with columns Номер, Статус, Контрагент, Склад, Відповідальний, Сума, Коментар, Дата — each header filterable.
- Звіти: 10 buttons (Залишки / Переоцінка складу / Історія товару / Звіт по поставках / Звіт по переміщенню / Собівартість послуг / Картка контрагента / У кого можна замовити / Замовлення товарів з критичним залишком / Звіт по списанню).
- Залишки filter form: Склад, Категорія, Бренд, Товар, Критичні (toggle), Середня ціна (toggle), Залишки radio (Всі/>0/<0/=0), Період. Побудувати + Expt Excel.
- Собівартість послуг filter form: Період, Розділ прайса, Вартість послуг, Категорія (tree), Товар, Склад, Відповідальний.
- Замовлення товарів з критичним залишком: zero-config, empty state "На жодному зі складів не виявлено товарів із критичним залишком."
- Моя інвентаризація: per-warehouse tabs, empty state "Товарів не знайдено".
- Додаткові налаштування складу (`/stock/settings/simple`): Тип автосписання (Без/Ручне/Автоматичне), Створювати витрату в касах (dropdown default=Не створювати), Увімкнути пункт меню "Моя інвентаризація" (toggle), Використовувати права доступу (toggle).

All screenshots saved to disk during the session.

---

# Part II — Full implementation spec (all phases)

The sections below expand every phase from milestone-level to SQL/API/UI level, and add the cross-cutting concerns (backfill, rollback, feature flag, i18n, analytics, tests, deployment) that a 13-week build needs.

---

## §13 Phase 1 — the complete keystone

### §13.1 Schema adjustment vs. §4.1

One change from §4.1: `stock_lot_consumption.lot_id` must allow NULL so that over-draws can record a ghost consumption row when the `allow_negative_balance` clinic toggle is on. Without this the function would need to silently drop data or abort — both worse.

```sql
ALTER TABLE public.stock_lot_consumption
  ALTER COLUMN lot_id DROP NOT NULL;

ALTER TABLE public.stock_lot_consumption
  ADD CONSTRAINT stock_lot_consumption_ghost_cost
  CHECK (lot_id IS NOT NULL OR unit_cost = 0);
```

Also add a clinic-settings row (if `clinic_settings` key/value table doesn't yet exist in the repo, create it in Phase 0):

```sql
CREATE TABLE IF NOT EXISTS public.clinic_settings (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES public.admin_users(id)
);
INSERT INTO public.clinic_settings(key, value) VALUES
  ('allow_negative_balance', 'true'::jsonb),            -- Q5 lock: TRUE for 30–60 day ramp-up
  ('writeoff_mode',          '"draft_hybrid"'::jsonb),  -- Q2 lock: auto-seed + manual edit
  ('auto_ap_bill_on_incoming','false'::jsonb),          -- Q3 lock: deferred until Cash module
  ('default_expense_category_id', 'null'::jsonb),       -- Q3 lock: column added post-Cash
  ('show_my_inventory',      'true'::jsonb),
  ('enforce_stock_permissions', 'true'::jsonb)          -- Q6 lock: full matrix from Phase 1
ON CONFLICT (key) DO NOTHING;
```

**Post-ramp-up flip (calendar event).** 30–60 days after inventory_v2 goes live, the head nurse runs a full audit (Phase 6) across all 1+3+N warehouses. Once balances are reconciled, an admin flips `allow_negative_balance` to `false` via `PATCH /api/stock/clinic-settings`. An admin-only banner on `/admin/stock/documents` counts days since launch and nags once past day 60 (client-side warning, no enforcement).

### §13.2 `_drain_lots` — the FIFO/LIFO heart

```sql
CREATE OR REPLACE FUNCTION public._drain_lots(p_doc_id UUID, p_mode TEXT)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_item            RECORD;
  v_lot             RECORD;
  v_need            NUMERIC(14,4);
  v_take            NUMERIC(14,4);
  v_allow_negative  BOOLEAN;
  v_warehouse       UUID;
  v_total           NUMERIC(14,2) := 0;
  v_line_cost_sum   NUMERIC(14,2);
  v_order           TEXT;
BEGIN
  IF p_mode NOT IN ('FIFO','LIFO') THEN
    RAISE EXCEPTION '_drain_lots: invalid mode %', p_mode USING ERRCODE='invalid_parameter_value';
  END IF;

  SELECT (value #>> '{}')::boolean INTO v_allow_negative
    FROM clinic_settings WHERE key = 'allow_negative_balance';
  v_allow_negative := COALESCE(v_allow_negative, false);

  SELECT warehouse_from_id INTO v_warehouse FROM stock_documents WHERE id = p_doc_id;
  v_order := CASE WHEN p_mode = 'LIFO' THEN 'DESC' ELSE 'ASC' END;

  FOR v_item IN
    SELECT id, material_id, unit_qty
      FROM stock_document_items WHERE stock_document_id = p_doc_id
  LOOP
    v_need := v_item.unit_qty;
    v_line_cost_sum := 0;

    FOR v_lot IN EXECUTE format(
      'SELECT id, qty_remaining, unit_cost
         FROM stock_lots
        WHERE material_id = $1 AND warehouse_id = $2 AND qty_remaining > 0
        ORDER BY received_at %s
          FOR UPDATE', v_order)
      USING v_item.material_id, v_warehouse
    LOOP
      EXIT WHEN v_need <= 0;
      v_take := LEAST(v_lot.qty_remaining, v_need);

      INSERT INTO stock_lot_consumption (stock_document_item_id, lot_id, unit_qty, unit_cost)
      VALUES (v_item.id, v_lot.id, v_take, v_lot.unit_cost);

      UPDATE stock_lots SET qty_remaining = qty_remaining - v_take WHERE id = v_lot.id;
      v_need := v_need - v_take;
      v_line_cost_sum := v_line_cost_sum + (v_take * v_lot.unit_cost);
    END LOOP;

    IF v_need > 0 THEN
      IF NOT v_allow_negative THEN
        RAISE EXCEPTION 'Insufficient stock for material % on warehouse % (short by %)',
          v_item.material_id, v_warehouse, v_need USING ERRCODE='check_violation';
      END IF;
      INSERT INTO stock_lot_consumption (stock_document_item_id, lot_id, unit_qty, unit_cost)
      VALUES (v_item.id, NULL, v_need, 0);
    END IF;

    UPDATE stock_document_items
       SET unit_cost  = CASE WHEN v_item.unit_qty > 0 THEN v_line_cost_sum / v_item.unit_qty ELSE 0 END,
           line_total = v_line_cost_sum
     WHERE id = v_item.id;

    UPDATE material_inventory
       SET current_quantity = current_quantity - v_item.unit_qty
     WHERE material_id = v_item.material_id AND warehouse_id = v_warehouse;

    v_total := v_total + v_line_cost_sum;
  END LOOP;

  UPDATE stock_documents SET total_amount = v_total WHERE id = p_doc_id;
END; $$;
```

### §13.3 `_transfer_lots`

Transfers preserve cost basis — when gloves move from Main to Cabinet-1, each lot that contributes carries its original `unit_cost` into the new lot on the destination warehouse. FIFO order on the source.

```sql
CREATE OR REPLACE FUNCTION public._transfer_lots(p_doc_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_doc      RECORD;
  v_item     RECORD;
  v_lot      RECORD;
  v_need     NUMERIC(14,4);
  v_take     NUMERIC(14,4);
  v_total    NUMERIC(14,2) := 0;
  v_line_sum NUMERIC(14,2);
BEGIN
  SELECT warehouse_from_id, warehouse_to_id INTO v_doc FROM stock_documents WHERE id = p_doc_id;

  FOR v_item IN
    SELECT id, material_id, unit_qty
      FROM stock_document_items WHERE stock_document_id = p_doc_id
  LOOP
    v_need := v_item.unit_qty;
    v_line_sum := 0;

    FOR v_lot IN
      SELECT id, qty_remaining, unit_cost FROM stock_lots
      WHERE material_id = v_item.material_id AND warehouse_id = v_doc.warehouse_from_id
        AND qty_remaining > 0 ORDER BY received_at ASC FOR UPDATE
    LOOP
      EXIT WHEN v_need <= 0;
      v_take := LEAST(v_lot.qty_remaining, v_need);

      INSERT INTO stock_lot_consumption (stock_document_item_id, lot_id, unit_qty, unit_cost)
      VALUES (v_item.id, v_lot.id, v_take, v_lot.unit_cost);

      UPDATE stock_lots SET qty_remaining = qty_remaining - v_take WHERE id = v_lot.id;

      INSERT INTO stock_lots (material_id, warehouse_id, source_document_id, unit_cost, qty_initial, qty_remaining)
      VALUES (v_item.material_id, v_doc.warehouse_to_id, p_doc_id, v_lot.unit_cost, v_take, v_take);

      v_need := v_need - v_take;
      v_line_sum := v_line_sum + (v_take * v_lot.unit_cost);
    END LOOP;

    IF v_need > 0 THEN
      RAISE EXCEPTION 'Transfer short: material % from warehouse %: need % more',
        v_item.material_id, v_doc.warehouse_from_id, v_need USING ERRCODE='check_violation';
    END IF;

    UPDATE stock_document_items
       SET unit_cost = v_line_sum / v_item.unit_qty, line_total = v_line_sum
     WHERE id = v_item.id;

    UPDATE material_inventory
       SET current_quantity = current_quantity - v_item.unit_qty
     WHERE material_id = v_item.material_id AND warehouse_id = v_doc.warehouse_from_id;

    INSERT INTO material_inventory (material_id, warehouse_id, current_quantity)
      VALUES (v_item.material_id, v_doc.warehouse_to_id, v_item.unit_qty)
    ON CONFLICT (material_id, warehouse_id) DO UPDATE
      SET current_quantity = material_inventory.current_quantity + EXCLUDED.current_quantity,
          last_restocked_at = CURRENT_DATE;

    v_total := v_total + v_line_sum;
  END LOOP;

  UPDATE stock_documents SET total_amount = v_total WHERE id = p_doc_id;
END; $$;
```

Transfers disallow negative balance (no `v_allow_negative` branch) — you cannot transfer stock you do not have. This matches CliniCards semantics.

### §13.4 `_adjust_lots`

Adjustment = the `Коректування` side-effect produced by posting an audit. Per-line the `unit_qty` column holds the **signed delta** (positive = found more, negative = found less). A positive delta creates a new lot at the material's current weighted-average cost on the warehouse. A negative delta drains FIFO.

```sql
CREATE OR REPLACE FUNCTION public._adjust_lots(p_doc_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_warehouse UUID;
  v_item      RECORD;
  v_lot       RECORD;
  v_need      NUMERIC(14,4);
  v_take      NUMERIC(14,4);
  v_avg_cost  NUMERIC(14,4);
  v_total     NUMERIC(14,2) := 0;
  v_line_sum  NUMERIC(14,2);
BEGIN
  SELECT warehouse_from_id INTO v_warehouse FROM stock_documents WHERE id = p_doc_id;

  FOR v_item IN
    SELECT id, material_id, unit_qty
      FROM stock_document_items WHERE stock_document_id = p_doc_id
  LOOP
    v_line_sum := 0;

    IF v_item.unit_qty > 0 THEN
      SELECT COALESCE(SUM(qty_remaining*unit_cost)/NULLIF(SUM(qty_remaining),0), 0)
        INTO v_avg_cost
      FROM stock_lots
      WHERE material_id = v_item.material_id AND warehouse_id = v_warehouse AND qty_remaining > 0;

      INSERT INTO stock_lots (material_id, warehouse_id, source_document_id, unit_cost, qty_initial, qty_remaining)
      VALUES (v_item.material_id, v_warehouse, p_doc_id, v_avg_cost, v_item.unit_qty, v_item.unit_qty);

      INSERT INTO material_inventory (material_id, warehouse_id, current_quantity)
        VALUES (v_item.material_id, v_warehouse, v_item.unit_qty)
      ON CONFLICT (material_id, warehouse_id) DO UPDATE
        SET current_quantity = material_inventory.current_quantity + EXCLUDED.current_quantity;

      v_line_sum := v_item.unit_qty * v_avg_cost;

    ELSIF v_item.unit_qty < 0 THEN
      v_need := -v_item.unit_qty;

      FOR v_lot IN
        SELECT id, qty_remaining, unit_cost FROM stock_lots
        WHERE material_id = v_item.material_id AND warehouse_id = v_warehouse
          AND qty_remaining > 0 ORDER BY received_at ASC FOR UPDATE
      LOOP
        EXIT WHEN v_need <= 0;
        v_take := LEAST(v_lot.qty_remaining, v_need);
        INSERT INTO stock_lot_consumption (stock_document_item_id, lot_id, unit_qty, unit_cost)
          VALUES (v_item.id, v_lot.id, v_take, v_lot.unit_cost);
        UPDATE stock_lots SET qty_remaining = qty_remaining - v_take WHERE id = v_lot.id;
        v_need := v_need - v_take;
        v_line_sum := v_line_sum + (v_take * v_lot.unit_cost);
      END LOOP;

      IF v_need > 0 THEN
        INSERT INTO stock_lot_consumption (stock_document_item_id, lot_id, unit_qty, unit_cost)
          VALUES (v_item.id, NULL, v_need, 0);
      END IF;

      UPDATE material_inventory
         SET current_quantity = current_quantity + v_item.unit_qty
       WHERE material_id = v_item.material_id AND warehouse_id = v_warehouse;
    END IF;

    UPDATE stock_document_items
       SET unit_cost  = CASE WHEN v_item.unit_qty <> 0 THEN v_line_sum / v_item.unit_qty ELSE 0 END,
           line_total = v_line_sum
     WHERE id = v_item.id;

    v_total := v_total + ABS(v_line_sum);
  END LOOP;

  UPDATE stock_documents SET total_amount = v_total WHERE id = p_doc_id;
END; $$;
```

### §13.5 `unpost_writeoff_document`

```sql
CREATE OR REPLACE FUNCTION public.unpost_writeoff_document(p_doc_id UUID, p_reason TEXT)
RETURNS public.stock_documents
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE d public.stock_documents;
BEGIN
  IF p_reason IS NULL OR length(trim(p_reason)) < 3 THEN
    RAISE EXCEPTION 'unpost_writeoff_document: reason is required (min 3 chars)'
      USING ERRCODE='invalid_parameter_value';
  END IF;

  SELECT * INTO d FROM stock_documents WHERE id = p_doc_id FOR UPDATE;

  IF d.doc_type <> 'writeoff' THEN
    RAISE EXCEPTION 'unpost_writeoff_document: only writeoff docs can be un-posted (got %)', d.doc_type
      USING ERRCODE='check_violation';
  END IF;
  IF d.status <> 'posted' THEN
    RAISE EXCEPTION 'unpost_writeoff_document: doc % not posted (status=%)', p_doc_id, d.status
      USING ERRCODE='check_violation';
  END IF;

  PERFORM 1 FROM material_inventory mi
   WHERE mi.warehouse_id = d.warehouse_from_id
     AND mi.material_id IN (SELECT material_id FROM stock_document_items WHERE stock_document_id = d.id)
   FOR UPDATE;

  UPDATE stock_lots sl
     SET qty_remaining = qty_remaining + slc.unit_qty
    FROM stock_lot_consumption slc
    JOIN stock_document_items sdi ON sdi.id = slc.stock_document_item_id
   WHERE sdi.stock_document_id = d.id AND slc.lot_id = sl.id;

  UPDATE material_inventory mi
     SET current_quantity = current_quantity + sdi.unit_qty
    FROM stock_document_items sdi
   WHERE sdi.stock_document_id = d.id
     AND mi.material_id = sdi.material_id AND mi.warehouse_id = d.warehouse_from_id;

  DELETE FROM stock_lot_consumption
   WHERE stock_document_item_id IN (SELECT id FROM stock_document_items WHERE stock_document_id = d.id);

  UPDATE stock_documents
     SET status='draft', posted_at=NULL, posted_by=NULL
   WHERE id = p_doc_id
  RETURNING * INTO d;

  INSERT INTO admin_audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), 'stock_document.unpost', 'stock_documents', d.id,
          jsonb_build_object('doc_number', d.doc_number, 'reason', p_reason));

  RETURN d;
END; $$;

REVOKE ALL ON FUNCTION public.unpost_writeoff_document FROM public;
GRANT  EXECUTE ON FUNCTION public.unpost_writeoff_document TO authenticated;
```

### §13.6 Phase-1 backfill migration — `20260501_stock_backfill.sql`

Runs after the schema migration. Creates the **3-tier topology seed** (Q1 lock: 1 main + 3 cabinets + N doctor satellites, where N comes from `doctors WHERE is_active=true`), then a single synthetic "opening-balance" `incoming` document on the main warehouse, seeds lots, and preserves current balances. Idempotent.

```sql
BEGIN;

-- 1) Main warehouse (seeded from the legacy storage_location='' convention)
INSERT INTO stock_warehouses (id, name_uk, kind, is_main, sort_order)
SELECT gen_random_uuid(), 'Головний склад', 'main', true, 0
WHERE NOT EXISTS (SELECT 1 FROM stock_warehouses WHERE kind='main');

-- 2) Three cabinets (Q1 lock: the clinic has exactly 3 physical treatment cabinets)
INSERT INTO stock_warehouses (name_uk, kind, is_main, sort_order)
SELECT v.name, 'cabinet', false, v.sort
  FROM (VALUES
    ('Кабінет 1', 10),
    ('Кабінет 2', 11),
    ('Кабінет 3', 12)
  ) AS v(name, sort)
 WHERE NOT EXISTS (SELECT 1 FROM stock_warehouses WHERE kind='cabinet' AND name_uk = v.name);

-- 3) One satellite per active doctor (N rows, grows with the roster).
--    The `doctors` table has no `full_name` column — compose from last_name + first_name
--    (patronymic intentionally omitted to keep warehouse label compact in the sidebar).
INSERT INTO stock_warehouses (name_uk, kind, is_main, doctor_id, sort_order)
SELECT 'Склад ' || CONCAT_WS(' ', d.last_name, d.first_name),
       'doctor',
       false,
       d.id,
       100 + ROW_NUMBER() OVER (ORDER BY d.last_name, d.first_name)
  FROM doctors d
 WHERE d.is_active = true
   AND NOT EXISTS (SELECT 1 FROM stock_warehouses sw WHERE sw.kind='doctor' AND sw.doctor_id = d.id);

-- 4) Route any legacy material_inventory rows (warehouse_id IS NULL) to the main warehouse.
WITH main_wh AS (SELECT id FROM stock_warehouses WHERE is_main ORDER BY sort_order LIMIT 1)
UPDATE material_inventory mi
   SET warehouse_id = (SELECT id FROM main_wh)
 WHERE mi.warehouse_id IS NULL;

WITH main_wh AS (SELECT id FROM stock_warehouses WHERE is_main ORDER BY sort_order LIMIT 1),
opening AS (
  INSERT INTO stock_documents (id, doc_type, doc_number, status, posted_at, posted_by,
                               warehouse_to_id, supplier_id, responsible_user_id, doc_date,
                               comment, total_amount)
  SELECT gen_random_uuid(),
         'incoming',
         'OPEN-' || to_char(CURRENT_DATE,'YYYY-MM-DD'),
         'posted',
         now(),
         (SELECT id FROM admin_users WHERE role='superadmin' ORDER BY created_at LIMIT 1),
         (SELECT id FROM main_wh),
         NULL, NULL, CURRENT_DATE,
         'Synthetic opening balance — created by 20260501_stock_backfill.sql',
         0
  WHERE NOT EXISTS (SELECT 1 FROM stock_documents WHERE doc_number LIKE 'OPEN-%')
  RETURNING id, warehouse_to_id
)
INSERT INTO stock_document_items (stock_document_id, material_id, pack_qty, unit_qty, unit_cost, line_total)
SELECT o.id, mi.material_id, 0, mi.current_quantity, 0, 0
  FROM opening o, material_inventory mi
 WHERE mi.current_quantity > 0 AND mi.warehouse_id = o.warehouse_to_id;

INSERT INTO stock_lots (material_id, warehouse_id, source_document_id, unit_cost, qty_initial, qty_remaining, received_at)
SELECT sdi.material_id, sd.warehouse_to_id, sd.id, 0, sdi.unit_qty, sdi.unit_qty, sd.posted_at
  FROM stock_documents sd
  JOIN stock_document_items sdi ON sdi.stock_document_id = sd.id
 WHERE sd.doc_number LIKE 'OPEN-%'
   AND NOT EXISTS (SELECT 1 FROM stock_lots sl WHERE sl.source_document_id = sd.id);

INSERT INTO admin_audit_logs (actor_id, action, entity_type, entity_id, metadata)
SELECT posted_by, 'stock_backfill.opening_balance', 'stock_documents', id,
       jsonb_build_object('item_count',
         (SELECT count(*) FROM stock_document_items WHERE stock_document_id = stock_documents.id))
  FROM stock_documents WHERE doc_number LIKE 'OPEN-%'
ON CONFLICT DO NOTHING;

COMMIT;
```

**Cost-basis caveat surfaced explicitly:** opening lots use `unit_cost = 0`. The Cost-of-Services report (§9.2, §19) will show "historical material cost unknown" for any treatment that consumes these lots. Fix options when clinic is ready: (a) clinic staff enter per-material opening cost via a one-time UI at Phase 2, (b) accept zero-cost basis and track only forward-from-today margin. Banner in the report lists affected lots.

### §13.7 Phase-1 API — complete contracts

```ts
// app/api/stock/warehouses/route.ts
GET    /api/stock/warehouses
       ?includeArchived=false
       → { data: Warehouse[] }
POST   /api/stock/warehouses
       body: { nameUk: string, nameEn?, namePl?, kind: 'main'|'cabinet'|'doctor'|'other',
               isMain?: boolean, responsibleUserId: UUID, doctorId?: UUID, comment?: string,
               sortOrder?: number }
       perm: stock_warehouses:manage
PATCH  /api/stock/warehouses/:id
       body: Partial<CreateBody>
       perm: stock_warehouses:manage
DELETE /api/stock/warehouses/:id
       409 if has any stock_documents; otherwise set is_archived=true (never hard delete once used)
PATCH  /api/stock/warehouses/reorder
       body: { orderedIds: UUID[] }
       perm: stock_warehouses:manage

// app/api/stock/documents/route.ts
GET    /api/stock/documents
       ?type=&status=&warehouseId=&supplierId=&from=&to=&q=&page=&pageSize=
       → { data: Document[], total, page }
POST   /api/stock/documents
       body: {
         docType: 'incoming'|'writeoff'|'return'|'transfer'|'adjustment',
         warehouseFromId?: UUID, warehouseToId?: UUID, supplierId?: UUID,
         responsibleUserId: UUID, docDate?: 'YYYY-MM-DD', comment?, imageUrl?,
         items: Array<{ materialId: UUID, packQty?: number, unitQty: number, unitCost?: number }>,
         treatmentRecordId?: UUID,  supplierOrderId?: UUID
       }
       returns draft, status='draft', doc_number auto-issued per (docType, year)
       perm varies by docType: stock_docs:edit_<type>

GET    /api/stock/documents/:id
       → { ...Document, items: Item[], lots?: LotConsumptionLine[] }

PATCH  /api/stock/documents/:id
       409 if status != 'draft'
       perm: stock_docs:edit_<type> on the relevant warehouse

DELETE /api/stock/documents/:id
       409 if status != 'draft'
       writeoff: perm stock_docs:delete_draft_writeoff; others: perm stock_docs:edit_<type>

POST   /api/stock/documents/:id/post
       body: {}
       calls post_stock_document(id) RPC

POST   /api/stock/documents/:id/unpost
       body: { reason: string }
       writeoff only; perm: stock_docs:unpost_writeoff; calls unpost_writeoff_document(id, reason)

POST   /api/stock/documents/:id/copy
       body: {}
       returns new draft with same items; perm: stock_docs:edit_<type>
```

Rate limits: `GET 30/min`, mutations `20/min`. CSRF per existing `withCsrf` helper. Zod validation; 422 on shape errors. Structured error codes: `STOCK_INSUFFICIENT`, `STOCK_LOCKED_POSTED`, `STOCK_INVALID_TRANSITION`.

### §13.8 pgTAP test suite — Phase 1

File: `supabase/tests/phase1_stock_posting.sql`. 24 cases:

1. Post incoming → balance += qty, one lot created per item
2. Post incoming twice parallel → one succeeds, other raises serialisation; balance correct
3. Post writeoff with sufficient stock → FIFO lot order observed, `stock_lot_consumption` rows created
4. Post writeoff with partial lots → multi-lot consumption rows written correctly
5. Post writeoff with insufficient stock + `allow_negative_balance=false` → raise `check_violation`
6. Post writeoff with insufficient stock + `allow_negative_balance=true` → ghost consumption row, balance negative
7. Post return → LIFO order; balance decreases
8. Post transfer → both warehouses updated atomically; destination lot carries source cost
9. Transfer short → raise; both balances untouched
10. Post adjustment positive → new lot at weighted-avg cost
11. Post adjustment negative → FIFO drain
12. Post adjustment zero delta → no-op (total=0)
13. Unpost writeoff → lot `qty_remaining` restored, balance restored, `stock_lot_consumption` deleted, status='draft'
14. Unpost without reason → raise
15. Unpost non-writeoff → raise
16. Unpost already-drafted doc → raise
17. Direct `UPDATE material_inventory` from `authenticated` role → blocked by RLS
18. Direct `INSERT INTO stock_lots` from `authenticated` → blocked
19. `post_stock_document` on already-posted doc → raise `check_violation`
20. Doc-shape CHECK: `incoming` without `warehouse_to_id` → insert fails
21. Doc-shape CHECK: `transfer` with same from/to → insert fails
22. Opening-balance backfill idempotent → run twice, still one OPEN-\* doc
23. Doc number `UNIQUE(doc_type, doc_number)` enforced
24. `total_amount` on posted doc equals `SUM(line_total)`

Runner: `supabase/tests/run.sh` extending the existing pgTAP pattern if present, otherwise `psql -f` with `pg_prove`.

### §13.9 Phase-1 UI — exactly what lands

Two pages, one utility component:

- `app/admin/stock/warehouses/page.tsx` — list + drag-reorder (`@dnd-kit/sortable`) + create/edit dialog. Reuses existing `shadcn/ui` Dialog/Table pattern from [`app/admin/materials`](app/admin/materials).
- `app/admin/stock/documents/page.tsx` — list with 5 tabs (type), column filters on status/supplier/warehouse/responsible, "Створити прихідну накладну" button → opens the incoming editor at `app/admin/stock/documents/[id]/page.tsx`.
- `src/components/admin/stock/IncomingDocumentEditor.tsx` — header form + line items table (TanStack Table) + auto-save draft + `Провести` button. Barcode input in Phase 3 wires into the same component via a feature-flagged sub-field.

Gated by `inventory_v2` flag (§20.3). Nav entry added to existing `AdminSidebar` behind the same flag.

---

## §14 Phase 2 — suppliers, brands, category tree (complete)

### §14.1 Schema

```sql
BEGIN;

CREATE TABLE IF NOT EXISTS public.material_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT, email TEXT, website TEXT,
  contact1_name TEXT, contact1_phone TEXT, contact1_email TEXT,
  contact2_name TEXT, contact2_phone TEXT, contact2_email TEXT,
  legal_address  TEXT, actual_address TEXT,
  tax_id TEXT,                                    -- ЄДРПОУ
  bank_details  TEXT,
  comment TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_suppliers_archived ON public.material_suppliers(is_archived);

CREATE TABLE IF NOT EXISTS public.material_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  comment TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.material_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES public.material_categories(id) ON DELETE RESTRICT,
  name_uk TEXT NOT NULL, name_en TEXT, name_pl TEXT,
  expense_category_id UUID,               -- nullable; FK added when expense_categories lands
  sort_order INT NOT NULL DEFAULT 0,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (COALESCE(parent_id::text, ''), name_uk)
);
CREATE INDEX IF NOT EXISTS idx_cats_parent ON public.material_categories(parent_id);

ALTER TABLE public.material_suppliers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_brands     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY suppliers_admin_rw  ON public.material_suppliers  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY brands_admin_rw     ON public.material_brands     FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY cats_admin_rw       ON public.material_categories FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

COMMIT;
```

### §14.2 Backfill migration `20260515_backfill_directories.sql`

Creates brand/supplier rows from the denormalised `materials.supplier_*` columns, then rewires FK, then drops legacy columns **only after** Phase 2 ships green. Two-step.

```sql
BEGIN;

INSERT INTO material_suppliers (name)
SELECT DISTINCT supplier_name FROM materials
 WHERE supplier_name IS NOT NULL AND supplier_name <> ''
ON CONFLICT (name) DO NOTHING;
-- (name has no unique yet; we'll add one here to dedupe)
ALTER TABLE material_suppliers ADD CONSTRAINT material_suppliers_name_uniq UNIQUE (name);

ALTER TABLE materials ADD COLUMN IF NOT EXISTS default_supplier_id UUID
  REFERENCES material_suppliers(id) ON DELETE SET NULL;

UPDATE materials m SET default_supplier_id = ms.id
  FROM material_suppliers ms WHERE ms.name = m.supplier_name;

-- Seed category tree from the existing flat enum
INSERT INTO material_categories (name_uk, sort_order)
SELECT x.n, x.s FROM (VALUES
  ('Композит', 1), ('Пломбувальні', 2), ('Інструмент', 3),
  ('Імплант', 4),  ('Гігієна', 5), ('Анестезія', 6), ('Інше', 99)
) x(n,s)
ON CONFLICT DO NOTHING;

ALTER TABLE materials ADD COLUMN IF NOT EXISTS category_id UUID
  REFERENCES material_categories(id) ON DELETE RESTRICT;

UPDATE materials m SET category_id = mc.id
  FROM material_categories mc
 WHERE m.category_id IS NULL
   AND mc.name_uk = CASE m.category
         WHEN 'composite' THEN 'Композит'
         WHEN 'filling'   THEN 'Пломбувальні'
         WHEN 'instrument'THEN 'Інструмент'
         WHEN 'implant'   THEN 'Імплант'
         WHEN 'hygiene'   THEN 'Гігієна'
         WHEN 'anesthesia'THEN 'Анестезія'
         ELSE 'Інше'
       END;

COMMIT;
```

Drop the legacy `supplier_name/contact/email` and `category` enum columns in a follow-up migration 2 weeks later (after Phase 2 ships, once we've verified no code references them).

### §14.3 Phase-2 API

```ts
GET/POST/PATCH/DELETE /api/stock/suppliers     // standard CRUD + archive; DELETE returns 409 if used in any stock_document
GET/POST/PATCH/DELETE /api/stock/brands        // same semantics
GET    /api/stock/categories                   // ?flat=true returns flat list, default returns tree
POST   /api/stock/categories                   // body: { parentId?, nameUk, nameEn?, namePl?, expenseCategoryId? }
PATCH  /api/stock/categories/:id
DELETE /api/stock/categories/:id               // 409 if has children or materials; else archive
PATCH  /api/stock/categories/reorder           // body: { orderedIds: UUID[], parentId?: UUID }
```

### §14.4 UI

- `app/admin/stock/suppliers/page.tsx` — list with column filters + full form (matches CliniCards supplier dialog: name, phones, website, emails, 2 contacts, addresses, ЄДРПОУ, bank details, archive)
- `app/admin/stock/brands/page.tsx` — thin list + small dialog
- `app/admin/stock/categories/page.tsx` — tree view (`react-arborist` or similar) with drag-reorder inside parent

### §14.5 Tests

`phase2_directories.sql` pgTAP (8 cases): archive preserves docs, delete 409 on used, unique `(parent_id, name_uk)` enforced, tree cycle prevention trigger.

---

## §15 Phase 3 — pack/unit, barcodes, per-warehouse matrix

### §15.1 Schema

```sql
BEGIN;

ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS pack_format_label TEXT,        -- e.g. 'Упаковка', 'Банка', 'Флакон'
  ADD COLUMN IF NOT EXISTS pack_size_numerator NUMERIC(14,4) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS pack_size_unit TEXT NOT NULL DEFAULT 'шт'
    CHECK (pack_size_unit IN ('шт','г','кг','мл','л','см','м','пара','набір')),
  ADD COLUMN IF NOT EXISTS barcodes TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS article_code TEXT,
  ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.material_brands(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_materials_barcode ON public.materials USING GIN (barcodes);
CREATE INDEX IF NOT EXISTS idx_materials_article ON public.materials (article_code);

ALTER TABLE public.material_inventory
  ADD COLUMN IF NOT EXISTS critical_level_unit_qty   NUMERIC(14,4),
  ADD COLUMN IF NOT EXISTS default_reorder_unit_qty  NUMERIC(14,4),
  ADD COLUMN IF NOT EXISTS is_visible                BOOLEAN NOT NULL DEFAULT true;

COMMIT;
```

### §15.2 Barcode lookup API

```ts
GET /api/stock/materials/by-barcode?code=XXX
→ 200 { data: Material } | 404 { code: 'BARCODE_NOT_FOUND' }
```

Used by the invoice editor when the user types/scans into the Додати товар field. Debounced 300ms.

### §15.3 Client-side scanner

`src/components/admin/stock/BarcodeInput.tsx`:

- If `window.BarcodeDetector` exists (Chromium mobile): start `getUserMedia({video})`, decode on frame.
- Fallback: listen for rapid keystrokes (USB scanner emulates keyboard at ~500 chars/sec) with Enter terminator.
- Manual typing always works.

### §15.4 UI extensions

- Product card dialog gains: brand picker (with inline `+ Додати бренд`), article, barcodes (comma-separated chip input), pack format label, in-pack unit + qty, per-warehouse matrix at bottom (one row per warehouse: critical level / default reorder qty / is-visible toggle).
- Category tree sidebar in `app/admin/materials/page.tsx`.

### §15.5 Tests

`phase3_units.sql` pgTAP (6 cases): barcode array lookup via GIN, unique(barcode) not enforced by design (tooltip 437 permits duplicates across products for bundle cases — confirm with clinic), pack-to-unit math `pack_qty * pack_size_numerator = unit_qty`.

---

## §16 Phase 4 — writeoff, transfer, return + Мої склади cards

### §16.1 Schema — nothing new

All doc types already land in Phase 1. Phase 4 is UI + API-edge work only. Well-factored Phase 1 pays off here.

### §16.2 UI — the daily hot path

Three editor variants sharing a core component:

- `src/components/admin/stock/InvoiceEditor.tsx` — header slots (from/to/supplier) conditionally rendered per doc_type prop, items table shared.
- `app/admin/stock/documents/page.tsx` — tabs for 5 doc types, uses same `InvoiceEditor` for all.
- `app/admin/stock/my-warehouses/page.tsx` — **Мої склади**, the card grid (§7):
  - Top bar: warehouse picker (default = user's home warehouse from `stock_warehouse_permissions`), category tree sidebar, search, "Critical only" toggle
  - Card grid (TanStack Virtual for 500+ item lists) — each card component = `MaterialCard.tsx`:
    - Image (lazy-loaded)
    - Name with colour rule: `qty > critical` green / `qty == 0` red / `qty <= critical` orange
    - `Нав. на цьому складі` — large qty + unit
    - `Нав. на інших` — small tile with blue/yellow/red per §7
    - `Заявки: N шт` — count of pending requisitions
    - Three buttons: `Списати ↓` (writeoff), `Перемістити ↔` (transfer), `Заявка 🛒` (requisition)
  - Floating right-side `ActionCart.tsx` with 3 drawers (one per action type), debounced auto-save into draft docs, single `Провести` per drawer.

Mobile layout: cards 1-per-row, action cart as bottom sheet.

### §16.3 API additions

```ts
POST /api/stock/documents/:id/add-item
     body: { materialId: UUID, packQty?, unitQty: number, unitCost?: number }
     optimised for side-cart: keeps draft in sync without re-PATCHing whole array
     perm: stock_docs:edit_<type>
DELETE /api/stock/documents/:id/items/:itemId

GET /api/stock/balances
    ?warehouseId=…&categoryIds=…&criticalOnly=false&q=…&page=&pageSize=
    → per-material-per-warehouse row with cross-warehouse totals joined in-query
    caches via Upstash for 30s keyed on (warehouseId, categoryIds, q)
    perm: stock_docs:view on that warehouse
```

### §16.4 Internal requisitions table (new)

Per tooltip 430 — internal staff requests, separate from supplier POs.

```sql
CREATE TABLE IF NOT EXISTS public.internal_requisitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  req_number TEXT UNIQUE NOT NULL,
  requester_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE RESTRICT,
  requester_warehouse_id UUID NOT NULL REFERENCES public.stock_warehouses(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','partially_filled','filled','rolled_into_po','cancelled')),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rolled_into_po_id UUID REFERENCES public.material_orders(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.internal_requisition_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id UUID NOT NULL REFERENCES public.internal_requisitions(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  unit_qty_requested NUMERIC(14,4) NOT NULL CHECK (unit_qty_requested > 0),
  unit_qty_fulfilled NUMERIC(14,4) NOT NULL DEFAULT 0
);

ALTER TABLE public.internal_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_requisition_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY req_admin_rw  ON public.internal_requisitions FOR ALL
  USING (public.is_admin() OR requester_id = auth.uid())
  WITH CHECK (public.is_admin() OR requester_id = auth.uid());
CREATE POLICY req_items_rw  ON public.internal_requisition_items FOR ALL
  USING (EXISTS (SELECT 1 FROM internal_requisitions r WHERE r.id = requisition_id
                 AND (public.is_admin() OR r.requester_id = auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM internal_requisitions r WHERE r.id = requisition_id
                 AND (public.is_admin() OR r.requester_id = auth.uid())));
```

### §16.5 Tests

`phase4_invoices.sql` pgTAP (10 cases): round-trip for each doc type, side-cart flow (draft → add item → post), return-from-incoming seeds items correctly. Playwright: full "card → side-cart → post" flow.

---

## §17 Phase 5 — calculation cards + treatment hook

### §17.1 Schema

```sql
BEGIN;

CREATE TABLE IF NOT EXISTS public.service_calculation_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL UNIQUE REFERENCES public.services(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.service_calculation_card_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.service_calculation_cards(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  default_unit_qty NUMERIC(14,4) NOT NULL CHECK (default_unit_qty > 0),
  is_replaceable BOOLEAN NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS idx_calc_items_card ON public.service_calculation_card_items (card_id);

ALTER TABLE public.treatment_records
  ADD COLUMN IF NOT EXISTS writeoff_document_id UUID
    REFERENCES public.stock_documents(id) ON DELETE SET NULL;

ALTER TABLE public.service_calculation_cards       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_calculation_card_items  ENABLE ROW LEVEL SECURITY;
CREATE POLICY calc_admin_rw  ON public.service_calculation_cards FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY calc_items_rw  ON public.service_calculation_card_items FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

COMMIT;
```

### §17.2 `resolve_calculation_card_lines` RPC

Given a treatment, expand each `treatment_record_items.service_id × quantity` into material consumption lines, multiplied correctly.

```sql
CREATE OR REPLACE FUNCTION public.resolve_calculation_card_lines(p_treatment_record_id UUID)
RETURNS TABLE(material_id UUID, unit_qty NUMERIC)
LANGUAGE sql STABLE
AS $$
  SELECT ci.material_id,
         SUM(tri.quantity * ci.default_unit_qty) AS unit_qty
    FROM treatment_record_items tri
    JOIN service_calculation_cards sc ON sc.service_id = tri.service_id AND sc.is_active
    JOIN service_calculation_card_items ci ON ci.card_id = sc.id
   WHERE tri.treatment_record_id = p_treatment_record_id
   GROUP BY ci.material_id;
$$;
```

### §17.3 `create_writeoff_draft_for_treatment` RPC

```sql
CREATE OR REPLACE FUNCTION public.create_writeoff_draft_for_treatment(
  p_treatment_record_id UUID,
  p_warehouse_id        UUID,
  p_responsible_user_id UUID
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_doc_id UUID := gen_random_uuid();
        v_doc_number TEXT;
BEGIN
  SELECT 'WO-' || to_char(now(),'YY') || '-' ||
         lpad(((COUNT(*)+1)::text), 7, '0')
    INTO v_doc_number
    FROM stock_documents WHERE doc_type='writeoff'
      AND doc_number LIKE 'WO-' || to_char(now(),'YY') || '-%';

  INSERT INTO stock_documents (id, doc_type, doc_number, status,
                               warehouse_from_id, responsible_user_id, doc_date,
                               treatment_record_id, comment)
  VALUES (v_doc_id, 'writeoff', v_doc_number, 'draft',
          p_warehouse_id, p_responsible_user_id, CURRENT_DATE,
          p_treatment_record_id,
          'Auto-generated from treatment ' || p_treatment_record_id::text);

  INSERT INTO stock_document_items (stock_document_id, material_id, pack_qty, unit_qty, unit_cost, line_total)
  SELECT v_doc_id, r.material_id, 0, r.unit_qty, 0, 0
    FROM resolve_calculation_card_lines(p_treatment_record_id) r
   WHERE r.unit_qty > 0;

  UPDATE treatment_records SET writeoff_document_id = v_doc_id WHERE id = p_treatment_record_id;

  RETURN v_doc_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.create_writeoff_draft_for_treatment TO authenticated;
```

### §17.4 Treatment-completion hook wiring

Extend `app/api/treatment-records/[id]/route.ts`:

```ts
if (next.status === 'completed' && prev.status !== 'completed') {
  const mode = await getClinicSetting<'none' | 'manual' | 'auto'>(
    'writeoff_mode'
  )
  if (mode === 'none') return
  const warehouseId = await resolveDoctorCabinetWarehouse(next.doctor_id)
  try {
    const { data: docId, error } = await supabase.rpc(
      'create_writeoff_draft_for_treatment',
      {
        p_treatment_record_id: next.id,
        p_warehouse_id: warehouseId,
        p_responsible_user_id: auth.user.id,
      }
    )
    if (error) throw error
    if (mode === 'auto') {
      const { error: postErr } = await supabase.rpc('post_stock_document', {
        p_doc_id: docId,
      })
      if (postErr) {
        captureException(postErr, { extra: { treatment: next.id, doc: docId } })
        await queueNotification({
          type: 'stock_autopost_failed',
          recipient: ADMIN_NOTIFICATION_EMAIL,
          metadata: { treatment: next.id, doc: docId },
        })
      }
    }
  } catch (e) {
    captureException(e, {
      extra: { treatment: next.id, phase: 'writeoff-hook' },
    })
  }
}
```

Hook never blocks treatment save. On failure: logged to Sentry + queued notification to admin.

### §17.5 `Заміна товару` — bulk substitute utility

Per tooltip 415. Single endpoint swaps material across **all active calculation cards** where it appears.

```sql
CREATE OR REPLACE FUNCTION public.substitute_material_across_calc_cards(
  p_from_material_id UUID, p_to_material_id UUID
) RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE n INT;
BEGIN
  IF p_from_material_id = p_to_material_id THEN
    RAISE EXCEPTION 'same material' USING ERRCODE='invalid_parameter_value';
  END IF;
  UPDATE service_calculation_card_items ci
     SET material_id = p_to_material_id
    FROM service_calculation_cards sc
   WHERE sc.id = ci.card_id AND sc.is_active AND ci.material_id = p_from_material_id
     AND ci.is_replaceable = true;
  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO admin_audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), 'calc_cards.substitute', 'materials', p_from_material_id,
          jsonb_build_object('to', p_to_material_id, 'rows_updated', n));
  RETURN n;
END; $$;
GRANT EXECUTE ON FUNCTION public.substitute_material_across_calc_cards TO authenticated;
```

API: `POST /api/stock/calc-cards/substitute` `{ from, to }` → `{ rowsUpdated: N }`. Perm: `stock_calc_cards:manage`.

### §17.6 UI

- `app/admin/stock/calc-cards/page.tsx` — list of price-list services with a `+` to open the card editor per service.
- `src/components/admin/stock/CalcCardEditor.tsx` — drawer with materials table (add/edit/delete lines, per-line `is_replaceable` toggle).
- `app/admin/stock/settings/additional/page.tsx` — toggles for `writeoff_mode`, `auto_ap_bill_on_incoming`, `show_my_inventory`, `enforce_stock_permissions`, `allow_negative_balance`. Saves via `PATCH /api/stock/clinic-settings`.
- Treatment detail view (existing `/admin/treatments/[id]` and `/cabinet/treatments/[id]`) gains a "Списані матеріали" section that lists the items from the linked `writeoff_document_id` with total cost.

### §17.7 Tests

`phase5_calc.sql` pgTAP (8 cases): resolve with multiple cards, substitute respects `is_replaceable=false`, draft-on-completion writes to both tables, auto-post path.

Playwright: create calc card → complete treatment → verify draft writeoff created (`manual` mode) → verify auto-posted and balance decremented (`auto` mode).

---

## §18 Phase 6 — inventory audits (complete)

### §18.1 Schema

```sql
BEGIN;

CREATE TABLE IF NOT EXISTS public.inventory_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','posted','void')),
  responsible_user_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE RESTRICT,
  warehouse_ids UUID[] NOT NULL,
  category_ids  UUID[] NOT NULL DEFAULT '{}',
  brand_ids     UUID[] NOT NULL DEFAULT '{}',
  material_ids  UUID[] NOT NULL DEFAULT '{}',
  audit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  comment TEXT,
  adjustment_document_id UUID REFERENCES public.stock_documents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  posted_at TIMESTAMPTZ,
  posted_by UUID REFERENCES public.admin_users(id)
);

CREATE TABLE IF NOT EXISTS public.inventory_audit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.inventory_audits(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL REFERENCES public.stock_warehouses(id) ON DELETE RESTRICT,
  qty_before NUMERIC(14,4) NOT NULL,
  qty_actual NUMERIC(14,4),
  UNIQUE (audit_id, material_id, warehouse_id)
);

ALTER TABLE public.stock_documents
  ADD CONSTRAINT stock_documents_audit_fk
  FOREIGN KEY (inventory_audit_id) REFERENCES public.inventory_audits(id) ON DELETE SET NULL;

ALTER TABLE public.inventory_audits       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_audit_items  ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_admin_rw ON public.inventory_audits FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY audit_items_rw ON public.inventory_audit_items FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

COMMIT;
```

### §18.2 `initialise_audit_items` + `post_inventory_audit` RPCs

```sql
CREATE OR REPLACE FUNCTION public.initialise_audit_items(p_audit_id UUID)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a RECORD; n INT;
BEGIN
  SELECT * INTO a FROM inventory_audits WHERE id = p_audit_id;

  INSERT INTO inventory_audit_items (audit_id, material_id, warehouse_id, qty_before)
  SELECT a.id, mi.material_id, mi.warehouse_id, mi.current_quantity
    FROM material_inventory mi
    JOIN materials m ON m.id = mi.material_id
   WHERE mi.warehouse_id = ANY(a.warehouse_ids)
     AND (cardinality(a.category_ids) = 0 OR m.category_id = ANY(a.category_ids))
     AND (cardinality(a.brand_ids)    = 0 OR m.brand_id    = ANY(a.brand_ids))
     AND (cardinality(a.material_ids) = 0 OR m.id          = ANY(a.material_ids))
     AND m.is_active
  ON CONFLICT (audit_id, material_id, warehouse_id) DO NOTHING;

  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END; $$;

CREATE OR REPLACE FUNCTION public.post_inventory_audit(p_audit_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a RECORD;
        wh UUID;
        v_doc_id UUID;
        v_num TEXT;
BEGIN
  SELECT * INTO a FROM inventory_audits WHERE id = p_audit_id FOR UPDATE;
  IF a.status <> 'draft' THEN RAISE EXCEPTION 'Audit % not draft', p_audit_id; END IF;

  FOR wh IN SELECT unnest(a.warehouse_ids) LOOP
    SELECT 'ADJ-' || to_char(now(),'YY') || '-' || lpad(((COUNT(*)+1)::text),7,'0')
      INTO v_num FROM stock_documents WHERE doc_type='adjustment'
        AND doc_number LIKE 'ADJ-' || to_char(now(),'YY') || '-%';

    INSERT INTO stock_documents (doc_type, doc_number, status, warehouse_from_id,
                                 responsible_user_id, doc_date, inventory_audit_id, comment)
    VALUES ('adjustment', v_num, 'draft', wh, a.responsible_user_id, a.audit_date,
            a.id, 'Adjustment from audit ' || a.audit_number)
    RETURNING id INTO v_doc_id;

    INSERT INTO stock_document_items (stock_document_id, material_id, pack_qty, unit_qty, unit_cost, line_total)
    SELECT v_doc_id, ai.material_id, 0, (COALESCE(ai.qty_actual,0) - ai.qty_before), 0, 0
      FROM inventory_audit_items ai
     WHERE ai.audit_id = a.id AND ai.warehouse_id = wh
       AND ai.qty_actual IS NOT NULL
       AND ai.qty_actual <> ai.qty_before;

    PERFORM public.post_stock_document(v_doc_id);
  END LOOP;

  UPDATE inventory_audits SET status='posted', posted_at=now(), posted_by=auth.uid(),
                              adjustment_document_id = v_doc_id
    WHERE id = a.id;
  RETURN a.id;
END; $$;
GRANT EXECUTE ON FUNCTION public.initialise_audit_items TO authenticated;
GRANT EXECUTE ON FUNCTION public.post_inventory_audit TO authenticated;
```

One adjustment document per warehouse per audit — matches the CliniCards pattern (audit posts → generates one Коректування per involved warehouse).

### §18.3 API

```ts
POST   /api/stock/audits               // body: { responsibleUserId, warehouseIds, categoryIds?, brandIds?, materialIds?, auditDate?, comment? }
GET    /api/stock/audits/:id           // returns audit + items with colour-code ready `delta`
PATCH  /api/stock/audits/:id           // update qty_actual on items
POST   /api/stock/audits/:id/init      // calls initialise_audit_items RPC
POST   /api/stock/audits/:id/autofill  // sets all qty_actual := qty_before (UI convenience)
POST   /api/stock/audits/:id/post      // calls post_inventory_audit RPC
DELETE /api/stock/audits/:id           // draft only
```

### §18.4 UI

- `app/admin/stock/audits/page.tsx` — list + `Створити новий акт` button
- `app/admin/stock/audits/new/page.tsx` — scope wizard matching CliniCards live UI (date, responsible, warehouses checkbox-tree, categories tree, brands multi, materials search, comment) → `Створити` → redirects to editor
- `app/admin/stock/audits/[id]/page.tsx` — editor with items table; line colours: qty_actual > qty_before = green bg; < = red bg; = = plain. Buttons `Заповнити автоматично`, `Провести`.

### §18.5 Tests

`phase6_audits.sql` pgTAP (6 cases): init idempotent, post generates correct adjustment docs per warehouse, re-post on already-posted audit raises.

---

## §19 Phase 7 — reports (remaining 3 SQL)

§9.1 Balances and §9.2 Cost-of-Services already have SQL. Here the other three Phase-7 reports:

### §19.1 Product history (`/admin/stock/reports/history`)

```sql
-- Parametrised as a SQL function so the API binds fast and the UI can filter by (material, warehouse, period)
CREATE OR REPLACE FUNCTION public.report_product_history(
  p_material_id UUID, p_warehouse_id UUID, p_from DATE, p_to DATE
) RETURNS TABLE (
  event_at TIMESTAMPTZ, doc_type TEXT, doc_number TEXT,
  qty_delta NUMERIC, unit_cost NUMERIC, running_balance NUMERIC,
  actor TEXT, comment TEXT
)
LANGUAGE sql STABLE AS $$
  WITH events AS (
    SELECT sd.posted_at AS event_at, sd.doc_type, sd.doc_number,
           CASE
             WHEN sd.doc_type='incoming'   AND sd.warehouse_to_id   = p_warehouse_id THEN  sdi.unit_qty
             WHEN sd.doc_type='writeoff'   AND sd.warehouse_from_id = p_warehouse_id THEN -sdi.unit_qty
             WHEN sd.doc_type='return'     AND sd.warehouse_from_id = p_warehouse_id THEN -sdi.unit_qty
             WHEN sd.doc_type='transfer'   AND sd.warehouse_from_id = p_warehouse_id THEN -sdi.unit_qty
             WHEN sd.doc_type='transfer'   AND sd.warehouse_to_id   = p_warehouse_id THEN  sdi.unit_qty
             WHEN sd.doc_type='adjustment' AND sd.warehouse_from_id = p_warehouse_id THEN  sdi.unit_qty
           END AS qty_delta,
           sdi.unit_cost,
           au.display_name AS actor, sd.comment
      FROM stock_documents sd
      JOIN stock_document_items sdi ON sdi.stock_document_id = sd.id
 LEFT JOIN admin_users au ON au.id = sd.posted_by
     WHERE sdi.material_id = p_material_id
       AND (sd.warehouse_from_id = p_warehouse_id OR sd.warehouse_to_id = p_warehouse_id)
       AND sd.status = 'posted'
       AND sd.posted_at::date BETWEEN p_from AND p_to
  )
  SELECT event_at, doc_type, doc_number, qty_delta, unit_cost,
         SUM(qty_delta) OVER (ORDER BY event_at, doc_number) AS running_balance,
         actor, comment
    FROM events WHERE qty_delta IS NOT NULL AND qty_delta <> 0
  ORDER BY event_at DESC, doc_number DESC;
$$;
```

### §19.2 Critical-stock reorder suggestion (`/admin/stock/reports/reorder`)

Zero-config, groups by default supplier. One-click PO button on the frontend creates a `material_orders` row pre-filled.

```sql
CREATE OR REPLACE FUNCTION public.report_critical_stock_reorder()
RETURNS TABLE (
  supplier_id UUID, supplier_name TEXT,
  material_id UUID, material_name TEXT, category TEXT,
  warehouse_id UUID, warehouse_name TEXT,
  qty NUMERIC, critical_level NUMERIC, suggested_order_qty NUMERIC
)
LANGUAGE sql STABLE AS $$
  SELECT m.default_supplier_id, ms.name,
         m.id, m.name_uk, mc.name_uk,
         sw.id, sw.name_uk,
         mi.current_quantity, mi.critical_level_unit_qty,
         COALESCE(mi.default_reorder_unit_qty,
                  GREATEST(mi.critical_level_unit_qty * 2 - mi.current_quantity, 0)) AS suggested
    FROM material_inventory mi
    JOIN materials m ON m.id = mi.material_id
    LEFT JOIN material_suppliers ms ON ms.id = m.default_supplier_id
    JOIN material_categories mc ON mc.id = m.category_id
    JOIN stock_warehouses sw ON sw.id = mi.warehouse_id
   WHERE m.is_active AND NOT sw.is_archived
     AND mi.current_quantity < COALESCE(mi.critical_level_unit_qty, 0)
   ORDER BY ms.name NULLS LAST, mc.name_uk, m.name_uk;
$$;
```

### §19.3 Writeoff report (`/admin/stock/reports/writeoff`)

```sql
CREATE OR REPLACE FUNCTION public.report_writeoff(
  p_from DATE, p_to DATE,
  p_warehouse_id UUID DEFAULT NULL, p_doctor_id UUID DEFAULT NULL, p_service_id UUID DEFAULT NULL
) RETURNS TABLE (
  doc_id UUID, doc_number TEXT, posted_at TIMESTAMPTZ,
  warehouse TEXT, doctor TEXT, service TEXT, material TEXT,
  unit_qty NUMERIC, unit_cost NUMERIC, line_total NUMERIC
)
LANGUAGE sql STABLE AS $$
  SELECT sd.id, sd.doc_number, sd.posted_at,
         sw.name_uk,
         CONCAT_WS(' ', d.last_name, d.first_name) AS doctor,
         s.name_uk, m.name_uk,
         sdi.unit_qty, sdi.unit_cost, sdi.line_total
    FROM stock_documents sd
    JOIN stock_document_items sdi ON sdi.stock_document_id = sd.id
    JOIN materials m ON m.id = sdi.material_id
    JOIN stock_warehouses sw ON sw.id = sd.warehouse_from_id
    LEFT JOIN treatment_records tr ON tr.id = sd.treatment_record_id
    LEFT JOIN doctors d ON d.id = tr.doctor_id
    LEFT JOIN LATERAL (
      SELECT services.name_uk FROM treatment_record_items tri
        JOIN services ON services.id = tri.service_id
       WHERE tri.treatment_record_id = tr.id ORDER BY tri.created_at LIMIT 1
    ) s ON true
   WHERE sd.doc_type='writeoff' AND sd.status='posted'
     AND sd.posted_at::date BETWEEN p_from AND p_to
     AND (p_warehouse_id IS NULL OR sd.warehouse_from_id = p_warehouse_id)
     AND (p_doctor_id    IS NULL OR tr.doctor_id        = p_doctor_id)
     AND (p_service_id   IS NULL OR EXISTS (SELECT 1 FROM treatment_record_items x
                                              WHERE x.treatment_record_id = tr.id AND x.service_id = p_service_id))
  ORDER BY sd.posted_at DESC, sd.doc_number DESC;
$$;
```

### §19.4 UI

Five report pages under `app/admin/stock/reports/*`, shared `ReportFilterBar` component (period + ad-hoc filter slots), TanStack Table results, CSV export via `papaparse` (already in deps).

### §19.5 Tests

`phase7_reports.sql` pgTAP (8 cases): product history period boundary, reorder suggest math, writeoff report doctor/service joins, CSV round-trip.

---

## §20 Cross-cutting concerns

### §20.1 Feature-flag wiring

Per CLAUDE.md, `src/lib/ab-test.ts` has a known `@vercel/edge-config` issue. Until that's fixed, use a simple env-var + `clinic_settings` hybrid:

- `NEXT_PUBLIC_INVENTORY_V2_ENABLED=true|false` gates the _nav entry_ and new routes at build-time (Next.js dead-code-elimination removes them in OFF branches).
- The `clinic_settings.enforce_stock_permissions` row gates _runtime behaviour_ per-environment (so preprod can be permissive while prod is strict).

Add `src/lib/feature-flags.ts`:

```ts
export function isInventoryV2Enabled(): boolean {
  return process.env.NEXT_PUBLIC_INVENTORY_V2_ENABLED === 'true'
}
```

Used by:

- `src/components/admin/AdminSidebar.tsx` — conditional nav entries
- Every Phase-1+ API route: early `return 404` if flag OFF
- `app/admin/stock/**` — `notFound()` at page-component level if OFF

Default: OFF in prod env, ON in preprod env. Flip prod once Phase 7 is green.

### §20.2 Rollback strategy

Phase 1 is the only truly risky migration (schema + behaviour). Rollback plan:

1. **Before deploy:** Supabase PITR enabled (CLAUDE.md notes this is a v3 backlog item — must ship before Phase 1 hits prod). Without PITR we have only daily backup; acceptable for preprod, not for prod.
2. **Deployment order:** schema migration first, app deploy second. Both behind flag; new endpoints only activate with `NEXT_PUBLIC_INVENTORY_V2_ENABLED=true`.
3. **Rollback migration:** `supabase/migrations/20260501_stock_posting_primitive_rollback.sql`. Drops all Phase-1 tables + functions. Leaves `material_inventory`, `materials`, `material_orders` untouched. Executed via `psql` only by @Yurii, never auto.
4. **Post-rollback checklist:**
   - Disable flag first (zero-downtime, immediate: `NEXT_PUBLIC_INVENTORY_V2_ENABLED=false` + redeploy)
   - Verify flag propagation via `/api/stock/warehouses` returning 404
   - Run rollback migration
   - Verify legacy `/api/materials`, `/api/material-orders` still work
   - File incident post-mortem

Later phases (2–7) are additive and reversible by disabling the flag; no rollback migrations needed unless they add a destructive column-drop, which we defer to "cleanup" migrations 2 weeks after each phase ships green.

### §20.3 i18n catalog

Three locale files, one new namespace `stock`:

- `src/locales/uk/stock.json`
- `src/locales/en/stock.json`
- `src/locales/pl/stock.json`

~220 keys across tabs, forms, buttons, error codes, status labels, tooltip-equivalent help texts. Ukrainian master (hand-written, reviewed with clinic terminology). EN + PL lazy-loaded per existing i18next config in `app/i18n-provider.tsx`.

Key structure example:

```json
{
  "nav": { "my_warehouses": "Мої склади", "invoices": "Накладні", ... },
  "doc_type": { "incoming": "Прихідна", "writeoff": "Списання", ... },
  "status":   { "draft": "Непроведена", "posted": "Проведена" },
  "error":    { "STOCK_INSUFFICIENT": "Недостатньо на складі: {{material}}", ... },
  "help":     { "head_warehouse": "Головний склад — …" }   // tooltip-equivalent texts, from our catalog Appendix B
}
```

Ship `uk` first at each phase; EN+PL lag by a week per phase, before the phase flips to ON.

### §20.4 Analytics / metrics

Practical, not over-engineered. One new table + daily materialised view:

```sql
CREATE TABLE IF NOT EXISTS public.stock_metrics_daily (
  day DATE PRIMARY KEY,
  posted_docs_count JSONB NOT NULL DEFAULT '{}'::jsonb,  -- {incoming:N, writeoff:N, ...}
  audits_posted_count INT NOT NULL DEFAULT 0,
  users_active_count INT NOT NULL DEFAULT 0,
  stockout_events_count INT NOT NULL DEFAULT 0,
  critical_low_materials_count INT NOT NULL DEFAULT 0,
  writeoff_autopost_failures INT NOT NULL DEFAULT 0,
  avg_material_cost_per_treatment NUMERIC(14,2)
);
```

Populated by `/api/cron/stock-metrics` running daily at 23:55 Kyiv time (registered in `vercel.json` along with existing `/api/cron/notifications` + `/api/cron/reminders` crons). Query feeds an `/admin/stock/reports/health` dashboard (hidden unless `view_reports` perm, visible only to inventory_manager+admins).

Acceptance criteria for each phase launch:

- Phase 1 launch-week: ≥1 posted doc of each type in preprod
- Phase 4 launch-week: ≥5 unique users create a doc in preprod
- Phase 5 launch-week: ≥1 treatment → auto-writeoff round-trip
- Phase 7 launch-week: each of 5 reports viewed at least once

### §20.5 pgTAP test suite — consolidated

Per-phase files live under `supabase/tests/`:

| Phase | File                       | Cases                                      |
| ----- | -------------------------- | ------------------------------------------ |
| 1     | `phase1_stock_posting.sql` | 24 (see §13.8)                             |
| 2     | `phase2_directories.sql`   | 8                                          |
| 3     | `phase3_units.sql`         | 6                                          |
| 4     | `phase4_invoices.sql`      | 10                                         |
| 5     | `phase5_calc.sql`          | 8                                          |
| 6     | `phase6_audits.sql`        | 6                                          |
| 7     | `phase7_reports.sql`       | 8                                          |
| —     | `phase0_settings.sql`      | 3 (`clinic_settings` existence + defaults) |

Total: 73 pgTAP cases, ~2000 lines of SQL tests.

Runner: add `npm run test:db` script calling `supabase test` or equivalent CLI; wire into CI `.github/workflows/ci.yml` as a new job `db-tests` that spins a throwaway Postgres in Docker, applies `supabase/migrations/*`, runs `supabase/tests/*`, asserts 0 failures.

### §20.6 Deployment checklist per phase

For every phase PR before flipping `ON` in prod:

```
[ ] All migrations applied on preprod database
[ ] All APIs return expected shape; 404s confirmed behind OFF flag
[ ] pgTAP cases green in CI
[ ] Playwright smoke for the phase green
[ ] i18n keys present for uk; en+pl best-effort
[ ] Nav entries visible only with flag ON
[ ] RLS policies verified for each new table (pg_policies query)
[ ] Seed script extended to cover new entities
[ ] CLAUDE.md updated (at least once per phase)
[ ] Rollback migration written & locally tested where applicable
[ ] Sentry tags: new API routes appear in Issues dashboard under "inventory_v2" release
[ ] One-on-one walkthrough with the clinic user who will exercise the flow first
```

### §20.7 Docs to update

Beyond this ADR:

- `CLAUDE.md` — Inventory v2 section with "all stock mutations via RPC" invariant (Phase 1)
- `docs/DATABASE.md` — add Inventory v2 schema diagram (Phase 1, 2, 5, 6)
- `docs/API.md` — add `/api/stock/**` endpoints (per phase)
- `docs/ARCHITECTURE.md` — one paragraph on the posting primitive + FIFO book pattern
- `docs/TESTING.md` — add pgTAP section
- `docs/ROADMAP.md` — mark Inventory v2 phases as they complete

---

**End of Part II.** Total additions: 8 phases SQL-complete, 73 pgTAP cases speccʼd, rollback procedure, feature flag wiring, i18n plan, analytics, per-phase deployment checklist. Document is now ~1500 lines — implementation-ready end to end.
