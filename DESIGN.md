---
name: Ubroker
description: Central de operacoes premium para corretores de alto padrao.
colors:
  command-navy: "oklch(0.21 0.05 255)"
  command-on-navy: "oklch(0.985 0 0)"
  operating-ink: "oklch(0.27 0.03 255)"
  quiet-surface: "oklch(0.97 0.005 255)"
  action-blue: "oklch(0.55 0.22 262)"
  action-on-blue: "oklch(0.99 0 0)"
  revenue-orange: "oklch(0.66 0.21 41)"
  success-green: "oklch(0.65 0.16 155)"
  attention-gold: "oklch(0.78 0.15 80)"
  destructive-red: "oklch(0.6 0.22 27)"
  structural-border: "oklch(0.91 0.01 255)"
  secondary-ink: "oklch(0.5 0.02 255)"
  canvas: "oklch(1 0 0)"
  sidebar-hover: "oklch(0.27 0.05 255)"
  sidebar-active: "oklch(0.32 0.06 258)"
typography:
  display:
    fontFamily: "Fraunces, Inter, serif"
    fontSize: "1.875rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Fraunces, Inter, serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: "0"
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.33
    letterSpacing: "0"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
spacing:
  base: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.command-navy}"
    textColor: "{colors.command-on-navy}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-secondary:
    backgroundColor: "{colors.quiet-surface}"
    textColor: "{colors.operating-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-destructive:
    backgroundColor: "{colors.destructive-red}"
    textColor: "{colors.command-on-navy}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.operating-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "36px"
  card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.operating-ink}"
    rounded: "{rounded.xl}"
    padding: "24px"
  badge-primary:
    backgroundColor: "{colors.command-navy}"
    textColor: "{colors.command-on-navy}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "2px 10px"
  sidebar-item-active:
    backgroundColor: "{colors.sidebar-active}"
    textColor: "{colors.command-on-navy}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "36px"
---

# Design System: Ubroker

## 1. Overview

**Creative North Star: "A Mesa de Comando"**

O Ubroker deve parecer a mesa de comando de uma operacao imobiliaria de alto valor: confiavel, precisa e preparada para decisoes frequentes. A interface autenticada e densa sem ser pesada; hierarquia, alinhamento e estados tornam a proxima acao evidente e deixam dinheiro, momentum e risco legiveis.

O sistema usa superficies claras e contidas contra uma navegacao navy permanente. Azul identifica acao e selecao; laranja aparece apenas onde receita, monetizacao ou uma oportunidade comercial merecem atencao. Fraunces cria autoridade em titulos e numeros de destaque, enquanto Inter sustenta controles, labels, tabelas e leitura repetida.

Este sistema rejeita generic SaaS dashboards with decorative gradients, oversized marketing cards, or vague AI sparkle language. Tambem rejeita real-estate cliche visuals that feel like a property portal rather than a broker operating system. A landing publica pode ser mais editorial, mas o produto autenticado sempre prioriza densidade, clareza e confianca.

**Key Characteristics:**

- Navegacao navy como ancora operacional.
- Superficies brancas e cinza-azuladas com bordas discretas.
- Informacao financeira com numeros tabulares e contraste alto.
- Acoes primarias raras, evidentes e consistentes.
- Movimento curto, funcional e respeitoso de `prefers-reduced-motion`.

**The Next Move Rule.** Toda tela deve tornar contato, qualificacao, agendamento, proposta, parceria, convite, cobranca ou investigacao a acao seguinte mais clara.

## 2. Colors

A paleta e contida e comercial: navy transmite comando, azul marca interacao, laranja destaca valor financeiro e os tons semanticos comunicam estado sem depender apenas da cor.

### Primary

- **Command Navy:** estrutura a sidebar, botoes primarios e superficies de alta autoridade.
- **Action Blue:** reservado para foco, links, selecao e acoes que movem o fluxo.

### Secondary

- **Revenue Orange:** chama atencao para monetizacao, comissao e oportunidades comerciais; nunca e decoracao ambiente.

### Tertiary

