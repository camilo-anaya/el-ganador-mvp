ALTER TABLE public.draws
  ADD COLUMN IF NOT EXISTS territory_scope text NOT NULL DEFAULT 'unspecified',
  ADD COLUMN IF NOT EXISTS territory_department text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS territory_municipality text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS territory_municipalities text NOT NULL DEFAULT '';
