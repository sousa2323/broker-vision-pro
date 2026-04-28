## Ambiente Admin Ubroker — Painel estratégico do superadmin

Novo ambiente paralelo ao app do corretor, com **sidebar própria**, identidade visual mais densa e foco em leitura de dados. **Nenhum dado real, sem APIs, sem cálculos dinâmicos** — tudo mock visual reaproveitando `src/data/mock.ts` quando útil.

## Estrutura de rotas (TanStack file-based)

```text
src/routes/
  admin.tsx                  ← layout (sidebar + header Admin)
  admin.index.tsx            ← /admin              Dashboard estratégico
  admin.financeiro.tsx       ← /admin/financeiro   Cobranças, vendas, conciliação
  admin.indicacoes.tsx       ← /admin/indicacoes   Árvore trinível
  admin.usuarios.tsx         ← /admin/usuarios     Lista de corretores
  admin.imoveis.tsx          ← /admin/imoveis      Inventário global
  admin.leads.tsx            ← /admin/leads        Todos os leads
  admin.parcerias.tsx        ← /admin/parcerias    Lista de parcerias
  admin.ia.tsx               ← /admin/ia           Performance da IA
  admin.inbox.tsx            ← /admin/inbox        Canais e volumes
  admin.configuracoes.tsx    ← /admin/configuracoes Regras de negócio
  admin.auditoria.tsx        ← /admin/auditoria    Logs de eventos
  admin.suporte.tsx          ← /admin/suporte      Disputas e bypass

src/data/admin-mock.ts       ← novo: cobranças, conciliações, logs, disputas, etc.
```

A landing pública (`/`) e o app do corretor (`/app/*`) **não são alterados**. Adicionar um link discreto "Admin" no rodapé da landing apontando para `/admin` (acesso demonstrativo).

## Layout do Admin (`admin.tsx`)

Mesma anatomia geral do `app.tsx`, porém com paleta admin (`bg-navy` mais profundo, badge "ADMIN" no header) e densidade maior.

```text
┌─ Sidebar (w-64, dark) ──────┬─ Header (Admin · Superadmin) ───────┐
│ UBROKER · ADMIN             │ Busca global · Sino · Avatar admin  │
│                             ├─────────────────────────────────────┤
│ ── OPERAÇÃO ──              │                                     │
│ • Dashboard                 │  <Outlet />                          │
│ • Financeiro       (badge)  │                                     │
│ • Indicações                │                                     │
│                             │                                     │
│ ── REDE ──                  │                                     │
│ • Usuários                  │                                     │
│ • Imóveis                   │                                     │
│ • Leads                     │                                     │
│ • Parcerias                 │                                     │
│                             │                                     │
│ ── INTELIGÊNCIA ──          │                                     │
│ • IA Assistente             │                                     │
│ • Inbox                     │                                     │
│                             │                                     │
│ ── GOVERNANÇA ──            │                                     │
│ • Configurações             │                                     │
│ • Auditoria                 │                                     │
│ • Suporte / Disputas (badge)│                                     │
│                             │                                     │
│ ──────────────              │                                     │
│ [avatar] Superadmin Ubroker │                                     │
└─────────────────────────────┴─────────────────────────────────────┘
```

Badges numéricos pequenos em Financeiro (cobranças atrasadas) e Suporte (disputas abertas) usando `bg-warm`.

## Módulos — conteúdo visual de cada tela

### 1. Dashboard (`admin.index.tsx`)
- **Faixa de receita** (3 KPIs grandes): Receita total plataforma · Receita do mês · MRR SaaS.
- **Receita por origem** (donut SVG estático + legenda): Comissão imóveis / SaaS / Indicações.
- **Operação** (4 KPIs): Corretores ativos · Leads gerados · Parcerias ativas · Vendas registradas.
- **Alertas estratégicos** (lista colorida): cobranças em atraso (vermelho), parcerias paradas (laranja), possíveis bypass (vermelho/escuro).
- **Mini-gráfico evolução de receita** (SVG polyline reaproveitando padrão da landing).

### 2. Financeiro (`admin.financeiro.tsx`)
Tabs: **Cobranças** · **Vendas** · **Conciliação**.
- **Cobranças**: tabela (Corretor · Origem · Valor · Vencimento · Status badge · Ação "Marcar como pago" / "Ver origem"). Filtros chips: Todos / Pendente / Faturado / Pago / Atrasado. Status colorido (verde pago, laranja pendente, vermelho atrasado).
- **Vendas (detalhamento)**: cards expansíveis mostrando Imóvel · Valor venda · Comissão total · Split (corretor A / corretor B / fee Ubroker) com barras proporcionais.
- **Conciliação**: tabela (Venda · Corretor · Valor esperado · Valor recebido · Status: Pendente / Confirmada / Divergente). Linha divergente destacada em vermelho.

### 3. Indicações (`admin.indicacoes.tsx`)
- Árvore visual trinível (3 colunas em cascata, conectores SVG simples).
- KPIs: Total indicados · Receita por nível (N1, N2, N3) · MRR recorrente total.
- Top 5 indicadores da rede (lista com avatar + receita gerada).

### 4. Usuários (`admin.usuarios.tsx`)
- Tabela densa: Avatar · Nome · CRECI · Cidade · Plano (Free/Pro chip) · Status (Ativo/Inativo/Bloqueado) · Receita gerada · Ações (Alterar plano · Bloquear).
- Filtros chips no topo: Todos / Pro / Free / Bloqueados. Busca.
- Reaproveita avatares e padrões de `mock.ts`; gera ~12 corretores fictícios em `admin-mock.ts`.

