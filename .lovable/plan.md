## Plano — Evoluir `/admin/leads` para Central de Visibilidade Operacional

Escopo: somente `src/routes/admin.leads.tsx`. Sem nova rota, sem mudanças na sidebar, sem novas dependências. Reuso de tokens semânticos atuais (`bg-card`, `bg-surface`, emerald/amber/red), `Sheet`, `Tabs`, `AlertDialog`, `Dialog`, `Checkbox`, `Tooltip`, `sonner`. Toda a inteligência derivada deterministicamente de `leads` (`@/data/mock`) + `adminBrokers` + `corretorRisco` (`@/data/admin-mock`) — sem alterar fontes de dados.

Princípio de tom: **supervisão estratégica**, não execução. Verbos: acompanhar, supervisionar, redistribuir, sinalizar, intervir. Nada de WhatsApp/ligar/registrar interação.

---

### 1. Modelo derivado por lead (helpers no topo do arquivo)

A partir de cada `Lead` do mock, derivar via seed determinístico (hash do `id`):

- `getCorretor(l) → AdminBroker` — atribuição estável (mod sobre `adminBrokers` ativos).
- `getTipoLead(l) → "Plataforma" | "Próprio"` — Marketplace/IA ⇒ Plataforma; WhatsApp/Instagram/Indicação ⇒ Próprio (com 1 exceção via seed para diversificar).
- `getOrigemAdmin(l) → "IA" | "Inbox" | "Marketplace" | "Indicação"` — mapa já existente.
- `getEtapa(l) → status` — usa `l.status`.
- `getTempoParado(l) → { horas, label }` — derivado de `ultimaInteracao` + seed.
- `getSLA(l) → { quebrado: boolean, restante: string }` — limite por etapa (Novo 2h, Qualificado 24h, Visita 12h, Proposta 48h).
- `getScore(l) → 0–100` — fórmula: 100 − (horasParado × peso) − (atrasoCadência) − (atrasoTarefas), com bônus por avanço no funil.
- `getRisco(l) → "saudavel" | "atencao" | "critico"` — função do score + SLA + tempo parado.
- `getVGV(l) → number` — usa `l.orcamento` (potencial).
- `getProximaAcao(l) → string` — regra:
  - SLA quebrado + Plataforma ⇒ "Cobrar follow-up"
  - Crítico + Plataforma ⇒ "Redistribuir lead"
  - Visita sem confirmação ⇒ "Confirmar visita"
  - Proposta parada > 48h ⇒ "Revisar proposta"
  - Score < 35 + corretor com `pctAtraso > 50` ⇒ "Verificar risco de bypass"
  - Proposta + score alto ⇒ "Acompanhar negociação"
  - default ⇒ "Sem ação necessária"
- `getRegiao(l) → cidade do corretor`.

Helpers visuais: `tonRisco`, `tonScore`, `pillSLA`.

### 2. Camada 1 — KPIs operacionais (topo)

Grid `grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3`. Cards `rounded-xl bg-card border p-4`, label uppercase 10px, valor 22px medium, micro-delta abaixo (↑/↓ %). Cards:

1. Leads ativos da plataforma — count `tipo === Plataforma && etapa !== Fechado/Perdido`.
2. Leads em risco — count `risco === atencao|critico`.
3. Leads negligenciados — count `SLA quebrado && Plataforma`.
4. Tempo médio de resposta — média horas parado.
5. Conversão da plataforma — `Fechado / total Plataforma`.
6. VGV em risco — soma `orcamento` de leads críticos.
7. Próximos fechamentos — count `etapa === Proposta` + soma VGV.

### 3. Camada 2 — Faixa de alertas inteligentes

`flex flex-wrap gap-2` abaixo dos KPIs. Pills clicáveis (`bg-red-50/50`, `bg-amber-50/50`, `bg-yellow-50/50`) com bullet colorido. Cada alerta aplica filtro pré-configurado na tabela (set `filtroAtivo`). Exemplos derivados:

- 🔴 N leads da plataforma sem interação > 72h
- 🟠 N propostas acima de R$ 1M sem follow-up
- 🟡 N visitas agendadas sem confirmação
- 🔴 N possíveis bypass identificados (score baixo + corretor `pctAtraso alto`)
- 🟠 N corretores com execução abaixo de 40%

Pill ativa fica destacada; clicar de novo limpa.

### 4. Camada 3 — Filtros avançados

