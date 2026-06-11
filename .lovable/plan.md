# Plano — Reposicionamento do Dashboard `/admin`

Escopo: **somente** `src/routes/admin.index.tsx`. Sem novas rotas, libs, mudanças no sidebar ou em tokens. Reusa dados já disponíveis em `adminKpis`, `adminKpisExtra`, `inteligenciaMercado`, `performanceCorretores`, `disputas`, `bypassAlertas`, `despesasMock`. Mantém estilo visual atual (mesmos `Card`, `BigKPI`, `MiniKPI`, espaçamentos).

A tela responde apenas 4 perguntas: **Rede saudável? Marketplace funcionando? Colaboração acontecendo? Há risco sistêmico?**

---

## 1. Cabeçalho

- Renomear título: `Painel estratégico` → **`Saúde do ecossistema`**.
- Subtítulo novo: *"Supervisão da rede de corretores independentes da Ubroker."*

## 2. Substituir a linha 1 (financeiro) por **Saúde da Rede** (4 KPIs)

Remove os 4 `BigKPI` financeiros (Receita / Despesas / Resultado / Margem) do topo. No lugar, manter o mesmo grid `lg:grid-cols-4` com:

1. **Corretores ativos** — `adminKpis.corretoresAtivos` + variação derivada de `adminKpisExtra` (novo helper local `crescimentoBaseAtiva()` que compara contra um valor anterior fixo: ex. 720, com indicador `TrendingUp`).
2. **Execução média da rede** — média de `performanceCorretores.top[*].conversaoPct` ponderada; rotular "Execução média" com `Activity` icon.
3. **Conversão média** — `adminKpisExtra.conversaoMesPct` + delta vs `conversaoMesAnteriorPct` (componente `tendencia` já existe — reusar).
4. **Crescimento mensal** — variação % da base ativa (mesmo helper acima), badge "Crescimento / Estável / Queda".

Acima da seção: eyebrow `Rede · Outubro/2025`.

## 3. Nova linha 2 — **Visão institucional** (apenas 2 KPIs financeiros)

Mantém o bloco "Visão de escala · Acumulado" já existente, mas reduzido e renomeado para **"Visão institucional"**:
- `Receita total da plataforma`
- `MRR SaaS`

Os antigos KPIs de Despesas/Resultado/Margem **são removidos** do dashboard (continuam disponíveis em `/admin/financeiro`).

## 4. Bloco **Marketplace funcionando?** (novo, substitui "Receita por origem" + "Evolução")

Mantém o mesmo grid 2 colunas, mas com leitura nova:

- **Coluna esquerda — Atividade do marketplace**: 4 indicadores em lista compacta:
  - Leads gerados (`adminKpis.leadsGerados`)
  - VGV movimentado (derivar somando `inteligenciaMercado.faixaPrecoDominante` × `vendasRegistradas`, ou usar um helper `vgvMovimentado()` derivado de mocks de imóveis).
  - Vendas registradas (`vendasRegistradas`)
  - Imóveis em destaque (top 3 — derivar dos mocks de imóveis em `src/data/mock.ts`).
- **Coluna direita — Evolução de receita**: manter o gráfico atual (é leitura de tendência, não cobrança).

## 5. Inteligência de Mercado

**Preservar integralmente.** Sem alterações.

## 6. Bloco **Colaboração acontecendo?** (novo)

Acima/abaixo de Inteligência de Mercado, novo `Card title="Colaboração da rede"` com grid 4 colunas:
- Parcerias ativas (`adminKpis.parceriasAtivas`)
- Receita compartilhada (derivar % do `receitaPorOrigem.comissao`)
- Matches relevantes do mês (helper determinístico contando entradas em `adminParcerias` com status "Ativa" recente)
- Crescimento da colaboração (variação MoM — helper local)

Visual: mesmos `MiniKPI`, ícone `Handshake`.

## 7. **Destaques da Rede** (renomear "Top corretores")

