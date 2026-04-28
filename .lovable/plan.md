# Plano — Conciliação Inteligente (Admin › Financeiro)

Evolução **aditiva** da aba "Conciliação" em `src/routes/admin.financeiro.tsx`. Nada da estrutura existente (abas, colunas base, KPIs de cobranças, modal de cobrança, identidade visual) será removido ou redesenhado.

## 1. Camada de dados (`src/data/admin-mock.ts`)

Expandir `Conciliacao` com campos sem quebrar usos atuais:

- `vgv: number`, `tipo: "Parceria" | "Lead Ubroker" | "SaaS"`, `imovel: string`
- `comissaoPct: number`, `comissaoTotal: number`, `splits: { nome; valor; tipo }[]`
- `criadoEm, faturadoEm, pagoEm?: string`, `diasDesdeFatura: number`
- `statusOperacional: "Em cobrança" | "Em negociação" | "Promessa de pagamento" | "Sem retorno" | "—"`
- `interacoes: { tipo: "Ligação"|"Mensagem"|"Negociação"; obs: string; data: string; autor: string }[]`
- `auditoria: { data; autor; acao; valorAnterior?; valorNovo? }[]` (cobrança criada, fatura enviada, tentativas, ajustes)

Atualizar status do mock para cobrir os 4 estados (Confirmada, Divergente, Pendente, **Parcial**) e popular pelo menos 6–8 linhas com cenários variados (parcial, divergência alta, atraso crítico, etc.).

Adicionar tipo `StatusConciliacao = "Confirmada" | "Divergente" | "Pendente" | "Parcial"` e helper `calcularStatusConciliacao(esperado, recebido)`.

## 2. Tabela Conciliação — colunas adicionais

Manter ID, Venda, Corretor, Esperado, Recebido, Status. **Adicionar à direita**:

- **Diferença** — `esperado - recebido`. R$ 0 neutro, positivo laranja (em aberto), negativo azul (acima do esperado).
- **Risco** — Baixo/Médio/Alto combinando dias desde fatura, % divergência e `corretorRisco[corretor]`. Badge colorido com `HoverCard` mostrando os critérios.
- **Status operacional** — chip discreto (Em cobrança / Negociação / Promessa / Sem retorno).
- **Ações** — `DropdownMenu` por linha: Confirmar pagamento, Ajustar valor recebido, Marcar como divergente, Registrar contato/cobrança, Ver cobrança completa, Ver contrato da parceria.

Status na coluna existente passa a ser **calculado** e inclui badge "Parcial" (âmbar claro). Linhas com alerta crítico ganham ícone à esquerda do ID:

- Recebido < 70% esperado → ⚠️ "Valor muito abaixo"
- Diferença ≥ R$ 10.000 → 🔴 "Alto impacto financeiro"
- `diasDesdeFatura > 15` sem pagamento → ⏳ "Atraso crítico"

Tudo via `Tooltip`, sem alterar largura/altura base das linhas.

## 3. Cabeçalho da aba — Visão de controle + filtros

Acima da tabela (dentro do `tab === "conciliacao"`), adicionar:

- **4 KPIs compactos** (mesmo estilo dos cards atuais): Total conciliado, Total divergente, Total pendente, Valor em risco (divergências + pendentes).
- **Barra de filtros colapsável**: Status de conciliação, Risco, Corretor (search), Valor mín/máx, "Somente com divergência" (switch). Implementar com `useState` + `useMemo` aplicando aos dados antes da renderização e dos KPIs.

## 4. Modal de Conciliação

Novo componente `ConciliacaoDetalheModal` (Dialog), aberto ao clicar na linha ou em "Ver cobrança completa". Cinco blocos:

1. **Resumo da venda** — imóvel, VGV, tipo.
2. **Comissão detalhada** — % total, valor total, splits (Captador / Parceiro / Fee Ubroker).
3. **Conciliação** — esperado, recebido, diferença, status atual (com badge).
4. **Ações diretas** — botões: Confirmar pagamento, Ajustar valor (input inline com confirmação), Registrar divergência, Registrar cobrança realizada. Ações que mexem em valor/status pedem confirmação (`AlertDialog`) e disparam `toast` + entrada na auditoria local (state).
5. **Histórico / Auditoria** — timeline vertical: cobrança criada → fatura enviada → tentativas → pagamento → ajustes. Cada item: data, autor, ação, valor anterior → novo quando aplicável.

Abaixo do bloco 5, **CRM de cobrança**: lista de interações + formulário curto (Select tipo, Textarea observação, botão Registrar) que faz `setState` local e adiciona toast.

## 5. Governança e segurança

- Toda ação no modal cria entrada em `auditoria` (state local) com autor "Superadmin", timestamp simulado, valor anterior/novo.
- Confirmar pagamento e Ajustar valor exigem confirmação via `AlertDialog`.
- Estado é local (sem backend) — protótipo administrativo apenas.

## 6. Exportação inteligente

Estender `ExportarMenu` (ou criar variante específica da aba) com:

- Relatório de divergências (linhas Divergente + Parcial)
- Relatório de inadimplência de conciliação (Pendente + atraso crítico)
- Relatório por corretor (conciliação) — agregação esperado/recebido/diferença
- Histórico completo de auditoria (flatten de todas as entradas)

## 7. Restrições respeitadas

- Abas Cobranças / Detalhamento / Conciliação **inalteradas**.
- Colunas base **mantidas** na mesma ordem, novas colunas **adicionadas à direita**.
- Tipografia, espaçamento, cores e layout preservados.
- Sem novas dependências; só componentes shadcn já presentes (Dialog, AlertDialog, DropdownMenu, HoverCard, Tooltip, Select, Switch, Textarea, Input, Button, Badge).

## Arquivos afetados

- **Editado** `src/data/admin-mock.ts` — expansão de `Conciliacao`, novo tipo de status, helper, mock enriquecido.
- **Editado** `src/routes/admin.financeiro.tsx` — KPIs + filtros da aba, colunas extras, alertas, dropdown de ações, novo `ConciliacaoDetalheModal`, CRM de interações, novos itens de export.

Nenhum arquivo será deletado.
