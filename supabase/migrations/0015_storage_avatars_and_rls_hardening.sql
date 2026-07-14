-- Codifica no repositório as políticas do bucket de avatars (criadas antes só
-- pelo dashboard) e aplica FORCE RLS como defesa em profundidade nas tabelas
-- com PII que nenhuma função DEFINER precisa ler.

-- Avatars: leitura pública (foto de perfil é pública por design);
-- escrita restrita à pasta do próprio usuário.
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

-- FORCE RLS apenas onde nenhuma função SECURITY DEFINER (dono postgres, sem
-- BYPASSRLS no Supabase) precisa fazer SELECT: o trigger
-- private.sync_broker_public_profile lê apenas a row do trigger (NEW), não
-- consulta broker_profiles. properties e partnership_requests ficam de fora —
-- são lidas por get_partnership_property, list_shared_inventory,
-- property_media_visible e property_open_for_partnership.
alter table public.broker_profiles force row level security;
alter table public.leads force row level security;
alter table public.lead_events force row level security;
alter table public.activities force row level security;
