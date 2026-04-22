-- Phase 4: internal requisitions (staff requests separate from supplier POs)
-- Per ADR §16.4 / tooltip 430

BEGIN;

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

-- Admins see all; staff see their own
CREATE POLICY req_admin_rw ON public.internal_requisitions FOR ALL
  USING (public.is_admin() OR requester_id = auth.uid())
  WITH CHECK (public.is_admin() OR requester_id = auth.uid());

CREATE POLICY req_items_rw ON public.internal_requisition_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.internal_requisitions r
      WHERE r.id = requisition_id
        AND (public.is_admin() OR r.requester_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.internal_requisitions r
      WHERE r.id = requisition_id
        AND (public.is_admin() OR r.requester_id = auth.uid())
    )
  );

-- Auto-generate req_number: REQ-YYYYMM-NNNNNN
CREATE OR REPLACE FUNCTION public.next_req_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_prefix TEXT := 'REQ-' || to_char(now(), 'YYYYMM') || '-';
  v_seq    BIGINT;
BEGIN
  SELECT COUNT(*) + 1 INTO v_seq
  FROM public.internal_requisitions
  WHERE req_number LIKE v_prefix || '%';
  RETURN v_prefix || lpad(v_seq::TEXT, 6, '0');
END;
$$;

COMMIT;
