-- 0016_leads_localizacao.sql
-- Adiciona localização estruturada aos leads: UF (estado) + cidade/região livre.
-- Colunas nullable para não quebrar RLS nem inserts existentes.

alter table public.leads add column if not exists estado text
  check (estado is null or estado in (
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB',
    'PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'));

alter table public.leads add column if not exists cidade text;
