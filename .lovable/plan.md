## Plano — Evoluir `/admin/imoveis` para Central Operacional do Inventário

Escopo: somente `src/routes/admin.imoveis.tsx`. Sem nova rota, sem mudança na sidebar, sem novas dependências. Reuso dos mesmos padrões já consolidados em `admin.leads.tsx` e `admin.usuarios.tsx` (KPIs em grid, faixa de alertas, filtros `Select`, tabela densa, `Sheet` com `Tabs`, `DropdownMenu`, `AlertDialog`, `Dialog`, `sonner`). Toda inteligência derivada deterministicamente de `properties` (`@/data/mock`) + `adminBrokers`/`corretorRisco` (`@/data/admin-mock`) — sem novos mocks, sem alterar fontes.

Princípio de tom: **supervisão do inventário**, não cadastro. Verbos: supervisionar, sinalizar, priorizar, suspender, solicitar atualização. Nenhum formulário de edição de imóvel.

---

### 1. Modelo derivado por imóvel (helpers no topo)

Hash determinístico de `p.id` gera atributos estáveis:

- `getCorretor(p) → AdminBroker` (usa `p.brokerId` quando existir; senão mod sobre ativos).
- `getOrigem(p) → "Plataforma" | "Próprio" | "Proprietário" | "Construtora" | "Parceiro"` — Marketplace ⇒ Plataforma; demais via seed.
- `getLeads(p) → { total, semana }` — derivado por seed.
- `getConversao(p) → number` (0–35%).
- `getDiasAtualizacao(p) → number` — 1–80 dias.
- `getDemanda(p) → "Alta" | "Média" | "Baixa"` — função de leads + visualizações derivadas.
- `getMarketplaceStatus(p) → "Publicado" | "Oculto" | "Pendente" | "Bloqueado"` — usa `p.marketplace` + seed.
- `getStatus(p) → "Ativo" | "Vendido" | "Suspenso" | "Removido"`.
- `getRisco(p) → "saudavel" | "atencao" | "critico"` — regras: atualização > 30d, demanda Baixa + 0 leads, mídia incompleta, anúncio incompleto.
- `getVGV(p) → p.valor`.
- `getScoreImovel(p) → 0–100` — leads × conversão − idade do anúncio.
- `getMidiaScore(p) → { fotos, qualidadePct, completo }`.
- `getMotivosRisco(p) → string[]` — lista textual para o drawer.

Helpers visuais: `tonRisco`, `tonDemanda`, `pillAtualizacao`.

### 2. Camada 1 — 7 KPIs operacionais (topo)

Grid `grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3`. Card `rounded-xl bg-card border p-4`, label uppercase 10px, valor 22px, subtexto muted:

1. Imóveis ativos (status === Ativo)
2. Alta demanda (demanda === Alta)
3. Sem atualização > 30 dias
4. Sem leads (leads.total === 0)
5. Vendas do mês (status === Vendido, derivado)
6. VGV ativo da rede (soma valor dos ativos)
7. Imóveis em risco (risco !== saudavel)

### 3. Camada 2 — Faixa de alertas inteligentes

`flex flex-wrap gap-2` abaixo dos KPIs. Pills clicáveis (`bg-red-50/50`, `bg-amber-50/50`, `bg-yellow-50/50`) que setam `alertaAtivo` e filtram a tabela:

- 🟡 N imóveis sem atualização há mais de 30 dias
- 🔴 N marketplace com alta demanda sem atendimento
- 🟡 N anúncios premium sem fotos completas
- 🟠 N imóveis sem leads há mais de 45 dias
- 🔴 N imóveis com alteração brusca de preço (derivado)

Clicar de novo limpa o filtro.

### 4. Camada 3 — Busca + filtros

Linha 1: input full width "Buscar imóvel, corretor, bairro ou código".
Linha 2: `flex flex-wrap gap-2` com `Select` shadcn: Região (cidade/bairro), Tipo (derivado do nome), Status, Marketplace, Demanda, Atualização (Recente / >30d / >60d), Risco, Faixa de valor, Corretor. Botão **Limpar filtros** quando algo ativo. Mesmos componentes/tons usados em `admin.leads.tsx`.

### 5. Camada 4 — Tabela operacional

Substitui a tabela simples atual. Colunas:

