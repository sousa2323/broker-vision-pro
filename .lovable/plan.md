# Plano — Refinamento estratégico de `/admin/imoveis`

Escopo: somente `src/routes/admin.imoveis.tsx`. Sem novas rotas, dependências ou alteração de sidebar/tokens. Toda inteligência derivada deterministicamente do `Property` + helpers já existentes (`getLeads`, `getRisco`, `getMidia`, `getDemanda`, `getConversao`, `getDiasAtualizacao`). Tom: supervisão e leitura estratégica — nada de ERP ou formulários.

---

## 1. Camada de inteligência (novos helpers no topo)

Adicionar funções puras reutilizáveis:

- `getInsightsImovel(i) → string[]` — combina demanda/conversão/dias/mídia/risco e retorna 1–3 frases curtas. Exemplos: "Alta demanda com baixa conversão", "Preço acima da média da região", "Anúncio com mídia insuficiente", "Boa taxa de resposta operacional", "Imóvel premium sem atualização recente".
- `getSaudeImovel(i) → { nivel: "saudavel"|"atencao"|"critico"; pontos: { label, ok }[] }` — score consolidado com 6 critérios: atualização, conversão, demanda, qualidade do anúncio, resposta operacional, leads negligenciados. Reusa `risco` mas adiciona detalhamento por ponto.
- `getScoresMarketplace(i) → { seo, midia, atendimento, conversao }` (0–100, derivados de mídia/leads/conversão/dias).
- `getAcaoRecomendada(i) → { titulo, racional, key }` — regras encadeadas por prioridade:
  1. `midia.completo === false` → "Solicitar novas fotos"
  2. `risco === "critico" && marketplaceStatus !== "Bloqueado"` → "Suspender marketplace"
  3. `demanda === "Alta" && conversao < 8` → "Reforçar atendimento dos leads"
  4. `demanda === "Alta" && marketplaceStatus !== "Publicado"` → "Priorizar no marketplace"
  5. `dias > 30` → "Atualizar descrição/preço"
  6. `leadsInfo.total === 0 && dias > 45` → "Reativar anúncio"
  7. fallback → "Sem ação prioritária"
- `getPrevisaoPerformance(i) → string` — "Potencial alto de conversão" / "Alta disputa no marketplace" / "Baixa competitividade na região".
- `getOperacaoImovel(i) → { leads, visitas, propostas, negligenciados, leitura }` — derivado de seed estável.

## 2. Inteligência discreta na tabela e KPIs

- Coluna **Insight** (nova, opcional via truncate) ou linha secundária sob "Imóvel" com 1 insight prioritário em `text-[11px] text-muted-foreground italic`. Não adiciona coluna nova se quebrar layout — preferir microcopy sob o nome do imóvel.
- Sob cada KPI, manter texto atual mas trocar `hint` por leitura interpretativa quando relevante (ex.: "Sem leads" → "3 com alta demanda represada").

## 3. Drawer — bloco "Ação recomendada pela Ubroker IA"

Inserir logo abaixo da linha de badges do `SheetHeader`, antes das Tabs:

```
┌──────────────────────────────────────────┐
│ ✦ Ação recomendada pela Ubroker IA       │
│ Solicitar novas fotos                    │
│ Mídia incompleta está reduzindo CTR no   │
│ marketplace.                             │
└──────────────────────────────────────────┘
```

`rounded-xl border bg-surface p-3` com ícone Sparkles, título 11px uppercase muted, ação em `text-sm font-medium`, racional em `text-xs text-muted-foreground`. Reage à mudança do imóvel selecionado.

## 4. Aba **Resumo** — bloco "Operação do imóvel"

Adicionar após o grid de Info, antes do parágrafo de leitura:

- 4 mini-indicadores horizontais: Leads vinculados / Visitas em andamento / Propostas abertas / Leads negligenciados.
- Linha de leitura: "Conversão acima da média da região." (de `getOperacaoImovel().leitura`).

## 5. Aba **Leads** — indicadores rápidos + leitura

Acima da mini-tabela já existente:

