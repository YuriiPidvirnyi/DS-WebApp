-- ============================================================
-- PAYMENT SYSTEM
-- Monobank Acquiring integration: payment configs + payments
-- ============================================================

-- 1. Enum type for payment mode
CREATE TYPE payment_mode_type AS ENUM ('none', 'deposit', 'full');

-- 2. Payment configs (global default when service_id IS NULL, per-service otherwise)
CREATE TABLE public.payment_configs (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id       uuid        REFERENCES public.services(id) ON DELETE CASCADE,
  payment_mode     payment_mode_type NOT NULL DEFAULT 'none',
  deposit_percent  integer     CHECK (deposit_percent BETWEEN 10 AND 90),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (service_id)
);

-- 3. Payments table — one row per Monobank invoice
CREATE TABLE public.payments (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id  uuid        NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  invoice_id      text        NOT NULL,
  amount_kopecks  integer     NOT NULL CHECK (amount_kopecks > 0),
  payment_mode    payment_mode_type NOT NULL,
  status          text        NOT NULL DEFAULT 'created',
  monobank_data   jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  paid_at         timestamptz,
  UNIQUE (invoice_id)
);

CREATE INDEX payments_appointment_id_idx ON public.payments (appointment_id);
CREATE INDEX payments_status_idx         ON public.payments (status);

-- 4. Enable RLS
ALTER TABLE public.payment_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments        ENABLE ROW LEVEL SECURITY;

-- 5. RLS: payment_configs — public read (needed by booking flow)
CREATE POLICY "payment_configs_select_public"
  ON public.payment_configs
  FOR SELECT
  USING (true);

-- 6. RLS: payments

-- Booking flow creates a payment (anon or authenticated)
CREATE POLICY "payments_insert_anon"
  ON public.payments
  FOR INSERT
  WITH CHECK (true);

-- Webhook (service role) updates payment status
-- Service role bypasses RLS by default; this policy covers the authenticated path if needed.
CREATE POLICY "payments_update_service_role"
  ON public.payments
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Authenticated users can only see their own payments
CREATE POLICY "payments_select_own"
  ON public.payments
  FOR SELECT
  USING (
    appointment_id IN (
      SELECT id FROM public.appointments
      WHERE patient_id = auth.uid()
    )
  );

-- 7. updated_at trigger for payment_configs

CREATE OR REPLACE FUNCTION public.set_payment_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payment_configs_updated_at
  BEFORE UPDATE ON public.payment_configs
  FOR EACH ROW EXECUTE FUNCTION public.set_payment_configs_updated_at();
