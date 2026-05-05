
# Plano — Etapa 1: Reorganizar tela Leads do corretor

Apenas reorganizar a primeira camada de `src/routes/app.leads.tsx`. Sem novos arquivos, sem modal, sem drawer, sem mudar mock, sem mexer em outras telas.

## Arquivo único editado

`src/routes/app.leads.tsx`

## 1. Cabeçalho

Acima do grid principal (hoje começa direto na `<section>` da tabela), adicionar bloco de header:

- Título `Leads` (font-display, 2xl).
- Subtítulo: "Sua central diária de execução comercial. Priorize contatos, acompanhe atrasos e avance oportunidades."
- À direita do título: botão `+ Novo lead` (mesmo estilo do botão atual `bg-navy`).
- O campo de busca atual ("Buscar lead") permanece onde está, dentro do card da lista. O `+ Novo lead` que hoje vive ali é movido para o header — evita duplicação.

## 2. Bloco "Execução de hoje" (4 cards)

Logo abaixo do header, grid de 4 cards compactos (`grid-cols-2 lg:grid-cols-4`, padding reduzido, ~80px de altura):

1. **A fazer hoje** — número + "Ligações, WhatsApp e follow-ups previstos."
2. **Atrasados** — número + "Leads com ação fora do prazo." (destaque moderado: borda/ícone vermelho suave, ex.: `border-red-200 bg-red-50/40`)
3. **Sem contato** — número + "Novos leads ainda sem primeira abordagem."
4. **Visitas hoje** — número + "Atendimentos confirmados para hoje."

### Como derivar os números (sem mexer no mock)

Cálculos in-file usando `leads` existente, para que os valores não fiquem hardcoded:

- `aFazerHoje`: leads com `status` em ["Novo","Qualificado","Visita","Proposta"] e `ultimaInteracao` contendo "hoje" OU sem interação recente — fórmula simples: `min(6, ativos)`.
- `atrasados`: leads cuja `ultimaInteracao` contém "dias" ou "semana" e status ativo.
- `semContato`: leads com `status === "Novo"`.
- `visitasHoje`: leads com `status === "Visita"` e `ultimaInteracao` contendo "hoje", fallback 1.

Helpers locais no componente (sem novo arquivo). Sem VGV, sem comissão, sem financeiro.

## 3. Filtros rápidos (chips)

Barra abaixo dos cards, antes da `<section>` da tabela:

Chips: `Todos · Hoje · Atrasados · Sem contato · Quentes · Visitas · Proposta`

- Estado local `filtroRapido` (default `"Todos"`).
- Estilo idêntico aos chips de `admin.leads.tsx` (rounded-full, border, ativo = `bg-foreground text-background`).
- Aplicar `.filter()` em cima de `leads` antes de renderizar a tabela:
  - Todos → tudo
  - Hoje → `ultimaInteracao.includes("hoje")`
  - Atrasados → contém "dias"/"semana"
  - Sem contato → `status === "Novo"`
  - Quentes → `getPrioridade(status) === "quente"`
  - Visitas → `status === "Visita"`
  - Proposta → `status === "Proposta"`

## 4. Lista de leads

Mantida exatamente como está (mesmas colunas, mesmo visual, mesmo painel lateral à direita). Apenas:

- Trocar `leads.map` por `leadsFiltrados.map`.
- Remover o botão `+ Novo lead` da barra interna (movido para o header) — manter apenas Buscar e Filtros.
- Painel lateral fixo já existe na tela original; mantido como hoje (o prompt diz "se já existir, manter fechado por padrão" — aqui ele é parte estrutural do layout, então fica como está sem novas adições).

## 5. Layout / responsividade

- Header + cards + chips ficam fora do grid `lg:grid-cols-[1fr_400px]`, ocupando largura total no topo.
- Grid atual da lista + aside permanece inalterado abaixo.
- Cards em `grid-cols-2 lg:grid-cols-4` para caber confortável no viewport 1189px.

## Restrições respeitadas

- Sem novos arquivos, sem novas rotas, sem mexer em sidebar, mock, banco, ou outras telas.
- Sem VGV, comissão, jurídico, drawer, modal, abas, scripts, cadência, WhatsApp simulado.
- Sem novo painel lateral.
- Identidade visual (Tailwind/shadcn já no arquivo) preservada.
