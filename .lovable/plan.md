# Evoluir `/app/parcerias` — Motor de descoberta, conexão e parceria

Editar **apenas** `src/routes/app.parcerias.index.tsx` e `src/routes/app.parcerias.$id.tsx`. Sem alterações em `mock.ts`, sidebar ou outras rotas. Tudo simulado, com estado local.

## 1. Cabeçalho (`app.parcerias.index.tsx`)

- Título: **"Parcerias"**
- Subtítulo: "Conecte-se com corretores, explore oportunidades e feche negócios em conjunto."
- Remover linha atual de contagem (será movida para dentro das abas).

## 2. Abas (Tabs)

Usar `@/components/ui/tabs` logo abaixo do header, com duas abas:

- **Explorar corretores** (default)
- **Minha rede**

Estado local: `useState<'explorar' | 'rede'>('explorar')` via `Tabs value/onValueChange`.

## 3. Aba "Explorar corretores"

Acima do grid:

- **Barra de busca** (`Input` com ícone Search) — filtra por `nome`, `regiao`, `especialidade` (case-insensitive contains).
- **Linha de filtros** (4 `Select`):
  - Região: derivada de `brokers.map(b => b.regiao)` única + opção "Todas".
  - Tipo de imóvel: estático ("Apartamento", "Cobertura", "Casa", "Comercial", "Terreno", "Todos").
  - Faixa de valor: estático ("Até R$ 800k", "R$ 800k–1,5M", "R$ 1,5M–3M", "Acima de R$ 3M", "Todas").
  - Perfil de cliente: estático ("Família", "Investidor", "Alto padrão", "Primeira moradia", "Todos").
  - Filtros de tipo/faixa/perfil são apenas visuais (não aplicam lógica real além de UI feedback) — região e busca filtram de fato.
- Microcopy: "X corretores encontrados".

**Cards (Explorar)** — manter estrutura visual atual, ajustar conteúdo:

- Foto + nome + agência (já existe).
- Região (MapPin), especialidade destacada (badge brand suave).
- Linha extra: "Carteira combinada: N imóveis" (usa `b.imoveis`).
- Badge de compatibilidade (já existe, manter).
- Footer com **dois botões**:
  - `Ver perfil` → `Link` para `/app/parcerias/$id` (variant outline).
  - `Conectar` → abre `ConnectModal` (variant default/navy).

## 4. Aba "Minha rede"

Subset fixo dos brokers como "minha rede" (ex.: B-01, B-02, B-04, B-05, B-07 — definido por array local `myNetworkIds`). Mostrar:

- Header pequeno: "Você tem N parceiros ativos · Carteira combinada de M imóveis" (somatório de `imoveis`).
- Mesmo grid de cards, com:
  - Tudo de "Explorar" +
  - **Status de relacionamento** (badge no topo do card): determinístico por id → `ativo` (emerald), `recente` (sky), `inativo` (slate). Mapa local `relStatus: Record<string, 'ativo'|'recente'|'inativo'>`.
  - Botões: `Ver perfil` + `Mensagem` (abre o mesmo `ConnectModal` com objetivo pré-selecionado).

## 5. Modal "Conectar com corretor" (`ConnectModal`)

`Dialog` disparado pelo botão Conectar. Estado local de campos.

- Título: "Conectar com corretor"
- Subtítulo: nome do corretor selecionado.
- Campos:
  - Mensagem inicial (`Textarea`, placeholder "Olá, vi seu perfil e gostaria de explorar oportunidades...").
  - Objetivo da conexão (`RadioGroup`): Parcerias / Troca de oportunidades / Networking profissional.
- Botões: Cancelar · **Enviar conexão** → toast sonner "Solicitação enviada para {nome}".

## 6. Tela de perfil (`app.parcerias.$id.tsx`)

Manter layout atual. Ajustes:

- Adicionar acima do botão "Solicitar parceria" um botão secundário **"Conectar"** que abre o mesmo `ConnectModal` (componente local recriado neste arquivo — sem extrair compartilhado para evitar criar novo arquivo).
- Botão "Solicitar parceria" geral do perfil → abre `PartnershipModal` (sem imóvel específico — campo de imóvel pré-preenchido como "Parceria geral").
- Cards de imóveis no inventário: o botão atual "Solicitar parceria neste imóvel" passa a abrir `PartnershipModal` com o imóvel pré-selecionado (estado local com `selectedProperty`).
- Trocar termos sociais: nada a alterar (já usa "parceria", "inventário"). Garantir que copy nova use **parceria / oportunidade / conexão / colaboração**.

## 7. Modal "Solicitar parceria" (`PartnershipModal`)

`Dialog` em `app.parcerias.$id.tsx`.

- Título: "Solicitar parceria"
- Subtítulo: "Imóvel: {nome do imóvel}" (ou "Parceria geral com {corretor}").
- Campos:
  - Mensagem (`Textarea`, obrigatório).
  - Tipo de parceria (`Select`): "Compartilhar comissão", "Captação conjunta", "Indicação de cliente", "Co-visita".
  - Observação (`Textarea`, opcional).
- Botões: Cancelar · **Enviar solicitação** → toast "Solicitação de parceria enviada".

## 8. Detalhes técnicos

- Componentes shadcn já existentes: `Tabs`, `Input`, `Select`, `Dialog`, `RadioGroup`, `Textarea`, `Button`, `Badge`, `Popover` (não necessário aqui).
- Toasts via `sonner` (já no projeto).
- Cores de status de relacionamento:
  - Ativo: `bg-emerald-100 text-emerald-700`
  - Recente: `bg-sky-100 text-sky-700`
  - Inativo: `bg-slate-200 text-slate-600`
- Toda lógica vive nos dois arquivos de rota. Sem novos arquivos, sem alterações em `mock.ts`.
- Manter `compatibilidade` e estrutura de cards existentes.

## Não alterar

- `src/data/mock.ts`, sidebar, demais rotas, layout do grid responsivo, fotos.

## Resultado

A tela passa de lista estática para uma plataforma com:
- Descoberta filtrada de corretores (busca + filtros).
- Diferenciação clara entre rede atual e exploração.
- Fluxos de conexão e solicitação de parceria com rastreabilidade simulada (toasts + modais estruturados).
- Linguagem alinhada ao contexto comercial (parceria, oportunidade, colaboração).
