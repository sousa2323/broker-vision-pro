## Plano — Indicações Admin como sistema escalável de gestão de rede (aditivo)

Atualização **estritamente aditiva** sobre `src/routes/admin.indicacoes.tsx`. Nada existente é removido. Sem nova rota, sem novo arquivo de página. Reusa `referralTree`, `adminBrokers` e `formatBRL` existentes. Adiciona dados de rede em `src/data/admin-mock.ts`.

---

### 1. Camada de dados (`src/data/admin-mock.ts`) — aditivos no final

Tipos e datasets novos, sem alterar `referralTree` nem `ReferralNode`:

- `type RedeIndicacaoStatus = "Ativo" | "Teste" | "Inativo"`
- `type RedeIndicacaoItem`: `{ id, nome, nivel: 1|2|3, indicador: string, indicados: number, status, mrr, receitaAcumulada, receitaPaga, receitaPendente, dataEntrada: string, crescimentoPct: number }`
- `redeIndicacoes: RedeIndicacaoItem[]` — derivado/expandido a partir de `referralTree` (achatado) e enriquecido com dados financeiros mock (≈ 14 itens cobrindo N1/N2/N3, com ao menos 2 inativos, 2 em teste).
- `redeIndicacoesPeriodoAnterior`: `{ totalIndicados, mrrN1, mrrN2, mrrN3, receitaTotal }` — para % crescimento.
- `redeAlertas`: lista de alertas dinâmicos (ex.: "Joana Maciel parou de gerar receita", "Queda de 12% na rede em outubro", "3 indicados em churn").
- `redeInsights`:
  - `concentracaoTop`: `% da receita gerada pelos top 3 indicadores`.
  - `profundidadeMedia`: número (média de níveis por ramo).
  - `conversaoPorNivel`: `[ {nivel:1, pct:62}, {nivel:2, pct:38}, {nivel:3, pct:21} ]`.
  - `evolucaoRede`: 6 meses `[ {mes, indicados, mrr} ]`.

### 2. Topo — manter os 4 KPIs + Receita recorrente, adicionar 2 evoluções

Estrutura atual preservada (mesmo grid 4 colunas + bloco "Receita recorrente total"). Aditivos:

- Em cada KPI de MRR (N1/N2/N3) e em "Total de indicados": badge pequeno abaixo do valor com `+X% vs mês anterior` (verde/vermelho conforme sinal), calculado a partir de `redeIndicacoesPeriodoAnterior`.
- No bloco "Receita recorrente total": adicionar mini-barras horizontais mostrando **% de contribuição por nível** (N1/N2/N3) com valor numérico ao lado.

### 3. Nova seção — Filtros da rede

Inserida **logo abaixo do bloco "Receita recorrente total"**, antes da árvore atual. Barra única com:

- Campo de busca (input) por nome.
- Select "Período": Este mês / Últimos 3 meses / Últimos 6 meses / Tudo.
- Select "Nível": Todos / N1 / N2 / N3.
- Select "Status": Todos / Ativo / Teste / Inativo.
- Select "Faixa de receita": Todos / Até R$200 / R$200–500 / R$500+.
- Botão "Limpar filtros".

Estado local (`useState`) controla todos os filtros e alimenta a tabela da seção 4. Sem efeito sobre árvore, KPIs ou outros blocos (filtros locais à tabela).

### 4. Nova seção — Lista da rede (tabela escalável)

Inserida **logo após a barra de filtros**, antes da árvore. Card com título "Rede de indicações" e botão "Exportar" (dropdown — ver seção 8).

Tabela com colunas:
Corretor (avatar+nome) · Nível (badge N1/N2/N3) · Indicador · Indicados · Status (badge colorido) · MRR · Receita acumulada · Receita paga · Receita pendente · Data entrada · Ações.

Coluna Ações: ícones — "Ver detalhes" (abre dialog com dados financeiros completos do corretor), "Expandir rede" (rola para a árvore e expande o nó correspondente), "Exportar" (gera CSV individual).

Paginação simples client-side (10 por página) ou virtualização leve via `slice`. Ordenável por receita/indicados/data clicando no header.

### 5. Atualização da árvore existente — colapsada por padrão + drill-down

Mantém o componente atual (mesmo card, mesmo layout visual), mas troca a renderização achatada por uma versão recursiva colapsável:

- Cada nó com `filhos` exibe um chevron (`ChevronRight`/`ChevronDown`) clicável.
- Estado `expanded: Set<string>` (por nome) controla quais nós estão abertos.
- **Inicialmente apenas a raiz aparece expandida** (Ramon Capone visível, filhos colapsados).
- Botões "Expandir tudo" / "Recolher tudo" no topo do card.
- Quando o usuário clica em "Expandir rede" na tabela (seção 4), o nó alvo entra no Set e o card rola até ele.

