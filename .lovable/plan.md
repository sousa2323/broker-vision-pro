# Refinamento visual e hierárquico — Modal "Operação do Lead"

Escopo: apenas `src/routes/app.leads.tsx`, dentro do bloco do modal (linhas ~771–1237). Sem novas abas, sem mudar estrutura geral, sem alterar lógica/mock. Reusar 100% dos helpers (`getProximaAcao`, `getMotivos`, `getStatusOperacional`, `getCadenciaDetalhada`, `getScoreLead`, `getChanceConversao`, `getTempoMedioResp`, `getComissao`, `getTimelineOperacional`, `SCRIPTS_LIB`, etc.). Pode adicionar 2 helpers visuais derivados se necessário (mapping score→tom, tempoSemInteracao→tom, sla→tom), sem novos dados.

---

## 1. Nova "Mission Control Bar" (logo abaixo das tabs sticky)

Barra horizontal sticky, abaixo da `TabsList`, visível em todas as abas — dá contexto operacional permanente. Não substitui a aba Execução; complementa.

Layout: `sticky top-[~140px] z-10 bg-background/95 backdrop-blur border-b border-border px-6 py-3`. Conteúdo em `flex flex-wrap gap-2` (em <md vira `grid-cols-2`).

7 mini-pills horizontais (todos `h-9 rounded-md border border-border px-3` com micro-label uppercase 9px e valor 13px medium):

1. Comissão potencial — `formatBRL(getComissao(selected))`
2. VGV/Imóvel — `formatBRL(selected.orcamento)`
3. Score IA — valor + bolinha de cor (verde ≥80, âmbar 50–79, vermelho <50)
4. Chance de fechamento — `getChanceConversao()%` + barra fina sob o número
5. Tempo sem interação — derivado da última `historico[0].data`; tom verde/âmbar/vermelho
6. SLA próxima ação — texto curto ex. "WhatsApp · 2h"; quando atrasado vira pill `bg-red-50 text-red-700` com ícone de alerta pulsante sutil
7. Temperatura — reutiliza `selectedPrio` (🔥/🌤/❄️)

Comportamento visual: pills neutras por padrão; só os indicadores de risco recebem cor. Resultado: leitura escaneável tipo cockpit.

## 2. Hero "Próxima ação recomendada" reforçado

Hoje: `border-primary/30 bg-surface p-6`. Ajustes:

- Container: `p-7`, `rounded-2xl`, `border-l-4 border-l-primary`, `bg-gradient-to-br from-surface to-background`, sombra `shadow-md`.
- Linha superior: 3 chips em fila — etapa da cadência (ex. "Dia 2 · Follow-up"), prioridade ("Alta"), SLA ("vence em 2h"). Quando SLA atrasado: chip vermelho "Atrasado · impacta conversão".
- Título maior (`text-2xl md:text-3xl font-semibold`), nome do lead em destaque.
- Sub-linha de impacto: frase curta dinâmica ("Atraso reduz chance de conversão em ~15%") derivada do score/tempo sem interação.
- Motivos: bullets com ícone `Sparkles` discreto à esquerda em vez de "•".
- CTA principal dominante: botão único `h-12 px-6 text-base font-semibold` (verde WhatsApp se ação=whatsapp; navy se ligar) ocupando largura máx. ~340px, alinhado à direita ou em linha própria abaixo. Ícone grande à esquerda + label ("Enviar WhatsApp agora").
- Link discreto "Ver alternativas" à direita do CTA, `text-xs text-muted-foreground hover:underline`.

## 3. Botões secundários — peso reduzido

Hoje 5 botões competem (Ligar e WhatsApp coloridos no mesmo grid). Novo:

- O CTA principal sai do grid e vai para dentro do hero.
- Grid vira `grid-cols-2 md:grid-cols-4 gap-2` apenas com: Ligar · Registrar · Agendar · Avançar.
- Todos `variant outline`, `h-10`, ícone 14px, label `text-xs font-medium`. Sem cores fortes — neutralidade total para que o hero seja a única coisa "gritante".

## 4. Status operacional — mini painel horizontal

Já existe como pills coloridas (`getStatusOperacional`). Refinar:

- Trocar título "Status operacional" por linha mais densa, mover para logo abaixo do hero.
- Pills com `h-7 px-2.5 rounded-full text-[11px]`, ícone 12px à esquerda. Adicionar bolinha pulsante (`animate-pulse`) só em pills `tone === "danger"`.
- Wrap natural; sem card-container — apenas a fila.

## 5. Timeline operacional — linha viva

- Linha guia `border-l-2 border-border` mais visível, com gradiente sutil no topo (`bg-gradient-to-b from-primary/30 to-transparent` nos primeiros 40px).
- Bullets coloridos por canal (não só por tone): WhatsApp `bg-emerald-500`, Visita `bg-blue-500`, IA `bg-violet-500`, Sistema `bg-slate-400`, Ligação `bg-amber-500`. Ícone branco dentro.
- Espaçamento `space-y-5`, timestamp `text-[10px] text-muted-foreground/70` à direita do label (não embaixo).
- Hover em cada item: `bg-surface/50 -mx-2 px-2 rounded` para feedback discreto.

## 6. Cadência — sensação de progresso

- Adicionar barra de progresso no topo da aba Cadência ("3 de 8 etapas concluídas") com `bg-emerald-500`.
- Cada dia: `Card` com header "Dia N · objetivo do dia" + chip de status agregado (ex. "2/3 concluídas").
- Ícones de status: ✓ verde em círculo cheio (concluído), ● âmbar (hoje), ⚠ vermelho (atrasado), ○ cinza (pendente). Sem usar emojis brutos.
- Item concluído: opacidade levemente reduzida + linha de checkmark animada (apenas CSS transition em hover).
- Atrasado: borda esquerda `border-l-2 border-l-red-400`, fundo `bg-red-50/30`.

