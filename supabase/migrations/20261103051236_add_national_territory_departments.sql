ALTER TABLE public.draws
  ADD COLUMN IF NOT EXISTS territory_departments text NOT NULL DEFAULT '';
