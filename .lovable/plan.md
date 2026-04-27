## Evolução da tela Indicações — Painel de crescimento recorrente

Único arquivo alterado: `src/routes/app.indicacoes.tsx`. Sem alterações em `src/data/mock.ts`, sidebar, rotas ou outras telas. Todos os novos números são derivados localmente a partir de `referrals` e `kpis.metaIsencao`.

A estrutura atual (hero NAVY com link, 3 stats, tabela de indicados) é mantida e enriquecida — não substituída. Adicionamos novos blocos abaixo dos existentes.

## Layout final (top → bottom)

```text
┌─ Header simples ─────────────────────────────────────────────────┐
│ Indicações                                                       │
│ Transforme sua rede de corretores em receita recorrente.         │
└──────────────────────────────────────────────────────────────────┘
┌─ Hero NAVY (existente) ──────────────────────────────────────────┐
│ Link único + Copiar / Compartilhar                               │
│ Microcopy: "Indique corretores e ganhe sobre as assinaturas..."  │
└──────────────────────────────────────────────────────────────────┘
┌─ Resumo de performance (4 cards) — substitui os 3 atuais ───────┐
│ Indicados ativos │ MRR mensal │ Total acumulado │ Conversão     │
│      4           │ R$ 480/mês │   R$ 1.920      │ 4 de 9 (44%)  │
└──────────────────────────────────────────────────────────────────┘
┌─ Bloco de incentivo (warm/orange) ──────────────────────────────┐
│ 💡 Você está a R$ 120 de não pagar nada pelo sistema.            │
│    Suas indicações já cobriram 80% da sua mensalidade.           │
│    [progress bar 80%]            [ Indicar mais corretores → ]   │
└──────────────────────────────────────────────────────────────────┘
┌─ Como funciona (5 passos numerados) ─────────────────────────────┐
│ 1 Compartilhe seu link                                           │
│ 2 O corretor entra na Ubroker                                    │
│ 3 Se contratar IA / Inbox, você ganha recorrência                │
│ 4 Se cobrir sua mensalidade, você não paga nada                  │
│ 5 O excedente pode ser recebido em dinheiro                      │
└──────────────────────────────────────────────────────────────────┘
┌─ Lista de indicados (existente, enriquecida) ────────────────────┐
│ Nome · Data entrada · Produto · Status · Receita · Situação      │
│ inclui agora 5 linhas: 4 ativos + 1 "Em teste" (Carla Souza)     │
└──────────────────────────────────────────────────────────────────┘
┌─ Potencial de crescimento ───────────────────────────────────────┐
│ Ganho atual R$ 480/mês  →  Meta R$ 840/mês                       │
│ "Se ativar mais 3 corretores, pode gerar R$ 840/mês"             │
│ [progress bar até meta]                                          │
└──────────────────────────────────────────────────────────────────┘
```

## Mudanças por bloco

### 1. Header
Adicionar título e subtítulo acima do hero NAVY existente (não dentro dele).

### 2. Hero NAVY (existente)
Manter como está. Apenas ajustar microcopy se necessário para alinhar à mensagem comercial nova.

### 3. Resumo de performance — 4 cards (era 3)
Substituir o grid atual de 3 stats por 4:
- **Indicados ativos**: `referrals.ativos.length` → 4
- **Receita recorrente mensal**: `sum(mrr)` → R$ 480/mês
- **Total acumulado**: `mrrTotal * 4` (4 meses fictícios) → R$ 1.920
- **Conversão**: `4 de 9 indicados ativos` (9 = total fictício local)

Componente `Stat` reutilizado (já existe).

### 4. Bloco de incentivo (NOVO) — warm/orange
Card `rounded-2xl border-l-4 border-l-warm bg-orange-50/60 p-5` com:
- Ícone `Sparkles` + título "Você está a R$ 120 de não pagar nada pelo sistema."
- Subtexto: "Suas indicações já cobriram 80% da sua mensalidade."
- Barra de progresso (`Progress` do shadcn) com `value={80}`.
- Botão `bg-warm text-warm-foreground` "Indicar mais corretores" (scroll para hero ou ação de copiar link).

### 5. Como funciona (NOVO)
Card branco com título "Como funciona" e 5 passos numerados em badges circulares (1..5) + texto curto. Layout em coluna única, sem ícones complexos.

### 6. Lista de indicados (existente) — enriquecer
- Adicionar colunas: **Data entrada** (fictícia: "12/jul", "03/ago", etc.) e **Produto** ("Combo IA + Inbox", "IA Assistente", "Inbox").
- Mudar coluna "Plano" para "Produto".
- Manter coluna Status com chip verde para Ativo, amber para "Em teste", muted para "Cancelado".
- Adicionar 1 linha fictícia "Carla Souza · Em teste · Inbox · R$ 0".
- Coluna final "Situação": "Gerando receita" / "Aguardando conversão".
- Dados derivados localmente (array constante dentro do componente, sem mexer em `mock.ts`).

### 7. Potencial de crescimento (NOVO)
Card final com:
- Título "Potencial de crescimento" + ícone `TrendingUp`.
- Texto: "Se você ativar mais 3 corretores, pode gerar R$ 840/mês em recorrência."
- Linha com 2 valores lado a lado: "Atual R$ 480/mês" → "Meta R$ 840/mês".
- Barra de progresso com `value={Math.round(480/840*100)}` ≈ 57%.

## Detalhes técnicos
- Imports adicionais: `TrendingUp`, `Gift`, `Users`, `CheckCircle2` de `lucide-react`; `Progress` de `@/components/ui/progress`; `Button` de `@/components/ui/button`; `Badge` de `@/components/ui/badge`.
- Manter `Stat`, `Copy`, `Share2`, `Sparkles` já usados.
- Toda a tabela e novos cards reutilizam classes existentes (`bg-card`, `border-border`, `text-warm`, `bg-navy`, `text-emerald-700`).
- Sem novas rotas, sem alteração de mock, sem novas dependências.
- CTA "Indicar mais corretores" rola para o topo (link do hero) — sem nova rota.

## Não alterar
- `src/data/mock.ts`, `routeTree.gen.ts`, sidebar, outras rotas.
- Hero NAVY (link de indicação) — apenas microcopy se necessário.
- Identidade visual, tipografia, paleta.