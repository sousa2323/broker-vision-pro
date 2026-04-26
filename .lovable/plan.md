# Nova tela — Parceria Ativa (gestão de parceria entre corretores)

Criar uma nova rota estática que simula o ambiente de execução de uma parceria entre dois corretores em torno de um imóvel. Sidebar, dados (`mock.ts`) e demais telas permanecem intactos. Toda informação é fictícia, com estado local.

## Arquivo

- Criar: `src/routes/app.parcerias.ativa.tsx` → rota `/app/parcerias/ativa`
- Acesso: adicionar um botão/link "Ver parceria ativa" no perfil do corretor (`src/routes/app.parcerias.$id.tsx`) e um pequeno call-to-action no topo da aba "Minha rede" em `src/routes/app.parcerias.index.tsx` apontando para essa rota. Sidebar não muda.

## Layout (desktop, 12-col grid; mobile colapsa em coluna única)

```text
┌──────────────────────────────────────────────────────────────┐
│ HEADER: imóvel · status badge · avatares A/B · "Ver contrato"│
│ microcopy: "Parceria formalizada para atuação conjunta..."    │
├──────────────────────────────────┬───────────────────────────┤
│ FINANCEIRO (card destaque)       │ AÇÕES PRINCIPAIS          │
│ Valor · Comissão · Divisão · Fee │ Atualizar etapa           │
│ "Seu ganho estimado: R$ 15.576"  │ Registrar atividade       │
│                                  │ Marcar como vendido       │
├──────────────────────────────────┴───────────────────────────┤
│ PIPELINE COMPARTILHADO (stepper horizontal)                  │
│ Lead → Qualificado → Visita → [Proposta*] → Fechado           │
│ "Última atualização: Proposta enviada por Corretor B"         │
├──────────────────────────────┬───────────────────────────────┤
│ ATIVIDADES (timeline)         │ COMUNICAÇÃO (mensagens)       │
│ Hoje 10:00 · Visita (A)       │ bolhas A/B + input            │
│ Ontem 18:00 · Proposta (B)    │ "Escrever mensagem..."        │
│ 2d · Lead qualificado (IA)    │                               │
├──────────────────────────────┼───────────────────────────────┤
│ DADOS DO IMÓVEL               │ CONTRATO                       │
│ foto · loc · descr · specs    │ "Contrato assinado em ..."     │
│ "Ver imóvel completo"         │ "Baixar contrato"              │
└──────────────────────────────┴───────────────────────────────┘
```

## Conteúdo (dados fictícios fixos)

- **Imóvel**: "Casa em condomínio em Itaipu", Niterói/RJ. Foto via Unsplash. 4 quartos, 3 vagas, 280 m², piscina.
- **Status inicial**: `Proposta enviada` (badge laranja). Opções: Ativa, Em negociação, Proposta enviada, Fechada.
- **Corretor A**: Ramon Capone (usa `broker` do mock). **Corretor B**: Marina Tavares — UpHouse Imóveis.
- **Financeiro**: Valor R$ 1.180.000 · Comissão 3% = R$ 35.400 · 50/50 = R$ 17.700 cada · Fee Ubroker 12% sobre comissão do corretor → ganho líquido **R$ 15.576**. Card com fundo `bg-navy text-navy-foreground` e destaque em laranja para o ganho final.
- **Pipeline**: stepper com 5 etapas; etapa atual destacada em laranja, anteriores em emerald, futuras em slate.
- **Atividades**: lista cronológica com ícone por tipo (Visita, Proposta, IA).
- **Mensagens**: array local com 3-4 bolhas iniciais; input controlado (`useState`) anexa nova mensagem ao array (somente em memória).
- **Contrato**: "Assinado em 12/04/2026 por ambas as partes" + botão "Baixar contrato" (toast "Download iniciado").

## Interações (estado local + sonner toasts)

- **Atualizar etapa**: `Popover` com lista das 5 etapas → atualiza estado e empurra entrada na timeline + toast.
- **Registrar atividade**: `Dialog` com tipo (Select: Ligação/Visita/Proposta/Mensagem) + descrição (Textarea) → adiciona ao topo da timeline.
- **Marcar como vendido**: abre `FinalizarVendaModal` (descrito abaixo).
- **Ver contrato / Baixar contrato / Ver imóvel completo**: toast informativo (sem navegação real para rota nova).
- **Mensagens**: enviar adiciona bolha do "Você (Corretor A)"; sem resposta automática.

## Modal — Finalizar Venda

`Dialog` com:
- Valor final da venda (`Input` numérico, default R$ 1.180.000)
- Quem fechou (`RadioGroup`): Corretor A / Corretor B / Ambos
- Checkbox: "Os termos da parceria foram respeitados?" (obrigatório)
- Botões: Cancelar · **Confirmar venda** (desabilitado até checkbox marcado) → toast "Venda registrada · parceria finalizada", muda status para "Fechada", adiciona entrada final na timeline.

## Identidade visual

- Reutilizar tokens existentes: `bg-card`, `border-border`, `text-ink`, `bg-navy`, `text-brand`/laranja para destaques (mesmos usados em `app.parcerias.$id.tsx`).
- Tipografia: `font-display` para títulos, classe `num` para valores monetários.
- Cards arredondados `rounded-2xl`, padding generoso, divisores sutis. Sem novas cores fora da paleta.

## Componentes shadcn já existentes a reutilizar

`Button`, `Badge`, `Card*`, `Dialog`, `Popover`, `Select`, `RadioGroup`, `Textarea`, `Input`, `Label`, `Avatar`, `Progress` (para a barra do stepper) — nenhum novo arquivo de UI.

## Detalhes técnicos

- Rota TanStack: `createFileRoute("/app/parcerias/ativa")`.
- Toda lógica num único arquivo `app.parcerias.ativa.tsx` com sub-componentes locais (`HeaderBlock`, `FinanceCard`, `PipelineStepper`, `ActivityTimeline`, `ChatBlock`, `PropertyBlock`, `ContractBlock`, `FinalizarVendaModal`).
- Sem alteração em `mock.ts`, sidebar, `__root.tsx` ou roteador.
- Estados: `status`, `etapaAtual`, `atividades[]`, `mensagens[]`, flags de modais.
- Toasts via `sonner`.

## Não alterar

- `src/routes/app.tsx` (sidebar), `src/data/mock.ts`, demais rotas (apenas adicionar 1 link em `app.parcerias.$id.tsx` e 1 CTA em `app.parcerias.index.tsx`).

## Resultado

Uma tela única, estática e visualmente densa que comunica segurança jurídica, transparência financeira e execução conjunta — posicionada como o "ambiente seguro" da venda em parceria, distinta de um CRM genérico.
