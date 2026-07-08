-- Operação do corretor: imóveis, leads, histórico de leads e atividades.
-- Tudo owner-only (RLS por auth.uid() = broker_id). Aplicar via scripts/db-push.mjs.

-- ---------------------------------------------------------------------------
-- Helper: manter updated_at em dia
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Indicações: quem indicou este corretor (usado na tela Indicações)
-- ---------------------------------------------------------------------------
alter table public.broker_profiles
  add column if not exists referred_by uuid references auth.users(id) on delete set null;

-- ---------------------------------------------------------------------------
-- Imóveis
-- ---------------------------------------------------------------------------
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  endereco text,
  bairro text,
  cidade text,
  valor numeric not null default 0,
  quartos int not null default 0,
  suites int not null default 0,
  vagas int not null default 0,
  area numeric not null default 0,
  descricao text,
  destaque boolean not null default false,
  marketplace boolean not null default false,
  foto text,
  status text not null default 'Ativo'
    check (status in ('Ativo','Em negociação','Vendido','Inativo','Excluído')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists properties_broker_idx on public.properties(broker_id);

alter table public.properties enable row level security;
create policy "properties_select_own" on public.properties
  for select using (auth.uid() = broker_id);
create policy "properties_insert_own" on public.properties
  for insert with check (auth.uid() = broker_id);
create policy "properties_update_own" on public.properties
  for update using (auth.uid() = broker_id) with check (auth.uid() = broker_id);
create policy "properties_delete_own" on public.properties
  for delete using (auth.uid() = broker_id);

create trigger properties_set_updated_at before update on public.properties
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Leads
-- ---------------------------------------------------------------------------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  email text,
  telefone text,
  origem text not null default 'Outro'
    check (origem in ('Instagram','WhatsApp','Marketplace','Indicação','Outro')),
  origem_detalhe text,
  interesse text,
  status text not null default 'Novo'
    check (status in ('Novo','Qualificado','Visita','Proposta','Fechado','Perdido')),
  orcamento numeric not null default 0,
  motivo_perda text,
  last_interaction_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists leads_broker_idx on public.leads(broker_id);

alter table public.leads enable row level security;
create policy "leads_select_own" on public.leads
  for select using (auth.uid() = broker_id);
create policy "leads_insert_own" on public.leads
  for insert with check (auth.uid() = broker_id);
create policy "leads_update_own" on public.leads
  for update using (auth.uid() = broker_id) with check (auth.uid() = broker_id);
create policy "leads_delete_own" on public.leads
  for delete using (auth.uid() = broker_id);

create trigger leads_set_updated_at before update on public.leads
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Histórico / interações do lead
-- ---------------------------------------------------------------------------
create table if not exists public.lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  broker_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null,
  texto text,
  created_at timestamptz not null default now()
);
create index if not exists lead_events_lead_idx on public.lead_events(lead_id, created_at desc);

alter table public.lead_events enable row level security;
create policy "lead_events_select_own" on public.lead_events
  for select using (auth.uid() = broker_id);
create policy "lead_events_insert_own" on public.lead_events
  for insert with check (auth.uid() = broker_id);
create policy "lead_events_delete_own" on public.lead_events
  for delete using (auth.uid() = broker_id);

-- ---------------------------------------------------------------------------
-- Atividades / agenda
-- ---------------------------------------------------------------------------
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  tipo text not null default 'Follow-up'
    check (tipo in ('Ligação','Visita','Follow-up','E-mail','Reunião')),
  cliente text,
  imovel text,
  nota text,
  scheduled_at timestamptz not null default now(),
  done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists activities_broker_idx on public.activities(broker_id, scheduled_at);

alter table public.activities enable row level security;
create policy "activities_select_own" on public.activities
  for select using (auth.uid() = broker_id);
create policy "activities_insert_own" on public.activities
  for insert with check (auth.uid() = broker_id);
create policy "activities_update_own" on public.activities
  for update using (auth.uid() = broker_id) with check (auth.uid() = broker_id);
create policy "activities_delete_own" on public.activities
  for delete using (auth.uid() = broker_id);

create trigger activities_set_updated_at before update on public.activities
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Diretório de corretores (tela Parcerias): expõe só colunas públicas de
-- outros corretores, sem PII (telefone/e-mail). security_invoker=off para
-- poder ler além das linhas próprias, mas restringe colunas na definição.
-- ---------------------------------------------------------------------------
create or replace view public.broker_directory
with (security_invoker = off) as
  select
    id, full_name, avatar_url, bio, regions,
    property_types, specialties, ticket_range, plan, referral_slug
  from public.broker_profiles;

grant select on public.broker_directory to authenticated;
