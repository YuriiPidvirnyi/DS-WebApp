-- Enforce "at most one active payment per appointment" at the database level.
--
-- /api/payments/create checks for an existing active payment with a SELECT and
-- then INSERTs — a TOCTOU race: two concurrent requests can both pass the check
-- and create two Monobank invoices for the same appointment. A partial unique
-- index closes that window atomically (the losing INSERT fails with 23505, which
-- the route now maps to 409).
--
-- "Active" mirrors the route's own definition: any status except the terminal
-- failure/expired/reversed.
--
-- Self-safe: only creates the index when no existing rows would violate it, so
-- applying this migration can never fail on pre-existing data. (If duplicates
-- exist they are reported and must be deduped first.)

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.payments') IS NULL THEN
    RAISE NOTICE 'payments table absent — skipping';
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.payments
    WHERE status NOT IN ('failure', 'expired', 'reversed')
    GROUP BY appointment_id
    HAVING count(*) > 1
  ) THEN
    RAISE WARNING
      'Existing duplicate active payments found — uniq_active_payment_per_appointment NOT created; dedupe first, then re-run.';
  ELSE
    CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_payment_per_appointment
      ON public.payments (appointment_id)
      WHERE status NOT IN ('failure', 'expired', 'reversed');
  END IF;
END $$;

COMMIT;
