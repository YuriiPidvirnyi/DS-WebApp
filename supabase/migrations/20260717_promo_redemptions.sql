-- Welcome-pack gift redemptions.
--
-- One row per gift handed out at reception. The gift is tied to a completed
-- intake questionnaire (NOT to a review — Google prohibits review incentives),
-- and uniqueness constraints enforce "one gift per questionnaire / per known
-- patient" at the DB level. stock_document_id is reserved for a follow-up that
-- auto-posts a writeoff from the promo warehouse when a gift is issued.

BEGIN;

CREATE TABLE public.promo_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_slug TEXT NOT NULL DEFAULT 'welcome_pack',
  intake_form_id UUID NOT NULL
    REFERENCES public.patient_intake_forms(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,
  stock_document_id UUID REFERENCES public.stock_documents(id) ON DELETE SET NULL,
  redeemed_by UUID NOT NULL REFERENCES public.admin_users(id),
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (campaign_slug, intake_form_id)
);

-- One gift per known patient per campaign (guest intakes have NULL patient_id
-- and are guarded per-questionnaire by the UNIQUE above).
CREATE UNIQUE INDEX uniq_promo_redemption_per_patient
  ON public.promo_redemptions (campaign_slug, patient_id)
  WHERE patient_id IS NOT NULL;

CREATE INDEX idx_promo_redemptions_redeemed_at
  ON public.promo_redemptions (campaign_slug, redeemed_at DESC);

ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;

-- Staff-only, both directions. Fine-grained permission (promo:redeem) is
-- enforced in the API route; RLS keeps the table invisible to patients.
CREATE POLICY "promo_redemptions_admin_all" ON public.promo_redemptions
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMIT;
