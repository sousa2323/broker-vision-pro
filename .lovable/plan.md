
# Plano — Tela Leads do Corretor: Central de Execução Comercial Guiada

Refatorar **apenas** `src/routes/app.leads.tsx`, mantendo identidade visual, sidebar e demais telas intactas. A tela passa a operar em três níveis: visão rápida (cards + filtros), visão operacional (lista priorizada) e visão profunda (painel lateral + modal "Operação do Lead").

Arquivos editados:
- `src/routes/app.leads.tsx` — reescrita da tela.
- `src/data/mock.ts` — extensão do tipo `Lead` com campos operacionais (próxima ação, cadência, badges, vínculos). Mantém leads existentes e adiciona campos opcionais para não quebrar outras telas (`/app/pipeline`, `/admin/leads` que reusam `leads`).

Sem novas rotas, sem novos pacotes (já temos shadcn `dialog`, `tabs`, `badge`, `button`, `tooltip`, `dropdown-menu`, `sheet`, lucide-react).

---

## 1. Extensão do mock (`src/data/mock.ts`)

Adicionar campos opcionais ao `Lead` para não impactar `admin.leads.tsx` e `app.pipeline.tsx`:

```ts
type LeadEtapa = "Novo" | "Tentativa de contato" | "Contatado" | "Qualificado"
              | "Atendimento" | "Visita" | "Proposta" | "Venda" | "Perdido";
type LeadTemperatura = "quente" | "morno" | "frio";
type LeadOrigemComercial = "manual" | "plataforma" | "ia" | "parceria";
type ProximaAcaoTipo = "ligar" | "whatsapp" | "follow-up" | "confirmar-visita"
                    | "enviar-imoveis" | "registrar-feedback" | "reativar" | "marcar-perdido";

interface ProximaAcao {
  tipo: ProximaAcaoTipo;
  label: string;            // "Ligar para João agora"
  prazo: string;            // "Hoje, 14h" | "Atrasado há 2h" | "Amanhã" | "Sem prazo"
  status: "hoje" | "atrasado" | "proximo" | "concluido";
  motivo?: string;          // "Dia 2 da cadência. Sem interação há 2h."
}

interface CadenciaItem { dia: number; titulo: string; status: "pendente"|"concluido"|"atrasado"; }
interface Visita { data: string; status: string; imovel: string; feedback?: string; }
interface Qualificacao {
  perfil?: string; tipoImovel?: string; regiao?: string; orcamento?: number;
  capacidade?: string; prazo?: string; motivacao?: string; objecoes?: string; observacoes?: string;
}
interface VinculoComercial {
  origemComercial: LeadOrigemComercial;
  feeAplicavel?: boolean;
  contratoId?: string;
  parceiro?: string;
  resumoVinculo?: string;
}

interface Lead {
  // …existentes
  etapa?: LeadEtapa;
  temperatura?: LeadTemperatura;
  proximaAcao?: ProximaAcao;
  cadencia?: CadenciaItem[];
  visitas?: Visita[];
  qualificacao?: Qualificacao;
  vinculo?: VinculoComercial;
  ultimoCanal?: "WhatsApp"|"Instagram"|"Ligação"|"Email"|"IA";
  ultimoResumo?: string;
}
```

Preencher todos os 6 leads existentes com esses campos coerentes (alguns atrasados, alguns quentes, 2 com visita hoje, 3 sem primeiro contato, etc.) para os KPIs do topo baterem com o cenário real.

Adicionar 4 leads novos: Roberto e Lúcia Tavares, Ana Beatriz Souza, Marcelo Pinheiro, Renata Couto, com origens variadas e cenários cobrindo: parceria com contrato vinculado, lead via IA com fee, lead manual, marketplace. Total ≥ 10 leads.

Exportar `LeadEtapa`, `LeadTemperatura`, `ProximaAcao`, etc. para uso na tela.

## 2. Estrutura da tela (`src/routes/app.leads.tsx`)

Layout em uma única coluna principal com painel lateral sticky à direita (mantém grid `lg:grid-cols-[1fr_400px]` atual).

Ordem vertical da coluna principal:
1. Header (título + subtítulo operacional novo).
2. Bloco "Execução de hoje" — 5 cards compactos.
3. Barra de filtros rápidos (chips) + busca + Filtros + Novo lead.
4. Lista priorizada de leads (tabela atual reorganizada).

### Header

```
Leads
Sua central diária de execução comercial.
Veja o que fazer, quando fazer e quais oportunidades priorizar.
```

### Bloco "Execução de hoje" (5 cards)

Grid responsivo `grid-cols-2 md:grid-cols-5`, altura compacta (~88px), cada card = número grande + label + subtexto pequeno + ícone discreto. Card "Atrasadas" com borda/accent vermelho suave; "Visitas hoje" com accent azul; "Quentes" com accent âmbar.

Valores derivados em `useMemo` a partir dos leads:
- Ações para hoje = leads com `proximaAcao.status === "hoje"`.
- Atrasadas = `status === "atrasado"`.
- Sem contato = `etapa === "Novo"` ou `"Tentativa de contato"` sem interação.
- Visitas hoje = `visitas` com data == hoje.
- VGV quentes = soma `orcamento` dos `temperatura === "quente"`.

### Filtros rápidos

Chips horizontais (scroll-x em mobile): Todos, Hoje, Atrasados, Sem contato, Quentes, Visitas, Proposta, Perdidos. Estado `filtroRapido`. Combina com busca por nome/id.

Botão "Filtros" abre `Sheet` lateral com filtros avançados (origem, temperatura, etapa, região, tipo, faixa de orçamento, tempo sem interação, status da cadência). Implementação simples com selects/checkboxes — apenas afeta a lista atual.

