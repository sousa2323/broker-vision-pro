## Etapa 3 — Prioridade inteligente + sensação de perda

Arquivo único editado: `src/routes/app.leads.tsx`. Sem mudanças em mock, sidebar, rotas, cards do topo, chips de filtro, colunas existentes ou lógica financeira.

### 1. Novo tipo `Nivel` (alta/media/baixa) + helpers

Adicionar logo após os helpers existentes (`getUrgencia`, etc.):

- `getNivel(l: Lead): "alta" | "media" | "baixa"` — regra puramente visual:
  - **alta**: `isAtrasado(l)` OU (`getPrioridade === "quente"` e `getUrgencia === "hoje"`) OU (top‑20% de comissão entre leads ativos com ação pendente).
  - **media**: ação para hoje (`getUrgencia === "hoje"`) OU (`getPrioridade === "morno"` com comissão acima da mediana).
  - **baixa**: `getPrioridade === "frio"` ou sem urgência.
- `getNivelMeta(n)` → `{ label, dot, chip, border }`:
  - alta → `🔴 Alta prioridade`, chip `bg-red-50 text-red-700 border-red-100`, border esquerda `border-l-red-500`.
  - media → `🟡 Média prioridade`, chip `bg-amber-50 text-amber-800 border-amber-100`, `border-l-amber-400`.
  - baixa → `⚪ Baixa prioridade`, chip `bg-slate-50 text-slate-600 border-slate-200`, `border-l-transparent`.
- `getNivelRank(n)` → 0/1/2.
- `getReforco(l): string | null` — microtexto de tensão para alta prioridade:
  - atrasado → `"Sem resposta há ${ultimaInteracao}"`
  - status Visita + hoje → `"Visita hoje — ainda não confirmada"`
  - status Proposta → `"Proposta enviada — sem retorno"`
  - quente sem `isHoje` → `"Lead quente sem contato"`
  - default → `null`

Limiar de comissão (top‑20%): calculado uma vez dentro do componente a partir de `leads` ativos:
```ts
const comissoesAtivas = leads.filter(isAtivo).map(l => getComissao(l.orcamento)).sort((a,b)=>b-a);
const topComissao = comissoesAtivas[Math.floor(comissoesAtivas.length * 0.2)] ?? Infinity;
const medianaComissao = comissoesAtivas[Math.floor(comissoesAtivas.length / 2)] ?? 0;
```
Passados para `getNivel` como segundo argumento (assinatura `getNivel(l, { topComissao, medianaComissao })`).

### 2. Ordenação atualizada

Substituir o sort atual por:
```
1. ativos antes de inativos (mantido)
2. nível: alta → media → baixa
3. maior comissão primeiro
```
(Remover o tiebreaker por urgência — nível já reflete urgência.)

### 3. Linha do lead — badge de prioridade

Na coluna **Lead**, abaixo (ou ao lado) do nome adicionar um badge discreto com `getNivelMeta`:

```
🔴 Alta prioridade
```

Estilo: `inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium` + `chip` do nível. Substituir o badge "Quente/Morno/Frio" atual por este badge de nível (mantém apenas 1 badge por linha, conforme Etapa 2). A bolinha colorida emoji entra como prefixo textual.

A `border-l-4` da `<tr>` passa a usar `getNivelMeta(...).border` em vez de `urgMeta.border`, reforçando prioridade visualmente.

### 4. Microtexto de reforço emocional

Na coluna **Próxima ação**, abaixo do label, quando `getReforco(l)` retornar string e o nível for `alta`:

```tsx
<div className="mt-1 text-[11px] font-medium text-red-600">⚠️ {reforco}</div>
```

Não alterar o restante da célula. Para outros níveis, nada extra (mantém limpeza).

### 5. Painel lateral — bloco de risco

Dentro do card "Potencial" do `<aside>`, abaixo do `subtextoUrg`, adicionar quando `selectedNivel === "alta"`:

```tsx
{reforcoSelected && (
  <div className="mt-2 rounded-md bg-red-50 px-2 py-1.5 text-xs font-medium text-red-700">
    ⚠️ {reforcoSelected}
  </div>
)}
{selectedNivel === "alta" && getPrioridade(selected.status) === "quente" && (
  <div className="mt-1 text-xs font-medium text-red-700">⚠️ Lead quente em risco de esfriar</div>
)}
```

Header do aside: trocar o badge "Quente/Morno/Frio" pelo badge de nível (mesma regra da tabela, 1 badge só).

### 6. Restrições respeitadas

- Nada de novas colunas, modais, drawers, rotas.
- Cards do topo, chips de filtro rápido, sidebar, mock e lógica financeira intactos.
- Nenhuma mudança em outros arquivos.

### Critérios de aceite mapeados

- Cada linha exibe um badge claro 🔴/🟡/⚪ + borda esquerda colorida correspondente.
- Leads de alta prioridade aparecem primeiro e têm microtexto vermelho de tensão ("Sem resposta há…", "Visita hoje — ainda não confirmada", etc.).
- Painel lateral reforça risco para leads críticos com bloco de alerta vermelho.
- Diferença visual imediata entre alta vs. baixa prioridade; baixa prioridade fica neutra/cinza.
- Ordenação: alta → média → baixa → maior comissão.
