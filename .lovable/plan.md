## Evolução da tela Ganhos — Painel de crescimento

Único arquivo alterado: `src/routes/app.ganhos.tsx`. Sem mudanças em `src/data/mock.ts`, sidebar, rotas ou outras telas. Toda nova informação é derivada localmente a partir de `earnings`, `referrals` e `kpis`. Layout base (card de receita total, gráfico de composição, tabela de histórico) é mantido e enriquecido — não substituído.

## Layout final (top → bottom)

```text
┌──────────────────────────────────────────────────┬────────────────┐
│ Receita total (NAVY) — enriquecido               │ Composição     │
│  R$ 96.480 · ↑ +12% vs mês anterior              │ (donut + %)    │
│  "Maior parte vem de comissões de imóveis"       │ Comissão 99,5% │
│  ┌─ Comissão de imóveis ──┬─ SaaS · Indicações ┐ │ SaaS 0,5%      │
│  │ R$ 96.000              │ R$ 480             │ │                │
│  │ Próprio R$ 72k         │ 4 indicados ativos │ │                │
│  │ Parceria R$ 24k        │ R$ 480/mês recorr. │ │                │
│  └────────────────────────┴────────────────────┘ │                │
└──────────────────────────────────────────────────┴────────────────┘
┌─────────────────────────── Bloco de incentivo (warm/orange) ─────┐
│ 💡 Você já gerou R$ 480 com indicações                          │
│    Faltam R$ 120 para cobrir sua mensalidade · 0,5% da receita  │
│                                       [ Convidar corretores → ] │
└──────────────────────────────────────────────────────────────────┘
┌──── Projeção de ganhos ──────────────────────────────────────────┐
│ Este mês (estimado) R$ 102k · Ano R$ 1,2M                        │
│ "Você está aumentando sua receita com parcerias" (microcopy)    │
└──────────────────────────────────────────────────────────────────┘
┌──── Histórico de transações (existente, enriquecido) ────────────┐
│ chips coloridos azul/laranja + descrição mais rica + tooltip    │
└──────────────────────────────────────────────────────────────────┘
```

## Mudanças por bloco

### 1. Card de receita total (NAVY) — enriquecer
- Logo abaixo do valor `R$ 96.480`, adicionar linha com badge verde `↑ +12% vs mês anterior` (TrendingUp icon, `bg-emerald-500/15 text-emerald-300`).
- Subtexto contextual em `text-white/70`: "Maior parte da sua receita vem de comissões de imóveis."
- Dentro dos dois sub-blocos (Comissão / SaaS), adicionar duas linhas pequenas:
  - Comissão: "Próprio R$ 72.000 · Parceria R$ 24.000" (split fictício 75/25 derivado de `earnings.comissao`).
  - SaaS: "{referrals.ativos.length} indicados ativos · R$ {sum mrr}/mês recorrente".

### 2. Card Composição (lateral) — adicionar percentuais
- Calcular `pct = value / total * 100` e exibir ao lado de cada item da legenda (`Comissão 99,5%`, `SaaS 0,5%`).
- Manter donut atual.

### 3. Bloco de incentivo (NOVO) — abaixo do grid superior
- Card `rounded-2xl border-l-4 border-l-warm bg-orange-50/60 p-5` com layout `flex justify-between`.
- Esquerda: ícone `Sparkles` + título "Você já gerou R$ 480 com indicações" + subtítulo "Faltam R$ 120 para cobrir sua mensalidade · representa 0,5% da sua receita".
- Direita: botão `bg-warm text-warm-foreground` "Convidar corretores" linkado via `<Link to="/app/indicacoes">`.

### 4. Bloco de projeção (NOVO)
- Card `rounded-2xl border bg-card p-6` com 2 colunas:
  - "Este mês (estimado)" — calcular como `total / diaAtual * 30` (≈ R$ 102k considerando dia ~28).
  - "Projeção anual" — `estimadoMes * 12`.
- Microcopy abaixo, em `text-sm text-emerald-700`: "Você está aumentando sua receita com parcerias · Indicações reduzem seu custo fixo."
- Ícone `TrendingUp` discreto.

### 5. Histórico de transações — enriquecer
- Trocar chips simples por chips com cor mais clara: Comissão = `bg-blue-100 text-blue-800`, SaaS = `bg-orange-100 text-orange-800` (já parecidos, mas reforçar consistência com paleta da marca).
- Substituir `descricao` simples por descrição + linha pequena `text-xs text-muted-foreground` com contexto:
  - T-01/T-02 → "Venda realizada · {parceria | direta}".
  - T-03..T-06 → "Recorrência de indicação ativa".
- Envolver a célula descrição em `<Tooltip>` (componente já existente) com texto longo explicativo.

## Dados derivados (locais)

```ts
const comissaoPropria = Math.round(earnings.comissao * 0.75);    // 72.000
const comissaoParceria = earnings.comissao - comissaoPropria;     // 24.000
const indicadosAtivos = referrals.ativos.length;                  // 4
const mrrIndicacoes = referrals.ativos.reduce((s,r)=>s+r.mrr,0);  // 480
const pctComissao = earnings.comissao / earnings.total * 100;     // 99.5
const pctSaas = earnings.saas / earnings.total * 100;             // 0.5
const variacaoMes = 12;                                           // fictício
const faltaMensalidade = Math.max(0, 600 - earnings.saas);        // 120
const estMes = Math.round(earnings.total / 28 * 30);              // ~103.371
const estAno = estMes * 12;
const txContexto: Record<string,string> = {
  "T-01": "Venda realizada · direta",
  "T-02": "Venda realizada · via parceria",
  "T-03": "Recorrência de indicação ativa · plano Pro",
  // ...
};
```

## Detalhes técnicos
- Imports adicionais: `Link` de `@tanstack/react-router`; ícones `TrendingUp`, `Sparkles`, `Users` de `lucide-react`; `Tooltip, TooltipTrigger, TooltipContent, TooltipProvider` de `@/components/ui/tooltip`; `Button` para CTA; reutilizar `referrals` e `kpis.metaIsencao` de `@/data/mock`.
- Manter classes/cores existentes (`bg-navy`, `text-warm`, `bg-card`, `border-border`).
- Usar `formatBRL` e `formatBRLcompact` para projeção.
- Sem novas rotas, sem mudança de mock, sem alteração no layout 2/3 + 1/3 do topo.

## Não alterar
- Estrutura do card de receita total e do card de composição (apenas inserções internas).
- Tabela de histórico (apenas estilo dos chips e linha de contexto).
- `src/data/mock.ts`, `routeTree.gen.ts`, sidebar, outras rotas.