- Renomear título do `Card`: `Top corretores` → **`Destaques da Rede`**.
- Trocar a coluna direita de "Receita" por **destaque qualitativo rotativo**:
  - 1º: "Maior conversão" (badge `Trophy`)
  - 2º: "Crescimento do mês" (`TrendingUp`)
  - 3º: "Maior colaboração" (`Handshake`)
  - 4º: "Melhor execução" (`Activity`)
- Remover o valor monetário grande; manter foto, nome, região (adicionar `c.regiao` se disponível, senão `Conversão X%`).
- Sem ranking competitivo agressivo: o `1, 2, 3` numérico vira ícone de destaque.

## 8. **Corretores que podem precisar de suporte** (renomear)

- Título do `Card`: `Corretores em baixa performance` → **`Corretores que podem precisar de suporte`**.
- Reescrever campo `motivo` em tom de apoio (helper local `motivoSuporte(c)`):
  - "Baixa produção" → "Queda recente de atividade"
  - "Sem leads" → "Poucos leads ativos"
  - "Inativo" → "Sem login há X dias"
  - "Baixa conversão" → "Baixa utilização da plataforma"
- Substituir badges "Crítico/Atenção" (vermelho/âmbar) por badge neutra única **`Atenção`** em tom suave (`bg-muted text-muted-foreground border-border`). Sem vermelho aqui.
- CTA mantém link para `/admin/usuarios`.

## 9. **Alertas Estratégicos** — focar em risco sistêmico

Reescrever a lista para refletir apenas risco da plataforma. Manter o `Card` existente com:

- **Bypass detectados** — usar `bypassAlertas.length` (vermelho se algum "Alto").
- **Disputas abertas** — contar `disputas.filter(d => d.status === "Aberta").length`.
- **Inadimplência crescente** — alerta dinâmico já existe (manter).
- **Divergências financeiras** — alerta de conciliação (manter, contando casos).
- **Queda coletiva de conversão** — alerta dinâmico já existe (manter).

**Remover** do dashboard:
- "8 parcerias ativas sem atualização há 14+ dias" (pertence a `/admin/parcerias`).
- "3 cobranças em atraso" (pertence a `/admin/financeiro`).
- Qualquer item operacional individual (visitas/propostas/tarefas).

## 10. Remoções explícitas (anti-microgerenciamento)

- Bloco financeiro de Despesas/Resultado/Margem do topo.
- "Receita por origem" donut (move-se para `/admin/financeiro` futuramente; aqui some).
- Alertas de operação individual de leads.
- Indicadores operacionais (`MiniKPI` Corretores ativos / Leads / Parcerias / Vendas) — substituídos pelo bloco "Marketplace" e "Colaboração" reformulados acima.

## Detalhes técnicos

- Helpers novos no topo do arquivo (puros): `execucaoMediaRede()`, `crescimentoBaseAtiva()`, `vgvMovimentado()`, `matchesRelevantes()`, `crescimentoColaboracao()`, `motivoSuporte(c)`, `destaqueQualitativo(idx)`.
- Reusar `BigKPI`, `MiniKPI`, `Card`, `Alerta` já definidos no arquivo (sem alterar assinatura).
- Vermelho restrito a: bypass de alto risco, inadimplência crescente, divergência financeira confirmada.
- Sem novas dependências, sem alterações em `admin-mock.ts`.

## Ordem final das seções

1. Saúde da Rede (4 KPIs)
2. Visão institucional (2 KPIs)
3. Marketplace funcionando? (atividade + evolução)
4. Inteligência de mercado *(preservada)*
5. Colaboração da rede (4 KPIs)
6. Destaques da Rede  |  Corretores que podem precisar de suporte
7. Alertas estratégicos (risco sistêmico)

## Critérios de aceite

- Topo do dashboard fala de **rede**, não de **caixa**.
- Nenhuma menção a "baixa performance", "cobrar", "tarefa pendente".
- Alertas só mostram risco sistêmico (bypass, disputas, inadimplência, divergência, queda coletiva).
- Inteligência de Mercado intacta.
- Visual idêntico ao atual: mesmos cards, mesmos espaçamentos, mesma tipografia.
