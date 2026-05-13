## Plano — Evolução operacional do Pipeline

Escopo: somente `src/routes/app.pipeline.tsx`. Sem alterar sidebar, identidade visual, estrutura do kanban ou outras telas. Sem novas dependências. Reutilizar tokens existentes (`bg-card`, `bg-surface`, `bg-brand`, `bg-navy`, `text-muted-foreground`, semânticas emerald/amber/red/violet/blue/slate já em uso).

---

### 1. Helpers derivados (topo do arquivo, sem novos dados)

Criar funções puras que derivam tudo do mock atual (`cards`, `valor`, `dias`, `tag`, `stageId`):

- `getScoreOperacional(card, stageId) → 0–100` — combina valor (peso VGV), `dias` (penaliza inatividade), estágio (Proposta/Visita pesam mais), `tag` (boost se "Score 87", "À vista", "IA qualificando").
- `getRiscoPerda(card, stageId) → "baixo" | "medio" | "alto"` — derivado de `dias` por estágio (ex.: Proposta >2d = alto, Visita >5d = alto, Qualificado >5d = médio).
- `getPrioridade(card, stageId) → boolean` — true se: VGV ≥ R$1,5M OU estágio Visita/Proposta com `dias` ativos OU `tag` presente OU score ≥ 85.
- `getComandoAcao(card, stageId) → string` — substitui `proximaAcaoDefault` por verbos imperativos: "Ligar agora", "Confirmar visita", "Enviar imóveis", "Cobrar decisão", "Iniciar pós-venda".
- `getMotivoPrioridade(card, stageId) → string` — frase curta para a fila ("Visita agendada para hoje", "3 dias sem retorno", "Lead novo aguardando abordagem").
- `buildFilaDoDia(stages) → Card[]` — seleciona top 3–5 ações priorizando: (1) visitas com `tag` de horário, (2) propostas com `dias ≥ 1`, (3) qualificados quentes sem interação, (4) atrasados (`dias ≥ 4`), (5) leads novos. Ordena por score desc, limita a 5.

### 2. Nova faixa "Fila Operacional do Dia" (topo)

Inserida entre o header da página e a linha de KPIs. Container `rounded-2xl bg-card border border-border p-4`.

- Título: `Hoje você precisa executar` (`font-display text-lg`).
- Subtítulo: `Prioridades operacionais recomendadas pela Ubroker IA.` (`text-xs text-muted-foreground`).
- Lista horizontal: `flex gap-3 overflow-x-auto` com cards `min-w-[260px] max-w-[280px]`.
- Cada mini-card mostra: nome do lead, chip do tipo de ação, motivo (1 linha), tempo/atraso (pill colorida por risco), VGV em `num`, botão `Executar agora` (`bg-navy text-navy-foreground h-8`).
- Empty state se vazio: linha discreta "Nenhuma execução pendente — bom trabalho."

### 3. Nova linha de KPIs operacionais (acima do kanban, abaixo da fila)

Grid `grid-cols-2 md:grid-cols-5 gap-3`. Cards `rounded-xl bg-card border border-border p-3` com label uppercase 10px + valor 20px medium. Todos derivados:

- **Execução do dia** — `X/Y tarefas` (Y = total de cards com ação devida hoje, X = mock fixo coerente, ex.: 14/18).
- **Tempo médio de resposta** — string fixa coerente "1h42".
- **Leads negligenciados** — count de cards com `dias ≥ 4`.
- **Cadências em atraso** — count de cards com `dias ≥ 3` em Visita/Proposta.
- **Taxa de execução** — derivada de execução do dia (%).

Manter os indicadores existentes do header ("X oportunidades · VGV", "oportunidades próximas de fechamento") intactos.

### 4. Refinos nos cards do kanban

Sem mudar layout principal. Adições discretas:

- **Borda/destaque prioritário**: cards com `getPrioridade === true` ganham `border-l-2 border-l-brand` + `shadow-md ring-1 ring-brand/20`. Cards comuns mantêm visual atual.
- **Badge "Prioritário"**: pequeno chip `bg-brand/10 text-brand text-[10px]` no topo direito (substitui o atual "🎯 Foco" — mesma lógica `isDestaque` ampliada via `getPrioridade`).
- **Score operacional**: linha discreta abaixo da comissão — `🧠 Score 87` em `text-[11px] text-muted-foreground` (cor verde se ≥80, âmbar 50–79, vermelho <50 — apenas no número).
- **Risco de perda**: pill `text-[10px]` ao lado da urgência: `Baixo risco` (slate), `Médio risco` (amber), `Alto risco` (red). Suprimida quando estágio = Fechado.
- **Próxima ação imperativa**: trocar `proximaAcaoDefault` + `c.proximaAcao` pela saída de `getComandoAcao`. Label muda de "Próximo passo:" para "Ação:" e o comando vira `font-semibold text-foreground`.

### 5. Ordem de renderização final na página

```
Header (título + botão Nova oportunidade)
↓
Fila Operacional do Dia (novo)
↓
KPIs operacionais (novo, 5 cards)
↓
Kanban (existente, com refinos)
```

### 6. Responsividade

- Fila do dia: `overflow-x-auto` em todas as breakpoints (já mobile-friendly).
- KPIs: `grid-cols-2 md:grid-cols-5`.
- Kanban: mantém comportamento atual (`auto-cols-[300px]` mobile, 5 colunas em lg).

### Critérios de aceite

- Faixa "Hoje você precisa executar" visível no topo com 3–5 ações priorizadas.
- Cards do kanban mostram Score, Risco e Ação imperativa; prioritários têm destaque sutil sem poluir.
- Linha de 5 KPIs operacionais visível acima do kanban.
- Nenhuma mudança fora de `app.pipeline.tsx`. Estética continua leve e consistente com o restante do sistema.
