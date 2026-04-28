## Plano — Conciliação Final (Governança, Cobrança Ativa e Auditoria)

Evolução **estritamente aditiva** sobre a aba "Conciliação" em `src/routes/admin.financeiro.tsx`. Layout, abas, identidade visual, colunas atuais (ID, Venda, Corretor, Esperado, Recebido, Diferença, Risco, Operacional, Status, Ações) e modal existente são preservados. Tudo abaixo é adicionado dentro das estruturas já presentes.

---

### 1. Camada de dados (`src/data/admin-mock.ts`)

Expandir `Conciliacao` (sem remover campos):

- `responsavel?: { tipo: "admin" | "operador"; nome: string }` — pode ficar indefinido (não atribuído).
- `slaDias: number` — janela de resolução (default 3 para Pendente/Divergente/Parcial).
- `slaIniciadoEm?: string` — começa quando entra em status não-Confirmada.
- `previsaoPagamento?: string` — definido manualmente pelo admin.
- `comprovante?: { nome: string; tipo: "PDF" | "Imagem"; referencia?: string; enviadoEm: string }`.
- `contrato: { versao: string; data: string; regras: string }` — bloco de vínculo contratual.
- `historicoCorretor: { pagamentosAtrasoPct: number; tempoMedioPagamentoDias: number; totalPagoHub: number; totalAberto: number }`.
- Expandir `ConciliacaoInteracao.tipo` para `"Ligação" | "WhatsApp" | "E-mail" | "Mensagem" | "Negociação"` (manter retrocompatível).
- `bloqueada?: boolean` — derivado de `status === "Confirmada"` (helper).

Helpers novos:
- `calcularPrioridade(c)` → score = `(valor / 1000) + (atraso × 5) + (risco peso)`. Usado para ordenação default.
- `calcularSLA(c)` → `{ restanteDias, atrasado: boolean }`.
- `agruparPorCorretor(lista)` → `{ corretor, totalDevido, totalRecebido, totalAtraso, inadimplenciaPct }[]`.

Popular os 8 mocks com responsáveis variados (alguns "não atribuído"), SLAs estourados em 2 linhas, previsões em 2, 1 com comprovante anexo, contrato v1.2 padrão, e historicoCorretor coerente com o risco.

---

### 2. Tabela — colunas e ordenação

Mantém todas as colunas atuais. **Adicionar ao final** (antes de Ações):

- **Responsável** — chip com nome ou botão ghost "Atribuir"; clique abre `Popover` com `Select` (Superadmin / Operador Cobranças / Operador Financeiro) + botão "Reatribuir" se já houver.
- **SLA** — badge: "Resolver em Xd" (neutro), "Atrasado +Yd" (vermelho) quando estourado. Confirmadas: "—".
- **Previsão** — data ou "—"; clique abre `Popover` com input de data.

Ordenação default da tabela passa a usar `calcularPrioridade` desc (Confirmadas vão para o final). Cabeçalhos ganham toggle de ordenação por clique (Esperado / Diferença / SLA / Prioridade).

Botão **"Agrupar por corretor"** acima da tabela (toggle). Quando ativo, substitui a tabela por uma tabela agregada: Corretor · Total devido · Total recebido · Total em atraso · Inadimplência % · botão "Ver itens" (volta ao modo lista filtrado por aquele corretor).

---

### 3. Bloqueio de edição (status Confirmada)

- Linha confirmada: dropdown de Ações mostra apenas "Ver detalhes" + **"Reabrir conciliação"**.
- "Reabrir conciliação" abre `AlertDialog` com `Textarea` obrigatória de justificativa. Ao confirmar: status volta a Pendente/Parcial conforme valores, entrada de auditoria registrada com a justificativa, toast.
- No modal, todos os inputs/botões de edição ficam `disabled` quando `bloqueada`, com tooltip "Conciliação confirmada — reabra para editar".

---

### 4. Modal `ConciliacaoDetalheModal` — novos blocos

Mantém os 5 blocos existentes. Adiciona, na ordem:

6. **Responsável & SLA** — chip do responsável com "Reatribuir", SLA visual (barra simples mostrando dias restantes/atraso), data prevista de pagamento (input editável com confirmação).
7. **Performance do corretor** — 4 mini-stats: % pagamentos em atraso, tempo médio de pagamento, total já pago ao hub, total em aberto. Lidos de `historicoCorretor`.
8. **Contrato aplicado** — versão, data de vigência, resumo das regras de comissão (ex: "6% comissão · 60/30/10 captador/parceiro/fee").
9. **Comprovante de pagamento** — área de upload (input file + campo "Referência (PIX/TED/banco)"). Se já existe, mostra "comprovante.pdf · enviado em DD/MM" + botão substituir/remover. Estado local (sem backend real); registra no log.
10. **Alertas inteligentes** — lista compacta de alertas auto-detectados para esta linha: valor < 70% esperado, atraso > SLA, divergência ≥ R$ 10k, sem retorno > 7 dias. Cada alerta com ícone e cor.

Bloco 4 (Ações diretas) reforçado:
- **Confirmar pagamento** e **Ajustar valor** continuam exigindo `AlertDialog`.
- **Marcar divergente** ganha campo de motivo opcional.
- **Definir previsão de pagamento** com date input.
- **Atribuir/Reatribuir responsável** inline.

CRM de cobrança (bloco já existente) ganha tipos novos no `Select`: Ligação · WhatsApp · E-mail · Mensagem · Negociação. Data preenchida automaticamente.

---

### 5. Auditoria reforçada

Toda ação registrada em `auditoria` com `{ data, autor, acao, valorAnterior?, valorNovo? }` — agora cobrindo:

- atribuição/reatribuição de responsável
- definição/alteração de previsão de pagamento
- upload/remoção de comprovante
- reabertura de conciliação (com justificativa concatenada em `acao`)
- mudança de status operacional
- confirmação, ajuste, divergência

---

### 6. Exportação

Estender `ExportarMenu` da aba com:

- Relatório de divergências (já planejado; manter)
- Relatório por corretor (agregado de `agruparPorCorretor`)
- Relatório de inadimplência (Pendente + SLA estourado)
- Histórico completo de auditoria (flatten de todas as entradas, com responsável)

---

### 7. Restrições respeitadas

- Nenhuma coluna existente removida; novas colunas vão ao final.
- Nenhum bloco do modal removido; novos blocos vão após os atuais.
- Identidade visual, abas, navegação, KPIs, filtros, modal de Cobrança preservados.
- Todas as alterações sensíveis (valor, status, reabertura) protegidas por `AlertDialog`.
- Estado local (sem backend) — protótipo administrativo.
- Sem novas dependências.

---

### Arquivos afetados

- **Editado** `src/data/admin-mock.ts` — expansão de `Conciliacao` (responsável, SLA, previsão, comprovante, contrato, historicoCorretor, tipos extras de interação), helpers `calcularPrioridade`, `calcularSLA`, `agruparPorCorretor`; mocks enriquecidos.
- **Editado** `src/routes/admin.financeiro.tsx` — colunas Responsável / SLA / Previsão, ordenação por prioridade, toggle "Agrupar por corretor" + tabela agregada, bloqueio de edição em Confirmadas + reabertura com justificativa, novos blocos no modal (Responsável & SLA, Performance do corretor, Contrato, Comprovante, Alertas), CRM com novos tipos, novos itens de export.

Nenhum arquivo deletado.