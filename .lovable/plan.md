## Refinar tela `/app/leads` — pipeline inteligente com valor financeiro

Editar **apenas** `src/routes/app.leads.tsx`. Estrutura (lista à esquerda + painel direito) preservada. Sem mudanças em `mock.ts`, sidebar ou rotas.

### 1. Helpers locais (topo do arquivo)

- `getPrioridade(status)`: `Proposta`/`Visita`/`Fechado` → `quente` 🔥, `Qualificado` → `morno` ⚡, `Novo` → `frio` ❄️, `Perdido` → neutro.
- `getComissao(orcamento)`: `orcamento * 0.03` (3% padrão UBroker, alinhado a `kpis.comissaoMedia`).
- `originHighlight(origem)`: `true` para `Indicação` e `Marketplace` (leads mais qualificados).

### 2. Padronizar cores de status

Atualizar `statusColor`:

- Novo → cinza (atual ok)
- Qualificado → azul
- Visita → laranja (`bg-orange-50 text-orange-800`)
- Proposta → roxo (atual ok)
- Fechado → emerald (mantém)
- Perdido → vermelho (`bg-red-50 text-red-700`)

### 3. Microcopy no topo da lista

Acima da barra de busca (dentro do header existente, sem novo bloco): linha pequena com ícone 🔥:

> "**Oportunidades em andamento:** 12 leads ativos"

### 4. Tabela enriquecida

Cada `<tr>` ganha uma **borda esquerda colorida** baseada em prioridade (vermelha quente / âmbar morno / azul-claro frio).

Coluna **Lead**: adicionar abaixo do nome um chip pequeno de prioridade (🔥 Quente / ⚡ Morno / ❄️ Frio) ao lado do nome.

Coluna **Origem**: se `Indicação` ou `Marketplace`, envolver em pill âmbar discreto com micro-tag "qualificada".

Coluna **Orçamento**: trocar valor único por bloco de duas linhas:

```
R$ 1.000.000
Comissão est. R$ 30.000   (verde discreto)
```

### 5. Painel direito (detalhe) — novos blocos

Mantém ordem geral. Após o cabeçalho com nome/status, adicionar/reorganizar:

**a) Resumo rápido** (novo bloco, antes de Origem):

- Tipo de imóvel desejado (extraído por regex simples de `interesse`: procura "casa|cobertura|apartamento|sala|terreno|studio|loft" — fallback "Imóvel residencial")
- Região de interesse (regex por bairros: "Icaraí|Santa Rosa|Niterói|São Francisco|Charitas..." — fallback "Niterói / RJ")
- Orçamento (formatado)

**b) Potencial de negócio** (novo bloco, após Interesse):

- Valor estimado: `formatBRL(orcamento)`
- Comissão estimada: `formatBRL(orcamento * 0.03)` (destaque verde/brand)

**c) Destaque "Última ação"** acima do histórico:

> "Última ação: **Hoje, 09:14**" (lê `historico[0].data`) — em pill brand suave.

### 6. Botões de ação

- "Registrar contato" → **"Registrar interação"**
- "Ver no pipeline" → **"Mover para pipeline"**

### 7. Não alterar

- `mock.ts`, layout grid, sidebar/topbar, demais rotas.
- Schema de `Lead`. Tudo derivado em runtime no componente.

### Resultado

Lista escaneável por prioridade + valor financeiro visível em cada linha; painel direito com leitura rápida do que o lead quer e quanto vale.