| Imóvel | Corretor | Origem | Leads | Conversão | Atualização | Demanda | Marketplace | Status | Risco | Ações |

Detalhes:
- **Imóvel**: thumb 64×48 + nome + `id` · `area`m² · bairro.
- **Corretor**: nome + cidade.
- **Origem**: badge (Plataforma azul suave; Próprio cinza; demais neutros) — tooltip com regra de governança.
- **Leads**: número grande + subtexto "N esta semana".
- **Conversão**: % + micro-barra (`h-1 rounded-full bg-muted` + fill emerald/amber/red).
- **Atualização**: "há Nd"; > SLA ⇒ pill vermelha.
- **Demanda**: badge Alta/Média/Baixa.
- **Marketplace**: pill Publicado/Oculto/Pendente/Bloqueado.
- **Status**: pill Ativo/Vendido/Suspenso/Removido.
- **Risco**: bullet + label.
- **Ações**: `DropdownMenu` com — Ver operação (abre drawer), Ver leads vinculados (drawer aba Leads), Ver histórico (drawer aba Atualizações), Sinalizar risco (toast), Suspender anúncio (`AlertDialog`), Priorizar no marketplace (toast). Itens invasivos (suspender/priorizar) desabilitados quando `origem === "Próprio"`.

Linha clicável abre drawer; ações usam `stopPropagation`.

### 6. Drawer supervisório (Sheet) — Painel operacional do ativo

Header: thumb + nome + código + badges (Origem, Risco, Demanda, Status, VGV).

Tabs (`Tabs` shadcn) — 6 abas:

- **Resumo** — cards: corretor responsável, origem, VGV, score, status, demanda, leads gerados, conversão, tempo anunciado. Parágrafo de leitura operacional gerado por regras ("Imóvel com alta procura em {bairro}. Boa conversão, porém sem atualização há Nd.").
- **Leads** — mini-tabela: leads vinculados (derivados de `leads` por bairro/corretor), estágio, responsável, risco operacional.
- **Performance** — cards: visualizações, leads, visitas, propostas, conversão, tempo médio de venda. Linha de leitura ("Conversão acima da média da região." / "Alta demanda com baixa conversão.").
- **Marketplace** — canais publicados (lista), score de mídia (barra), nº de fotos, qualidade %, status SEO/descritivo. Indicador: Premium / Incompleto / Mídia insuficiente.
- **Atualizações** — timeline derivada: alteração de preço, troca de fotos, mudança de descrição, mudança de status, republicação.
- **Auditoria** — log "quem · quando · o quê" (preço alterado por X; marketplace suspenso por Admin; etc.).

Footer fixo: **Ver leads vinculados** · **Priorizar anúncio** · **Solicitar atualização** · **Sinalizar risco** · **Suspender marketplace**. Quando `origem === "Próprio"`: Priorizar e Suspender ficam desabilitados com tooltip ("Imóvel próprio do corretor — supervisão apenas").

### 7. Estado e interações

`useState`: `busca`, `filtros`, `alertaAtivo`, `selecionado`, `suspenderOpen`, `solicitarAtualizacaoOpen`. Filtros + alerta + busca combinam via `useMemo`. Toasts via `sonner`. Sem mutação de dados.

### 8. Tom & restrições visuais

- Sem botão "Editar imóvel" / "Novo imóvel" / formulários de cadastro.
- Vermelho restrito a: risco crítico, SLA de atualização quebrado, alertas 🔴, marketplace bloqueado.
- Mantém tipografia, espaçamentos, radii e tokens (`bg-card`, `bg-surface`, `border-border`) atuais. Densidade controlada — KPIs + alertas ocupam ~30% da viewport inicial.
- Nenhuma alteração fora de `src/routes/admin.imoveis.tsx`.

### 9. Critérios de aceite

- 7 KPIs no topo refletem números derivados consistentes.
- Faixa de alertas filtra a tabela ao clicar; toggle limpa.
- Busca + 9 filtros combinam corretamente.
- Tabela exibe todas as 11 colunas com Origem, Demanda, Marketplace, Status, Risco.
- Drawer abre com 6 abas e footer contextual; ações invasivas bloqueadas em imóveis "Próprio".
- Tom 100% supervisão; visual permanece premium/clean alinhado a Leads/Usuários Admin.
