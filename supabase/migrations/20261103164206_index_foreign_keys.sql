CREATE INDEX IF NOT EXISTS business_news_account_created_idx
  ON public.business_news (account_id, created_at DESC);

CREATE INDEX IF NOT EXISTS business_sessions_account_idx
  ON public.business_sessions (account_id);

CREATE INDEX IF NOT EXISTS participations_draw_idx
  ON public.participations (draw_id);

CREATE INDEX IF NOT EXISTS payment_events_account_created_idx
  ON public.payment_events (account_id, created_at DESC);

CREATE INDEX IF NOT EXISTS tickets_participation_idx
  ON public.tickets (participation_id);
