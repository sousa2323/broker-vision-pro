-- Solicitações de parceria entre corretores, com resposta restrita ao destinatário.

create table if not exists public.partnership_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (char_length(trim(message)) > 0),
  partnership_type text not null default 'comissao'
    check (partnership_type in ('comissao','captacao','indicacao','covisita','oportunidades','networking')),
  notes text,
  status text not null default 'pending'
    check (status in ('pending','accepted','declined')),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (sender_id <> receiver_id)
);

create index if not exists partnership_requests_sender_idx
  on public.partnership_requests(sender_id, created_at desc);
create index if not exists partnership_requests_receiver_idx
  on public.partnership_requests(receiver_id, status, created_at desc);
create unique index if not exists partnership_requests_pending_pair_idx
  on public.partnership_requests(sender_id, receiver_id)
  where status = 'pending';

alter table public.partnership_requests enable row level security;

create policy "partnership_requests_select_participant"
  on public.partnership_requests for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "partnership_requests_insert_sender"
  on public.partnership_requests for insert
  with check (auth.uid() = sender_id and sender_id <> receiver_id and status = 'pending');

create trigger partnership_requests_set_updated_at
  before update on public.partnership_requests
  for each row execute function public.set_updated_at();

create or replace function public.respond_to_partnership_request(
  request_id uuid,
  response text
)
returns public.partnership_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.partnership_requests;
begin
  if response not in ('accepted', 'declined') then
    raise exception 'Resposta inválida';
  end if;

  update public.partnership_requests
     set status = response,
         responded_at = now()
   where id = request_id
     and receiver_id = auth.uid()
     and status = 'pending'
  returning * into result;

  if result.id is null then
    raise exception 'Solicitação não encontrada ou já respondida';
  end if;

  return result;
end;
$$;

revoke all on function public.respond_to_partnership_request(uuid, text) from public;
grant execute on function public.respond_to_partnership_request(uuid, text) to authenticated;

alter publication supabase_realtime add table public.partnership_requests;
