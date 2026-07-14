-- Otimiza as políticas RLS para calcular auth.uid() uma vez por comando
-- e adiciona índices às chaves estrangeiras apontadas pelo Performance Advisor.

-- ---------------------------------------------------------------------------
-- Perfis
-- ---------------------------------------------------------------------------
alter policy "broker_profiles_select_own"
  on public.broker_profiles
  using ((select auth.uid()) = id);

alter policy "broker_profiles_insert_own"
  on public.broker_profiles
  with check ((select auth.uid()) = id);

alter policy "broker_profiles_update_own"
  on public.broker_profiles
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ---------------------------------------------------------------------------
-- Imóveis
-- ---------------------------------------------------------------------------
alter policy "properties_select_own"
  on public.properties
  using ((select auth.uid()) = broker_id);

alter policy "properties_insert_own"
  on public.properties
  with check ((select auth.uid()) = broker_id);

alter policy "properties_update_own"
  on public.properties
  using ((select auth.uid()) = broker_id)
  with check ((select auth.uid()) = broker_id);

alter policy "properties_delete_own"
  on public.properties
  using ((select auth.uid()) = broker_id);

-- ---------------------------------------------------------------------------
-- Leads
-- ---------------------------------------------------------------------------
alter policy "leads_select_own"
  on public.leads
  using ((select auth.uid()) = broker_id);

alter policy "leads_insert_own"
  on public.leads
  with check ((select auth.uid()) = broker_id);

alter policy "leads_update_own"
  on public.leads
  using ((select auth.uid()) = broker_id)
  with check ((select auth.uid()) = broker_id);

alter policy "leads_delete_own"
  on public.leads
  using ((select auth.uid()) = broker_id);

-- ---------------------------------------------------------------------------
-- Histórico de leads
-- ---------------------------------------------------------------------------
alter policy "lead_events_select_own"
  on public.lead_events
  using ((select auth.uid()) = broker_id);

alter policy "lead_events_insert_own"
  on public.lead_events
  with check ((select auth.uid()) = broker_id);

alter policy "lead_events_delete_own"
  on public.lead_events
  using ((select auth.uid()) = broker_id);

-- ---------------------------------------------------------------------------
-- Atividades
-- ---------------------------------------------------------------------------
alter policy "activities_select_own"
  on public.activities
  using ((select auth.uid()) = broker_id);

alter policy "activities_insert_own"
  on public.activities
  with check ((select auth.uid()) = broker_id);

alter policy "activities_update_own"
  on public.activities
  using ((select auth.uid()) = broker_id)
  with check ((select auth.uid()) = broker_id);

alter policy "activities_delete_own"
  on public.activities
  using ((select auth.uid()) = broker_id);

-- ---------------------------------------------------------------------------
-- Solicitações de parceria
-- ---------------------------------------------------------------------------
alter policy "partnership_requests_select_participant"
  on public.partnership_requests
  using (
    (select auth.uid()) = sender_id
    or (select auth.uid()) = receiver_id
  );

alter policy "partnership_requests_insert_sender"
  on public.partnership_requests
  with check (
    (select auth.uid()) = sender_id
    and sender_id <> receiver_id
    and status = 'pending'
  );

-- ---------------------------------------------------------------------------
-- Mensagens de parceria
-- ---------------------------------------------------------------------------
alter policy "partnership_messages_select_participant"
  on public.partnership_messages
  using (
    exists (
      select 1
      from public.partnership_requests request
      where request.id = partnership_id
        and request.status = 'accepted'
        and (select auth.uid()) in (request.sender_id, request.receiver_id)
    )
  );

alter policy "partnership_messages_insert_participant"
  on public.partnership_messages
  with check (
    (select auth.uid()) = sender_id
    and exists (
      select 1
      from public.partnership_requests request
      where request.id = partnership_id
        and request.status = 'accepted'
        and (select auth.uid()) in (request.sender_id, request.receiver_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Índices das chaves estrangeiras
-- ---------------------------------------------------------------------------
create index if not exists activities_lead_id_idx
  on public.activities(lead_id);

create index if not exists activities_property_id_idx
  on public.activities(property_id);

create index if not exists broker_profiles_referred_by_idx
  on public.broker_profiles(referred_by);

create index if not exists lead_events_broker_id_idx
  on public.lead_events(broker_id);

create index if not exists partnership_messages_sender_id_idx
  on public.partnership_messages(sender_id);
