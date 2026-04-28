
# Financeiro V2 — Governança e Controle

Evolução da tela `/admin/financeiro` adicionando camadas de governança, rastreabilidade, risco e exportação **sem alterar** a estrutura base (cards do topo, abas, tabela). Todas as adições são incrementais.

## 1. Enriquecer mock (`src/data/admin-mock.ts`)

Estender o tipo `Cobranca` (não-breaking — campos adicionais opcionais) e popular dados realistas:

- `status` agora inclui `"Contestado"`.
- Novos campos: `criadoEm`, `faturadoEm`, `pagoEm?`, `vendaId?` (link para `VendaDetalhada`), `diasAtraso?`, `divergencia?: { esperado: number; cobrado: number }`.
- Nova estrutura `corretorRisco: Record<string, { nivel: "baixo" | "medio" | "alto"; pctAtraso: number; totalAberto: number }>`.
- Expandir lista de cobranças (12–16 itens) com mistura realista de origens, status, divergências e atrasos para alimentar todas as visualizações.

## 2. Filtros avançados (Camada 1)

Acima da tabela de Cobranças, adicionar barra de filtros colapsável:

- **Período**: date-range (Popover + Calendar shadcn, `mode="range"`, `pointer-events-auto`).
- **Corretor**: Select com busca (Command/Popover) usando lista derivada das cobranças.
- **Tipo de receita**: chips (Parceria / Lead Ubroker / SaaS).
- **Status**: chips estendidos (inclui Contestado) — substitui o filtro atual mantendo o mesmo visual.
- **Estratégicos** (linha secundária recolhível "Filtros avançados"): valor mín/máx, atraso > N dias, "Apenas alto valor (> R$5k)" toggle.
- Botão "Limpar filtros" + contador "X de Y cobranças".

Estado local com `useState` e função `aplicarFiltros(cobrancas)` pura.

## 3. Seletor de período + KPIs dinâmicos (Camada 7)

Acima dos 3 cards principais existentes, adicionar tira com 4 chips: **Hoje · 7 dias · 30 dias · Personalizado**. Recalcula `totalRecebido`, `totalPendente`, `totalAtraso` via filtragem por `pagoEm`/`vencimento`. Cards principais permanecem visualmente idênticos.

## 4. Indicadores de saúde financeira (Camada 8)

Logo abaixo dos 3 cards atuais, grid de 4 mini-cards densos:

- Taxa de inadimplência (%)
- Ticket médio
- Tempo médio de pagamento (dias)
- % receita por origem (mini barra empilhada Parceria / Lead / SaaS)

Mesmo estilo visual dos KPIs existentes, mas em variante compacta para não competir com os cards principais.

## 5. Coluna "Risco" (Camada 4)

Nova coluna entre `Status` e `Ações`. Bolinha colorida (`bg-emerald-500` / `bg-amber-500` / `bg-red-500`) + label curto. HoverCard (shadcn) com:

- % de pagamentos em atraso do corretor
- Total em aberto
- Histórico curto (últimas 3 cobranças)

## 6. Mini-conciliação visual (Camada 9)

Ícone à esquerda do `valor`:

- ✓ verde quando `divergencia` ausente.
- ⚠ âmbar quando há divergência.

Tooltip mostra "Esperado X · Cobrado Y · Δ Z".

## 7. Coluna "Origem detalhada" + Modal (Camadas 2 e 3)

Botão ícone `<FileSearch />` em nova coluna (ou dentro de Ações como item primário "Ver origem"). Abre `Dialog` shadcn com 4 seções:

1. **Venda vinculada**: imóvel, VGV, tipo de operação (consulta `vendasDetalhadas` por `vendaId`; fallback "Cobrança SaaS recorrente" quando não houver venda).
2. **Comissão**: % total, divisão por participante, % Ubroker, **valor calculado vs valor cobrado** com badge de divergência se aplicável.
3. **Envolvidos**: lista corretor(es) com avatar.
4. **Timeline financeira** (Camada 3): linha vertical com nós Criado → Faturado → Vencimento → Pago. Se atrasado, badge vermelho "X dias em atraso" no nó de Vencimento.

## 8. Ações operacionais expandidas (Camada 5)

DropdownMenu na coluna Ações (substitui os 3 ícones soltos por um trigger `<MoreHorizontal />` + mantém o atalho "Marcar como pago" como ícone visível para fluxo rápido):

- ✓ Marcar como pago
- 📄 Gerar cobrança (toast simulado)
- ⚠ Marcar como contestado
- 🔍 Ver origem (abre o modal)
- ✏ Editar cobrança (toast simulado)

Usar `sonner` (`toast.success`) para feedback simulado — sem mutação real do mock.

## 9. Exportação inteligente (Camada 6)

Adicionar botão "Exportar" no header da seção (não existia ainda). DropdownMenu com 4 opções, todas geram CSV client-side via `Blob` e `URL.createObjectURL`:

- Exportar dados filtrados (CSV)
- Relatório por corretor (agrupado)
- Relatório contábil (SaaS vs Comissão)
- Relatório de inadimplência (apenas Atrasado/Contestado)

## 10. Agrupamento (Camada 10 — preparação)

Adicionar utilitário `agruparCobrancas(cobrancas, por: "corretor" | "origem" | "mes")` em `src/data/admin-mock.ts`, sem UI agora. Comentário `// TODO: usado por views futuras de agrupamento`.

## Arquivos afetados

- **Editar** `src/data/admin-mock.ts` — estender tipo Cobranca, adicionar `corretorRisco`, util de agrupamento, dados ricos.
- **Editar** `src/routes/admin.financeiro.tsx` — toda a UI nova (filtros, KPIs de saúde, novas colunas, modal, dropdowns, export). Aba "Cobranças" recebe ~80% das mudanças; abas "Vendas" e "Conciliação" permanecem intactas.

## Detalhes técnicos

- shadcn já disponível: `dialog`, `dropdown-menu`, `popover`, `calendar`, `command`, `hover-card`, `tooltip`, `select`, `sonner`. Sem novas deps.
- Date range: `Calendar mode="range"` com `className="p-3 pointer-events-auto"`.
- Status "Contestado" → cor `bg-purple-50 text-purple-700`, mantendo o padrão de pílulas existente.
- CSV: helper local `toCSV(rows: Record<string, unknown>[])` com escape de `"` e separador `;` (compatível com Excel pt-BR).
- Tipos derivados (`StatusCobranca`) atualizados para incluir `Contestado`.
- Layout base, classes Tailwind, paleta (`bg-warm`, `bg-surface`, `text-emerald-700` etc.) e estrutura de abas **inalterados**.

## Fora de escopo

- Sem gateway de pagamento, sem persistência, sem mudanças em outras telas admin.
- Sem alteração nas abas "Detalhamento de vendas" e "Conciliação" além de poderem se beneficiar dos mesmos dados de venda.
