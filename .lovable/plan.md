# Plano — Admin/Indicações como Rede Dinâmica (grafo navegável, níveis relativos)

Atualização **estritamente aditiva/refatora interna** sobre os 2 arquivos já existentes. Sem nova rota, sem nova tela, sem mudança de identidade visual.

Arquivos editados:
- `src/data/admin-mock.ts` — adiciona `indicadorId` em cada item da rede e helpers de grafo.
- `src/routes/admin.indicacoes.tsx` — refatora lógica para "usuário base" + níveis relativos calculados.

---

## 1. Modelo de dados — virar grafo (mock)

Em `redeIndicacoes`, adicionar 2 campos por item (mantendo todos os existentes):
- `id` (já existe)
- `indicadorId: string | null` — id do indicador direto (`null` = raiz / Ramon).
- Manter `indicador: string` (nome) para compatibilidade.

Adicionar **Ramon Capone** como item raiz (`id: "RI-000"`, `indicadorId: null`) para que ele também seja "usuário base" selecionável.

Remover semanticamente o uso de `nivel` fixo (campo permanece no tipo por compatibilidade, mas a tela ignora — sempre calcula).

Novos helpers exportados:
- `getIndicadosDiretos(baseId)` — filhos imediatos.
- `getRedeRelativa(baseId)` — BFS retornando `Map<id, { item, nivelRelativo }>` apenas dos descendentes (níveis 1, 2, 3+).
- `getCaminho(baseId, alvoId)` — caminho ascendente (para breadcrumb opcional).

Tudo puro, sem dependência nova.

## 2. Estado de "Usuário Base" (contexto da tela)

No componente:
- `const [baseId, setBaseId] = useState<string>("RI-000")` (Ramon por padrão).
- `const baseUser = useMemo(() => redeIndicacoes.find(r => r.id === baseId), [baseId])`.
- `const redeRelativa = useMemo(() => getRedeRelativa(baseId), [baseId])` — recalcula tudo ao trocar.

Trocar usuário: dispara recálculo de KPIs, tabela, distribuição, insights, alertas. Sem reload de página, instantâneo.

## 3. Header novo — "Visualizando rede de:"

Logo abaixo do título existente "Indicações", inserir uma faixa:
- Avatar (inicial em círculo, padrão atual) + nome do `baseUser`.
- Subtítulo: "Indicador direto: {nome do pai} · Entrada: {data}" (ou "Raiz da rede" se Ramon).
- Botão "Trocar usuário" → abre `Dialog` com `Command`/Input de busca por nome (busca em todo `redeIndicacoes`). Selecionar → `setBaseId` e fecha.
- Botão "Voltar para Ramon" (atalho rápido) quando `baseId !== "RI-000"`.

## 4. KPIs do topo — agora relativos

Os 4 cards existentes passam a refletir a rede do `baseUser`:
- **Total de indicados** = tamanho de `redeRelativa`.
- **MRR Nível 1 / 2 / 3** = soma de MRR dos itens com `nivelRelativo === 1/2/3`.
- Variação vs período anterior: continua usando `redeIndicacoesPeriodoAnterior` (mock; quando `baseId !== "RI-000"`, escala proporcionalmente pelo share do baseUser para parecer realista).
- Adicionar abaixo de cada KPI de MRR: **% de participação** (MRR do nível ÷ MRR total da rede relativa).

Bloco "Receita recorrente total" → vira **Distribuição dinâmica N1/N2/N3** com:
- Barras horizontais proporcionais (largura = % do MRR total).
- Valor absoluto + percentual à direita.
- Tudo relativo ao `baseUser`.

## 5. Tabela "Rede de indicações" — refatorada

Fonte: `Array.from(redeRelativa.values())` (apenas descendentes, **não** o próprio base).

Colunas:
- Corretor (avatar + nome)
- **Nível (relativo)** — badge N1/N2/N3+ calculado
- **Indicador direto** — `indicador` (nome do pai)
- Indicados (quantos descendentes diretos esse corretor tem)
- Status
- MRR atual
- Receita acumulada
- Valor pago
- Valor pendente
- Data de entrada
- Ações

Filtros existentes mantidos (busca, nível, status, faixa). **Adicionar:**
- Período: 7d / 30d / 90d / Personalizado (mock — só filtra visual).
- Tipo de produto: Todos / IA / Inbox / Combo (mock — adicionar campo `produto` aos itens em admin-mock).

Paginação client-side mantida (10/pág).

