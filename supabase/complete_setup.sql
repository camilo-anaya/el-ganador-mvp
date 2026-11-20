-- ============================================================================
-- EL GANADOR - ESQUEMA MAESTRO DE PRODUCCIÓN PARA SUPABASE (POSTGRESQL)
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase (EL GANADOR)
-- ============================================================================

-- Habilitar extensión UUID
create extension if not exists "uuid-ossp";

-- 1. TABLA: SORTEOS / RIFAS (DRAWS)
create table if not exists public.draws (
  id text primary key,
  title text not null,
  admin text not null,
  category text not null,
  unit_price integer not null check (unit_price > 0),
  total_tickets integer not null check (total_tickets > 0),
  followers integer not null default 0,
  live integer not null default 0,
  emoji text not null,
  description text not null default '',
  business_city text not null default 'Colombia',
  territory_scope text not null default 'unspecified',
  territory_department text not null default '',
  territory_municipality text not null default '',
  territory_municipalities text not null default '',
  territory_departments text not null default '',
  business_description text not null default '',
  business_followers integer not null default 0,
  category_details text not null default '{}',
  owner_id text,
  product_value integer not null default 0,
  image_url text not null default '',
  published integer not null default 1,
  start_mode text not null default 'date',
  start_threshold integer not null default 100,
  scheduled_at timestamp with time zone,
  started_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  published_at timestamp with time zone
);

create index if not exists idx_draws_published on public.draws(published, live);
create index if not exists idx_draws_category on public.draws(category);

-- 2. TABLA: CUENTAS DE COMERCIOS Y USUARIOS
create table if not exists public.business_accounts (
  id text primary key,
  role text not null check (role in ('business', 'customer')),
  display_name text not null,
  email text not null unique,
  password_salt text not null,
  password_hash text not null,
  business_name text not null default '',
  business_city text not null default '',
  business_description text not null default '',
  category text not null default '',
  plan text not null default 'inicio',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  entity_type text not null default '',
  legal_name text not null default '',
  tax_id text not null default '',
  identity_number text not null default '',
  business_phone text not null default '',
  business_address text not null default '',
  business_photo_url text not null default '',
  business_banner_url text not null default '',
  bank_name text not null default '',
  bank_account_type text not null default 'Ahorros',
  bank_account_number text not null default '',
  bank_account_holder text not null default '',
  bank_account_doc text not null default '',
  account_status text not null default 'active',
  plan_expires_at timestamp with time zone
);

create index if not exists idx_accounts_email on public.business_accounts(email);
create index if not exists idx_accounts_plan on public.business_accounts(plan, account_status);

-- 3. TABLA: SESIONES
create table if not exists public.business_sessions (
  token_hash text primary key,
  account_id text not null references public.business_accounts(id) on delete cascade,
  expires_at timestamp with time zone not null
);

create index if not exists idx_sessions_account on public.business_sessions(account_id);
create index if not exists idx_sessions_expires on public.business_sessions(expires_at);

-- 4. TABLA: PARTICIPACIONES (RESERVAS Y COMPRAS)
create table if not exists public.participations (
  id text primary key,
  draw_id text not null references public.draws(id) on delete cascade,
  buyer_name text not null,
  buyer_email text not null,
  ticket_count integer not null,
  ticket_numbers text not null,
  total_amount integer not null,
  status text not null check (status in ('reserved', 'expired', 'sold', 'paid')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone not null
);

create index if not exists idx_participations_draw on public.participations(draw_id);
create index if not exists idx_participations_buyer on public.participations(buyer_email, status);

-- 5. TABLA: TIQUETES Y BALOTAS
create table if not exists public.tickets (
  draw_id text not null references public.draws(id) on delete cascade,
  number integer not null,
  status text not null check (status in ('available', 'reserved', 'sold')),
  participation_id text references public.participations(id) on delete set null,
  hold_until timestamp with time zone,
  primary key (draw_id, number)
);

create index if not exists idx_tickets_draw_status on public.tickets(draw_id, status, number);
create index if not exists idx_tickets_participation on public.tickets(participation_id);

-- 6. TABLA: PAGOS DE PLANES (WOMPI)
create table if not exists public.plan_payments (
  id text primary key,
  account_id text not null references public.business_accounts(id) on delete cascade,
  plan_id text not null,
  reference text not null unique,
  wompi_transaction_id text unique,
  amount_in_cents integer not null,
  currency text not null default 'COP',
  status text not null default 'PENDING',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_plan_payments_reference on public.plan_payments(reference);
create index if not exists idx_plan_payments_account on public.plan_payments(account_id);

-- 7. TABLA: HISTORIAL DE EVENTOS DE PAGO
create table if not exists public.payment_events (
  id text primary key,
  account_id text not null,
  event_type text not null,
  description text not null,
  amount integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_payment_events_account on public.payment_events(account_id, created_at desc);

-- 8. TABLA: CERTIFICADOS CRIPTOGRÁFICOS DE SORTEO (SHA-256)
create table if not exists public.public_certificates (
  draw_id text primary key,
  payload_json text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. TABLA: HISTORIAS (STORIES 24H)
create table if not exists public.business_stories (
  id text primary key,
  account_id text not null references public.business_accounts(id) on delete cascade,
  media_url text not null,
  media_type text not null default 'image',
  caption text not null default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone not null,
  views_count integer not null default 0
);

create index if not exists idx_stories_expiry on public.business_stories(account_id, expires_at);

-- 10. TABLA: NOVEDADES Y NOTICIAS
create table if not exists public.business_news (
  id text primary key,
  account_id text not null references public.business_accounts(id) on delete cascade,
  content text not null,
  image_url text not null default '',
  images_json text not null default '[]',
  ticket_price integer default 25000,
  ticket_count integer default 100,
  mechanic text default 'balotera',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_news_created on public.business_news(account_id, created_at desc);

-- 11. BUCKET DE SUPABASE STORAGE PARA MULTIMEDIA
insert into storage.buckets (id, name, public)
values ('elganador-storage', 'elganador-storage', true)
on conflict (id) do update set public = true;

-- Políticas de Acceso Público para Storage
drop policy if exists "Archivos públicos en elganador-storage" on storage.objects;
create policy "Archivos públicos en elganador-storage"
on storage.objects for select
using (bucket_id = 'elganador-storage');

drop policy if exists "Carga permitida en elganador-storage" on storage.objects;
create policy "Carga permitida en elganador-storage"
on storage.objects for insert
with check (bucket_id = 'elganador-storage');

-- ============================================================================
-- FIN DEL ESQUEMA MAESTRO
-- ============================================================================
