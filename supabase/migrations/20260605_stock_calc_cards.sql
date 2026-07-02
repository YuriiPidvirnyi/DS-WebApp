BEGIN;

-- 1) Calculation card per service
CREATE TABLE IF NOT EXISTS public.service_calculation_cards (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL UNIQUE REFERENCES public.services(id) ON DELETE CASCADE,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Items per card
CREATE TABLE IF NOT EXISTS public.service_calculation_card_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id          UUID NOT NULL REFERENCES public.service_calculation_cards(id) ON DELETE CASCADE,
  material_id      UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  default_unit_qty NUMERIC(14,4) NOT NULL CHECK (default_unit_qty > 0),
  is_replaceable   BOOLEAN NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS idx_calc_items_card ON public.service_calculation_card_items (card_id);

-- 3) Link treatment_records to their auto-seeded writeoff draft
ALTER TABLE public.treatment_records
  ADD COLUMN IF NOT EXISTS writeoff_document_id UUID
    REFERENCES public.stock_documents(id) ON DELETE SET NULL;

-- 4) RLS
ALTER TABLE public.service_calculation_cards       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_calculation_card_items  ENABLE ROW LEVEL SECURITY;

CREATE POLICY calc_admin_rw
  ON public.service_calculation_cards FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY calc_items_rw
  ON public.service_calculation_card_items FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 5) RPC: expand treatment items into material lines using calc cards
CREATE OR REPLACE FUNCTION public.resolve_calculation_card_lines(p_treatment_record_id UUID)
RETURNS TABLE(material_id UUID, unit_qty NUMERIC)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT ci.material_id,
         SUM(tri.quantity * ci.default_unit_qty) AS unit_qty
    FROM treatment_record_items tri
    JOIN service_calculation_cards sc
         ON sc.service_id = tri.service_id AND sc.is_active = true
    JOIN service_calculation_card_items ci ON ci.card_id = sc.id
   WHERE tri.treatment_record_id = p_treatment_record_id
   GROUP BY ci.material_id;
$$;

-- 6) RPC: create a writeoff draft pre-seeded from calc cards
CREATE OR REPLACE FUNCTION public.create_writeoff_draft_for_treatment(
  p_treatment_record_id UUID,
  p_warehouse_id        UUID,
  p_responsible_user_id UUID
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_doc_id     UUID := gen_random_uuid();
  v_doc_number TEXT;
BEGIN
  SELECT 'WO-' || to_char(now(), 'YY') || '-' ||
         lpad(((COUNT(*) + 1)::text), 7, '0')
    INTO v_doc_number
    FROM stock_documents
   WHERE doc_type = 'writeoff'
     AND doc_number LIKE 'WO-' || to_char(now(), 'YY') || '-%';

  INSERT INTO stock_documents (
    id, doc_type, doc_number, status,
    warehouse_from_id, responsible_user_id, doc_date,
    treatment_record_id, comment
  )
  VALUES (
    v_doc_id, 'writeoff', v_doc_number, 'draft',
    p_warehouse_id, p_responsible_user_id, CURRENT_DATE,
    p_treatment_record_id,
    'Auto-generated from treatment ' || p_treatment_record_id::text
  );

  INSERT INTO stock_document_items
    (stock_document_id, material_id, pack_qty, unit_qty, unit_cost, line_total)
  SELECT v_doc_id, r.material_id, 0, r.unit_qty, 0, 0
    FROM resolve_calculation_card_lines(p_treatment_record_id) r
   WHERE r.unit_qty > 0;

  UPDATE treatment_records
     SET writeoff_document_id = v_doc_id
   WHERE id = p_treatment_record_id;

  RETURN v_doc_id;
END;
$$;
REVOKE ALL ON FUNCTION public.create_writeoff_draft_for_treatment FROM public;
GRANT  EXECUTE ON FUNCTION public.create_writeoff_draft_for_treatment TO authenticated;

-- 7) RPC: substitute a material across all active calc cards (tooltip 415)
CREATE OR REPLACE FUNCTION public.substitute_material_across_calc_cards(
  p_from_material_id UUID,
  p_to_material_id   UUID
) RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE n INT;
BEGIN
  IF p_from_material_id = p_to_material_id THEN
    RAISE EXCEPTION 'same material' USING ERRCODE = 'invalid_parameter_value';
  END IF;

  UPDATE service_calculation_card_items ci
     SET material_id = p_to_material_id
    FROM service_calculation_cards sc
   WHERE sc.id = ci.card_id
     AND sc.is_active = true
     AND ci.material_id = p_from_material_id
     AND ci.is_replaceable = true;

  GET DIAGNOSTICS n = ROW_COUNT;

  INSERT INTO admin_audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(),
    'calc_cards.substitute',
    'materials',
    p_from_material_id,
    jsonb_build_object('to', p_to_material_id, 'rows_updated', n)
  );

  RETURN n;
END;
$$;
REVOKE ALL ON FUNCTION public.substitute_material_across_calc_cards FROM public;
GRANT  EXECUTE ON FUNCTION public.substitute_material_across_calc_cards TO authenticated;

COMMIT;
