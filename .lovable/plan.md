## Refinar Dashboard `/app` — hierarquia, contexto e foco em resultado

Editar **apenas** `src/routes/app.index.tsx`. Estrutura geral, layout em grid, sidebar e topbar permanecem intactos.

### 1. CTA global abaixo do título
Adicionar logo abaixo de "Olá, Ramon 👋", em destaque sutil (pill com ícone âmbar/warm + texto):
> "Hoje você tem **3 oportunidades quentes** para avançar."

### 2. Hierarquia dos KPIs
Os 5 cards continuam na mesma grid. Promover visualmente os dois cards de dinheiro:
- **Faturamento (R$ 96.000)** — passa a usar o variant `accent` (fundo navy escuro, texto claro, ícone âmbar), igual ao VGV.
- **VGV (R$ 3,2mi)** — mantém `accent`.
- Os outros 3 (Comissão média, Vendidos, Ticket médio) ficam neutros (card branco, tipografia mais discreta).

Resultado: olho vai imediatamente para os dois blocos escuros = dinheiro.

### 3. Card "Vendidos no mês" → indicador de meta
- Valor principal: `2 / 3` (com `meta do mês` em micro caption).
- Substituir o subtítulo `"2 / 3 meta"` por:
  - barra de progresso fininha (66%) em cor brand
  - micro texto: *"Falta 1 venda para atingir sua meta"*

### 4. Bloco de Monetização (direita, navy)
Estrutura mantida. Adições:
- Logo abaixo do valor `R$ 480`, antes do progresso, nova linha em texto warm/âmbar:
  > "Você já cobriu **80%** do seu plano com indicações."
- Botão "Convidar mais corretores" passa de link discreto para **botão sólido warm/âmbar** (preenchido, com seta), ocupando largura cheia, mais chamativo.

### 5. Bloco "Operação" — micro contexto
Cada uma das 3 mini-tiles ganha uma terceira linha (caption em muted, abaixo do label):
- Leads novos → *"Últimos 7 dias"*
- Em atendimento → *"Ativos agora"*
- Propostas → *"Em andamento"*

### 6. "Últimos leads" — contexto de venda
Cada item da lista (5 leads) ganha uma segunda linha curta (truncada) com a essência do interesse, derivada do campo `interesse` em `mock.ts` (ou um novo campo `resumo` curto adicionado a cada lead):
```
João Mendes                             [Qualificado]
Busca casa com área externa até R$ 1mi
Instagram · há 2h
```
Para evitar mexer em `mock.ts`, gerar o resumo localmente truncando `interesse` em ~70 caracteres com reticências. Sem alteração de schema.

### 7. Bloco "Agenda" — destaque de hoje
Cada item de atividade (já tem `data`: "Hoje, Amanhã, Sex…"):
- Se `data` começa com "Hoje" → tile recebe **borda esquerda azul (border-l-2 border-brand)** + pequena tag pill `Hoje` em azul ao lado do nome do cliente.
- Demais ficam neutros.

### 8. Não alterar
- Grid, colunas, ordem de blocos, sidebar, topbar, gráfico de evolução, dados em `mock.ts`.
- Nenhum arquivo além de `src/routes/app.index.tsx`.

### Resultado
Dashboard com olhar guiado para dinheiro → meta → próxima ação, mantendo o layout aprovado.
