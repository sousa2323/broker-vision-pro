# Refinamento estrutural — Modal "Operação do Lead"

Escopo restrito ao drawer atual em `src/routes/app.leads.tsx` (linhas ~771–1151). Sem nova lógica, sem novas abas, sem mudar mock, sidebar, tabela, cards do topo, Pipeline ou demais telas. Apenas estrutura visual, spacing, hierarquia e comportamento de scroll.

## 1. Container do modal

Substituir o painel lateral atual por um modal grande centralizado:

- Overlay `bg-black/50` cobrindo a tela.
- Card central: `w-[88vw] max-w-[1400px] h-[90vh]` centralizado (flex center).
- `rounded-2xl`, `bg-background`, `shadow-2xl`, `border border-border`.
- Estrutura interna em 3 zonas verticais com **um único scroll**:

```text
┌─────────────────────────────────────────┐
│ HEADER STICKY (fixo no topo)            │
├─────────────────────────────────────────┤
│ TABS STICKY (fixas abaixo do header)    │
├─────────────────────────────────────────┤
│ CONTEÚDO (único overflow-y-auto)        │
│   ...                                    │
└─────────────────────────────────────────┘
```

Técnico: o card é `flex flex-col`. Header e TabsList recebem `sticky top-0` / `sticky top-[Xpx]` dentro do mesmo container scrollável. Remover `overflow` interno de qualquer aba — só o wrapper de conteúdo rola.

## 2. Header sticky

Linha única, `px-6 py-4`, `bg-background`, `border-b border-border`, `sticky top-0 z-20`.

- **Esquerda**: nome do lead (forte) + id (muted, pequeno) numa linha; abaixo, badges em fila — etapa, prioridade, temperatura.
- **Direita**: botão `Marcar como perdido` (variant ghost/outline, secundário) + botão fechar (ícone X).
- Remover badges duplicados que hoje aparecem dispersos no topo do conteúdo.

## 3. Tabs sticky

`TabsList` com `sticky top-[72px] z-10 bg-background border-b border-border px-6 pt-3 pb-3`. Triggers em linha única com `gap-2`, scroll horizontal só se necessário em telas estreitas (`overflow-x-auto`). Garantir `mb-6` no primeiro bloco de cada `TabsContent` para que a barra nunca encoste no conteúdo (corrige sobreposição atual da aba Histórico).

## 4. Spacing global padronizado

- Padding lateral do conteúdo: `px-6`.
- Padding vertical do conteúdo: `py-6`.
- Entre seções (blocos da aba): `space-y-6`.
- Dentro de cards: `p-5`, elementos internos `space-y-3` (12–16px).
- Cards: `rounded-xl border border-border bg-card`.

## 5. Hierarquia visual em 3 níveis

- **Nível 1 (execução imediata)**: card "Próxima ação", botões operacionais principais. Tipografia maior, borda sutil destacada (`border-primary/30`), fundo `bg-surface`, ação principal em botão `default` cheio.
- **Nível 2 (contexto operacional)**: timeline, status, cadência, qualificação. Cards normais, títulos `text-sm font-semibold text-muted-foreground uppercase tracking-wide`.
- **Nível 3 (apoio)**: scripts, histórico antigo, observações. Tipografia menor, `text-muted-foreground`, sem destaques de cor.

## 6. Aba Execução — refinamento

- **Card "Próxima ação"** vira herói da aba: `p-6`, título grande, frase de ação, motivo em bullets discretos, CTA principal em destaque.
- **Botões operacionais** num grid uniforme: `grid grid-cols-2 md:grid-cols-5 gap-3`, todos com mesma altura (`h-11`), mesmo peso visual. Ordem fixa: Ligar · WhatsApp · Registrar interação · Agendar visita · Avançar etapa. "Marcar perdido" sai daqui (já está no header) — ou fica como link `ghost` discreto ao final.
- **Status operacional**: linha de mini-badges com `gap-2 flex-wrap`, sem caixas separadas por badge.
- **Timeline**: lista vertical com linha guia (`border-l border-border pl-4 ml-2`), ícones `h-3.5 w-3.5`, timestamps `text-xs text-muted-foreground`, `space-y-4` entre eventos.
- **Métricas rápidas**: grid `grid-cols-3 md:grid-cols-6 gap-3`, mini-cards uniformes `p-3`.