## 7. Interações — histórico inteligente

- Cada card de interação ganha 1 linha de microcontexto derivada da ação (já temos `getSugestaoPosInteracao`). Adicionar 1 micro-badge no header tipo "Lead respondeu em 12min" / "Score +5" / "Follow-up em 1h" — derivada simples do tipo + posição no histórico.
- Cabeçalho com avatar circular do canal (mesma paleta da timeline §5) substituindo o emoji solto.
- Bloco "Próxima ação sugerida" com fundo `bg-primary/5`, borda esquerda `border-l-2 border-l-primary/40`, ícone `ArrowRight` 12px.

## 8. WhatsApp — central inteligente

- "Sugestão IA" promovida: `rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-background p-5`, header com `Sparkles` 16px + label "Assistente IA" e mini-tag "personalizada". Botão "Usar sugestão" `h-9` violeta sólido.
- Templates: grid `grid-cols-2 md:grid-cols-3 gap-2`, cards `p-3 h-auto` com título `text-xs font-semibold` + preview `text-[11px] text-muted-foreground line-clamp-2` + botão "Usar" pequeno fantasma.
- Textarea: `min-h-[140px]`, `bg-card`, header próprio "Mensagem" + contador de caracteres + botões de ação ("Enviar" sólido emerald + "Salvar como template" ghost) ancorados.
- Última conversa colapsada num accordion fino acima da composição.

## 9. Qualificação — painel de inteligência

- Cada um dos 4 cards (Perfil, Busca, Financeiro, Decisão) ganha:
  - Ícone leve no header (`User`, `Search`, `Wallet`, `CheckCircle`) `h-4 w-4 text-muted-foreground`.
  - Border-top colorida fina por categoria (azul/violeta/verde/âmbar) `border-t-2`.
  - Pares label/valor em `grid grid-cols-[auto_1fr] gap-x-3 gap-y-2`, valor `font-medium`.

## 10. Scripts — biblioteca premium

- Cada script `p-4` (não 5), header em 2 linhas: título `text-sm font-semibold` + objetivo `text-[11px] text-muted-foreground`. Categoria como chip pequeno à direita.
- Mensagem em bloco `bg-surface/60 rounded-md p-3 text-sm font-mono-like` (usar `font-normal` mas leading mais alto).
- Botão "Copiar" `ghost size-sm` com ícone `Copy` 12px, alinhado ao topo direito.

## 11. Histórico — timeline institucional

- Agrupar por data (hoje, ontem, esta semana, anterior) com header sticky-suave `text-[11px] uppercase tracking-widest text-muted-foreground py-2 border-b border-dashed`.
- Linha temporal contínua (mesma estética da §5).
- Cada evento com microbadge de origem: IA (violeta), WhatsApp (emerald), Sistema (slate), Corretor (navy) — `text-[10px] px-1.5 py-0.5 rounded`.

## 12. Microinterações globais

- Todos os cards interativos: `transition-all hover:border-foreground/20 hover:shadow-sm`.
- Botões: `active:scale-[0.98] transition-transform`.
- Pills "danger" com `animate-pulse` só na bolinha indicadora (não no texto).
- Tabs: indicador inferior animado já existe; aumentar para `border-b-2 transition-colors`.
- Sem motion lib nova — apenas Tailwind transitions.

## 13. Tokens e responsividade

- Reutilizar tokens existentes (`bg-surface`, `bg-card`, `text-muted-foreground`, `border-border`, `bg-navy`). Cores semânticas (emerald/red/amber/violet/blue/slate) já estão em uso no arquivo — manter consistência, não inventar nova paleta.
- Mission Control Bar em <md: vira `grid grid-cols-2 gap-2`. Hero CTA em <md: `w-full`.
- Sem scroll horizontal em nenhuma aba; manter `overflow-x-auto` apenas em TabsList.

## Detalhes técnicos

- Editar somente o bloco `{drawerOpen && ...}` em `src/routes/app.leads.tsx`.
- Adicionar (no topo do arquivo, entre os helpers existentes):
  - `getScoreTone(score) → "good"|"warn"|"danger"`
  - `getTempoSemInteracao(lead) → { label, tone }` derivando de `historico[0].data`
  - `getSlaProximaAcao(lead) → { label, atrasado: boolean }` baseado em `getCadenciaDetalhada` (primeiro item `hoje`/`atrasado`).
- Importar ícones já não usados de `lucide-react` se necessário (`Copy`, `User`, `Search`, `Wallet`, `CheckCircle`, `AlertCircle`).
- Não tocar nos Dialogs `perdaOpen`/`registroOpen`, na tabela, sidebar, cards do topo, Pipeline ou outras rotas.

## Critérios de aceite

- Mission Control Bar visível e fixa abaixo das tabs em todas as abas.
- Hero "Próxima ação" claramente dominante; CTA único e óbvio.
- Botões secundários neutros, sem competir com o CTA.
- Timeline e Histórico com bullets coloridos por canal e linha guia contínua.
- Cadência com progresso visível e estados emocionais (concluído leve, atrasado urgente).
- WhatsApp parecendo central com IA, não textarea solta.
- Qualificação com ícones e categorias visualmente distintas.
- Microinterações sutis em hover/active sem exageros.
- Nenhuma alteração fora do modal; nenhuma lógica/mock alterada.
