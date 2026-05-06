# Plano — Leads como Central de Execução Comercial Guiada

Alteração restrita a `src/routes/app.leads.tsx` (sem mexer em sidebar, rotas, mock, Pipeline ou outras telas). Mantém a base atual (cards, filtros rápidos, tabela, aside) e adiciona as camadas faltantes: 5º card de VGV, busca real, filtros avançados, colunas operacionais, ações rápidas no aside e o drawer “Operação do Lead” com 8 abas.

## 1. Cabeçalho

Atualizar subtítulo para:
"Sua central diária de execução comercial. Veja o que fazer, quando fazer e quais oportunidades priorizar."

## 2. Bloco "Execução de hoje" — adicionar 5º card

Manter os 4 cards existentes e acrescentar:

- **Oportunidades quentes** — valor `R$ X mi` em VGV (soma de `orcamento` dos leads com `getPrioridade === "quente"` e ativos), label "VGV em leads quentes", subtexto "Potencial estimado das oportunidades prioritárias".

Grid passa a `lg:grid-cols-5` (mantém `grid-cols-2` no mobile).

## 3. Filtros rápidos + busca + filtros avançados

- Adicionar chip **"Perdidos"** ao array `FILTROS_RAPIDOS` (filtra `status === "Perdido"`).
- Substituir o "campo de busca" decorativo por `<input>` real controlado (`busca`), aplicado sobre nome / id / interesse.
- Botão **"Filtros"** abre um `<Dialog>` com filtros avançados (somente UI, sem persistência de lógica nova): Origem, Temperatura, Etapa, Região, Tipo de imóvel, Faixa de orçamento, Tempo sem interação, Status da cadência. Render via `select`/`checkbox` simples + botão "Aplicar"/"Limpar". Estado local; aplicar reduz `leadsFiltrados`.
- Mover o botão "+ Novo lead" para a barra de ações junto com "Filtros" (mantém o do header também, conforme já existe — opcional remover do header para não duplicar; manter no header e adicionar primário na toolbar).

## 4. Tabela — novas colunas

Reordenar/adicionar colunas para a ordem operacional:

```
Lead | Origem | Potencial | Etapa | Próxima ação | Prazo/SLA | Última interação
```

- **Origem**: igual hoje (badge "qual." quando aplicável).
- **Etapa**: usa `l.status` com `statusColor` (renomeia coluna "Status" para "Etapa").
- **Última interação**: novo helper `getCanalUltimo(l)` deriva canal a partir do primeiro item de `l.historico` (se existir) ou "—". Render: `Canal · ultimaInteracao`. Sem alterar mock.

Mantém `border-l-4` por nível, badge de prioridade no Lead, microtexto de tensão na coluna "Próxima ação".

## 5. Painel lateral — ações rápidas e atalho ao drawer

Logo abaixo dos 3 CTAs (Ligar / WhatsApp / Registrar), incluir um grid 2x2 de ações secundárias compactas:

- Registrar interação
- Agendar visita
- Avançar etapa
- Marcar como perdido

E um botão full-width **"Ver operação completa"** que abre o drawer.

Acrescentar pequenos badges/alertas contextuais no topo do aside quando aplicável (reaproveitando os helpers existentes): "Visita hoje às 15h" (quando `status === "Visita"` + `isHoje`), "Proposta sem retorno" (status Proposta), "Lead sem contato há Xh" (atrasado), "Lead qualificado pela IA" (se `historico` contém item com `tipo === "IA"`).

## 6. Drawer "Operação do Lead"

Usar `Drawer` (vaul) lateral à direita controlado por `useState`. Abre via "Ver operação completa".

Conteúdo com `Tabs` (`@/components/ui/tabs`) — 8 abas:

1. **Execução** (default): repete o card de Próxima ação, lista "Tarefas de hoje" (mock derivado: ação atual), "Tarefas atrasadas" (se `isAtrasado`), botões "Avançar etapa" e "Registrar interação".
2. **Cadência**: lista estática de Dia 1 / Dia 2 / Dia 3 com ações (Ligação inicial, WhatsApp, Follow-up, Envio de imóveis, Prova social, Nova tentativa). Status (Pendente / Concluído / Atrasado) derivado simples a partir do `status`/`urgencia` do lead.
3. **Interações**: timeline a partir de `l.historico` (data, canal, texto). Reaproveita o histórico que já está no aside.
4. **WhatsApp**: card com "última mensagem" (primeiro item de histórico com tipo WhatsApp ou placeholder), `<textarea>` com mensagem sugerida pré-preenchida e botão "Enviar mensagem sugerida" (sem ação real).
5. **Visitas**: cartão com visita derivada (status Visita → "Sábado 10h, Apartamento em Icaraí"), campo de feedback. Demais leads: estado vazio.
6. **Qualificação**: campos read-only derivados do `interesse`: Perfil, Tipo, Região, Orçamento, Capacidade, Prazo, Motivação, Objeções, Observações (placeholders quando não inferível).
7. **Scripts**: lista de scripts por etapa (Primeiro contato, Reativação, Confirmação de visita, Pós-visita, Proposta) — texto curto estático com botão "Copiar".
8. **Histórico**: timeline completa do `l.historico` + eventos sintéticos ("Lead criado", "Etapa atual: X").

Drawer ocupa `max-w-2xl` à direita em desktop, full-width no mobile. Header do drawer: nome, id, etapa, badge de nível.

## 7. Lógica de priorização

Mantém ordenação atual (ativo → nível alta/média/baixa → maior comissão). Sem mudança.

## 8. Restrições respeitadas

- Sem alteração em sidebar, rotas, Pipeline, Financeiro, Imóveis, Indicações, Parcerias, mock.
- Sem novas dependências (usa `Dialog`, `Drawer`, `Tabs` já presentes).
- Identidade visual mantida (navy, surface, cards arredondados, fundo claro).

## Detalhes técnicos

- Novos estados em `LeadsPage`: `busca: string`, `filtrosOpen: boolean`, `drawerOpen: boolean`, `filtrosAvancados: { origem?, etapa?, tipo?, regiao?, orcamentoMax? }`.
- Novos helpers no topo do arquivo: `getCanalUltimo`, `getVgvQuente(leads)`, `getAlertasContexto(l): string[]`, `getCadenciaPlano(l)`, `getScripts()`.
- Reaproveita `getNivel`, `getNivelMeta`, `getReforco`, `getProximaAcao`, `getUrgencia`, `getUrgenciaMeta` já existentes.
- Drawer renderizado uma única vez fora do `<aside>`, ligado a `selected`.
- Garantir tipagem: extender `FILTROS_RAPIDOS` com `"Perdidos"`.

## Critérios de aceite

- Topo mostra 5 cards (4 atuais + VGV de quentes).
- Chip "Perdidos" presente; busca filtra a tabela; botão Filtros abre dialog funcional.
- Tabela mostra 7 colunas na ordem definida, incluindo Etapa e Última interação.
- Aside tem 3 CTAs principais + 4 ações secundárias + botão "Ver operação completa".
- Drawer abre com 8 abas navegáveis e conteúdo coerente por lead.
- Visual da Ubroker preservado, sidebar e demais telas inalteradas.
