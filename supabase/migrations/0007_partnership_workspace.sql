-- Workspace real da parceria: inventário compartilhado e chat persistido.

create table if not exists public.partnership_messages (
  id uuid primary key default gen_random_uuid(),
  partnership_id uuid not null references public.partnership_requests(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists partnership_messages_request_idx
  on public.partnership_messages(partnership_id, created_at);

alter table public.partnership_messages enable row level security;

create policy "partnership_messages_select_participant"
  on public.partnership_messages for select
  using (
    exists (
      select 1 from public.partnership_requests request
      where request.id = partnership_id
        and request.status = 'accepted'
        and auth.uid() in (request.sender_id, request.receiver_id)
    )
  );

create policy "partnership_messages_insert_participant"
  on public.partnership_messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.partnership_requests request
      where request.id = partnership_id
        and request.status = 'accepted'
        and auth.uid() in (request.sender_id, request.receiver_id)
    )
  );

create or replace function public.list_partnership_properties(request_id uuid)
returns setof public.properties
language sql
security definer
stable
set search_path = public
as $$
  select property.*
  from public.properties property
  join public.partnership_requests request on request.id = request_id
  where request.status = 'accepted'
    and auth.uid() in (request.sender_id, request.receiver_id)
    and property.broker_id in (request.sender_id, request.receiver_id)
    and property.status not in ('Excluído', 'Inativo')
  order by property.created_at desc;
$$;

revoke all on function public.list_partnership_properties(uuid) from public;
grant execute on function public.list_partnership_properties(uuid) to authenticated;

alter publication supabase_realtime add table public.partnership_messages;