### 5. Imóveis (`admin.imoveis.tsx`)
- Tabela: Foto thumb · Nome · Bairro · Valor · Corretor responsável · Status (Ativo/Vendido/Removido) · Marketplace (badge). Reaproveitar `properties` do `mock.ts`.

### 6. Leads (`admin.leads.tsx`)
- Tabela global: ID · Nome · Origem (IA/Inbox/Marketplace/Indicação) · Corretor atribuído · Status · Última interação. Filtros por origem. Reaproveitar `leads` do mock.

### 7. Parcerias (`admin.parcerias.tsx`)
- Tabela: Imóvel · Corretor captador · Corretor parceiro · Status (Ativa/Finalizada/Cancelada) · Comissão estimada · Ações (Ver contrato · Ver pipeline). Linha clicável abre painel lateral com timeline mock.

### 8. IA Assistente (`admin.ia.tsx`)
- KPIs globais: Leads atendidos · Leads qualificados · Taxa qualificação · Tempo médio resposta.
- Gráfico barras semanal (SVG estático).
- Tabela "Logs de atendimento" (Lead · Canal · Score · Resultado · Data).

### 9. Inbox (`admin.inbox.tsx`)
- Cards de canais: WhatsApp · Instagram · Marketplace · Email — com status conectado e volume de conversas.
- KPIs: Conversas totais · Sem resposta (alerta laranja) · Tempo médio.

### 10. Configurações (`admin.configuracoes.tsx`)
Cards de regras de negócio (input visual, sem persistência):
- **Comissão padrão** (% slider/input + texto explicativo).
- **Fee Ubroker — Parceria** (% input).
- **Fee Ubroker — Lead próprio** (% input).
- **Regras de indicação trinível** (3 inputs % por nível: N1 / N2 / N3).
- **Mensalidade do plano Pro** (R$ input).
- Botão "Salvar alterações" (visual, sem ação).

### 11. Auditoria (`admin.auditoria.tsx`)
- Timeline densa de logs: ícone por tipo · Ator · Ação · Alvo · Timestamp.
- Filtros por tipo: Venda registrada · Parceria criada · Contrato assinado · Bloqueio · Alteração de regra.
- Eventos críticos destacados em vermelho/laranja.

### 12. Suporte / Disputas (`admin.suporte.tsx`)
Tabs: **Disputas** · **Contestações** · **Possíveis bypass**.
- **Disputas**: cards com Corretor A vs Corretor B · motivo · status (Aberta/Em análise/Resolvida) · botão "Abrir caso".
- **Contestações de venda**: lista de vendas contestadas com valor em risco.
- **Possíveis bypass**: alertas vermelhos com indício (ex: "lead recebido pela Ubroker fechado fora do sistema") + Corretor + Lead + Ação "Investigar".

## Diretrizes visuais

- **Paleta**: reaproveitar tokens existentes (`bg-navy`, `bg-card`, `bg-surface`, `text-warm`, `bg-warm`).
  - Azul (primary) → padrão de ações.
  - **Laranja (`bg-warm` / `text-warm`)** → alertas e atenção.
  - **Verde (`text-emerald-600` / `bg-emerald-50`)** → pagos / positivos.
  - **Vermelho (`text-red-600` / `bg-red-50`)** → atraso / risco / bypass.
- Tabelas densas (`text-sm`, `py-2`), cabeçalhos `uppercase tracking-widest text-[11px] text-muted-foreground`.
- Badges de status reutilizáveis (componente local `StatusBadge` por tela quando útil).
- Cards `rounded-xl border bg-card`, espaçamento `space-y-6` consistente com o app do corretor.
- Header do admin mostra chip "ADMIN" em `bg-warm` ao lado do título.

## Detalhes técnicos

- **Sem novas dependências**. Apenas `lucide-react`, shadcn (`Badge`, `Button`, `Card`, `Tabs`, `Input`, `Select`, `Table`) já presentes.
- **Roteamento**: arquivos seguem convenção `admin.<rota>.tsx`. Layout `admin.tsx` exporta `createFileRoute("/admin")` com `component` que renderiza sidebar + `<Outlet />`. `routeTree.gen.ts` é regenerado automaticamente — não editar manualmente.
- **Mock data novo** (`src/data/admin-mock.ts`): exporta `adminBrokers`, `cobrancas`, `vendasDetalhadas`, `conciliacoes`, `disputas`, `bypassAlertas`, `auditLogs`, `iaLogs`, `inboxCanais`, `referralTree`. Tipos explícitos. Reaproveita `leads`, `properties`, `formatBRL` de `mock.ts`.
- **Componentes locais por arquivo** (sem novos componentes globais): `Section`, `KPI`, `StatusBadge`, `RowAction` definidos dentro de cada rota como já é padrão no projeto.
- **Acesso**: link discreto no footer da landing (`src/routes/index.tsx`) "Admin (demo)" → `/admin`. Sem autenticação (é demo).
- **Sidebar collapse**: não implementar agora — manter sempre visível em `md:flex` como no app do corretor.

## O que NÃO será feito

- Sem banco de dados, sem Supabase, sem APIs.
- Sem cálculos dinâmicos (totais são valores escritos no mock).
- Sem alterações em rotas `/app/*` ou na landing além do link discreto no footer.
- Sem login/RBAC — apenas visual/demonstrativo.
- Sem editar `src/routeTree.gen.ts`.
