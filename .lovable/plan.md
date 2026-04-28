## Plano — Financeiro Admin: Resultado + Despesas (aditivo)

Atualização **estritamente aditiva** sobre `src/routes/admin.financeiro.tsx`. Nada de existente é renomeado, removido ou reordenado. Sem nova rota, sem novo arquivo de página.

---

### 1. Camada de dados (`src/data/admin-mock.ts`)

Adicionar (sem tocar nos tipos existentes):

- Tipo `Despesa`:
  ```
  { id, data, categoria: CategoriaDespesa, descricao, tipo: "Fixo"|"Variável",
    valor, status: "Pago"|"A pagar", observacao?, responsavel? }
  ```
- `CATEGORIAS_DESPESA = ["Marketing","Tecnologia","Operacional","Jurídico","Administrativo","Outros"]`.
- Mock `despesasMock`: ~10 itens distribuídos no mês corrente, mistura de Pago/A pagar, fixas e variáveis, valores coerentes com a receita atual para gerar margem ~15-30%.

### 2. Bloco "Resultado do período" (logo abaixo dos 3 KPIs principais)

Inserido entre as linhas 254 e 256 da página (após `KPI Recebido/A receber/Em atraso`, antes do bloco "saúde financeira"). Quatro cards na mesma estética do `KPI`/`MiniKPI` atual:

1. **Receita total** — reusa `totalRecebido + totalPendente` já calculados (não recalcula receita). Verde.
2. **Despesas totais** — soma de `despesas` no período filtrado (respeita `range` quando definido). Tom neutro.
3. **Resultado líquido** — `receita - despesas`. Verde se ≥ 0, vermelho se < 0.
4. **Margem** — `resultado / receita`. Badge: verde > 20%, âmbar 0-20%, vermelho < 0%.

Filtro de período já existente (`range`) também filtra as despesas — sem novos controles.

### 3. Faixa de alertas (opcional, topo do bloco Resultado)

Renderizada apenas quando aplicável:
- Resultado negativo no período → alerta vermelho.
- Despesas > 70% da receita → alerta âmbar.

Componente leve (div com `Alert` shadcn já presente no projeto).

### 4. Nova aba "Despesas"

Adicionada **ao final** das abas existentes em `admin.financeiro.tsx` linha 296:

```
Cobranças | Detalhamento de vendas | Conciliação | Despesas
```

Estado: `tab === "despesas"`. Não altera as outras três abas.

Conteúdo da aba:

**Filtros simples** (mesma estética dos filtros atuais): categoria (multi), status (Pago / A pagar), tipo (Fixo / Variável), busca por descrição.

**Mini-KPIs** (linha de 4): Total no período · Pagas · A pagar · Maior categoria.

**Tabela** com colunas: ID · Data · Categoria · Descrição · Tipo · Valor · Status · Ações.

**Ações por linha** (`DropdownMenu`): Editar · Marcar como paga (se "A pagar") · Excluir (com `AlertDialog` de confirmação).

**Botão "Nova despesa"** acima da tabela.

### 5. Modal de despesa (criar/editar)

`Dialog` shadcn novo, definido no mesmo arquivo (componente local `DespesaModal`). Campos:

Obrigatórios: Data (input date) · Categoria (Select com `CATEGORIAS_DESPESA`) · Descrição (Input) · Valor (Input number, máscara BRL) · Tipo (RadioGroup Fixo/Variável) · Status (RadioGroup Pago/A pagar).

Opcionais: Observação (Textarea) · Responsável (Input).

Validação simples client-side; toast de sucesso ao salvar; estado local em `useState<Despesa[]>(despesasMock)`.

### 6. Integração automática

Toda criação/edição/exclusão/marcar-paga atualiza o mesmo array `despesas` em estado local da página. Os 4 cards de Resultado e o alerta recalculam via `useMemo` a partir desse array. Sem persistência (protótipo).

### 7. Exportação

Estender `ExportarMenu` com 3 itens novos ao final do dropdown (sem mexer nos atuais):

- Relatório de despesas (CSV: id, data, categoria, descrição, tipo, valor, status, responsável).
- Relatório de resultado (CSV: período, receita, despesas, resultado, margem%).
- Relatório financeiro consolidado (CSV unificando KPIs + despesas agrupadas por categoria).

`ExportarMenu` recebe nova prop opcional `despesas`.

### 8. Restrições respeitadas

- Nenhuma rota nova. Nenhum arquivo novo. Apenas edição de 2 arquivos.
- KPIs, abas existentes, lógica de cobranças/vendas/conciliação **intactos**.
- Receita não é duplicada — reusa `totalRecebido + totalPendente`.
- Identidade visual mantida (componentes `KPI`, `MiniKPI`, `TabBtn`, cores `green/red/amber/navy`).
- Sem novas dependências.

---

### Arquivos afetados

- **Editado** `src/data/admin-mock.ts` — tipo `Despesa`, `CATEGORIAS_DESPESA`, `despesasMock`.
- **Editado** `src/routes/admin.financeiro.tsx` — bloco "Resultado do período" abaixo dos KPIs principais, alertas opcionais, nova aba "Despesas" ao final, componente local `DespesaModal`, helpers de cálculo (`totalDespesas`, `resultadoLiquido`, `margem`), 3 novos exports em `ExportarMenu`.

Nenhum arquivo deletado. Nenhuma rota alterada.