Substitui as 5 pills atuais. Linha 1 (busca): input full width "Buscar lead, corretor, região ou operação".
Linha 2 (filtros, em `flex flex-wrap gap-2` com `Select` shadcn): Origem · Região · Corretor · Etapa · Risco · SLA (Ok/Quebrado) · Tipo (Plataforma/Próprio) · Score (Excelente/Atenção/Crítico) · Faixa de VGV.
Botão **Limpar filtros** quando algum estiver ativo. Estado em `useState<Filtros>`.

### 5. Camada 4 — Tabela de supervisão

Colunas (substituem as atuais):

| Lead | Corretor | Origem | Tipo | Etapa | Score | SLA | Última interação | Tempo parado | VGV | Risco | Próxima ação | Ações |

Detalhes:
- **Tipo**: badge "Plataforma" (azul suave) ou "Próprio" (cinza). Tooltip explicando regra de redistribuição.
- **Score**: badge clean com número + cor (emerald/amber/red).
- **SLA**: pill "Ok 4h restante" ou "Quebrado +18h" (vermelho).
- **Risco**: bullet + label.
- **Próxima ação**: texto destacado (`font-medium text-foreground`); destaque visual quando ≠ "Sem ação necessária".
- **Ações**: `DropdownMenu` (já existe) com:
  - Ver operação (abre drawer)
  - Ver timeline
  - Ver corretor (link `/admin/usuarios?focus=ID`)
  - Redistribuir lead — **somente** se `tipo === Plataforma` (`AlertDialog` confirmando)
  - Adicionar observação interna (`Dialog` + textarea, toast)
  - Marcar acompanhamento (toast)
  - Abrir auditoria (vai para aba Auditoria do drawer)
  - Sinalizar risco (toast)

Linha clicável abre drawer; ações via dropdown usam `stopPropagation`.

### 6. Drawer supervisório (Sheet)

Cabeçalho: nome do lead, ID, badge Tipo, badge Risco, score grande, VGV, etapa, tempo parado.

Tabs (shadcn `Tabs`):

- **Resumo** — origem, tipo, responsável (avatar+nome+plano), score, risco, VGV, estágio, tempo parado, taxa de execução do corretor (derivada), conversão histórica do corretor (derivada).
- **Timeline operacional** — usa `l.historico` + eventos derivados (mudanças de etapa, ações IA, SLA breach). Estilo linha do tempo clean.
- **Cadência** — checklist da cadência da etapa atual com itens cumpridos/atrasados (derivado).
- **Performance do corretor** — mini-cards: execução %, conversão %, leads ativos, % SLA cumprido, com link "Ver corretor".
- **Auditoria** — log: redistribuições, mudanças de responsável, mudanças de etapa, alertas críticos, suspeita de bypass, exclusões. Derivado deterministicamente.
- **Financeiro** — VGV, comissão estimada, status de cobrança (cruzar com `cobrancas` se houver match por corretor — caso contrário "Sem cobrança vinculada").
- **Risco operacional** — explica como o risco foi calculado (lista de fatores), com botão "Sinalizar risco" (toast).

Footer do drawer: botões **Redistribuir** (se Plataforma), **Adicionar observação**, **Marcar acompanhamento**, **Sinalizar risco**. Sem botões de execução comercial.

### 7. Estado e interações

- `useState`: `busca`, `filtros`, `alertaAtivo`, `selecionado` (lead aberto), `redistribuirOpen`, `observacaoOpen`.
- Redistribuição: `AlertDialog` "X corretores aptos da mesma região receberão o lead. O corretor original perde acesso comercial." → toast.
- Toasts via `sonner`.

### 8. Tom & restrições visuais

- Sem botões WhatsApp/ligar/registrar interação em nenhum lugar.
- Vermelho restrito a: SLA quebrado, risco crítico, alertas 🔴, bypass.
- Mantém tipografia, espaçamentos e radii atuais. Densidade controlada — KPIs e alertas não devem ocupar mais que ~30% da viewport inicial.
- Nenhuma alteração fora de `src/routes/admin.leads.tsx` e nenhum mock novo.

### 9. Critérios de aceite

- 7 KPIs no topo refletem dados derivados consistentes.
- Faixa de alertas filtra a tabela ao clicar.
- Filtros avançados (9 dimensões) + busca global funcionam combinados.
- Tabela mostra Tipo (Plataforma/Próprio), Score, SLA, Risco e Próxima ação corretamente.
- Redistribuir só aparece para leads Plataforma; AlertDialog explicita preservação da carteira própria.
- Drawer abre com 7 abas; sem botões de execução comercial.
- Tom 100% supervisão; densidade visual permanece premium/clean.