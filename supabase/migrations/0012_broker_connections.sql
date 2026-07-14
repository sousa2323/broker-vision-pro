-- Conexões entre corretores: vínculo de rede ("seguidor" com aceite).
-- Não compartilha nenhum dado — apenas registra a relação para "Minha rede".

create table if not exists public.broker_connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  target_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (char_length(trim(message)) > 0),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> target_id)
);

create index if not exists broker_connections_requester_idx
  on public.broker_connections(requester_id, created_at desc);
create index if not exists broker_connections_target_idx
  on public.broker_connections(target_id, status, created_at desc);
create unique index if not exists broker_connections_active_pair_idx
  on public.broker_connections(requester_id, target_id) where status <> 'declined';

alter table public.broker_connections enable row level security;

create policy "broker_connections_select_participant"
  on public.broker_connections for select
  using ((select auth.uid()) in (requester_id, target_id));

create policy "broker_connections_insert_requester"
  on public.broker_connections for insert
  with check (
    (select auth.uid()) = requester_id
    and requester_id <> target_id
    and status = 'pending'
  );

-- Sem update/delete: resposta apenas via RPC abaixo.

create trigger broker_connections_set_updated_at
  before update on public.broker_connections
  for each row execute function public.set_updated_at();

create or replace function public.respond_to_connection_request(request_id uuid, response text)
returns public.broker_connections
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.broker_connections;
begin
  if response not in ('accepted', 'declined') then
    raise exception 'Resposta inválida';
  end if;

  update public.broker_connections
     set status = response,
         responded_at = now()
   where id = request_id
     and target_id = auth.uid()
     and status = 'pending'
  returning * into result;

  if result.id is null then
    raise exception 'Solicitação não encontrada ou já respondida';
  end if;

  return result;
end;
$$;

revoke all on function public.respond_to_connection_request(uuid, text) from public;
grant execute on function public.respond_to_connection_request(uuid, text) to authenticated;

alter publication supabase_realtime add table public.broker_connections;
