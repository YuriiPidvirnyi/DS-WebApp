BEGIN;

-- admin_users: extend role constraint to include 'assistant'
ALTER TABLE public.admin_users
  DROP CONSTRAINT IF EXISTS admin_users_role_check;

ALTER TABLE public.admin_users
  ADD CONSTRAINT admin_users_role_check
  CHECK (role IN ('superadmin', 'admin', 'staff', 'doctor', 'assistant'));

-- treatment_records: what was done during a visit
CREATE TABLE IF NOT EXISTS public.treatment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  tooth_numbers TEXT[] NOT NULL DEFAULT '{}',
  diagnosis TEXT,
  notes TEXT,
  attachment_urls TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'signed', 'completed')),
  total_cost NUMERIC(12, 2) NOT NULL DEFAULT 0
    CHECK (total_cost >= 0),
  payment_status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'waived', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_treatment_records_appointment_id ON public.treatment_records (appointment_id);
CREATE INDEX IF NOT EXISTS idx_treatment_records_patient_id ON public.treatment_records (patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_records_doctor_id ON public.treatment_records (doctor_id);
CREATE INDEX IF NOT EXISTS idx_treatment_records_status ON public.treatment_records (status);
CREATE INDEX IF NOT EXISTS idx_treatment_records_created_at ON public.treatment_records (created_at DESC);

ALTER TABLE public.treatment_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "treatment_records_patient_select" ON public.treatment_records;
CREATE POLICY "treatment_records_patient_select"
  ON public.treatment_records FOR SELECT
  USING (auth.uid() = patient_id OR public.is_admin());

DROP POLICY IF EXISTS "treatment_records_admin_all" ON public.treatment_records;
CREATE POLICY "treatment_records_admin_all"
  ON public.treatment_records FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- treatment_record_items: individual procedures within a treatment
CREATE TABLE IF NOT EXISTS public.treatment_record_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_record_id UUID NOT NULL REFERENCES public.treatment_records(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  tooth_number TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price_at_time NUMERIC(12, 2) NOT NULL CHECK (price_at_time >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_treatment_record_items_record ON public.treatment_record_items (treatment_record_id);
CREATE INDEX IF NOT EXISTS idx_treatment_record_items_service ON public.treatment_record_items (service_id);

ALTER TABLE public.treatment_record_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "treatment_record_items_patient_select" ON public.treatment_record_items;
CREATE POLICY "treatment_record_items_patient_select"
  ON public.treatment_record_items FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.treatment_records tr WHERE tr.id = treatment_record_id AND auth.uid() = tr.patient_id)
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "treatment_record_items_admin_all" ON public.treatment_record_items;
CREATE POLICY "treatment_record_items_admin_all"
  ON public.treatment_record_items FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- materials: catalog of consumable materials
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_uk TEXT NOT NULL,
  name_en TEXT,
  name_pl TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  unit TEXT NOT NULL,
  sku TEXT UNIQUE,
  min_stock_level NUMERIC(14, 4) NOT NULL DEFAULT 0 CHECK (min_stock_level >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  supplier_name TEXT,
  supplier_contact TEXT,
  supplier_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_materials_category ON public.materials (category);
CREATE INDEX IF NOT EXISTS idx_materials_is_active ON public.materials (is_active);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "materials_admin_all" ON public.materials;
CREATE POLICY "materials_admin_all"
  ON public.materials FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- material_inventory: current stock levels
CREATE TABLE IF NOT EXISTS public.material_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  current_quantity NUMERIC(14, 4) NOT NULL DEFAULT 0 CHECK (current_quantity >= 0),
  storage_location TEXT NOT NULL DEFAULT '',
  last_restocked_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT material_inventory_material_location_unique UNIQUE (material_id, storage_location)
);

CREATE INDEX IF NOT EXISTS idx_material_inventory_material ON public.material_inventory (material_id);

ALTER TABLE public.material_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "material_inventory_admin_all" ON public.material_inventory;
CREATE POLICY "material_inventory_admin_all"
  ON public.material_inventory FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- material_orders: orders placed by staff/assistants
CREATE TABLE IF NOT EXISTS public.material_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ordered_by UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_approval', 'approved', 'ordered', 'delivered', 'cancelled')),
  total_estimated_cost NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_estimated_cost >= 0),
  notes TEXT,
  urgency TEXT NOT NULL DEFAULT 'normal'
    CHECK (urgency IN ('low', 'normal', 'high', 'critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_material_orders_ordered_by ON public.material_orders (ordered_by);
CREATE INDEX IF NOT EXISTS idx_material_orders_status ON public.material_orders (status);
CREATE INDEX IF NOT EXISTS idx_material_orders_created_at ON public.material_orders (created_at DESC);

ALTER TABLE public.material_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "material_orders_select" ON public.material_orders;
CREATE POLICY "material_orders_select"
  ON public.material_orders FOR SELECT
  USING (ordered_by = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "material_orders_insert" ON public.material_orders;
CREATE POLICY "material_orders_insert"
  ON public.material_orders FOR INSERT
  WITH CHECK (ordered_by = auth.uid() AND public.is_admin());

DROP POLICY IF EXISTS "material_orders_update" ON public.material_orders;
CREATE POLICY "material_orders_update"
  ON public.material_orders FOR UPDATE
  USING (ordered_by = auth.uid() OR public.is_admin())
  WITH CHECK (ordered_by = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "material_orders_delete" ON public.material_orders;
CREATE POLICY "material_orders_delete"
  ON public.material_orders FOR DELETE
  USING (public.is_admin());

-- material_order_items: line items in an order
CREATE TABLE IF NOT EXISTS public.material_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_order_id UUID NOT NULL REFERENCES public.material_orders(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  quantity_requested NUMERIC(14, 4) NOT NULL CHECK (quantity_requested > 0),
  quantity_delivered NUMERIC(14, 4) NOT NULL DEFAULT 0 CHECK (quantity_delivered >= 0),
  unit_price NUMERIC(12, 4) NOT NULL CHECK (unit_price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_material_order_items_order ON public.material_order_items (material_order_id);
CREATE INDEX IF NOT EXISTS idx_material_order_items_material ON public.material_order_items (material_id);

ALTER TABLE public.material_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "material_order_items_select" ON public.material_order_items;
CREATE POLICY "material_order_items_select"
  ON public.material_order_items FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.material_orders mo WHERE mo.id = material_order_id AND (mo.ordered_by = auth.uid() OR public.is_admin()))
  );

DROP POLICY IF EXISTS "material_order_items_insert" ON public.material_order_items;
CREATE POLICY "material_order_items_insert"
  ON public.material_order_items FOR INSERT
  WITH CHECK (
    public.is_admin() AND EXISTS (SELECT 1 FROM public.material_orders mo WHERE mo.id = material_order_id AND (mo.ordered_by = auth.uid() OR public.is_admin()))
  );

DROP POLICY IF EXISTS "material_order_items_update" ON public.material_order_items;
CREATE POLICY "material_order_items_update"
  ON public.material_order_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.material_orders mo WHERE mo.id = material_order_id AND (mo.ordered_by = auth.uid() OR public.is_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.material_orders mo WHERE mo.id = material_order_id AND (mo.ordered_by = auth.uid() OR public.is_admin())));

DROP POLICY IF EXISTS "material_order_items_delete" ON public.material_order_items;
CREATE POLICY "material_order_items_delete"
  ON public.material_order_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.material_orders mo WHERE mo.id = material_order_id AND public.is_admin()));

-- treatment_materials_used: materials consumed during treatments
CREATE TABLE IF NOT EXISTS public.treatment_materials_used (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_record_id UUID NOT NULL REFERENCES public.treatment_records(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  quantity_used NUMERIC(14, 4) NOT NULL CHECK (quantity_used > 0),
  registered_by UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_treatment_materials_used_record ON public.treatment_materials_used (treatment_record_id);
CREATE INDEX IF NOT EXISTS idx_treatment_materials_used_material ON public.treatment_materials_used (material_id);

ALTER TABLE public.treatment_materials_used ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "treatment_materials_used_patient_select" ON public.treatment_materials_used;
CREATE POLICY "treatment_materials_used_patient_select"
  ON public.treatment_materials_used FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.treatment_records tr WHERE tr.id = treatment_record_id AND auth.uid() = tr.patient_id)
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "treatment_materials_used_admin_all" ON public.treatment_materials_used;
CREATE POLICY "treatment_materials_used_admin_all"
  ON public.treatment_materials_used FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

COMMIT;
