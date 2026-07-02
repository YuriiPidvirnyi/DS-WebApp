-- Extend payments table for hold/finalize flow and fiscalization tracking
ALTER TABLE public.payments
  ADD COLUMN payment_type text NOT NULL DEFAULT 'debit',
  ADD COLUMN hold_at      timestamptz,
  ADD COLUMN finalized_at timestamptz;

-- Index for finding holds approaching expiry (8+ days old)
CREATE INDEX payments_hold_at_idx ON public.payments (hold_at)
  WHERE hold_at IS NOT NULL;