- **Success Green:** confirma conclusao e saude operacional.
- **Attention Gold:** sinaliza pendencia ou risco que pede leitura, sem competir com erro.
- **Destructive Red:** reservado a falha, bloqueio e acao destrutiva confirmada.

### Neutral

- **Operating Ink:** texto principal, titulos de interface e dados.
- **Secondary Ink:** metadados e texto secundario; nao deve substituir texto de corpo.
- **Quiet Surface:** toolbars, filtros, agrupamentos e estados inativos.
- **Structural Border:** separacao de controles, tabelas e containers.
- **Canvas:** superficie de leitura principal.
- **Sidebar Hover / Active:** estados de navegacao sobre o Command Navy.

### Named Rules

**The One Signal Rule.** Azul e laranja nao competem na mesma decisao: azul move o fluxo; laranja revela valor comercial.

**The Status Needs Words Rule.** Sucesso, atencao e erro sempre recebem texto ou icone alem da cor.

## 3. Typography

**Display Font:** Fraunces (com Inter e serif como fallback)  
**Body Font:** Inter (com `ui-sans-serif` e `system-ui` como fallback)  
**Label/Mono Font:** Inter com numeros tabulares para valores, contagens e datas

**Character:** Fraunces adiciona autoridade editorial a titulos e numeros que merecem pausa. Inter mantem controles, dados e leitura operacional neutros, nitidos e familiares.

### Hierarchy

- **Display** (400, 1.875rem, 1.2): saudacoes, titulo principal de dashboard e KPI dominante; a landing pode ampliar Fraunces de forma responsiva sem levar essa escala para o app.
- **Headline** (400, 1.5rem, 1.25): titulo de painel estrategico e agrupamentos de primeira ordem.
- **Title** (600, 1rem, 1.5): cabecalhos compactos, nomes de entidades e itens de lista.
- **Body** (400, 0.875rem, 1.43): texto padrao, tabelas e controles; prosa explicativa fica entre 65 e 75 caracteres por linha.
- **Label** (500, 0.75rem, 1.33): metadados, status e suporte. Caixa alta com tracking so e permitida em rotulos curtos de metricas, nunca como estrutura repetida de secoes.

### Named Rules

**The Two Voices Rule.** Fraunces expressa comando e valor; Inter executa o trabalho. Fraunces nunca aparece em botoes, campos, labels ou dados tabulares densos.

**The Tabular Money Rule.** Valores monetarios, percentuais, contagens e datas usam algarismos tabulares para comparacao imediata.

## 4. Elevation

O sistema usa elevacao hibrida e estrutural. Superficies permanecem quase planas, separadas por tom e borda; sombras pequenas aparecem em controles elevados, cards e menus para distinguir camada ou estado. Sombras grandes e difusas nao pertencem ao produto autenticado.

### Shadow Vocabulary

- **Control Lift** (`0 1px 2px 0 rgb(0 0 0 / 0.05)`): botoes secundarios, campos e controles sobre superficies claras.
- **Surface Lift** (`0 1px 3px 0 rgb(0 0 0 / 0.10), 0 1px 2px -1px rgb(0 0 0 / 0.10)`): cards, menus e tabs ativos que precisam se separar do plano abaixo.

### Named Rules

**The Structural Lift Rule.** Sombra comunica camada ou interacao; nunca serve como ornamento. Um container com borda nao recebe sombra ampla.

## 5. Components

Os componentes sao compactos, familiares e consistentes. Todo controle interativo deve ter default, hover, focus-visible, active, disabled e, quando aplicavel, loading e error.

### Buttons

- **Shape:** cantos discretamente curvos (6px), altura padrao de 36px e espacamento horizontal de 16px.
- **Primary:** Command Navy sobre texto claro, peso 500; uma tela deve ter uma acao primaria dominante por contexto.
- **Hover / Focus:** hover altera a intensidade em cerca de 10%; foco usa anel Action Blue de 1px ou 2px sem deslocar layout; transicao de cor em 150ms.
- **Secondary / Ghost / Tertiary:** secondary usa Quiet Surface; outline usa Canvas com borda Structural Border; ghost so ganha superficie no hover; link e reservado a navegacao textual.
- **Disabled / Loading:** opacidade de 50% com interacao bloqueada; loading preserva largura e label para evitar salto.

