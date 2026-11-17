-- 1. Tabla de Comercios y Planes B2B
create table if not exists public.merchants (
  id uuid default gen_random_uuid() primary key,
  business_name text not null,
  nit text unique not null,
  plan_type text check (plan_type in ('emprendedor', 'pro', 'enterprise')) default 'emprendedor',
  subscription_status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabla de Rifas con Cobertura Legal, Radicados y Ciudad
create table if not exists public.raffles (
  id uuid default gen_random_uuid() primary key,
  merchant_id uuid references public.merchants(id) on delete cascade,
  title text not null,
  description text,
  prize_value numeric not null,
  ticket_price numeric not null,
  total_tickets integer not null,
  coverage_type text check (coverage_type in ('local', 'nacional')) not null,
  city text not null,
  radicado_number text not null,
  resolution_pdf_url text not null,
  payment_receipt_url text not null,
  draw_date timestamp with time zone not null,
  status text default 'pending_approval' check (status in ('pending_approval', 'active', 'completed', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabla de Tiquetes con SHA-256
create table if not exists public.tickets (
  id uuid default gen_random_uuid() primary key,
  raffle_id uuid references public.raffles(id) on delete cascade,
  buyer_email text not null,
  buyer_phone text not null,
  ticket_number integer not null,
  sha256_hash text unique not null,
  payment_status text default 'pending' check (payment_status in ('pending', 'paid', 'refunded')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.merchants enable row level security;
alter table public.raffles enable row level security;
alter table public.tickets enable row level security;

-- Políticas de Seguridad RLS
drop policy if exists "Comerciantes ven su propio perfil" on public.merchants;
create policy "Comerciantes ven su propio perfil" on public.merchants
  for all using (auth.uid() = id);

drop policy if exists "Cualquier usuario puede ver rifas activas" on public.raffles;
create policy "Cualquier usuario puede ver rifas activas" on public.raffles
  for select using (status = 'active' or status = 'pending_approval');

drop policy if exists "Comerciantes gestionan sus propias rifas" on public.raffles;
create policy "Comerciantes gestionan sus propias rifas" on public.raffles
  for all using (auth.uid() = merchant_id);

drop policy if exists "Compradores ven sus propios tiquetes" on public.tickets;
create policy "Compradores ven sus propios tiquetes" on public.tickets
  for select using (auth.email() = buyer_email);

-- Índices de alto rendimiento para búsqueda y validación notarial
create index if not exists idx_raffles_merchant_id on public.raffles(merchant_id);
create index if not exists idx_raffles_status on public.raffles(status);
create index if not exists idx_tickets_raffle_id on public.tickets(raffle_id);
create index if not exists idx_tickets_sha256 on public.tickets(sha256_hash);
create index if not exists idx_tickets_buyer on public.tickets(buyer_phone, buyer_email);
