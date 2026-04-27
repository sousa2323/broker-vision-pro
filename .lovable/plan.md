## Evolução da tela Atividades — Agenda comercial inteligente

Único arquivo alterado: `src/routes/app.atividades.tsx`. Sem mudanças em `mock.ts`, sidebar, rotas ou outras telas. Toda a riqueza extra (impacto, etapa, parceria, atrasos, sugestões) é derivada localmente da lista existente via mapa estático por `id`, mantendo o tipo `ActivityItem` intacto.

## 1. Resumo do dia (topo estratégico)

Logo abaixo do header, três cards horizontais compactos:

```text
[ Atividades hoje  4 ] [ Alto impacto  2 ] [ Atrasadas  1 (laranja) ]
```

- Layout `grid grid-cols-3 gap-3`, cada card em `border border-border bg-card rounded-2xl p-4`.
- "Atrasadas" usa `text-orange-600` + ícone `AlertTriangle`.

## 2. Bloco "Prioridades do dia" (sugestões IA)

Acima da lista, card único com 3 sugestões fictícias:

- "Follow-up com João Mendes — 3 dias sem resposta"
- "Confirmar visita de Camila Andrade"
- "Enviar proposta para Roberto e Lúcia"

Estilo: `border-l-4 border-l-orange-400 bg-orange-50/40`, ícone `Sparkles`. Cada item com botão pequeno "Adicionar à agenda" (apenas toast).

## 3. Toggle Lista / Calendário

Abaixo do título "Atividades":

```text
[ Lista (ativo) ] [ Calendário ]
```

- Estado local `view: "lista" | "calendario"`.
- Modo Calendário: grid semanal estática (Seg–Dom × faixas de horário 08–20h) com blocos coloridos correspondentes às atividades de "Hoje" e "Amanhã" — visual apenas, sem interação real. Implementado com CSS grid simples.

## 4. Cards de atividade enriquecidos

Mantém a estrutura/ícones atuais e adiciona campos derivados de um mapa local `meta[id]`:

```text
┌──────────────────────────────────────────────────────────────┐
│ [icon] Camila Andrade                            09:30  ⏰   │
│        Ligação · Casa em Itaipu — R$ 1.180.000               │
│        Etapa: Visita    [Alto impacto]    Parceria: Marina T.│
│        Confirmar visita de sábado.                            │
│        [✔ Concluir] [⏰ Reagendar] [📊 Pipeline] [💬 Conversa]│
└──────────────────────────────────────────────────────────────┘
```

Novos elementos no card:
- **Imóvel vinculado**: usa `a.imovel` se existir; caso contrário, valor do mapa local (ex: "Casa em Itaipu — R$ 1.180.000").
- **Etapa do pipeline**: chip `bg-navy/5 text-navy` (Lead, Qualificado, Visita, Proposta).
- **Tag de impacto**: chip colorido — Alto (`bg-orange-100 text-orange-700`), Médio (`bg-amber-100 text-amber-800`), Baixo (`bg-muted text-muted-foreground`).
- **Parceria** (opcional): linha "Parceria com Marina Tavares" com ícone `Handshake`.
- **Status atrasado**: se `data === "Hoje"` e `hora` < hora atual (e `id` não está no set local `concluidas`), exibir badge `Atrasado` em vermelho à direita do horário.
- **Ações rápidas**: 4 botões `ghost size="sm"` com ícones `Check`, `Clock`, `BarChart3`, `MessageCircle`. "Concluir" adiciona o id ao set `concluidas` (risca o card via `line-through opacity-60`); demais ações disparam `toast`.

## 5. Agrupamento por dia com contagem

Header de cada seção: `Hoje (4 atividades)` em vez de só `Hoje`. A contagem usa `items.length` já disponível.

## 6. Modal "Nova atividade"

Botão existente "Nova atividade" passa a abrir `Dialog` com formulário (estado local, sem persistir):

- Nome do lead (Input)
- Tipo (Select: Ligação, Visita, Reunião, Follow-up, E-mail)
- Data (Input `type="date"`) e Hora (Input `type="time"`)
- Imóvel vinculado — opcional (Input)
- Parceria vinculada — opcional (Input)
- Observação (Textarea)

Botões: Cancelar / Salvar. Salvar fecha o modal e dispara `toast` ("Atividade criada"). Não persiste na lista (mantém dados fictícios estáveis).

## Detalhes técnicos

- Manter export `Route` e função `ActivitiesPage` no mesmo arquivo.
- Novos estados: `view`, `concluidas: Set<string>`, `openNova: boolean`, `form` (campos do modal).
- `meta` constante por id contendo `{ etapa, impacto, imovel?, valor?, parceria? }` para os 8 ids existentes (A-01 … A-08).
- Helper `isAtrasada(a)` compara `hora` com `new Date()` quando `data === "Hoje"`.
- Reutilizar shadcn já presentes: `Dialog`, `Input`, `Select`, `Textarea`, `Button`, `toast` (sonner). Ícones extras de `lucide-react`: `AlertTriangle`, `Sparkles`, `Handshake`, `Check`, `Clock`, `BarChart3`, `MessageCircle`, `LayoutList`, `CalendarDays`.
- Calendário semanal: grid CSS estática (`grid-cols-8`, primeira coluna = horários), blocos posicionados manualmente para Hoje/Amanhã usando classes Tailwind — sem libs.
- Manter paleta: `bg-navy`, `text-orange-*`, `bg-card`, `border-border`.

## Não alterar

- `src/data/mock.ts`, sidebar, outras rotas, `routeTree.gen.ts`.
- Estrutura geral (header, agrupamento por dia, ícones de tipo permanecem).
