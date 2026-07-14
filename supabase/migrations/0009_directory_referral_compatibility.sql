-- Compatibilidade transitória para versões anteriores do frontend, que ainda
-- filtram referred_by em broker_directory. O RLS de broker_referrals garante
-- que cada usuário veja essa relação somente para os seus próprios indicados.

create or replace view public.broker_directory
with (security_invoker = true) as
  select
    profile.id,
    profile.full_name,
    profile.avatar_url,
    profile.bio,
    profile.regions,
    profile.property_types,
    profile.specialties,
    profile.ticket_range,
    profile.plan,
    profile.referral_slug,
    referral.referrer_id as referred_by
  from public.broker_public_profiles profile
  left join public.broker_referrals referral
    on referral.referred_id = profile.id;

revoke all on public.broker_directory from public, anon;
grant select on public.broker_directory to authenticated;
