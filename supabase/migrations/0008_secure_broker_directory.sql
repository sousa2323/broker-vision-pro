-- Separa os dados públicos do perfil privado e faz a view do diretório
-- respeitar o RLS do usuário que a consulta.

-- ---------------------------------------------------------------------------
-- Perfil público: somente os campos necessários para diretório e parcerias.
-- A escrita é feita pelo trigger abaixo a partir de broker_profiles.
-- ---------------------------------------------------------------------------
create table public.broker_public_profiles (
  id uuid primary key references public.broker_profiles(id) on delete cascade,
  full_name text not null,
  avatar_url text,
  bio text,
  regions text[] not null default '{}',
  property_types text[] not null default '{}',
  specialties text[] not null default '{}',
  ticket_range text,
  plan text not null default 'Free' check (plan in ('Free', 'Pro')),
  referral_slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.broker_public_profiles enable row level security;

create policy "broker_public_profiles_select_authenticated"
  on public.broker_public_profiles for select
  to authenticated
  using (true);

revoke all on public.broker_public_profiles from anon;
grant select on public.broker_public_profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Indicações: a relação deixa de ficar exposta no diretório inteiro.
-- Somente o corretor que indicou consegue consultar seus indicados.
-- ---------------------------------------------------------------------------
create table public.broker_referrals (
  referred_id uuid primary key
    constraint broker_referrals_referred_id_fkey
    references public.broker_public_profiles(id) on delete cascade,
  referrer_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (referred_id <> referrer_id)
);

create index broker_referrals_referrer_idx
  on public.broker_referrals(referrer_id, created_at desc);

alter table public.broker_referrals enable row level security;

create policy "broker_referrals_select_referrer"
  on public.broker_referrals for select
  to authenticated
  using ((select auth.uid()) = referrer_id);

revoke all on public.broker_referrals from anon;
grant select on public.broker_referrals to authenticated;

-- ---------------------------------------------------------------------------
-- Backfill antes de trocar a view, para não haver janela sem dados.
-- ---------------------------------------------------------------------------
insert into public.broker_public_profiles (
  id,
  full_name,
  avatar_url,
  bio,
  regions,
  property_types,
  specialties,
  ticket_range,
  plan,
  referral_slug,
  created_at,
  updated_at
)
select
  id,
  full_name,
  avatar_url,
  bio,
  coalesce(regions, '{}'),
  coalesce(property_types, '{}'),
  coalesce(specialties, '{}'),
  ticket_range,
  plan,
  referral_slug,
  coalesce(created_at, now()),
  coalesce(updated_at, now())
from public.broker_profiles;

insert into public.broker_referrals (referred_id, referrer_id)
select profile.id, profile.referred_by
from public.broker_profiles profile
where profile.referred_by is not null
  and profile.referred_by <> profile.id;

-- ---------------------------------------------------------------------------
-- Sincronização transacional: cadastro e edição continuam escrevendo apenas
-- em broker_profiles; a cópia pública e a indicação acompanham automaticamente.
-- A função fica em schema não exposto e usa nomes totalmente qualificados.
-- ---------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create function private.sync_broker_public_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.broker_public_profiles (
    id,
    full_name,
    avatar_url,
    bio,
    regions,
    property_types,
    specialties,
    ticket_range,
    plan,
    referral_slug,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.full_name,
    new.avatar_url,
    new.bio,
    coalesce(new.regions, '{}'),
    coalesce(new.property_types, '{}'),
    coalesce(new.specialties, '{}'),
    new.ticket_range,
    new.plan,
    new.referral_slug,
    coalesce(new.created_at, now()),
    coalesce(new.updated_at, now())
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    bio = excluded.bio,
    regions = excluded.regions,
    property_types = excluded.property_types,
    specialties = excluded.specialties,
    ticket_range = excluded.ticket_range,
    plan = excluded.plan,
    referral_slug = excluded.referral_slug,
    updated_at = excluded.updated_at;

  if new.referred_by is null or new.referred_by = new.id then
    delete from public.broker_referrals
    where referred_id = new.id;
  else
    insert into public.broker_referrals (referred_id, referrer_id)
    values (new.id, new.referred_by)
    on conflict (referred_id) do update set
      referrer_id = excluded.referrer_id;
  end if;

  return new;
end;
$$;

revoke all on function private.sync_broker_public_profile()
  from public, anon, authenticated;

create trigger broker_profiles_sync_public
  after insert or update on public.broker_profiles
  for each row execute function private.sync_broker_public_profile();

-- ---------------------------------------------------------------------------
-- Mantém o contrato usado pelo frontend, agora sem bypass de RLS e sem expor
-- referred_by. O acesso à tabela-base também é limitado aos autenticados.
-- ---------------------------------------------------------------------------
drop view public.broker_directory;

create view public.broker_directory
with (security_invoker = true) as
  select
    id,
    full_name,
    avatar_url,
    bio,
    regions,
    property_types,
    specialties,
    ticket_range,
    plan,
    referral_slug
  from public.broker_public_profiles;

revoke all on public.broker_directory from public, anon;
grant select on public.broker_directory to authenticated;
