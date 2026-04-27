## Evolução da tela Perfil — Base estruturada do corretor

Único arquivo alterado: `src/routes/app.perfil.tsx`. Sem mudanças em `mock.ts`, sidebar, rotas ou outras telas. A estrutura base (coluna esquerda identidade + coluna direita informações) é mantida — apenas enriquecida.

## Layout final

```text
┌─ Coluna esquerda (1/3) ─────────┐  ┌─ Coluna direita (2/3) ──────────────────┐
│ Foto                            │  │ Nota: "Essas informações ajudam a IA    │
│ Nome (Ramon Cardozo Capone)     │  │ e outros corretores a entender seu      │
│ "Essas informações são          │  │ perfil de atuação."                     │
│  utilizadas para personalizar   │  ├──────────────────────────────────────────┤
│  sua experiência na Ubroker."   │  │ INFORMAÇÕES (existente, mantido)        │
│ Chip Plano Free                 │  │ E-mail · Telefone · CRECI · Região      │
│ [Fazer upgrade para Pro]        │  │   principal (era "Região de atuação")   │
└─────────────────────────────────┘  ├──────────────────────────────────────────┤
                                     │ REGIÕES SECUNDÁRIAS (NOVO)              │
                                     │ chips: Niterói, São Gonçalo, Maricá +   │
                                     ├──────────────────────────────────────────┤
                                     │ PERFIL DE ATUAÇÃO (NOVO)                │
                                     │ - Especialidades (tags multi)           │
                                     │ - Faixa de ticket médio (select)        │
                                     │ - Tipo de imóvel (chips multi)          │
                                     │ - Perfil de cliente (chips multi)       │
                                     ├──────────────────────────────────────────┤
                                     │ BIO PÚBLICA (existente, placeholder     │
                                     │ ajustado)                               │
                                     ├──────────────────────────────────────────┤
                                     │ [Cancelar]  [Salvar alterações]         │
                                     └──────────────────────────────────────────┘
```

## Mudanças por bloco

### Coluna esquerda
- Adicionar microtexto cinza abaixo do nome: "Essas informações são utilizadas para personalizar sua experiência na Ubroker."
- Manter foto, nome, chip de plano e botão de upgrade exatamente como estão.

### Coluna direita — topo
- Adicionar bloco de orientação acima do card "Informações": pequeno texto em `text-muted-foreground` com ícone `Sparkles` ou `Info`: "Essas informações ajudam a IA e outros corretores a entender melhor seu perfil de atuação."

### Card "Informações" (existente)
- Manter campos: E-mail, Telefone, CRECI.
- Renomear "Região de atuação" → "Região principal" (mesmo `Field`, valor "Niterói / RJ").

### Card "Regiões secundárias" (NOVO)
- Card branco separado com título "Regiões secundárias" e microcopy "Outras regiões onde você atende".
- Lista de chips removíveis (visuais): Niterói, São Gonçalo, Maricá, Itaipu.
- Botão tracejado "+ Adicionar região" (puramente visual, sem lógica real).

### Card "Perfil de atuação" (NOVO)
Card branco com 4 subgrupos empilhados, cada um com label + controle visual:

1. **Especialidades** — chips selecionáveis (estado local toggle): Coberturas (selecionado), Casas em condomínio (selecionado), Alto padrão (selecionado), Apartamentos compactos, Lançamentos, Pé na areia.
2. **Faixa de ticket médio** — `Select` shadcn com opções: Até R$ 500k · R$ 500k – R$ 1M · R$ 1M – R$ 3M (selecionado) · R$ 3M – R$ 10M · Acima de R$ 10M.
3. **Tipo de imóvel** — chips multi: Residencial (on), Comercial, Lançamentos (on), Temporada.
4. **Perfil de cliente** — chips multi: Família (on), Investidor (on), Primeira compra, Mudança interestadual (on).

Chips ativos usam `bg-navy text-navy-foreground`, inativos `bg-surface text-muted-foreground border border-border`. Estado via `useState` local — apenas visual.

### Card "Bio pública" (existente)
- Manter campo `<textarea>`.
- Trocar placeholder/defaultValue para sugerir: "Descreva seu posicionamento, experiência e diferenciais no mercado." (manter o defaultValue atual como exemplo preenchido OU usar como placeholder se vazio — manter texto atual e ajustar `placeholder` no textarea).

### Botões
- Manter "Cancelar" e "Salvar alterações" como estão.

## Detalhes técnicos
- Imports adicionais em `app.perfil.tsx`: `useState` de react; `Sparkles` (ou `Info`) e `X`, `Plus` de `lucide-react`; `Select, SelectTrigger, SelectValue, SelectContent, SelectItem` de `@/components/ui/select`.
- Componente helper local `Chip({label, active, onClick})` para os chips toggláveis, reutilizado em Especialidades, Tipo de imóvel e Perfil de cliente.
- Estado local: `useState` para arrays de selecionados e para o ticket. Sem persistência, sem chamadas externas.
- Reaproveitar componente `Field` existente para os 4 campos de informações.
- Manter classes e identidade visual (`bg-card`, `border-border`, `bg-navy`, `bg-surface`, `text-muted-foreground`).

## Não alterar
- `src/data/mock.ts`, sidebar, rotas, outras telas.
- Estrutura de duas colunas (1/3 + 2/3) e identidade visual.
- Foto, nome, chip de plano, botão de upgrade, botões finais.
- Campos existentes (E-mail, Telefone, CRECI) — apenas "Região de atuação" é renomeado para "Região principal".
