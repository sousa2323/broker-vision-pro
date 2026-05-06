# Refinar modal "Operação do Lead"

Alteração restrita ao drawer "Operação do Lead" em `src/routes/app.leads.tsx`. Sem mexer em sidebar, rotas, mock, Pipeline, Financeiro, Admin ou no restante da tela de Leads (cards, filtros, tabela e aside seguem como estão).

## 1. Header do drawer

Manter nome / id / etapa / nível, mas reorganizar como faixa única com:
- Nome + id
- Badge de etapa (`statusColor`)
- Badge de prioridade (`getNivelMeta`)
- Badge de temperatura (quente / morno / frio)
- Botão "Marcar como perdido" (ghost, à direita) que abre o modal de saída descrito no item 10.

## 2. Aba "Execução" — reestruturação completa

Cinco blocos verticais, espaçados, todos derivados dos helpers já existentes + novos auxiliares puros (sem alterar mock).

### Bloco 1 — Status operacional
Card compacto com linha de mini-badges:
- Temperatura (🔴/🟡/🔵)
- Score (mock determinístico a partir do id+orçamento, 60–95)
- Tempo sem interação (`l.ultimaInteracao`)
- Risco de perda (quando `isAtrasado` ou prioridade Proposta sem retorno)
- Cadência (Em dia / Dia X atrasado)
- Visita (quando `status === Visita`)

Helper novo: `getStatusOperacional(l)` retorna array `{ icon, label, tone }`.

### Bloco 2 — Próxima ação recomendada
Card destacado (borda suave, fundo `surface`, sem aparência de alerta):
- Título "Próxima ação recomendada"
- Frase forte usando `getProximaAcao(l).label` + nome do lead
- Lista "Motivo" com 2–3 bullets derivados (visita marcada, sem confirmação há Xh, risco médio de no-show, etc.) via `getMotivos(l)`.
- CTAs: Ligar · WhatsApp · Confirmar visita (quando aplicável) · Adiar tarefa.

### Bloco 3 — Timeline operacional
Lista compacta com linha vertical discreta. Itens derivados de `l.historico` + eventos sintéticos ("Sem resposta há Xh", "Visita agendada", "Lead qualificado pela IA"). Ícones pequenos, timestamps pequenos. Helper `getTimelineOperacional(l)`.

### Bloco 4 — Cadência ativa
Subtítulo "Sequência operacional em andamento". Lista de checkboxes/itens com status (Concluído / Hoje / Atrasado / Pendente), tipo + canal + prazo. Botão "Concluir tarefa" por item (sem persistir). Reusa `getCadenciaPlano(l)` existente, ampliando para incluir canal e prazo.

### Bloco 5 — Métricas rápidas
Linha horizontal de 6 mini-cards: Score, Potencial (`orcamento`), Comissão (`getComissao`), Chance de conversão (derivada de score), Tempo médio resposta (mock por origem), Estágio de decisão (Alto/Médio/Baixo a partir de status).

## 3. Aba "Interações"

Reformatar como mini-CRM. Cada item do histórico vira card com:
- Ícone do canal
- Data/hora
- Responsável (mock: "Você")
- Resumo (texto do histórico)
- Linha "➡️ Próxima ação sugerida" (helper `getSugestaoPosInteracao(item, l)`).

Botão "Registrar interação" abre dialog compacto com `select` de tipo (ligação / WhatsApp / reunião / visita / observação / follow-up) + textarea. Sem persistência.

## 4. Aba "Cadência"

Substituir tabela atual por jornada vertical:
- Título "Cadência: Qualificação Premium"
- Agrupada por Dia 1–4
- Cada item: canal · objetivo · SLA · status (badge) · script sugerido (colapsável)
- Botões topo: Pausar cadência · Reiniciar · Trocar cadência (apenas UI).

## 5. Aba "WhatsApp"

Layout mini-inbox:
- Card "Última conversa" com horário e resumo
- Bloco "Sugestão IA" (texto pré-pronto baseado no interesse do lead)
- Botões: Usar sugestão · Editar mensagem · Copiar texto
- Lista de templates rápidos (Apresentação, Confirmação visita, Follow-up, Pós-visita).

## 6. Aba "Visitas"

Card de visita derivado (quando `status === Visita`): imóvel relacionado, data/hora, status (Agendada/Confirmada/Realizada/Não compareceu/Reagendada), endereço, observações, campo feedback. Botões: Confirmar visita · Registrar feedback · Reagendar. Estado vazio elegante para os demais.

## 7. Aba "Qualificação"

Reorganizar em 4 cards: Perfil · Busca · Financeiro · Decisão. Campos derivados de `interesse` + placeholders. Visual limpo, sem inputs editáveis (read-only mock).

## 8. Aba "Scripts"

Biblioteca por etapa (Primeiro contato, Reativação, Follow-up, Confirmação de visita, Pós-visita, Proposta). Cada script: título · objetivo · texto · botão "Copiar". Reusa lista atual, expandindo objetivos.

## 9. Aba "Histórico"

Linha do tempo completa estilo auditoria leve:
- Lead criado · Qualificado · Etapa alterada · Interação registrada · Visita criada · Proposta enviada · Perda/Conversão (quando aplicável)
- Cada linha: data/hora · responsável · origem da ação · alteração.

## 10. Saída operacional — "Marcar como perdido"

Novo `Dialog` controlado por `perdaOpen`:
- Select obrigatório com motivos (Sem retorno, Sem perfil, Comprou outro imóvel, Sem crédito, Momento errado, Valor acima, Não gostou da região, Outro)
- Textarea obrigatório "Observação"
- Botões: Cancelar · Confirmar perda (sem persistência, apenas fecha).

## 11. Inteligência comportamental

Mini-badges discretos no header do drawer e no Bloco 1, exibidos condicionalmente:
- Sem resposta · Quente parado · Proposta sem retorno · Cadência atrasada · Visita sem confirmação · Risco de perda.

Helper `getAlertasComportamentais(l)`.

## 12. Restrições

- Sem novas dependências.
- Sem alterações em mock, sidebar, rotas, Pipeline ou demais telas.
- Sem alterar tabela/aside/cards do topo da página de Leads.
- Identidade visual Ubroker (navy, surface, cards arredondados) preservada.
- Sem dashboards, sem formulários gigantes, sem poluição visual.

## Detalhes técnicos

- Novos estados em `LeadsPage`: `perdaOpen`, `perdaMotivo`, `perdaObs`, `registroOpen`, `registroTipo`, `registroTexto`.
- Novos helpers puros: `getStatusOperacional`, `getMotivos`, `getTimelineOperacional`, `getMetricasRapidas`, `getSugestaoPosInteracao`, `getAlertasComportamentais`, `getScoreLead`, `getVisitaInfo`.
- Ampliar `getCadenciaPlano` para devolver canal + SLA por item.
- Toda a refatoração ocorre dentro do JSX do drawer já existente; abas são reescritas individualmente.

## Critérios de aceite

- Drawer parece um cockpit operacional (status, ação, timeline, cadência, métricas).
- Próxima ação clara e com motivos.
- Cadência visual por dias.
- Interações com sugestão de próxima ação.
- Histórico em linha do tempo de auditoria leve.
- Saída operacional com motivo obrigatório.
- Demais áreas da plataforma e da própria página de Leads inalteradas.
