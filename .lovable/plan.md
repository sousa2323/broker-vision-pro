
# Etapa 2 — Leads orientados a ação + gatilho financeiro

Arquivo único editado: `src/routes/app.leads.tsx`. Sem mudanças em mock, sidebar, rotas, cards do topo ou chips de filtro rápido (Etapa 1 preservada).

## 1. Helpers locais (no topo do componente)

Adicionar funções puras dentro do arquivo:

- `getProximaAcao(lead)` — derivada do `status`:
  - Novo → "Ligar agora"
  - Qualificado → "Enviar WhatsApp"
  - Visita → "Confirmar visita hoje"
  - Proposta → "Fazer follow-up"
  - Fechado/Perdido → "—"
- `getUrgencia(lead)` → `"atrasado" | "hoje" | "futuro"`:
  - atrasado: `isAtrasado(l)` (já existe)
  - hoje: `isHoje(l)` ou status Visita/Proposta
  - futuro: demais ativos
- `getUrgenciaMeta(u)` → `{ dot, label, chip }`:
  - atrasado → vermelho (`bg-red-50 text-red-700 border-red-100`), label "Atrasado"
  - hoje → âmbar suave (`bg-amber-50 text-amber-800 border-amber-100`), label "Fazer hoje"
  - futuro → cinza neutro, label "Futuro"
- `getUrgenciaRank(u)` → 0/1/2 para ordenação.

## 2. Ordenação automática

Substituir `leadsFiltrados` por uma versão ordenada:

```
.sort((a,b) => {
  const ra = getUrgenciaRank(getUrgencia(a));
  const rb = getUrgenciaRank(getUrgencia(b));
  if (ra !== rb) return ra - rb;            // atrasado → hoje → futuro
  return getComissao(b.orcamento) - getComissao(a.orcamento); // maior comissão
})
```

Inativos (Fechado/Perdido) descem ao final.

## 3. Nova estrutura da tabela

Reescrever `<thead>` e `<tbody>` com colunas, nesta ordem:

1. **Lead** — avatar + nome + 1 badge de temperatura (Quente/Morno/Frio). ID em `text-[10px] text-muted-foreground/70`. Sem outros chips.
2. **Potencial** —
   - Linha 1: `💰 R$ 36.000` em `text-base font-semibold text-emerald-700` (ícone `Wallet` ou emoji).
   - Linha 2: `Imóvel: R$ 1.200.000` em `text-xs text-muted-foreground`.
3. **Próxima ação** (coluna mais proeminente) —
   - Texto em `text-sm font-medium text-foreground`.
   - Ícone à esquerda dependente do tipo (`Phone`, `MessageCircle`, `Calendar`, `Send`).
4. **Prazo** —
   - Pill com bolinha colorida: `🔴 Atrasado há {l.ultimaInteracao}` / `🟡 Fazer hoje` / `⚪ Futuro`.
   - Usa `getUrgenciaMeta` para classes.
5. **Status** — badge atual (`statusColor`).
6. **Origem** — texto simples; selo "qualificada" reduzido para badge minúsculo somente quando aplicável.

Remover da linha:
- chip de prioridade duplicado (mantido apenas em "Lead")
- detalhe verboso de origem qualificada (vira badge inline pequeno)
- borda colorida à esquerda fica baseada em urgência (não mais em prioridade) para reforçar urgência.

## 4. Barra superior da tabela

Manter Buscar + Filtros como hoje. Sem novos elementos.

## 5. Painel lateral (`<aside>`)

Reorganizar para hierarquia "oportunidade + ação":

1. **Bloco topo destacado** (substitui "Potencial de negócio" como primeiro card) —
   - Card `border-emerald-200 bg-emerald-50/50 p-4`:
     - `💰 Potencial: R$ {comissao}` (text-2xl font-semibold text-emerald-700)
     - `➡️ {proximaAcao} {primeiroNome}` (text-sm font-medium)
     - Subtexto: derivado da urgência — "Lead sem resposta há {ultimaInteracao}" se atrasado, "Ação prevista para hoje" se hoje, "Sem prazo imediato" caso contrário.
2. **3 botões principais** (logo abaixo, `grid-cols-3`):
   - Ligar (`Phone`) → `bg-navy text-navy-foreground`
   - WhatsApp (`MessageCircle`) → `bg-emerald-600 text-white`
   - Registrar interação (`ClipboardCheck`) → `border border-border`
   - Remove o botão atual "Mover para pipeline".
3. **Dados complementares** (cards menores, ordem):
   - Resumo rápido (tipo, região, valor do imóvel) — mantido, mas valor do imóvel passa a viver aqui (não mais duplicado em "Potencial de negócio").
   - Origem (mantido, compacto).
   - Interesse (mantido).
   - Histórico (mantido).
4. Remover o card duplicado "Potencial de negócio" (substituído pelo bloco topo).

Header do aside (nome, status, contatos) permanece, mas com badge de temperatura único.

## 6. Restrições respeitadas

- Sem novas telas, modais, drawers ou rotas.
- Sem alterações em sidebar, mock, cards do topo, chips de filtro.
- Sem IA, sem cadência, sem WhatsApp simulado.
- Dados financeiros mantidos (apenas reorganizados visualmente).

## Critérios de aceite mapeados

- Comissão é o elemento de maior peso visual em cada linha (verde + bold + maior).
- Coluna "Próxima ação" presente, com ícone e verbo claro.
- Pill de urgência com cor vermelho/âmbar/neutro conforme regra.
- Lista ordenada por urgência → comissão.
- Apenas 1 badge de temperatura por linha; ID discreto; menos ruído.
- Aside começa por "Potencial + ação" e tem 3 CTAs (Ligar / WhatsApp / Registrar).
