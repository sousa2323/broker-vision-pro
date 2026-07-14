-- Leitura do chat de parceria: marca d'água de última leitura por usuário
-- e listagem de conversas (última mensagem + não lidas) em uma chamada.

create table if not exists public.partnership_chat_reads (
  partnership_id uuid not null references public.partnership_requests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (partnership_id, user_id)
);

create index if not exists partnership_chat_reads_user_id_idx
  on public.partnership_chat_reads(user_id);

alter table public.partnership_chat_reads enable row level security;

create policy "partnership_chat_reads_select_own"
  on public.partnership_chat_reads for select
  using ((select auth.uid()) = user_id);

create policy "partnership_chat_reads_insert_own"
  on public.partnership_chat_reads for insert
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.partnership_requests request
      where request.id = partnership_id
        and request.status = 'accepted'
        and (select auth.uid()) in (request.sender_id, request.receiver_id)
    )
  );

create policy "partnership_chat_reads_update_own"
  on public.partnership_chat_reads for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Upsert com relógio do servidor (evita skew do cliente).
create or replace function public.mark_partnership_read(p_partnership_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.partnership_chat_reads (partnership_id, user_id, last_read_at)
  select p_partnership_id, auth.uid(), now()
  where exists (
    select 1 from public.partnership_requests request
    where request.id = p_partnership_id
      and request.status = 'accepted'
      and auth.uid() in (request.sender_id, request.receiver_id)
  )
  on conflict (partnership_id, user_id) do update set last_read_at = now();
$$;

revoke all on function public.mark_partnership_read(uuid) from public;
grant execute on function public.mark_partnership_read(uuid) to authenticated;

-- Conversas do usuário: parceiro, última mensagem e contagem de não lidas.
-- security invoker: RLS de requests/messages/reads se aplica normalmente.
create or replace function public.list_partnership_conversations()
returns table (
  partnership_id uuid,
  partner_id uuid,
  last_message_body text,
  last_message_at timestamptz,
  last_message_sender_id uuid,
  unread_count bigint
)
language sql
stable
set search_path = public
as $$
  select
    request.id,
    case
      when request.sender_id = (select auth.uid()) then request.receiver_id
      else request.sender_id
    end,
    last_message.body,
    last_message.created_at,
    last_message.sender_id,
    coalesce(unread.total, 0)
  from public.partnership_requests request
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
      and message.sender_id <> (select auth.uid())
      and message.created_at > coalesce(
        (
          select chat_read.last_read_at
          from public.partnership_chat_reads chat_read
          where chat_read.partnership_id = request.id
            and chat_read.user_id = (select auth.uid())
        ),
        'epoch'::timestamptz
      )
  ) unread on true
  where request.status = 'accepted'
    and (select auth.uid()) in (request.sender_id, request.receiver_id)
  order by coalesce(last_message.created_at, request.updated_at) desc;
$$;

grant execute on function public.list_partnership_conversations() to authenticated;

alter publication supabase_realtime add table public.partnership_chat_reads;
