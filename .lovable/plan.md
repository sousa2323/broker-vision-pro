## Plano — Gestão operacional ativa da rede (`/admin/usuarios`)

Escopo: somente `src/routes/admin.usuarios.tsx`. Sem nova rota, sem mudar sidebar/identidade/sidebar, sem novas dependências. Reutilizar tokens semânticos já em uso (`bg-card`, `bg-surface`, emerald/amber/red), `Sheet`, `Tabs`, `Checkbox` (já no projeto). Toda nova lógica derivada de `adminBrokers` + `corretorRisco` + helpers determinísticos existentes — sem alterar `admin-mock.ts`.

Princípio de tom: linguagem de **suporte operacional**, não de fiscalização. Verbos: acompanhar, ajudar, priorizar, proteger, melhorar. Cores de alerta usadas com parcimônia.

---

### 1. Novos helpers (extensão do bloco existente)

Adicionar ao topo, ao lado dos já existentes:

- `getOrigemLeads(u) → { plataforma: number; propria: number }` — split determinístico (plataforma 30–70%) sobre `getLeadsAtivos`.
- `getNegligenciaPlataforma(u) → number` — fração de `getNegligencia` aplicável a leads originados pela Ubroker (define se "Redistribuir leads Ubroker" aparece).
- `getPipelineComposicao(u) → { novos, qualificados, visitas, propostas, criticos }` — soma = `getLeadsAtivos`.
- `getTendencia(u, metrica) → { atual, delta, direcao }` para `execucao | conversao | negligencia | tempoResposta`.
- `getAlertasInteligentes(u) → Alerta[]` (max 4) — combina negligência plataforma, queda execução, dias sem login, conversão acima da média.
- `getAcaoRecomendada(u) → { titulo, motivos: string[] }` — frase única + 2–4 bullets derivados dos piores indicadores.
- `getSaudeOperacional(u) → "saudavel" | "atencao" | "critico"` — alias semântico do `getRiscoOperacional` para uso no novo bloco/badge no drawer.

Helpers visuais novos: `tonDelta(direcao, metrica)` (verde/vermelho conforme métrica — em "negligência" subir é ruim), `setaDelta(direcao)` (↑ ↓ →).

### 2. Tabela principal — seleção múltipla + ações em massa

- Coluna 1 vira checkbox (`<Checkbox />`). Estado `selectedIds: Set<string>`. Header com checkbox "selecionar todos visíveis (filtrados)".
- Quando `selectedIds.size > 0`, renderizar **barra de ações em massa** flutuando acima da tabela: `sticky top-0` dentro do wrapper, `rounded-xl bg-card border border-border p-2 flex items-center gap-2`:
  - `N selecionados` + botão limpar.
  - Botões: **Enviar alerta operacional**, **Alterar cadência padrão**, **Agendar acompanhamento**, **Pausar distribuição de leads da plataforma**.
  - Cada ação dispara `toast` (sonner já no projeto) com confirmação. Sem mutação real.
  - Texto do botão de pausa traz tooltip: "Não bloqueia o corretor — apenas interrompe entrada de novos leads Ubroker até normalização."
- Linha continua clicável p/ abrir drawer; clique no checkbox `stopPropagation`.

### 3. Drawer — cockpit de intervenção

Reorganizar o conteúdo do `Sheet` mantendo cabeçalho atual. Nova ordem dentro do `SheetContent`:

```
Header (avatar, nome, meta, badge risco, score IA)        ← já existe
↓
[1] Bloco "Ação recomendada"            ← novo, destaque
↓
[2] Bloco "Saúde operacional"           ← novo, badge grande + 1 linha
↓
[3] Bloco "Alertas inteligentes"        ← novo, lista pills
↓
[4] Bloco "Tendência operacional"       ← novo, 4 mini-cards com delta
↓
[5] Bloco "Composição do pipeline"      ← novo, barra empilhada + legendas
↓
Tabs (Resumo · Operação · Performance · Cadências · Financeiro · Auditoria)  ← mantém
```

#### 3.1. Ação recomendada
`rounded-xl bg-card border border-border p-4`. Título uppercase 10px "AÇÃO RECOMENDADA". Frase principal (`text-base font-medium`) vinda de `getAcaoRecomendada().titulo` (ex.: "Entrar em contato com Ramon Capone"). Lista compacta de motivos (bullets coloridos `•`). Quatro botões em `flex flex-wrap gap-2`:

