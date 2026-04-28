## Plano — Dashboard Admin como painel estratégico (aditivo)

Atualização **estritamente aditiva** sobre `src/routes/admin.index.tsx`. Nada existente é removido ou renomeado. Sem nova rota, sem novo arquivo. Reusa dados de `src/data/admin-mock.ts` (incluindo `despesasMock` já criado).

---

### 1. Camada de dados (`src/data/admin-mock.ts`) — pequenos aditivos

Adicionar ao final do arquivo, sem tocar em nada existente:

- `adminKpisExtra`:
  - `receitaMesAnterior: 540_000` (para comparativo de tendência)
  - `inadimplenciaAtualPct: 8.4`, `inadimplenciaMesAnteriorPct: 6.1`
  - `conversaoMesPct: 14.2`, `conversaoMesAnteriorPct: 16.0`
- `inteligenciaMercado`:
  - `regioesDemanda`: top 5 (cidade/bairro, leads, visitas) — Niterói/Icaraí, SP/Pinheiros, Rio/Barra, Maricá, Curitiba.
  - `tiposImovel`: top 5 (label, buscas) — Apto 2 quartos, Cobertura, Casa, Studio, Sala comercial.
  - `faixaPrecoDominante`: `{ min: 500_000, max: 1_000_000, share: 38 }` + 2 faixas secundárias.
  - `conversaoPorOrigem`: `[ {origem:"Lead Ubroker", pct:18}, {origem:"Parceria", pct:24}, {origem:"Indicação", pct:31} ]`.
- `performanceCorretores`:
  - `top`: 5 melhores (derivados de `adminBrokers` ordenado por `receita` + `conversaoPct` mock por nome).
  - `baixaPerformance`: 4 com baixa conversão / inativos (usa `Tiago Sá`, `Carla Souza`, `Rafael Couto`, `Joana Maciel`) com motivo (`"Inatividade 21d"`, `"Conversão 3%"`, etc.).

Tipos exportados para tudo acima.

### 2. Topo do Dashboard — Resultado real (substitui a primeira faixa atual)

Em `admin.index.tsx`, a section atual com 3 `BigKPI` (Receita total, Receita do mês, MRR SaaS) é **reorganizada em duas linhas** mantendo o componente `BigKPI`:

**Linha 1 — Visão operacional (curto prazo)** — 4 cards:
1. **Receita do mês** — `adminKpis.receitaMes` (verde, padrão atual).
2. **Despesas do mês** — soma de `despesasMock` (neutro/cinza).
3. **Resultado líquido** — `receitaMes - despesasMes` (verde se ≥0, vermelho se <0).
4. **Margem (%)** — `resultado / receitaMes`. Badge: verde >20%, âmbar 0–20%, vermelho <0%.

**Linha 2 — Visão de escala (longo prazo)** — 2 cards:
1. **Receita total da plataforma** — `adminKpis.receitaTotal` (acumulado).
2. **MRR SaaS** — `adminKpis.mrrSaas`.

Receita do mês **não é duplicada** — só aparece na linha 1. A linha 2 traz acumulado e recorrência.

### 3. Evolução de receita — comparativo + tendência

Mantém o gráfico SVG atual. Adiciona acima do gráfico um pequeno header:
- Variação vs mês anterior (`(receitaMes - receitaMesAnterior) / receitaMesAnterior * 100`).
- Ícone de tendência: `TrendingUp` verde (>+3%), `Minus` cinza (-3% a +3%), `TrendingDown` vermelho (<-3%).
- Label textual: "Crescimento" / "Estabilidade" / "Queda".

### 4. Receita por origem — % dinâmico + destaque

Mantém o donut. Ajustes mínimos:
- O `pct()` já existe e já é dinâmico — nada a mudar nesse ponto.
- Adicionar **destaque visual** ao slice de maior valor: sua linha na legenda recebe `font-medium`, badge "Principal fonte" e ponto colorido maior. O slice correspondente no SVG ganha `strokeWidth="22"` (vs 20).

### 5. Nova seção — Inteligência de mercado

Inserida **abaixo dos gráficos principais** (após a section "Receita por origem + Evolução"), antes dos MiniKPIs operacionais. Um único `Card` com título "Inteligência de mercado" contendo grid de 4 sub-blocos (2x2 em desktop, 1 col em mobile):

1. **Regiões com maior demanda** — lista top 5 (região · leads · visitas) com mini-barras horizontais proporcionais.
2. **Tipos de imóvel mais buscados** — lista top 5 com contagem.
3. **Faixa de preço dominante** — destaque grande da faixa principal + 2 secundárias com `%`.
4. **Conversão por origem** — barras horizontais com `%` por origem (Lead Ubroker, Parceria, Indicação).

Todos usam o mesmo padrão visual de `Card` interno do arquivo.

### 6. Nova seção — Performance de corretores

Inserida **abaixo de Inteligência de mercado**, antes dos MiniKPIs. Grid 2 colunas:

- **Top corretores** (`Card`): tabela compacta — Avatar · Nome · Receita · Conversão · Badge "Top". Top 5.
- **Baixa performance** (`Card`): tabela compacta — Avatar · Nome · Motivo · Badge âmbar/vermelho. Lista 4. Botão "Ver no admin de usuários" (Link para `/admin/usuarios`).

Reusa `adminBrokers` (avatar, nome, receita) + dados de `performanceCorretores`.

### 7. MiniKPIs operacionais — sem alteração

`Corretores ativos · Leads gerados · Parcerias ativas · Vendas registradas` permanecem como estão.

### 8. Alertas estratégicos — evolução do bloco existente

Mantém o bloco "Alertas estratégicos" e seus 4 alertas atuais. **Adiciona** novos alertas calculados dinamicamente, ao topo da lista, apenas quando aplicáveis:

- `resultadoLiquido < 0` → alerta vermelho: "Resultado negativo no mês".
- Margem < margem mês anterior em > 5pp → alerta âmbar: "Margem em queda vs mês anterior".
- `inadimplenciaAtualPct > inadimplenciaMesAnteriorPct + 1` → alerta âmbar: "Inadimplência crescente".
- `conversaoMesPct < conversaoMesAnteriorPct - 1` → alerta âmbar: "Queda de conversão".
- `despesasMes > receitaMes * 0.7` → alerta âmbar: "Aumento de despesas vs receita".

Reusa o componente `Alerta` já presente no arquivo. Os 4 alertas atuais (cobranças, parcerias, bypass, conciliações) seguem renderizados em seguida.

### 9. Restrições respeitadas

- Nenhuma rota nova. Nenhum arquivo novo. Edição de **2 arquivos**.
- Componentes existentes (`BigKPI`, `MiniKPI`, `Card`, `Alerta`) reusados — sem mudanças.
- Identidade visual mantida (oklch tokens atuais, mesmas classes Tailwind).
- Sem novas dependências.
- Dashboard "consome" dados de Financeiro reusando `despesasMock` já existente em `admin-mock.ts` (mesmo módulo de dados que `admin.financeiro.tsx` usa).

---

### Arquivos afetados

- **Editado** `src/data/admin-mock.ts` — adiciona `adminKpisExtra`, `inteligenciaMercado`, `performanceCorretores` e tipos relacionados ao final do arquivo.
- **Editado** `src/routes/admin.index.tsx` — reorganiza topo em 2 linhas (operacional/escala), adiciona header de tendência ao gráfico de evolução, destaque na receita por origem, 2 novas seções (Inteligência de mercado, Performance de corretores), e novos alertas dinâmicos no bloco existente.

Nenhum arquivo deletado. Nenhuma rota alterada. Nenhuma funcionalidade existente removida.