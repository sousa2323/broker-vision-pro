-- Slug de indicação (link ubroker.com.br/r/{slug}) + perfis de cliente do Perfil
-- Unicidade via índice único: RLS é owner-only, então o client não consegue
-- checar slugs de outros corretores — colisões são tratadas com retry no 23505.

alter table public.broker_profiles
  add column referral_slug text,
  add column client_profiles text[] default '{}';

create unique index broker_profiles_referral_slug_idx
  on public.broker_profiles (referral_slug);