### Chips

- **Style:** badges compactos usam 6px de raio, padding de 2px por 10px e texto de 12px sem transformar todo chip em pill.
- **State:** status semantico combina nome, icone quando util e tom correspondente; filtros selecionados usam Action Blue ou Command Navy de modo consistente.

### Cards / Containers

- **Corner Style:** cantos contidos (12px).
- **Background:** Canvas para leitura; Quiet Surface apenas para agrupamentos internos sem criar card dentro de card.
- **Shadow Strategy:** Surface Lift e permitido somente quando o card realmente representa uma camada independente.
- **Border:** Structural Border de 1px e o separador padrao.
- **Internal Padding:** 24px em desktop, reduzindo para 16px em superficies compactas ou mobile.

### Inputs / Fields

- **Style:** altura de 36px, raio de 6px, fundo transparente ou Canvas, borda Structural Border e padding horizontal de 12px.
- **Focus:** anel Action Blue visivel sem depender apenas da mudanca da borda.
- **Error / Disabled:** erro combina Destructive Red com mensagem explicita; disabled reduz contraste e usa cursor indisponivel sem ocultar o valor.

### Navigation

A sidebar desktop de 256px usa Command Navy, itens de 36px, icones de 16px e labels Inter de 14px. Hover usa Sidebar Hover; rota atual usa Sidebar Active, texto claro e peso 500. Em mobile, a mesma hierarquia migra para drawer sem criar uma segunda taxonomia. O topo permanece compacto e orientado a busca, notificacoes e conta.

### Tabs

Tabs vivem sobre Quiet Surface com 8px de raio; o item ativo sobe para Canvas, recebe texto principal e Surface Lift. O controle preserva altura de 36px e foco visivel em cada trigger.

### Financial Metrics

Metricas usam algarismos tabulares, hierarquia Fraunces apenas no valor e Inter nos rotulos. VGV, comissao e monetizacao precisam de unidade, periodo e contexto; numeros grandes sem significado sao proibidos.

## 6. Do's and Don'ts

### Do:

- **Do** lead with the next useful action e deixar a proxima decisao evidente no primeiro viewport.
- **Do** make money and momentum legible com numeros tabulares, unidade, periodo e estado.
- **Do** preserve a premium operating tone com hierarquia, alinhamento e linguagem precisa.
- **Do** separar broker work from admin governance por densidade, prioridade e tipo de decisao.
- **Do** use AI as operational leverage quando qualifica, resume, recomenda, detecta risco ou economiza tempo.
- **Do** manter controles em 36px, base de espacamento de 4px, raios entre 4px e 16px e transicoes funcionais de 150-250ms.
- **Do** garantir navegacao por teclado, foco visivel, contraste legivel, labels claros e alternativa para movimento reduzido.

### Don't:

- **Don't** drift into generic SaaS dashboards with decorative gradients, oversized marketing cards, or vague AI sparkle language.
- **Don't** use real-estate cliche visuals that feel like a property portal rather than a broker operating system.
- **Don't** add heavy visual decoration in authenticated surfaces; density, clarity, and trust matter more than spectacle.
- **Don't** usar cards aninhados, grids de cards identicos ou faixas laterais coloridas com mais de 1px.
- **Don't** usar gradient text, glassmorphism decorativo, sombras amplas sobre elementos com borda ou cards com raio acima de 16px.
- **Don't** usar display fonts em labels, botoes, campos, tabelas ou navegacao.
- **Don't** usar movimento decorativo, sequencias de entrada de pagina ou transicoes acima de 250ms para tarefas rotineiras.
- **Don't** reinventar affordances padrao, abrir modal como primeira solucao ou variar a aparencia da mesma acao entre telas.
- **Don't** usar cor saturada em estado inativo nem comunicar status apenas por cor.
- **Don't** usar labels em caixa alta e tracking largo como scaffold repetido de secoes; reserve esse tratamento a metricas curtas e genuinas.
