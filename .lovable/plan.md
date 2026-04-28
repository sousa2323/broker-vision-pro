# Plano — Indicações Admin: Visão Geral primeiro, rede de corretor sob demanda

Refatorar a tela `/admin/indicacoes` para abrir como **painel global da rede Ubroker** e só mudar para o **modo "rede do corretor"** quando o admin selecionar um. Sem nova rota, sem nova tela, sem mudar identidade visual.

Arquivo único editado: `src/routes/admin.indicacoes.tsx`
(`src/data/admin-mock.ts` já tem tudo que precisamos: `redeIndicacoes`, `getIndicadosDiretos`, `getRedeRelativa`, `redeRepassesMock`, períodos anteriores.)

---

## 1. Dois modos da tela

Substituir `baseId` (que hoje começa em `"RI-000"` — Ramon) por:

- `mode: "global" | "broker"` — começa em `"global"`.
- `baseId: string | null` — `null` no modo global; preenchido só no modo broker.

Toda a renderização passa a ramificar por `mode`. Trocar para `"broker"` acontece apenas via:
- Botão "Buscar corretor" no header (abre Dialog de busca).
- Ação "Ver rede" na tabela de indicadores.
- Botão "Ver corretor" em alertas/insights.

Voltar para `"global"`: botão "← Voltar para visão geral" visível só no modo broker.

## 2. Header

**Modo global:**
- Título: "Visão geral da rede Ubroker"
- Subtexto: "Consolidado de indicações, recorrência e repasses da rede."
- Botão primário: "Buscar corretor" (ícone Search) → abre Dialog com Input de busca por nome/agência sobre `redeIndicacoes` (exclui `RI-000`). Selecionar → `setMode("broker")` + `setBaseId(id)`.
- Dropdown "Exportar" (ver §7).

**Modo broker:**
- Botão "← Voltar para visão geral" (ghost) acima do título.
- Título: "Visualizando rede de: {nome}"
- Subtexto: "Indicador direto: {pai} · Entrada: {data}" (ou "Raiz da rede" se Ramon).
- Botões: "Trocar corretor" (reabre o Dialog de busca) + "Exportar" (ver §7).

## 3. KPIs do topo

**Modo global** — 5 cards baseados em `redeIndicacoes` inteiro (excluindo `RI-000` da contagem):
1. Total de corretores na rede
2. MRR total de indicações (soma de `mrr`)
3. Receita paga no período (soma de `valorPago`)
4. Receita pendente (soma de `valorPendente`)
5. Crescimento da rede — % comparado ao mock `redeIndicacoesPeriodoAnterior` (variação no número de corretores ativos)

Sem destaque de N1/N2/N3 nesses cards.

**Modo broker** — manter os 4 cards atuais (Total de indicados, MRR N1, N2, N3 — relativos ao base, com `pctBadge`), exatamente como hoje.

## 4. Distribuição da rede

**Modo global** — substituir o bloco "Distribuição N1/N2/N3 (relativa)" por **3 sub-blocos lado a lado** (grid responsivo):

a) **Receita por nível global** — barras horizontais para N1/N2/N3 calculadas via `getRedeRelativa(ROOT_ID)` (Ramon como raiz absoluta da Ubroker). Mostra valor + %.

b) **Status da rede** — 3 contadores com mini-barras: Ativos / Em teste / Inativos. Source: agregação por `status` em `redeIndicacoes`.

c) **Produtos contratados** — 3 contadores: IA Assistente / Inbox / Combo. Source: agregação por campo `produto` (já existe no mock).

**Modo broker** — manter o bloco atual de Distribuição N1/N2/N3 relativa ao base.

## 5. Tabela principal

**Modo global** — listar **apenas indicadores** (corretores que têm pelo menos 1 indicado direto) ordenados por MRR gerado desc.

Source: `redeIndicacoes.filter(r => getIndicadosDiretos(r.id).length > 0)`.

Colunas:
- Corretor (avatar + nome + agência)
- Indicados diretos (count via `getIndicadosDiretos(id).length`)
- Rede total (count via `getRedeRelativa(id).size`)
- MRR gerado — soma de MRR de toda sub-rede
- Receita acumulada — soma `receitaAcumulada` da sub-rede
- Receita paga — soma `valorPago` da sub-rede
- Receita pendente — soma `valorPendente` da sub-rede
- Status (do próprio corretor)
- Ações (dropdown):
  - "Ver rede" → entra no modo broker
  - "Ver detalhes" → abre Dialog atual (financial/repasses)
  - "Exportar relatório do corretor" → CSV individual

Filtros: busca + status + faixa de MRR gerado. Paginação 10/pág (mantida).

**Modo broker** — manter a tabela atual de descendentes (rede relativa do base), filtros e ações como hoje.

## 6. Árvore / Grafo

**Modo global** — remover render da árvore lazy. Substituir por um Card compacto:
- Texto: "Visualize o grafo navegável da rede a partir de qualquer corretor."
- Botão único "Abrir grafo da rede" → entra no modo broker com `baseId = ROOT_ID` (Ramon).

**Modo broker** — manter o `LazyNode` atual (1 nível por vez, expandir sob demanda), inalterado.

## 7. Exportação (dropdown)

**Modo global:**
- "Consolidado da rede" — CSV de todos `redeIndicacoes` (id, nome, indicador, status, produto, mrr, acumulado, pago, pendente, data).
- "Relatório financeiro global" — agregados por status + totais.
- "Pendências de repasse" — todos com `valorPendente > 0`.

**Modo broker** (mantém atual):
- "Rede completa de {nome}"
- "Receita por nível (relativo)"
- "Repasses do corretor"

Cabeçalho de contexto em todos os CSVs (já implementado via param `context` em `downloadCSV`).

## 8. Insights e Alertas

**Modo global** — recalcular sobre a rede inteira:
- Insights: top 3 indicadores por MRR gerado, corretores inativos com receita acumulada > R$ 1k, concentração (top 3 / MRR total).
- Alertas: mesmas regras atuais, mas avaliando `redeIndicacoes` completo. Botão "Ver corretor" entra no modo broker.

**Modo broker** — manter lógica atual (relativa ao base).

## 9. Detalhes técnicos

- Estado novo: `const [mode, setMode] = useState<"global"|"broker">("global"); const [baseId, setBaseId] = useState<string|null>(null);`
- `baseUser = mode === "broker" && baseId ? redeIndicacoes.find(r => r.id === baseId) : null`
- Memos globais novos: `globalKPIs`, `nivelGlobal` (via `getRedeRelativa(ROOT_ID)`), `statusAgg`, `produtoAgg`, `indicadoresList` (com sub-rede agregada por id, calculado uma vez).
- Memos atuais (rede relativa, KPIs por nível, etc.) só rodam quando `mode === "broker"`.
- O Dialog de busca de corretor é reutilizado para "Buscar corretor" (global) e "Trocar corretor" (broker) — mesmo componente interno, controlado por `searchOpen`.
- Ação "Ver rede" e "Voltar para visão geral" fazem `window.scrollTo({top:0})` para feedback.
- Toast (sonner já disponível) ao entrar/sair do modo broker: "Visualizando rede de {nome}" / "Voltando à visão geral".

## 10. Restrições respeitadas

- Mesma rota, mesmo arquivo, mesma identidade visual (Tailwind/shadcn).
- Lógica de rede dinâmica e níveis relativos preservada (modo broker).
- Árvore continua lazy; no modo global ela nem renderiza.
- Sem nova dependência.
- `admin-mock.ts` intocado.
