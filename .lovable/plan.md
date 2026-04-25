# Refinar `/app/imoveis` — central de inventário, performance e rastreabilidade

Editar **apenas** `src/routes/app.imoveis.tsx`. Sem alterar `mock.ts`, sidebar ou layout do grid. Tudo simulado, sem backend.

## 1. Estado e helpers locais

No topo do componente:

- `statuses = ["Ativo", "Em negociação", "Vendido", "Inativo", "Excluído"] as const`
- `useState<Record<string, Status>>` inicial: maioria "Ativo", IM-002 "Em negociação", IM-005 "Inativo"
- Helpers determinísticos (a partir do `id` do imóvel para não mudar a cada render):
  - `getInteressados(id)` → 6–24
  - `getVisitas(id)` → 1–8
  - `getPropostas(id)` → 0–3
  - `getComissao(valor)` → `valor * 0.03`
  - `isAltaDemanda(p)` → valor ≥ 1.5M **ou** interessados ≥ 18 **ou** visitas ≥ 6

## 2. Card enriquecido

Mantém imagem + grid atual. Adiciona dentro do bloco de informações:

- **Badge de status** no canto superior direito da imagem (cor por status: Ativo verde, Em negociação âmbar, Vendido azul, Inativo cinza, Excluído vermelho/risca).
- **Selo "Alta demanda"** (acima do badge marketplace) quando `isAltaDemanda` for true — fundo brand suave + borda azul sutil no card (`ring-1 ring-brand/30`).
- Após o título/endereço:
  - Linha de performance: `👥 12 interessados · 🚪 5 visitas · 📝 2 propostas` (texto pequeno, muted).
  - Linha financeira em verde discreto: `Comissão estimada R$ 25.500`.
- Footer do card com **ações rápidas** (ícones + label discreto): Ver detalhes · Editar · Compartilhar · Adicionar mídia · Alterar status. Substitui qualquer "Solicitar parceria" (não existe atualmente, mas a regra fica explícita).

## 3. Menu "Alterar status"

Botão no card abre Popover (`@/components/ui/popover`) com 5 opções. Ao clicar:

- **Ativo / Em negociação / Inativo** → atualiza estado local + toast (sonner) "Status atualizado".
- **Vendido** → abre `Dialog` "Registrar venda do imóvel".
- **Excluído** → abre `Dialog` "Registrar exclusão do imóvel" (com aviso de rastreabilidade).

## 4. Modal "Registrar venda do imóvel"

Título + subtítulo: "Para manter a rastreabilidade da operação, registre as informações principais desta venda."

Campos (todos visuais, `useState` simples):
- Data da venda (input date)
- Valor final da venda (input number, prefilled com valor do imóvel)
- Origem do comprador (select: Marketplace / Instagram / WhatsApp / Indicação / Outro)
- Houve parceria com outro corretor? (radio Sim/Não)
- Foi negociado dentro da Ubroker? (radio Sim/Não)
- Observações (textarea)

Botões: Cancelar · **Confirmar venda** (aplica status "Vendido" e toast "Venda registrada · IM-001").

## 5. Modal "Registrar exclusão do imóvel"

Aviso visível no topo (banner âmbar/vermelho com ícone AlertTriangle): "Esta ação ficará registrada no histórico do inventário."

Campos:
- Motivo (select: Imóvel vendido / Proprietário retirou / Imóvel indisponível / Cadastro duplicado / Erro de cadastro / Outro)
- Houve negociação iniciada pela Ubroker? (radio Sim/Não)
- Observações (textarea, marcada como obrigatória — `required` + asterisco)

Botões: Cancelar · **Confirmar exclusão** (variant destructive, aplica status "Excluído" e toast).

## 6. Modal "Adicionar mídia"

Disparado pela ação "Adicionar mídia" do card. Conteúdo simulado:
- Dropzone (div tracejada) com ícone Upload e texto "Arraste fotos ou clique para selecionar" (sem `<input type=file>` real funcional — apenas visual).
- Botão "Adicionar vídeo".
- Preview de galeria com 3 thumbnails fictícios (usando a foto do próprio imóvel + 2 placeholders).
- Texto auxiliar muted: "Fotos e vídeos aumentam a performance do imóvel no marketplace."
- Botão Fechar.

## 7. Modal de cadastro existente

Editar o modal já existente:

- Banner azul claro no topo (substituindo/abaixo do subtítulo): "Este imóvel será exibido no marketplace B2C e poderá receber leads de compradores interessados."
- Adicionar um campo opcional **"Tipo de cliente ideal"** (select com options: família / investidor / jovem casal / primeira moradia / alto padrão), antes da Descrição.

## 8. Detalhes técnicos

- Usar `Dialog` de `@/components/ui/dialog`, `Popover` de `@/components/ui/popover`, `Select`, `RadioGroup`, `Textarea`, `Input`, `Button` já existentes.
- Toasts via `sonner` (já presente em `@/components/ui/sonner`).
- Cores de status:
  - Ativo: `bg-emerald-100 text-emerald-700`
  - Em negociação: `bg-amber-100 text-amber-700`
  - Vendido: `bg-sky-100 text-sky-700`
  - Inativo: `bg-slate-200 text-slate-600`
  - Excluído: `bg-rose-100 text-rose-700`
- Cards com status "Excluído" → `opacity-60` + label tachado.
- Toda lógica vive localmente em `InventoryPage`. Nenhum dado novo em `mock.ts`.

## Não alterar

- `src/data/mock.ts`, sidebar, grid responsivo do inventário, demais rotas.
- Imagens, ordem ou quantidade de imóveis.

## Resultado

Cada card comunica: status comercial, demanda real, comissão potencial e ações operacionais. Vender e excluir passam por fluxos com rastreabilidade. Cadastro reforça exposição no marketplace B2C.
