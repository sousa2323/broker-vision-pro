-- Expõe referred_by no diretório para a tela de Indicações poder listar
-- os corretores indicados pelo corretor logado (não é PII).
create or replace view public.broker_directory
with (security_invoker = off) as
  select
    id, full_name, avatar_url, bio, regions,
    property_types, specialties, ticket_range, plan, referral_slug, referred_by
  from public.broker_profiles;

grant select on public.broker_directory to authenticated;
