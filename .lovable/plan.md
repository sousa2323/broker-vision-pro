## Plano — Central operacional da rede (`/admin/usuarios`)

Escopo: somente `src/routes/admin.usuarios.tsx`. Sem nova rota, sem mudar sidebar/identidade, sem novas dependências. Reutilizar tokens existentes (`bg-card`, `bg-surface`, `text-muted-foreground`, semânticas emerald/amber/red já em uso na tela). Drawer com `@/components/ui/sheet` (já disponível). Dados derivados do mock atual `adminBrokers` + `corretorRisco` — sem alterar `admin-mock.ts`.

---

### 1. Helpers operacionais (topo do arquivo, puros)

Derivados de `adminBrokers` + `corretorRisco` + um seed determinístico por `id` para gerar números coerentes (sem aleatoriedade entre renders):

- `getLeadsAtivos(u) → number`
- `getExecucao(u) → number (0–100)`
- `getConversao(u) → number (0–100)`
- `getNegligencia(u) → number` (leads sem interação acima do SLA)
- `getDiasSemLogin(u) → number`
- `getRiscoOperacional(u) → "saudavel" | "atencao" | "critico"` — combina execução baixa, negligência alta, dias sem login, status `Bloqueado/Inativo`.
- `getScoreIA(u) → number (0–100)`
- `getRegiao(u)` derivado de `cidade`.

Helpers de classificação visual: `tonExecucao(n)`, `tonConversao(n)`, `tonRisco(r)` retornando classes `bg-emerald-50 text-emerald-700`, `bg-amber-50 text-amber-700`, `bg-red-50 text-red-700`, `bg-surface text-muted-foreground` — alinhados ao estilo já usado nos badges Plano/Status.

### 2. Camada executiva — 6 KPIs no topo

Acima dos filtros atuais. Grid `grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3`. Cada card: `rounded-xl bg-card border border-border p-3`, label uppercase 10px, valor 20px medium, subtexto 11px muted.

1. Corretores ativos — count `status === "Ativo"` × multiplicador para 752.
2. Execução média da rede — média de `getExecucao`.
3. Leads negligenciados — soma de `getNegligencia`.
4. Corretores em risco — count `risco === "critico"`.
5. Receita da plataforma — soma de `receita`.
6. Conversão média — média de `getConversao`.

### 3. Faixa de alertas operacionais

Container `rounded-xl bg-card border border-border p-3`, lista horizontal `flex flex-wrap gap-2`. Cada alerta: pill `text-xs` com bullet colorido (●) + texto. 4 alertas derivados:

- 🔴 N corretores com >10 leads negligenciados
- 🟠 N corretores sem login há >7 dias
- 🟡 N propostas sem follow-up (derivado)
- 🟢 N corretores com conversão >30%

Clicar num alerta aplica filtro correspondente (por ex. risco=crítico).

### 4. Filtros operacionais (substitui linha atual)

Manter o input de busca à direita. Substituir os 4 chips atuais (`Todos/Pro/Free/Bloqueados`) por 6 grupos de filtros como popovers/selects compactos lado a lado, no mesmo estilo dos chips já existentes:

- Execução: Todas · Alta · Média · Baixa
- Risco: Todos · Saudável · Atenção · Crítico
- Conversão: Todas · Alta · Baixa
- Status operacional: Todos · Sem login · Negligenciando · Cadência atrasada · Pipeline parado
- Plano: Todos · Free · Pro
- Região: Todas · (lista derivada de `cidade`)

Implementação simples: cada filtro é um `<select>` estilizado com classes existentes, ou chips em linha com overflow horizontal. Estado em `useState` único `{exec, risco, conv, status, plano, regiao, busca}`.

### 5. Tabela operacional (substitui colunas atuais)

Mantém `overflow-hidden rounded-xl border border-border bg-card` + `<table>` + `<thead bg-surface>`. Novas colunas:

| Corretor | Plano | Região | Leads ativos | Execução | Conversão | Negligência | Receita | Risco | Ações |

- **Corretor**: avatar + nome + CRECI (igual hoje).
- **Plano / Região**: pills/texto compactos.
- **Leads ativos**: número monoespaçado (`num`).
- **Execução**: `XX%` + barrinha 60px (`h-1 rounded-full bg-surface` com fill colorido por tom).
- **Conversão**: `XX%` colorido.
- **Negligência**: número + ícone alerta quando >10 (vermelho).
- **Receita**: `formatBRL` (igual hoje).
- **Risco**: badge `Saudável/Atenção/Crítico` com tons emerald/amber/red.
- **Ações**: ícones existentes (`ArrowUpRight`, `Ban`) + `MoreHorizontal` opcional.

Linha inteira clicável: `onClick` abre o drawer do corretor (cursor-pointer, hover já existente).

### 6. Drawer lateral do corretor

Usar `Sheet` de `@/components/ui/sheet` com `side="right"` largura `sm:max-w-2xl`. Estado `selected: AdminBroker | null`.

**Cabeçalho**: avatar 56px, nome (`font-display text-xl`), linha meta (CRECI · plano · região · status), badge risco grande, score IA (`🧠 87`).

**Tabs** (`@/components/ui/tabs`): `Resumo · Operação · Performance · Cadências · Financeiro · Auditoria`.

Conteúdo de cada aba: grids 2-col de mini-cards `rounded-lg bg-surface p-3` com label + valor, todos derivados dos helpers. Listas curtas (visitas, propostas, tarefas atrasadas, logs) renderizadas como linhas simples com bullet colorido — sem gráficos. Densidade controlada, espaçamento generoso.

- **Resumo**: leads ativos, vendas, conversão, receita, score, execução, negligência.
- **Operação**: visitas agendadas, propostas abertas, tarefas atrasadas, leads em risco, pipeline (mini lista por estágio).
- **Performance**: conversão, tempo médio resposta, follow-ups, consistência, ranking interno (#N).
- **Cadências**: ativas, % conclusão (barra), gargalos, tarefas ignoradas.
- **Financeiro**: comissão gerada, fee plataforma, MRR SaaS, inadimplência (`corretorRisco.pctAtraso`), repasses pendentes (`corretorRisco.totalAberto`).
- **Auditoria**: lista de eventos (mock derivado): alterações críticas, leads perdidos, bloqueios, denúncias, disputas.

### 7. Ordem de renderização final

```
Header (título + subtítulo)
↓
6 KPIs
↓
Faixa de alertas
↓
Linha de filtros + busca
↓
Tabela operacional
↓
Sheet (drawer) — overlay quando selected ≠ null
```

### 8. Responsividade

- KPIs: `grid-cols-2 md:grid-cols-3 lg:grid-cols-6`.
- Filtros: `flex flex-wrap gap-2`.
- Tabela: mantém `overflow-auto` do `Table` wrapper; em telas <1024px o scroll horizontal preserva todas as colunas.
- Drawer: `w-full sm:max-w-2xl`, conteúdo `overflow-y-auto`.

### Critérios de aceite

- Topo mostra 6 KPIs + faixa de alertas, sem poluição.
- Filtros operacionais funcionais combinados com busca atual.
- Tabela exibe novas colunas com badges/barras coloridas conforme tom.
- Clique em linha abre drawer com 6 abas funcionais e dados derivados.
- Nenhuma alteração fora de `src/routes/admin.usuarios.tsx`. Estética continua minimalista e consistente com o restante do admin.
