-- Perfil profissional do corretor (1:1 com auth.users)
-- Aplicar via Supabase Dashboard > SQL Editor (ou supabase db push)

create table public.broker_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  creci text not null,
  avatar_url text,
  bio text,
  regions text[] default '{}',
  property_types text[] default '{}',
  specialties text[] default '{}',
  ticket_range text,
  channels jsonb default '{"whatsapp":false,"instagram":false,"email":false}',
  availability text,
  lead_limit int,
  plan text not null default 'Free' check (plan in ('Free','Pro')),
  terms_accepted_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.broker_profiles enable row level security;

create policy "broker_profiles_select_own"
  on public.broker_profiles for select
  using (auth.uid() = id);

create policy "broker_profiles_insert_own"
  on public.broker_profiles for insert
  with check (auth.uid() = id);

create policy "broker_profiles_update_own"
  on public.broker_profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