- **Abrir leads críticos** → fecha drawer e navega para `/admin/leads` com filtro (`navigate({ to: "/admin/leads", search: { risco: "critico", corretor: u.id } })`). Se a rota não aceitar search, usar `toast` + manter scope visual.
- **Enviar alerta operacional** → abre `Dialog` simples com preview do texto: "Você possui leads da plataforma sem interação acima do SLA." + canais (WhatsApp / notificação / aviso interno) como chips informativos. Confirmar → toast.
- **Agendar acompanhamento** → toast "Acompanhamento agendado para amanhã, 09h".
- **Redistribuir leads Ubroker** → renderizado **somente** quando `getNegligenciaPlataforma(u) > 0`. Tooltip: "Apenas leads originados pela plataforma podem ser redistribuídos. Carteira própria do corretor é preservada." Confirmação obrigatória via `AlertDialog` listando "X leads da plataforma serão redistribuídos. Y leads de carteira própria permanecem com o corretor."

#### 3.2. Saúde operacional
Linha única: badge grande (`Saudável` emerald / `Atenção` amber / `Crítico` red) + microcopy explicativa ("execução alta · baixa negligência · boa resposta" etc., gerada a partir dos indicadores).

#### 3.3. Alertas inteligentes
`flex flex-col gap-1.5`. Cada alerta = pill `text-xs` com bullet colorido + texto curto. Máx 4. Tons suaves (`bg-red-50/50`, `bg-amber-50/50`, `bg-emerald-50/50`) — sem inundar de vermelho.

#### 3.4. Tendência operacional
Grid `grid-cols-2 md:grid-cols-4 gap-2`. Cada mini-card `rounded-lg bg-surface p-3`:
- label uppercase 10px ("Execução", "Conversão", "Negligência", "Tempo médio")
- valor 18px medium
- linha delta: seta + `+/-X%` + "últimos 7 dias", colorida via `tonDelta`.

#### 3.5. Composição do pipeline
- Linha-resumo: `42 leads ativos`.
- **Barra empilhada** horizontal (`flex h-2 rounded-full overflow-hidden`) com 5 segmentos proporcionais: novos / qualificados / visitas / propostas / críticos — tons da paleta existente.
- Legenda em grid `grid-cols-5 gap-2` com bullet + label + número.
- **Badge de origem** ao lado: "X da plataforma · Y carteira própria" — reforça regra de redistribuição.

### 4. Tabela — coluna "Origem dos leads"

Adicionar coluna compacta entre **Leads ativos** e **Execução**: dois micro-pills empilhados: `Plataforma N` (azul) / `Própria N` (cinza). Comunica imediatamente o que pode ser redistribuído. Sem aumentar densidade significativa (texto 11px).

### 5. Saúde da rede — KPI extra na faixa de alertas existente

Na faixa horizontal de alertas já existente (acima dos filtros), adicionar **um pill resumo** à esquerda: `● Saúde da rede: Saudável (78%)` — % = corretores `saudavel` / total. Cor do bullet conforme nível agregado. Mantém densidade atual.

### 6. Tom & restrições visuais

- Nenhum copy com "punir/monitorar/controlar/penalizar/bloquear corretor". Sempre "acompanhar/priorizar/proteger leads da plataforma/suporte operacional".
- Vermelho restrito a: badge crítico, negligência > 10, alerta 🔴. Resto em âmbar/cinza/azul.
- Mantém tipografia, espaçamentos e radii já estabelecidos. Nada de bordas grossas, gradientes pesados, ícones em excesso.

### 7. Estado e interações

- `selectedIds`, `bulkActionOpen`, `recommendDialogOpen`, `redistributeDialogOpen` em `useState` no componente raiz.
- Toasts via `sonner` (já presente em `src/components/ui/sonner.tsx`).
- Filtros existentes preservados; alertas operacionais continuam clicáveis.

### 8. Critérios de aceite

- Drawer abre com Ação Recomendada visível primeiro, motivos claros e 3–4 botões de intervenção.
- Botão "Redistribuir leads Ubroker" some quando o corretor não tem leads de plataforma negligenciados; quando aparece, o diálogo deixa explícito que carteira própria é preservada.
- Tabela permite seleção múltipla; barra de ações em massa surge apenas quando há seleção; "Pausar distribuição" comunica claramente que NÃO bloqueia o corretor.
- Tendência mostra seta/delta corretos por métrica (em negligência e tempo de resposta, subir = ruim = vermelho).
- Pipeline composto via barra empilhada + split plataforma/própria.
- Linguagem em todo o fluxo é de suporte, não de fiscalização. Densidade visual permanece minimalista.
- Nenhuma alteração fora de `src/routes/admin.usuarios.tsx`.