## 6. Ações por linha (dropdown)

Substituir ações atuais por 3 itens:
- 🔎 **Ver rede deste corretor** → `setBaseId(row.id)` + scroll ao topo. Recalcula tudo.
- 📊 **Ver detalhes** → abre o `Dialog` já existente, agora enriquecido: mini-gráfico de evolução (SVG já presente em `EvolucaoChart`), histórico de repasses (já existe), composição da própria sub-rede (contagem N1/N2/N3 a partir de `getRedeRelativa(row.id)`).
- ⬇ **Exportar individual** → CSV daquele corretor + sub-rede.

## 7. Árvore — lazy / 1 nível por vez

Refatorar a árvore atual (que hoje usa `referralTree` estático) para usar `redeIndicacoes` como grafo:
- Renderizar **apenas o `baseUser`** + **filhos diretos** colapsados por padrão.
- Cada nó com indicados mostra chevron; click expande **somente** seus filhos diretos (busca via `getIndicadosDiretos(node.id)` no momento do clique). Sem recursão antecipada.
- Estado: `expanded: Set<string>` com ids expandidos.
- Ao clicar "Ver rede deste corretor" na tabela, a árvore também troca seu nó raiz para o novo base (consistente com o resto da tela).
- Botões "Expandir tudo" / "Recolher tudo" removidos (incompatível com escalabilidade). Substituir por contador "{n} indicados diretos · clique para expandir".

`referralTree` deixa de ser usado pela tela, mas permanece exportado em `admin-mock.ts` (não remover — pode ser usado em outro lugar).

## 8. Insights automáticos (novo bloco)

Card "Insights da rede" recalculado por `baseUser`. Regras simples sobre `redeRelativa`:
- Se MRR N1 caiu >10% vs período anterior → "Seu nível 1 caiu X% este mês".
- Se MRR N2 cresceu >15% → "Nível 2 está crescendo acima da média".
- Conta itens `Inativo` → "{n} usuários inativos impactando receita".
- Concentração: se top 3 > 60% do MRR → "Risco de concentração: top 3 = X%".

Substitui (mantendo o card) os insights mock estáticos atuais.

## 9. Alertas — relativos ao base

`redeAlertas` deixa de ser estático; gerado dinamicamente:
- Cada `Inativo` com `receitaAcumulada > 1000` → alerta âmbar "Indicador parou de gerar receita".
- Cada `crescimentoPct < -15` → alerta vermelho "Queda de performance".
- Concentração >60% → alerta âmbar.
Botão "Ver corretor" no alerta → `setBaseId(corretor.id)`.

## 10. Exportação — respeita contexto

Dropdown de exportação (já existe) atualizado:
- "Rede completa de {nome do base}" — CSV de `redeRelativa`.
- "Receita por nível (relativo)" — agregado N1/N2/N3.
- "Relatório financeiro" — pago/pendente/acumulado por corretor da rede.
- "Histórico de repasses" — `redeRepassesMock` (mantido).

Cada CSV inclui cabeçalho de contexto: `# Usuário base: {nome} · Período: {filtro} · Gerado em: {data}`.

## 11. Escalabilidade

- Sem expandir árvore inteira; só lazy 1 nível.
- Tabela paginada (10/pág) — funciona com 10k itens.
- Busca de "trocar usuário" usa `Command` com filtro client-side (rápido até alguns milhares de mocks). Para o mock atual (15 itens) é trivial.
- `getRedeRelativa` é BFS O(n); roda só ao trocar `baseId` (memoizado).

## 12. UX / preservação visual

- Mesma paleta, mesmas classes Tailwind, mesma tipografia (`font-display`, `num`).
- Mesmos componentes shadcn (`Card`, `Badge`, `Button`, `Input`, `Table`, `Dialog`, `DropdownMenu`, `Command` para a busca de troca de usuário).
- Sem nova dependência.
- Trocar usuário tem feedback instantâneo: toast "Visualizando rede de {nome}" + animação sutil de fade nos KPIs (CSS já existente).

---

## Restrições respeitadas

- ✅ Sem nova tela / nova rota.
- ✅ Identidade visual preservada.
- ✅ Estrutura base mantida (mesmos blocos, mesma ordem geral).
- ✅ Nível **calculado** (nunca fixo) e **relativo ao base**.
- ✅ Árvore lazy (1 nível por vez).
- ✅ Exportação respeita contexto.
- ✅ Sem dependência nova; só edição em 2 arquivos já existentes.