### Lista priorizada

Manter a tabela existente, com colunas novas:

| Lead | Origem | Potencial | Etapa | Próxima ação | Prazo/SLA | Última interação |

- **Lead**: avatar + nome + ID + badge temperatura + barra colorida lateral de prioridade (vermelho/laranja/azul/verde/cinza, derivada via helper `getPrioridadeColor(lead)`).
- **Origem**: rótulo + badge comercial discreto (Meu lead / Lead da Plataforma / Lead via IA / Lead de Parceria) — mapeado de `vinculo.origemComercial`. "Outro" mantém detalhe.
- **Potencial**: orçamento + comissão estimada (3%).
- **Etapa**: badge neutra com nome da etapa.
- **Próxima ação**: ícone do canal (Phone/MessageCircle/Calendar) + label da ação + sub-badge de status (Hoje / Atrasado / Próximo / Concluído).
- **Prazo/SLA**: texto, com vermelho se atrasado.
- **Última interação**: canal · data + tooltip com `ultimoResumo`.

Ordenação por prioridade operacional via score (atrasados > quentes > sem 1º contato > visita hoje > proposta > mornos > frios).

Alertas contextuais discretos abaixo do nome (texto pequeno, ex. "Lead sem contato há 4h", "Cadência atrasada", "Visita hoje 15h", "Lead qualificado pela IA") — derivados do estado.

Clique na linha = seleciona o lead e atualiza o painel lateral. Linha tem ação extra "Ver operação completa" via menu ou clique no botão na coluna de ações (adicionar ícone discreto à direita da última coluna ou no rodapé do painel).

## 3. Painel lateral

Reorganizar a hierarquia (mantém o card sticky atual, mesma largura):

1. **Header do lead**: nome, ID, temperatura, etapa, e-mail, telefone.
2. **Card destacado "Próxima ação recomendada"** (com fundo levemente acentuado em `brand/5`):
   - Título da ação (ex. "Ligar para João agora")
   - Subtexto com motivo/contexto da cadência.
   - 3 botões primários: Ligar, WhatsApp, Registrar interação (placeholders, abrem `toast` via sonner).
3. **Ações rápidas**: linha de botões compactos — Registrar interação, Agendar visita, Avançar etapa, Marcar como perdido, **Ver operação completa**.
4. **Resumo rápido** (atual): tipo, região, orçamento, comissão estimada.
5. **Origem** (atual, com badge "qualificada" preservada).
6. **Interesse** (texto curto).
7. **Regras vinculadas** (novo, discreto): origem comercial, fee aplicável (sim/não), contrato vinculado (id), corretor parceiro, resumo do vínculo. Renderizar apenas as linhas presentes.
8. **Histórico** resumido (mantém últimos 3, link "Ver tudo" abre o modal na aba Histórico).

## 4. Modal "Operação do Lead"

`Dialog` em tamanho largo (`max-w-4xl`) com `Tabs` (shadcn) — abas: Execução · Cadência · Interações · WhatsApp · Visitas · Qualificação · Scripts · Histórico. Aberto via "Ver operação completa".

- **Execução** (aba default): próxima ação destacada, lista de tarefas de hoje, lista de atrasadas, etapa atual com botão "Avançar etapa" (ciclando o enum), botão "Registrar interação" (toast).
- **Cadência**: lista da `cadencia` agrupada por dia, cada item com ícone/cor por status.
- **Interações**: timeline (reaproveita `historico` + `ultimoCanal/ultimoResumo`).
- **WhatsApp**: bloco simulado — última mensagem recebida, sugestão de mensagem (texto fixo por etapa), botão "Enviar mensagem sugerida" (toast).
- **Visitas**: cards das `visitas` (data, status, imóvel, feedback).
- **Qualificação**: lista de campos do `qualificacao` em `dl`.
- **Scripts**: 4 scripts fixos (Primeiro contato, Reativação, Confirmação de visita, Pós-visita, Proposta) renderizados em cards copiáveis.
- **Histórico**: timeline completa do `historico`.

Estado: `const [opOpen, setOpOpen] = useState(false); const [opTab, setOpTab] = useState("execucao");`.

## 5. Helpers / utilitários (no próprio arquivo da rota)

```ts
function getPrioridadeScore(l: Lead): number   // pra ordenação
function getPrioridadeColor(l: Lead): string   // borda lateral
function getBadgeComercial(l: Lead): { label: string; tone: string } | null
function getProximaAcaoIcon(tipo: ProximaAcaoTipo): ReactNode
function matchFiltroRapido(l: Lead, f: FiltroRapido): boolean
```

## 6. Compatibilidade com outras telas

- `admin.leads.tsx` e `app.pipeline.tsx` consomem `leads` mas só leem `id/nome/origem/status/orcamento/historico/ultimaInteracao`. Os novos campos são todos opcionais → zero impacto.
- Os 4 leads adicionais entram naturalmente em `/admin/leads` e em `/app/pipeline` (status mapeia para colunas existentes).

## 7. Aceite

- Tela abre mostrando os 5 cards de execução do dia + filtros rápidos + lista priorizada.
- Cada linha exibe próxima ação, prazo (com destaque para atrasados), badge de temperatura, badge comercial e barra lateral de prioridade.
- Painel lateral começa pela próxima ação recomendada, depois ações rápidas, depois detalhes do lead e por último regras vinculadas.
- "Ver operação completa" abre modal com 8 abas funcionais (apenas dados estáticos / toasts).
- Sidebar, identidade visual, demais rotas e tela Pipeline permanecem intactas.

