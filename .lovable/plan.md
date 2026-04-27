## Reestruturação da tela IA Assistente — Central de Controle e Performance

Único arquivo alterado: `src/routes/app.ia.tsx`. Sem mudanças em `mock.ts`, sidebar, rotas ou outras telas. Todos os dados extras (performance, configurações, conexão, comportamento) são constantes locais com dados fictícios. O chat existente continua presente, mas como bloco secundário "Exemplo de atendimento".

## Nova estrutura da página (top → bottom)

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Header: "IA Assistente"  · subtítulo                                  │
│ Ações: [Pausar IA] [Editar comportamento] [Assumir conversa]          │
├──────────────────────────────────────────────────────────────────────┤
│ 1. STATUS DA IA (3 cards)                                             │
│  [● IA ativa]  [WhatsApp conectado]  [Tempo médio resposta 12s]       │
├──────────────────────────────────────────────────────────────────────┤
│ 2. PERFORMANCE — "Últimos 30 dias" (4 cards)                          │
│  [Leads atendidos 32] [Qualificados 18] [Visitas 9] [Resp. 96%]       │
├──────────────────────────────────────────────────────────────────────┤
│ 3. Grid 2 colunas:                                                    │
│  ┌─ Configuração da IA ─┐  ┌─ Conexão WhatsApp ─┐                     │
│  │ Tom de voz (chips)   │  │  [QR Code mock]    │                     │
│  │ Objetivo (chips)     │  │  Conectado ✓       │                     │
│  │ Autonomia (chips)    │  │  [Reconectar]      │                     │
│  └──────────────────────┘  └────────────────────┘                     │
├──────────────────────────────────────────────────────────────────────┤
│ 4. Comportamento (full width)                                         │
│  Quando transferir p/ humano: [✓ após qualificação] [✓ pediu humano]  │
│                               [○ intenção de compra]                  │
│  Quando parar: [✓ sem resposta 24h] [✓ fora do horário]               │
├──────────────────────────────────────────────────────────────────────┤
│ 5. Exemplo de atendimento (grid 2 col)                                │
│  ┌─ Mini chat preview (read-only) ─┐ ┌─ Inteligência extraída ─┐      │
│  │ Seletor de conversa (3 chips)   │ │ Score de qualificação 88│      │
│  │ Últimas 4 mensagens (truncado)  │ │ Intenção: compra ativa  │      │
│  │ [Ver conversa completa]         │ │ Próx. ação: Agendar     │      │
│  │                                 │ │ visita sábado           │      │
│  │  (sem input ativo)              │ │ ─────────────           │      │
│  │                                 │ │ Dados extraídos (lista) │      │
│  └─────────────────────────────────┘ └─────────────────────────┘      │
└──────────────────────────────────────────────────────────────────────┘
```

## 1. Header + ações principais

Bloco no topo com título "IA Assistente", subtítulo "Central de controle do seu atendente virtual". À direita, três botões:
- `Pausar IA` (outline, ícone `Pause`) — alterna estado local `iaAtiva`, dispara toast.
- `Editar comportamento` (outline, ícone `Settings2`) — rola até bloco Comportamento (anchor scroll).
- `Assumir conversa` (default navy, ícone `UserCheck`) — toast.

## 2. Status da IA (3 cards horizontais)

`grid grid-cols-1 md:grid-cols-3 gap-3`. Cada card `border border-border bg-card rounded-2xl p-4`:
- **IA ativa/pausada** — bullet verde pulsante quando ativa (`bg-emerald-500`), cinza quando pausada. Título dinâmico via `iaAtiva`.
- **WhatsApp conectado** — ícone `MessageCircle` verde, texto "Conectado · +55 21 9 9999-0000".
- **Tempo médio de resposta** — número grande "12s", legenda "Últimas 24h".

## 3. Performance (4 cards — ROI da IA)

Header da seção: "Performance · Últimos 30 dias". Grid `md:grid-cols-4`. Cada card mostra label pequeno, número grande (`font-display text-3xl`) e variação (`+18% vs mês anterior` em verde):
- Leads atendidos — 32
- Leads qualificados — 18
- Visitas geradas — 9
- Taxa de resposta — 96%

## 4. Configuração da IA (card editável)

Estado local com 3 grupos. Cada grupo é uma linha "Label" + chips clicáveis (botões com `bg-navy text-navy-foreground` quando selecionado, `border border-border bg-background` quando não):
- **Tom de voz**: Consultivo · Premium · Direto
- **Objetivo**: Qualificar leads · Agendar visitas · Enviar imóveis
- **Nível de autonomia**: Total · Assistido · Apenas triagem

Mudança de chip dispara toast "Configuração atualizada".

## 5. Conexão WhatsApp (card lateral)

- Quadrado 160x160 com SVG/CSS simulando QR Code (grid 8x8 de pixels pretos/brancos pseudo-aleatórios via array fixo).
- Status "Conectado ✓" em verde + número fictício.
- Botão `outline` "Reconectar" (toast).
- Microcopy: "Sessão ativa há 14 dias".

## 6. Comportamento (card full-width)

Duas subseções com checkboxes (shadcn `Checkbox`):

**Quando transferir para humano:**
- Após qualificação completa (checked)
- Quando o cliente pedir explicitamente (checked)
- Quando detectar intenção de compra (unchecked)

**Quando parar de responder:**
- Lead sem resposta há 24h (checked)
- Fora do horário comercial (checked)
- Mais de 10 mensagens sem evolução (unchecked)

## 7. Exemplo de atendimento (chat reaproveitado, secundário)

Grid `lg:grid-cols-[1fr_320px]`:

**Esquerda — preview de conversa (read-only):**
- Header pequeno: "Exemplo de atendimento da IA" + 3 chips para alternar entre `aiConversations` (Felipe / Renata / Marcelo).
- Mostra apenas as **últimas 4 mensagens** da conversa selecionada (slice), com bolhas no mesmo estilo atual mas reduzidas.
- **Sem input ativo** — remover completamente o campo de mensagem.
- Botão `outline` "Ver conversa completa" no rodapé (toast).

**Direita — Inteligência extraída (evolução do bloco atual):**
- Bloco no topo: "Score de qualificação" (número grande + barra de progresso baseada em `conv.score`).
- "Intenção detectada": chip colorido (ex: "Compra ativa", "Investimento", "Pesquisa inicial") — derivado por id.
- "Próxima ação sugerida": destaque em card laranja claro (`bg-orange-50 border-l-4 border-l-orange-400`) com texto tipo "Agendar visita para sábado 10h".
- Lista de dados extraídos (mantém `conv.extracted` atual).

## Detalhes técnicos

- Manter `export const Route = createFileRoute("/app/ia")(...)` e função `AIPage`.
- Estados locais novos: `iaAtiva: boolean`, `tom`, `objetivo`, `autonomia` (strings), `transferir: Set<string>`, `parar: Set<string>`, `active` (já existe — id da conversa do exemplo).
- Mapa local `intencoes[id] = { intencao, proxima }` para os 3 ids existentes (AI-1, AI-2, AI-3).
- Reutilizar shadcn presentes: `Button`, `Checkbox`, `toast` (sonner). Ícones lucide adicionais: `Pause`, `Play`, `Settings2`, `UserCheck`, `MessageCircle`, `Wifi`, `Clock`, `TrendingUp`, `Target`, `Sparkles`, `QrCode`.
- QR Code mock: componente inline com `grid grid-cols-12` e array de 144 booleans fixos renderizando quadrados pretos/brancos (sem libs).
- Manter paleta: `bg-navy`, `bg-card`, `border-border`, `text-orange-*`, `text-emerald-*`.
- Remover do JSX atual: input de mensagem, botão Send grande, layout 3-colunas tipo inbox.

## Não alterar

- `src/data/mock.ts` (estrutura de `aiConversations` permanece).
- Sidebar, outras rotas, `routeTree.gen.ts`.
- Identidade visual (cores, tipografia, radius).
