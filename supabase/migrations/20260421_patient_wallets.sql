-- Patient wallet cards — tokenized cards saved via Monobank Acquiring
CREATE TABLE public.patient_wallet_cards (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_token   text        NOT NULL,
  masked_pan   text        NOT NULL,
  country      text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  UNIQUE (user_id, card_token)
);

CREATE INDEX patient_wallet_cards_user_id_idx ON public.patient_wallet_cards (user_id);

ALTER TABLE public.patient_wallet_cards ENABLE ROW LEVEL SECURITY;

-- Users can only see their own cards
CREATE POLICY "wallet_cards_select_own"
  ON public.patient_wallet_cards
  FOR SELECT
  USING (user_id = auth.uid());

-- Webhook (service role) inserts/upserts card tokens
CREATE POLICY "wallet_cards_insert_service"
  ON public.patient_wallet_cards
  FOR INSERT
  WITH CHECK (true);

-- Upsert (update existing token data)
CREATE POLICY "wallet_cards_update_service"
  ON public.patient_wallet_cards
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Users can delete their own cards
CREATE POLICY "wallet_cards_delete_own"
  ON public.patient_wallet_cards
  FOR DELETE
  USING (user_id = auth.uid());
