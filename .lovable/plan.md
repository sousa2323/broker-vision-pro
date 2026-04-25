## Refinar `/app/pipeline` — Kanban como ferramenta ativa de fechamento

Editar **apenas** `src/routes/app.pipeline.tsx`. Estrutura de 5 colunas e layout preservados. Sem mudanças em `mock.ts` ou outras rotas.

### 1. Tipo `Card` e dados estendidos

Acrescentar campos opcionais ao tipo:
- `proximaAcao?: string` — preencher em todos os cards via mock inline (agendar visita / enviar proposta / follow-up / etc.)
- (mantém `dias` como "dias parado / desde criação"; usado para urgência)

Helpers locais no topo do arquivo:
- `getUrgencia(dias)` → `"ok" | "atencao" | "urgente"` (≤1 / 2-3 / >3)
- `getComissao(valor)` → `valor * 0.03`
- `isDestaque(card, stageId)` → `true` se estágio ∈ {Visita, Proposta} **e** valor ≥ 1.500.000

### 2. Indicador de urgência no card

Substituir o atual `{c.dias}d` por badge com cor:
- ok → cinza neutro: "Última ação hoje" (dias=0) ou "Há Xd"
- atencao (amarelo): "Sem interação há Xd"
- urgente (vermelho): "Sem interação há Xd · agir"

Para cards de **Fechado**, trocar mensagem por "Fechado em Xd" (verde).

### 3. Próxima ação

Linha discreta dentro do card (abaixo do valor):
> "Próximo passo: **agendar visita**"

Default por estágio quando o card não traz `proximaAcao`:
- Novo → "qualificar lead"
- Qualificado → "agendar visita"
- Visita → "enviar proposta"
- Proposta → "follow-up de decisão"
- Fechado → "iniciar pós-venda"

### 4. Comissão estimada em todos os cards

Adicionar linha pequena: `Comissão est. R$ 42.000` (verde discreto, `text-emerald-700`). Nos cards de Fechado, substitui a tag manual `"Comissão R$ 84.6k"` por essa linha calculada — remover essas tags duplicadas dos dados.

### 5. Destaque de cards-chave

Quando `isDestaque(...)` for verdadeiro: aplicar `ring-1 ring-brand/40 shadow-md` + pequena tag canto superior "🎯 Foco" (cor brand). Sutil, sem quebrar o grid.

### 6. Coluna Proposta

Logo abaixo do header da coluna (mesma linha do contador): pill "Aguardando decisão" em violeta suave (`bg-violet-50 text-violet-700`). Mostrado só nessa coluna.

### 7. Coluna Fechado

Header da coluna ganha pill verde "Concluídos no mês". Cards de Fechado trocam o badge de urgência por `"Fechado em Xd"` e mantêm tag opcional (ex.: "À vista").

### 8. Indicador no topo

No header existente, segunda linha do subtítulo:
> "20 oportunidades · VGV R$ 27.310.000"  
> "**3 oportunidades próximas de fechamento**" (em brand, com ícone Target)

`proximasFechamento` = contagem de cards com estágio `Proposta` **ou** (Visita com valor ≥ 1.500.000).

### Estrutura final do card (ordem)

```
[🎯 Foco]                          [badge urgência]
Cliente
Imóvel · região
R$ 1.590.000
Comissão est. R$ 47.700
Próximo passo: enviar proposta
[tag opcional ex.: "Sábado 10h"]
```

### Não alterar

- `mock.ts`, sidebar, layout grid das colunas, demais rotas.
- Quantidade/ordem de colunas e cards.

### Resultado

Cada card comunica em 2 segundos: quanto vale, quanto rende, há quanto tempo está parado e qual é o próximo passo. Visita e Proposta de alto valor ganham destaque visual; Fechado reforça performance.
