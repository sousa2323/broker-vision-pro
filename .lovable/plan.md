## Evolução do Inbox — Central de Conversão e Fechamento

Único arquivo alterado: `src/routes/app.inbox.tsx`. Sem mudanças em `src/data/mock.ts`, sidebar, rotas ou outras telas. Toda a inteligência adicional (status IA, score, sugestões, ações comerciais) é derivada por mapas locais de enriquecimento indexados pelo `id` da conversa, mantendo o layout 3-colunas atual intacto (sidebar 300px · chat · painel 320px).

## Mapa de enriquecimento local

```ts
const meta: Record<string, {
  iaAtiva: boolean;
  etapa: "Novo" | "Qualificado" | "Visita" | "Proposta" | "Fechado";
  prioridade: "quente" | "espera" | "risco" | null;
  esperaTexto?: string;       // ex "sem resposta há 2h"
  score: number;              // 0-100
  classificacao: "Frio" | "Morno" | "Quente";
  sugestaoIA?: { texto: string; acoes: ("visita" | "opcoes" | "info")[] };
  proximaAcao: string;        // ex "Enviar 3 opções até 14h"
}>
```

Cobre os 5 ids existentes (C-1..C-5) com cenários realistas:
- C-1 Camila — humano, Visita, quente, score 88, sugestão "confirmar visita sábado 10h"
- C-2 João — IA atendendo, Qualificado, espera (2h), score 72
- C-3 Vanessa — IA atendendo, Novo, morna, score 54
- C-4 Felipe — IA atendendo, Qualificado, score 81, sugestão "enviar 3 opções"
- C-5 Roberto — humano, Proposta, risco (sem retorno 24h), score 76

## 1. Header da conversa (topo do chat)

Mantém avatar + nome + canal/online à esquerda. Adiciona logo abaixo do nome uma linha de chips compactos:
- Badge de status: "● IA atendendo" (verde pulsante) ou "● Em conversa" (navy).
- Badge de etapa do pipeline com cores de `pipelineStages` (ex: amarelo "Visita").

À direita, substituir "Ver lead" por grupo discreto:
- `Assumir conversa` (botão outline pequeno, ícone `UserCheck`) — visível só quando IA ativa; ao clicar, alterna `iaAtiva→false` no estado local de overrides, dispara toast "IA pausada para esta conversa" e injeta uma mensagem do sistema no histórico.
- `Ver lead` (link text-brand) — mantido.

## 2. Indicadores na lista de conversas (sidebar)

Sem mexer no layout do botão. Adições dentro do bloco de texto (abaixo de `ultimaMsg`):
- Linha pequena `flex gap-1.5` com:
  - Badge de prioridade: 🔥 "Quente" (warm), ⏳ "{esperaTexto}" (amber), ⚠️ "Risco" (red-500/10 text-red-700) — apenas quando aplicável.
  - Mini chip "IA" (border + text-emerald-600) ou "Humano" (text-muted-foreground), bem pequeno (text-[10px]).

O badge de não-lidas existente permanece.

## 3. Sugestão da IA (acima do input)

Renderizado condicionalmente (`meta[id].sugestaoIA`) entre a área de mensagens e o input. Card slim:
- `bg-orange-50 border-l-4 border-l-orange-400 rounded-md px-3 py-2`
- Ícone `Sparkles` + texto "Sugestão: {texto}"
- Linha de botões compactos (size sm, variant outline) conforme `acoes`:
  - "visita" → `Confirmar visita`
  - "opcoes" → `Enviar opções`
  - "info" → `Pedir mais informações`
- Botão `X` no canto para dispensar (estado local `dismissedSuggestions: Set<string>`).

Cada clique dispara toast "Atividade criada no pipeline" / "Proposta enviada" etc., simulando integração com CRM (item 8).

## 4. Ações rápidas no chat (acima do input)

Linha horizontal scrollável com 5 ícone-botões compactos (`h-8`, variant ghost com border):
- `Home` Enviar imóvel
- `Calendar` Agendar visita
- `FileText` Enviar proposta
- `CheckSquare` Criar tarefa
- `ArrowRightCircle` Mover no pipeline

Cada um abre um `Dialog` simples com 2-3 campos (sem persistência real):
- Enviar imóvel → seletor de até 3 imóveis (lista mock fixa de 4 títulos).
- Agendar visita → input data + hora.
- Enviar proposta → input valor + condições.
- Criar tarefa → input título + data.
- Mover no pipeline → select com `pipelineStages`.

Submit fecha o modal e dispara toast "Ação registrada · atividade criada / pipeline atualizado".

## 5. Chips rápidos no input

Logo acima do round input (mas abaixo das ações rápidas), linha de chips clicáveis pequenos:
- "Confirmar visita" · "Enviar proposta" · "Aguardar retorno"

Ao clicar, preenchem o input com texto pronto (estado controlado `draft`).

## 6. Painel direito — enriquecimento

Mantém estrutura (lead identificado / dados / interesse / botão). Adiciona, antes do bloco "Interesse":

**Score do lead** — card com:
- número grande `font-display text-3xl` (`meta.score`)
- barra de progresso (shadcn `Progress`)
- chip de classificação: Frio (slate), Morno (amber), Quente (warm/orange)

**Próxima ação sugerida** — card destacado:
- `bg-orange-50 border-l-4 border-l-orange-400 rounded-md p-3`
- Label "Próxima ação" + texto `meta.proximaAcao`
- Botão pequeno "Marcar como feita" (toast).

## 7. Comportamento de IA pausada

Estado local `iaOverrides: Record<string, boolean>` permite "Assumir conversa" alternar IA→Humano apenas no front. Quando `iaAtiva` derivado é true, mensagens da IA no histórico ganham prefixo visual: pequeno chip "IA" sobre a bolha (já existem mensagens com prefixo `[IA]` em C-4 — manter texto, mas adicionar marcador visual sobre todas as bolhas `from: "you"` enquanto IA estiver ativa).

## Detalhes técnicos

- Imports adicionais lucide: `UserCheck`, `Sparkles`, `Calendar`, `FileText`, `CheckSquare`, `ArrowRightCircle`, `Home`, `Flame`, `Clock`, `AlertTriangle`, `X`, `Bot`.
- Componentes shadcn novos no arquivo: `Dialog`, `Progress`, `Button`, `Input`, `Textarea`, `Select`, `toast` (sonner).
- Estados novos: `draft: string`, `iaOverrides`, `dismissedSuggestions`, `openModal: null | "imovel" | "visita" | "proposta" | "tarefa" | "pipeline"`, `etapaOverrides: Record<string, Etapa>` para refletir mudanças do modal "Mover no pipeline" no header.
- Sem alterar `inboxConversations` em `mock.ts`. Reaproveitar `pipelineStages` para cores e select.
- Manter `grid-cols-[300px_1fr_320px]`, paleta atual (`bg-navy`, `bg-card`, `bg-surface`, `text-warm`).

## Não alterar

- Layout 3-colunas, tipografia, espaçamentos, radius.
- `src/data/mock.ts`, sidebar, outras rotas, `routeTree.gen.ts`.
- Estrutura do chat (lista de bolhas + input redondo).
