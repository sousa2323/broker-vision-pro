-- Endurece o storage de mídia de imóveis: bucket privado, leitura restrita ao
-- dono ou a imóveis compartilhados/em parceria, exibição via signed URLs.
-- O banco passa a armazenar PATHS (não URLs públicas) em foto/fotos/video.

-- 1) Converte URLs públicas armazenadas em paths (idempotente; preserva a
--    ordem da galeria — fotos[1] é a capa).
update public.properties set
  foto = nullif(
    regexp_replace(coalesce(foto, ''), '^https?://[^/]+/storage/v1/object/(public/)?property-media/', ''),
    ''
  ),
  video = nullif(
    regexp_replace(coalesce(video, ''), '^https?://[^/]+/storage/v1/object/(public/)?property-media/', ''),
    ''
  ),
  fotos = coalesce(
    (
      select array_agg(
        regexp_replace(item, '^https?://[^/]+/storage/v1/object/(public/)?property-media/', '')
        order by ord
      )
      from unnest(fotos) with ordinality as t(item, ord)
    ),
    '{}'
  );

-- 2) Bucket privado.
update storage.buckets set public = false where id = 'property-media';

-- 3) Helper DEFINER: o objeto é mídia de um imóvel compartilhado e ativo, OU
--    de um imóvel em parceria aceita com o caller (parceiro mantém acesso à
--    mídia do workspace mesmo se a flag for desligada depois). DEFINER porque
--    a policy de storage roda como o usuário e a RLS own-only de properties
--    esconderia o imóvel de terceiros.
create or replace function public.property_media_visible(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.properties property
    where (
        property.foto = object_name
        or property.video = object_name
        or property.fotos @> array[object_name]
      )
      and (
        (property.partnership_shared and property.status = 'Ativo')
        or exists (
          select 1 from public.partnership_requests request
          where request.property_id = property.id
            and request.status = 'accepted'
            and auth.uid() in (request.sender_id, request.receiver_id)
        )
      )
  );
$$;

revoke all on function public.property_media_visible(text) from public;
grant execute on function public.property_media_visible(text) to authenticated;

create index if not exists properties_fotos_gin on public.properties using gin (fotos);
create index if not exists properties_foto_idx on public.properties(foto);

-- 4) Leitura: dono da pasta OU mídia visível por compartilhamento/parceria.
--    createSignedUrl(s) com o JWT do usuário é autorizado por esta policy.
--    As políticas de escrita own-folder de 0005 permanecem.
drop policy if exists "property_media_public_read" on storage.objects;

create policy "property_media_read_owner_or_shared"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'property-media'
    and (
      (select auth.uid())::text = (storage.foldername(name))[1]
      or public.property_media_visible(name)
    )
  );
