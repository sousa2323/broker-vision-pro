-- Mídia do imóvel: galeria de fotos (ordenada, fotos[1] = capa) + 1 vídeo.
-- Aplicar via scripts/db-push.mjs.

-- ---------------------------------------------------------------------------
-- Colunas na tabela properties
-- ---------------------------------------------------------------------------
alter table public.properties
  add column if not exists fotos text[] not null default '{}',
  add column if not exists video text;

-- Backfill: promove a foto única existente para o array (como capa)
update public.properties
  set fotos = array[foto]
  where foto is not null and fotos = '{}';

-- ---------------------------------------------------------------------------
-- Bucket de mídia (público para leitura; escrita restrita à pasta do dono)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-media',
  'property-media',
  true,
  52428800, -- 50 MB (acomoda vídeo)
  array['image/jpeg','image/png','image/webp','video/mp4','video/quicktime','video/webm']
)
on conflict (id) do nothing;

-- Policies espelhando o bucket avatars: leitura pública, escrita só na
-- pasta cujo primeiro segmento é o uid do usuário ({userId}/...).
create policy "property_media_public_read"
  on storage.objects for select
  using (bucket_id = 'property-media');

create policy "property_media_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'property-media'
    and (auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "property_media_update_own"
  on storage.objects for update
  using (
    bucket_id = 'property-media'
    and (auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "property_media_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'property-media'
    and (auth.uid())::text = (storage.foldername(name))[1]
  );
