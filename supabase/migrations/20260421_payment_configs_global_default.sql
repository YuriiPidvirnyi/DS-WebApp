-- Global default payment config: full-price online payment for all services
-- service_id = NULL applies to any service without a per-service override
INSERT INTO public.payment_configs (service_id, payment_mode, deposit_percent)
VALUES (NULL, 'full', NULL)
ON CONFLICT (service_id) DO UPDATE
  SET payment_mode = EXCLUDED.payment_mode,
      deposit_percent = EXCLUDED.deposit_percent,
      updated_at = now();
