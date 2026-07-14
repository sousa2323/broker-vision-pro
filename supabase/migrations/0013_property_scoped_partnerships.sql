-- Parceria escopada a um imóvel: a solicitação passa a referenciar um imóvel
-- específico do receiver, e o compartilhamento se limita a ele. Corrige o
-- over-share do modelo anterior (list_partnership_properties expunha o
-- portfólio inteiro dos dois corretores) e adiciona caminho de encerramento.

-- 1) Flag de compartilhamento para parcerias (separada de marketplace).
alter table public.properties
  add column if not exists partnership_shared boolean not null default false;

-- 2) Limpa dados de teste do modelo antigo (permite property_id NOT NULL).
delete from public.partnership_messages;
delete from public.partnership_chat_reads;
delete from public.partnership_requests;

-- 3) Escopo por imóvel.
alter table public.partnership_requests
  add column property_id uuid not null references public.properties(id) on delete cascade;

create index if not exists partnership_requests_property_idx
  on public.partnership_requests(property_id);

drop index if exists partnership_requests_pending_pair_idx;
create unique index if not exists partnership_requests_pending_pair_property_idx
  on public.partnership_requests(sender_id, receiver_id, property_id)
  where status = 'pending';

-- 4) Status 'ended' (encerramento de parceria aceita).
alter table public.partnership_requests drop constraint partnership_requests_status_check;
alter table public.partnership_requests add constraint partnership_requests_status_check
  check (status in ('pending', 'accepted', 'declined', 'ended'));

-- 5) Helper DEFINER: o imóvel pertence ao receiver e está aberto a parcerias.
--    Precisa ser DEFINER porque a RLS own-only de properties impediria o
--    remetente de enxergar o imóvel numa subquery de policy.
create or replace function public.property_open_for_partnership(p_property_id uuid, p_receiver_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.properties property
    where property.id = p_property_id
      and property.broker_id = p_receiver_id
      and property.partnership_shared
      and property.status = 'Ativo'
  );
$$;

revoke all on function public.property_open_for_partnership(uuid, uuid) from public;
grant execute on function public.property_open_for_partnership(uuid, uuid) to authenticated;

drop policy "partnership_requests_insert_sender" on public.partnership_requests;
create policy "partnership_requests_insert_sender"
  on public.partnership_requests for insert
  with check (
    (select auth.uid()) = sender_id
    and sender_id <> receiver_id
    and status = 'pending'
    and public.property_open_for_partnership(property_id, receiver_id)
  );

-- 6) Encerramento: accepted -> ended, por qualquer participante. As políticas
--    de partnership_messages/chat_reads exigem status = 'accepted', então o
--    encerramento revoga o chat automaticamente.
create or replace function public.end_partnership(request_id uuid)
returns public.partnership_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.partnership_requests;
begin
  update public.partnership_requests
     set status = 'ended'
   where id = request_id
     and status = 'accepted'
     and auth.uid() in (sender_id, receiver_id)
  returning * into result;

  if result.id is null then
    raise exception 'Parceria não encontrada ou não está ativa';
  end if;

  return result;
end;
$$;

revoke all on function public.end_partnership(uuid) from public;
grant execute on function public.end_partnership(uuid) to authenticated;

-- 7) Mata o over-share: apenas o imóvel da parceria, para participantes.
drop function if exists public.list_partnership_properties(uuid);

create or replace function public.get_partnership_property(request_id uuid)
returns setof public.properties
language sql
stable
security definer
set search_path = public
as $$
  select property.*
  from public.properties property
  join public.partnership_requests request on request.property_id = property.id
  where request.id = request_id
    and request.status = 'accepted'
    and auth.uid() in (request.sender_id, request.receiver_id);
$$;

revoke all on function public.get_partnership_property(uuid) from public;
grant execute on function public.get_partnership_property(uuid) to authenticated;

-- 8) Catálogo compartilhado: SOMENTE campos limitados (sem endereço completo),
--    de imóveis com a flag ligada e ativos, excluindo os do próprio caller.
create or replace function public.list_shared_inventory(p_broker_id uuid default null)
returns table (
  id uuid,
  broker_id uuid,
  nome text,
  bairro text,
  cidade text,
  descricao text,
  valor numeric,
  foto text,
  fotos text[]
)
language sql
stable
security definer
set search_path = public
as $$
  select property.id, property.broker_id, property.nome, property.bairro,
         property.cidade, property.descricao, property.valor, property.foto, property.fotos
  from public.properties property
  where auth.uid() is not null
    and property.partnership_shared
    and property.status = 'Ativo'
    and property.broker_id <> auth.uid()
    and (p_broker_id is null or property.broker_id = p_broker_id)
  order by property.created_at desc;
$$;

revoke all on function public.list_shared_inventory(uuid) from public;
grant execute on function public.list_shared_inventory(uuid) to authenticated;

-- 9) Conversas ganham o imóvel. Vira DEFINER porque o parceiro não-dono não
--    enxerga a linha de properties sob a RLS own-only; o filtro de
--    participante/accepted continua explícito no corpo.
drop function if exists public.list_partnership_conversations();

create or replace function public.list_partnership_conversations()
returns table (
  partnership_id uuid,
  partner_id uuid,
  property_id uuid,
  property_nome text,
  last_message_body text,
  last_message_at timestamptz,
  last_message_sender_id uuid,
  unread_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    request.id,
    case
      when request.sender_id = auth.uid() then request.receiver_id
      else request.sender_id
    end,
    request.property_id,
    property.nome,
    last_message.body,
    last_message.created_at,
    last_message.sender_id,
    coalesce(unread.total, 0)
  from public.partnership_requests request
  join public.properties property on property.id = request.property_id
  left join lateral (
    select message.body, message.created_at, message.sender_id
    from public.partnership_messages message
    where message.partnership_id = request.id
    order by message.created_at desc
    limit 1
  ) last_message on true
  left join lateral (
    select count(*) as total
    from public.partnership_messages message
    where message.partnership_id = request.id
      and message.sender_id <> auth.uid()
      and message.created_at > coalesce(
        (
          select chat_read.last_read_at
          from public.partnership_chat_reads chat_read
          where chat_read.partnership_id = request.id
            and chat_read.user_id = auth.uid()
        ),
        'epoch'::timestamptz
      )
  ) unread on true
  where request.status = 'accepted'
    and auth.uid() in (request.sender_id, request.receiver_id)
  order by coalesce(last_message.created_at, request.updated_at) desc;
$$;

revoke all on function public.list_partnership_conversations() from public;
grant execute on function public.list_partnership_conversations() to authenticated;
