-- Patient intake questionnaire ("анкета пацієнта").
--
-- Public /anketa form for new patients: demographics + structured medical
-- history + consents. Rows are submitted anonymously (guest) or with
-- patient_id when the visitor is signed in; staff review them at
-- /admin/intake and link/annotate. promo_code + source carry the welcome-pack
-- campaign attribution from the QR query params (?promo=…&src=…).
--
-- RLS mirrors contact_submissions: public INSERT only, admin everything.

BEGIN;

CREATE TABLE public.patient_intake_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,

  -- contact / demographics
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  patronymic TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  date_of_birth DATE,

  -- structured medical history
  allergies TEXT,
  medications TEXT,
  chronic_conditions TEXT,
  is_pregnant BOOLEAN,
  complaints TEXT,

  -- consents
  data_consent BOOLEAN NOT NULL DEFAULT false,
  marketing_consent BOOLEAN NOT NULL DEFAULT false,

  -- campaign attribution
  promo_code TEXT,
  source TEXT NOT NULL DEFAULT 'direct',

  -- staff workflow
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'reviewed', 'linked')),
  admin_notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_intake_status_created
  ON public.patient_intake_forms (status, created_at DESC);
CREATE INDEX idx_intake_phone ON public.patient_intake_forms (phone);
CREATE INDEX idx_intake_patient ON public.patient_intake_forms (patient_id);

ALTER TABLE public.patient_intake_forms ENABLE ROW LEVEL SECURITY;

-- Guests insert with patient_id NULL; signed-in patients may only link a row
-- to THEMSELVES. WITH CHECK (true) would let anyone holding the public anon
-- key plant medical data against an arbitrary patient_id via PostgREST.
CREATE POLICY "intake_insert_public" ON public.patient_intake_forms
  FOR INSERT WITH CHECK (patient_id IS NULL OR patient_id = auth.uid());

-- Patients see their own questionnaires in the cabinet
CREATE POLICY "intake_own_read" ON public.patient_intake_forms
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "intake_admin_all" ON public.patient_intake_forms
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMIT;