Visual idêntico ao atual (mesmas badges N0/N1/N2/N3, mesma tipografia).

### 6. Nova seção — Performance da rede

Inserida **abaixo da árvore**, substituindo o bloco fixo "Top indicadores da rede" por um grid de 3 cards (mesmo padrão visual):

1. **Top por receita** — top 5 ordenados por `mrr` (lista atual evoluída, agora dinâmica de `redeIndicacoes`).
2. **Top por crescimento** — top 5 por `crescimentoPct` (badge verde com `+X%`).
3. **Indicadores inativos** — lista dos `status === "Inativo"` com motivo ("Sem receita há Xd") e botão "Notificar".

O bloco fixo atual é **substituído pelo card "Top por receita"** (mantém a mesma intenção, mas dinâmico). Nenhum dado novo conflita.

### 7. Camada financeira por corretor

Já entra na tabela (seção 4) como 3 colunas: Receita acumulada, Receita paga, Receita pendente. Adicionalmente, no dialog "Ver detalhes" da seção 4, mostrar:

- Resumo financeiro grande (3 cards: gerada / paga / pendente).
- Mini-tabela de últimos 6 repasses mock (data, valor, status).

### 8. Exportação

Botão "Exportar" no header do card "Rede de indicações" abre dropdown com 5 opções:

- Relatório por corretor (CSV de um corretor — habilita só após seleção; ou abre seletor)
- Relatório da rede completa (CSV de `redeIndicacoes`)
- Receita por período (CSV de `evolucaoRede`)
- Receita por nível (CSV agregado por N1/N2/N3)
- Histórico de repasses (CSV mock)

Implementação: helper local `downloadCSV(filename, rows)` que monta blob `text/csv` e dispara `<a download>`. Sem dependência nova.

### 9. Nova seção — Alertas da rede

Card "Alertas da rede" inserido **acima da seção Performance** (entre tabela e performance). Lista os itens de `redeAlertas` com ícone (`AlertTriangle` âmbar / `AlertCircle` vermelho) + texto + ação opcional ("Ver corretor"). Tipos:
- Indicador parou de gerar receita
- Queda de performance da rede no mês
- Redução de receita recorrente
- Churn de indicados (saídas no período)

Reusa o padrão visual de alertas já existente em outras telas admin (mesma estrutura de `Card` com lista divisível).

### 10. Nova seção — Insights estratégicos

Card "Insights da rede" inserido **abaixo de Performance da rede** (último bloco da página). Grid 2x2 em desktop:

1. **Concentração de receita** — "Top 3 indicadores geram X% da receita" + barra horizontal.
2. **Profundidade da rede** — número grande (média de níveis) + breakdown N1/N2/N3 (quantidade de nós).
3. **Conversão por nível** — 3 barras horizontais com `%` (N1/N2/N3) usando `conversaoPorNivel`.
4. **Evolução da rede** — mini-gráfico SVG (mesmo padrão SVG já usado em `admin.index.tsx`) com linha de MRR ou indicados ao longo de 6 meses.

### 11. Restrições respeitadas

- Sem nova rota, sem novo arquivo de página. Edição de **2 arquivos**: `src/data/admin-mock.ts` + `src/routes/admin.indicacoes.tsx`.
- KPIs do topo, bloco de receita recorrente total e árvore **mantidos** (árvore apenas torna-se colapsável; tipo `ReferralNode` intacto).
- Lógica de cálculo dos níveis não muda (`flatten` continua funcionando; novos selectors derivam da mesma estrutura).
- Componentes shadcn já presentes reusados (`Badge`, `Button`, `Input`, `Card`, `Table`, `Dialog`, `DropdownMenu`, `Collapsible`).
- Sem novas dependências.
- Identidade visual mantida (mesmos tokens, mesmas classes Tailwind, mesma família tipográfica `font-display`, `num`).

---

### Arquivos afetados

- **Editado** `src/data/admin-mock.ts` — adiciona ao final: tipos `RedeIndicacaoStatus`, `RedeIndicacaoItem`; datasets `redeIndicacoes`, `redeIndicacoesPeriodoAnterior`, `redeAlertas`, `redeInsights`. Nada existente alterado.
- **Editado** `src/routes/admin.indicacoes.tsx` — adiciona % crescimento e contribuição por nível no topo; novas seções (filtros, tabela da rede com ações + dialog de detalhes, alertas, performance dinâmica em 3 cards, insights); converte renderização da árvore para versão colapsável (preservando aparência); adiciona helper `downloadCSV` e dropdown de exportação.

Nenhum arquivo deletado. Nenhuma rota alterada. Nenhum KPI ou bloco existente removido.