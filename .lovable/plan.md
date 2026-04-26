# Refino da tela Parceria Ativa — execução, urgência e fechamento

Único arquivo alterado: `src/routes/app.parcerias.ativa.tsx`. Sem novas rotas, sem mudanças em `mock.ts`, sidebar ou outras telas. Apenas enriquecimentos visuais e de interação no estado local existente.

## 1. Novo bloco — Próxima ação + Urgência

Inserir um novo card `NextActionBanner` entre o `HeaderBlock` e a grid Financeiro/Ações.

```text
┌─────────────────────────────────────────────────────────────┐
│ ⚡ Próxima ação                              ⏱ Sem atualização │
│ Agendar visita com o cliente                  há 3 dias       │
│ Responsável: Corretor B · Prazo sugerido: Hoje                │
│                              [Marcar como concluída]          │
└─────────────────────────────────────────────────────────────┘
```

- Estado local: `proximaAcao = { titulo, responsavel: "A" | "B", prazo }` + `diasSemAtualizacao = 3` (fictício).
- Borda/fundo destacados em azul (`border-sky-200 bg-sky-50`) quando `responsavel === "A"` (usuário logado); neutro (`bg-card`) caso contrário.
- Indicador de urgência (chip à direita):
  - 0–1 dia → cinza neutro
  - 2–3 dias → âmbar (`bg-amber-100 text-amber-800`)
  - > 3 dias → vermelho (`bg-red-100 text-red-700`)
- Botão "Marcar como concluída" empurra atividade na timeline e zera `diasSemAtualizacao`, definindo nova próxima ação genérica ("Aguardar retorno do cliente").

## 2. Pipeline mais ativo

No `PipelineStepper`:

- Adicionar botão "Atualizar etapa" no canto superior direito do card (mesmo `Popover` reutilizado de `AcoesCard`, recebendo a callback `onChangeEtapa` via prop).
- Adicionar microcopy abaixo do stepper: "A etapa define o andamento da parceria e é visível para ambos."

## 3. Bloco de atividades evoluído

No `ActivityTimeline`:

- Header ganha botão "Registrar atividade" (mesmo modal já existente, callback `onRegistrar` passado como prop).
- Ampliar opções no `RegistrarAtividadeModal` para: Visita realizada, Proposta enviada, Follow-up realizado, Outro (mantendo mapeamento de ícones).
- Em cada item da timeline, exibir badge com autor (Corretor A / Corretor B / IA) usando cor distinta por origem.

## 4. Comunicação acelerada

No `ChatBlock`:

- Adicionar subtítulo: "Conversa vinculada a esta parceria".
- Linha de chips de sugestões rápidas (`Button size="sm" variant="outline"`) acima do input:
  - "Enviar proposta" · "Confirmar visita" · "Aguardando retorno"
- Clicar em um chip preenche o input (não envia automaticamente).

## 5. Bloco de contrato → "Termos ativos da parceria"

Renomear `ContractBlock` (visualmente):

- Título: "Termos ativos da parceria".
- Lista de termos com destaque (chips em vez de bullets simples):
  - Divisão **50% / 50%**
  - Exclusividade **90 dias**
  - Fee Ubroker **12%**
- Manter aviso de contrato assinado (mais discreto).
- Trocar botão "Baixar contrato" por "Ver contrato completo" (mantendo toast).

## 6. Microajuste financeiro

No `FinanceCard`, adicionar uma linha pequena no rodapé esquerdo: *"Simulação baseada no valor atual do imóvel"*.

## 7. Finalização da venda evoluída

Reescrever `FinalizarVendaModal` em duas etapas (estado local `step: "form" | "resumo"`):

**Etapa 1 — Formulário:**

- Valor final da venda (input numérico).
- Recalcular ao vivo conforme o valor digitado: comissão (3%), parte de cada corretor, fee Ubroker, ganho líquido — mostrar mini grid.
- Quem fechou: Corretor A / B / Ambos.
- Checkbox: "Ambas as partes confirmam que a venda seguiu os termos da parceria."
- Botão "Confirmar venda" desabilitado até checkbox marcado.

**Etapa 2 — Resumo (após confirmar):**

```text
✓ Venda concluída com sucesso
Valor final ............ R$ 1.180.000
Ganho Corretor A ....... R$ 15.576
Ganho Corretor B ....... R$ 15.576
Fee plataforma ......... R$ 4.248
                     [Fechar]
```

Ao fechar, o estado externo já foi atualizado (status → Fechada, etapa → Fechado, atividade adicionada).

## Detalhes técnicos

- Manter todos os sub-componentes no mesmo arquivo.
- Novos estados em `ParceriaAtivaPage`: `proximaAcao`, `diasSemAtualizacao`.
- `PipelineStepper` recebe nova prop `onChangeEtapa`.
- `ActivityTimeline` recebe nova prop `onRegistrar`; cada `Atividade` ganha campo opcional `origem: "A" | "B" | "IA" | "Sistema"` derivado do `autor` para colorir o badge.
- `ChatBlock` ganha estado interno para preencher input via chip.
- `FinalizarVendaModal` passa a calcular valores em tempo real com `useMemo` e alterna entre dois conteúdos via `step`.
- Toda lógica permanece em estado local; nenhuma chamada de rede.
- Reutilizar tokens visuais existentes (`bg-card`, `border-border`, `text-orange-*`, `bg-navy`) e componentes shadcn já importados — sem novas dependências.

## Não alterar

- `src/data/mock.ts`, sidebar, outras rotas, `routeTree.gen.ts`.
- Estrutura geral do layout (grid, ordem dos blocos principais — apenas insere o `NextActionBanner`).