## 7. Aba Cadência

- Cada dia em container próprio: `Card` com header "Dia N — objetivo", `space-y-4` entre dias.
- Tarefas como linhas de checklist: ícone status à esquerda, canal+objetivo no centro, SLA `text-xs text-muted-foreground` à direita, script colapsável abaixo (`text-sm text-muted-foreground`).
- Remover aparência de tabela/formulário.

## 8. Aba Interações

- Cada interação como card leve `p-4`, `space-y-4` entre cards.
- Cabeçalho do card: ícone canal + responsável + timestamp discreto à direita.
- Resumo em corpo normal.
- Bloco "➡️ Próxima ação sugerida" com fundo `bg-surface`, borda esquerda `border-l-2 border-primary/40`, padding compacto.

## 9. Aba WhatsApp

- Layout em 2 zonas: card "Última conversa" no topo + card "Sugestão IA" destacado.
- Templates em `grid grid-cols-2 gap-3`, cards iguais com título e botão "Usar".
- Área de texto maior (`min-h-[120px]`), botões de ação alinhados à direita.
- Separação clara entre IA (fundo `bg-surface`) e mensagem manual (fundo `bg-card`).

## 10. Aba Visitas

Quando não há visita: estado vazio premium centralizado — ícone grande discreto, frase "Nenhuma visita agendada ainda.", botão `Agendar primeira visita` (sem lógica nova, apenas UI). Quando há: card único bem espaçado.

## 11. Aba Qualificação

- Grid `grid-cols-1 md:grid-cols-2 gap-4` para os 4 blocos: Perfil, Busca, Financeiro, Decisão.
- Cada card: título uppercase pequeno, lista de pares label/valor com `space-y-2`, label `text-muted-foreground text-xs`, valor `text-sm font-medium`.

## 12. Aba Scripts

- Lista vertical `space-y-4`, cada script em card `p-5`.
- Header: título forte + objetivo `text-xs text-muted-foreground` em linha separada.
- Texto do script em bloco com `bg-surface rounded-md p-3`.
- Botão "Copiar" pequeno (`size="sm" variant="ghost"`) à direita do header.

## 13. Aba Histórico

Garantir `mt-6` para evitar a sobreposição atual com a TabsList sticky. Manter timeline já existente, só ajustando spacing (`space-y-3`).

## 14. Responsividade

- `<lg`: grids de 5–6 colunas caem para 2; tabs com `overflow-x-auto`.
- Header: badges quebram em segunda linha.
- Modal: em `<md`, vira `w-[96vw] h-[94vh]`.
- Sem scroll horizontal em nenhuma aba.

## 15. Detalhes técnicos

- Editar apenas o bloco JSX `{drawerOpen && selected && ...}` (linhas ~772–1151) e seus filhos.
- Trocar wrapper externo de painel lateral para overlay+card centralizado.
- Mover `Tabs` para fora do bloco com padding interno: TabsList sticky, TabsContent recebe `px-6 py-6`.
- Eliminar qualquer `overflow-y-auto` aninhado dentro das abas.
- Reusar todos os helpers já existentes (`getProximaAcao`, `getMotivos`, `getStatusOperacional`, `getTimelineOperacional`, `getCadenciaPlano`, `getScoreLead`, `getComissao`, `SCRIPTS_LIB`, etc.) — nenhum dado ou lógica nova.
- Manter os Dialogs `perdaOpen` e `registroOpen` intactos.

## Critérios de aceite

- Modal centralizado ocupando ~88vw × 90vh, com sombra premium.
- Um único scroll vertical no conteúdo; header e tabs sempre visíveis.
- Tabs nunca sobrepõem conteúdo (Histórico corrigido).
- Spacing uniforme em todas as abas (24px externo, 24px entre seções).
- Hierarquia clara entre ação imediata, contexto e apoio.
- Botões operacionais alinhados em grid uniforme.
- Estado vazio elegante na aba Visitas.
- Nenhuma alteração fora do bloco do modal.
