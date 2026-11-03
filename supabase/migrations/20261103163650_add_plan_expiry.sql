ALTER TABLE public.business_accounts
  ADD COLUMN IF NOT EXISTS plan_expires_at text;

CREATE INDEX IF NOT EXISTS business_accounts_plan_expiry_idx
  ON public.business_accounts (plan_expires_at)
  WHERE plan_expires_at IS NOT NULL;