- 4 pills compactas: "em risco N", "sem resposta N", "em proposta N", "convertidos N".
- Frase interpretativa abaixo: "Alta procura com baixa evolução para visita." ou "Leads avançando normalmente no funil." (regra: se `convertidos/total < 0.1` e `demanda === "Alta"` → alerta).

## 6. Aba **Marketplace** — Saúde comercial do ativo

Reestruturar conteúdo atual em 4 sub-blocos:

1. **Scores** (`grid-cols-4 gap-2`): mini cards horizontais com SEO / Mídia / Atendimento / Conversão — número grande + micro-barra colorida.
2. **Indicadores** (lista checklist): qualidade das fotos · quantidade ideal de fotos · presença de vídeo · descrição completa · atualização recente · destaque premium ativo. Cada item com check verde / x âmbar.
3. **Leitura operacional**: parágrafo curto derivado dos scores (ex.: "Boa geração de leads, porém anúncio com baixa qualidade visual.").
4. **Previsão de performance**: pill única — "Potencial alto de conversão" / "Alta disputa no marketplace" / "Baixa competitividade na região".

## 7. Footer contextual do drawer

Hoje os 5 botões aparecem iguais. Lógica nova:

- `acaoRecomendada.key` determina o botão **primary** (cor `default`, posição mais à direita ou destacada).
- Demais ficam `variant="outline"` ou `ghost`.
- Mapeamento key → botão: `fotos|descricao|preco` → "Solicitar atualização"; `priorizar` → "Priorizar anúncio"; `suspender` → "Suspender marketplace"; `atendimento|leads` → "Ver leads vinculados"; `reativar` → "Priorizar anúncio".
- Mantém regra atual: imóveis "Próprio" continuam com Priorizar/Suspender desabilitados.

## 8. Indicador consolidado "Saúde do imóvel"

No header do drawer, adicionar pill ao lado dos badges existentes:

`● Saudável` / `● Atenção` / `● Crítico` com `Tooltip` mostrando os 6 pontos (`✓ Atualização recente`, `✗ Mídia incompleta`, …). Reusa `getSaudeImovel`.

Também aparecer como bullet color na coluna **Risco** da tabela (já existe — apenas renomear visualmente para "Saúde" no header da coluna mantendo a mesma escala).

## 9. Alertas inteligentes adicionais na faixa

Acrescentar 1–2 pills aos alertas já existentes (sem poluir):

- 🟠 N imóveis com alta demanda atribuídos a corretores de baixa execução
- 🟡 N imóveis premium sem interação recente

(Filtram a tabela igual aos atuais.)

## 10. Restrições

- Sem novos cards gigantes, sem gráficos, sem novas libs.
- Insights em `text-[11px]–text-xs text-muted-foreground`, ícones Lucide já importados (`Sparkles`, `TrendingUp`, `AlertTriangle`).
- Vermelho restrito a crítico/SLA quebrado/suspender.
- Nenhuma mudança fora de `src/routes/admin.imoveis.tsx`.

## Detalhes técnicos

- Novos helpers ficam entre os helpers existentes (linhas ~100–200).
- `acaoRecomendada` e `saude` são calculados dentro do componente do drawer via `useMemo` sobre `imovel`.
- Footer: substituir array fixo de botões por render baseado em `acaoRecomendada.key` decidindo `variant`.
- Aba Marketplace: substituir bloco atual por 4 sub-seções; reutiliza `getMidia` + `getScoresMarketplace`.
- Aba Resumo/Leads: adicionar componentes locais `OperacaoBloco` e `LeadsQuickStats` no mesmo arquivo.

## Critérios de aceite

- Drawer mostra "Ação recomendada pela Ubroker IA" que muda conforme imóvel.
- Footer destaca 1 botão primário coerente com a recomendação.
- Aba Marketplace exibe 4 scores + checklist + leitura + previsão.
- Aba Resumo mostra bloco "Operação do imóvel"; aba Leads mostra 4 pills + leitura.
- Header do drawer mostra pill "Saúde" com tooltip detalhado.
- Tabela ganha 1 insight curto sob o nome do imóvel quando aplicável.
- Visual permanece clean/minimal, sem novas dependências.
