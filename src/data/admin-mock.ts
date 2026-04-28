// Mock data exclusivo do ambiente Admin Ubroker. Sem persistência, sem APIs.

export type AdminBroker = {
  id: string;
  nome: string;
  creci: string;
  cidade: string;
  plano: "Free" | "Pro";
  status: "Ativo" | "Inativo" | "Bloqueado";
  receita: number;
  avatar: string;
};

export const adminBrokers: AdminBroker[] = [
  { id: "U-001", nome: "Ramon Cardozo Capone", creci: "RJ-78342", cidade: "Niterói/RJ", plano: "Free", status: "Ativo", receita: 96_480, avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=128&q=80" },
  { id: "U-002", nome: "Alessandra Freixo", creci: "RJ-91245", cidade: "Niterói/RJ", plano: "Pro", status: "Ativo", receita: 184_200, avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=128&q=80" },
  { id: "U-003", nome: "Aldemar Souza", creci: "RJ-44128", cidade: "Maricá/RJ", plano: "Pro", status: "Ativo", receita: 142_800, avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=128&q=80" },
  { id: "U-004", nome: "Denise Molinaro", creci: "SP-203412", cidade: "São Paulo/SP", plano: "Pro", status: "Ativo", receita: 312_400, avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=128&q=80" },
  { id: "U-005", nome: "Joana Maciel", creci: "RJ-66001", cidade: "Niterói/RJ", plano: "Pro", status: "Ativo", receita: 48_200, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=128&q=80" },
  { id: "U-006", nome: "Pedro Verissimo", creci: "RJ-77820", cidade: "Rio/RJ", plano: "Pro", status: "Ativo", receita: 62_100, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&q=80" },
  { id: "U-007", nome: "Carla Fontes", creci: "SP-118432", cidade: "São Paulo/SP", plano: "Pro", status: "Ativo", receita: 94_800, avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=128&q=80" },
  { id: "U-008", nome: "Tiago Sá", creci: "RJ-55029", cidade: "Niterói/RJ", plano: "Free", status: "Ativo", receita: 18_400, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=128&q=80" },
  { id: "U-009", nome: "Carla Souza", creci: "PR-22118", cidade: "Curitiba/PR", plano: "Free", status: "Inativo", receita: 0, avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=128&q=80" },
  { id: "U-010", nome: "Marcos Iglesias", creci: "RS-44820", cidade: "Porto Alegre/RS", plano: "Pro", status: "Ativo", receita: 76_200, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&q=80" },
  { id: "U-011", nome: "Rafael Couto", creci: "RJ-88110", cidade: "Niterói/RJ", plano: "Free", status: "Bloqueado", receita: 0, avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=128&q=80" },
  { id: "U-012", nome: "Beatriz Lemos", creci: "SP-302118", cidade: "São Paulo/SP", plano: "Pro", status: "Ativo", receita: 215_600, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&q=80" },
];

export type StatusCobrancaTipo = "Pendente" | "Faturado" | "Pago" | "Atrasado" | "Contestado";
export type OrigemCobranca = "Parceria" | "Lead Ubroker" | "SaaS";

export type Cobranca = {
  id: string;
  corretor: string;
  origem: OrigemCobranca;
  valor: number;
  vencimento: string; // dd/mm
  status: StatusCobrancaTipo;
  // Camada V2 — rastreabilidade e auditoria
  criadoEm: string; // dd/mm
  faturadoEm?: string; // dd/mm
  pagoEm?: string; // dd/mm
  vendaId?: string; // referência a VendaDetalhada
  diasAtraso?: number;
  divergencia?: { esperado: number; cobrado: number };
};

export const cobrancas: Cobranca[] = [
  { id: "CB-2041", corretor: "Alessandra Freixo", origem: "Parceria", valor: 8_400, vencimento: "28/04", status: "Atrasado", criadoEm: "10/04", faturadoEm: "18/04", diasAtraso: 4, vendaId: "VD-118" },
  { id: "CB-2040", corretor: "Aldemar Souza", origem: "Lead Ubroker", valor: 3_200, vencimento: "30/04", status: "Pendente", criadoEm: "20/04", faturadoEm: "23/04" },
  { id: "CB-2039", corretor: "Denise Molinaro", origem: "Parceria", valor: 14_600, vencimento: "02/05", status: "Faturado", criadoEm: "15/04", faturadoEm: "22/04", vendaId: "VD-117", divergencia: { esperado: 14_100, cobrado: 14_600 } },
  { id: "CB-2038", corretor: "Ramon Capone", origem: "SaaS", valor: 120, vencimento: "01/05", status: "Pago", criadoEm: "25/04", faturadoEm: "26/04", pagoEm: "29/04" },
  { id: "CB-2037", corretor: "Pedro Verissimo", origem: "Parceria", valor: 6_800, vencimento: "22/04", status: "Atrasado", criadoEm: "01/04", faturadoEm: "10/04", diasAtraso: 10 },
  { id: "CB-2036", corretor: "Carla Fontes", origem: "Lead Ubroker", valor: 4_400, vencimento: "05/05", status: "Faturado", criadoEm: "20/04", faturadoEm: "27/04" },
  { id: "CB-2035", corretor: "Marcos Iglesias", origem: "Parceria", valor: 9_200, vencimento: "26/04", status: "Pago", criadoEm: "12/04", faturadoEm: "20/04", pagoEm: "25/04" },
  { id: "CB-2034", corretor: "Beatriz Lemos", origem: "SaaS", valor: 240, vencimento: "01/05", status: "Pago", criadoEm: "25/04", faturadoEm: "26/04", pagoEm: "30/04" },
  { id: "CB-2033", corretor: "Joana Maciel", origem: "Lead Ubroker", valor: 2_100, vencimento: "29/04", status: "Pendente", criadoEm: "22/04", faturadoEm: "24/04" },
  { id: "CB-2032", corretor: "Tiago Sá", origem: "SaaS", valor: 120, vencimento: "20/04", status: "Atrasado", criadoEm: "10/04", faturadoEm: "12/04", diasAtraso: 8 },
  { id: "CB-2031", corretor: "Pedro Verissimo", origem: "Lead Ubroker", valor: 5_600, vencimento: "18/04", status: "Contestado", criadoEm: "05/04", faturadoEm: "11/04", divergencia: { esperado: 4_200, cobrado: 5_600 } },
  { id: "CB-2030", corretor: "Alessandra Freixo", origem: "SaaS", valor: 240, vencimento: "10/04", status: "Pago", criadoEm: "01/04", faturadoEm: "03/04", pagoEm: "09/04" },
  { id: "CB-2029", corretor: "Beatriz Lemos", origem: "Parceria", valor: 18_400, vencimento: "08/05", status: "Faturado", criadoEm: "20/04", faturadoEm: "28/04" },
  { id: "CB-2028", corretor: "Tiago Sá", origem: "Lead Ubroker", valor: 1_800, vencimento: "12/04", status: "Atrasado", criadoEm: "01/04", faturadoEm: "04/04", diasAtraso: 16 },
  { id: "CB-2027", corretor: "Marcos Iglesias", origem: "SaaS", valor: 240, vencimento: "01/05", status: "Pago", criadoEm: "24/04", faturadoEm: "25/04", pagoEm: "28/04" },
  { id: "CB-2026", corretor: "Aldemar Souza", origem: "Parceria", valor: 12_400, vencimento: "06/05", status: "Pendente", criadoEm: "22/04", faturadoEm: "26/04", vendaId: "VD-117" },
];

// Risco por corretor (calculado off-line a partir do histórico)
export const corretorRisco: Record<string, { nivel: "baixo" | "medio" | "alto"; pctAtraso: number; totalAberto: number }> = {
  "Alessandra Freixo": { nivel: "medio", pctAtraso: 28, totalAberto: 8_400 },
  "Aldemar Souza": { nivel: "baixo", pctAtraso: 6, totalAberto: 15_600 },
  "Denise Molinaro": { nivel: "baixo", pctAtraso: 4, totalAberto: 14_600 },
  "Ramon Capone": { nivel: "baixo", pctAtraso: 0, totalAberto: 0 },
  "Pedro Verissimo": { nivel: "alto", pctAtraso: 62, totalAberto: 12_400 },
  "Carla Fontes": { nivel: "baixo", pctAtraso: 12, totalAberto: 4_400 },
  "Marcos Iglesias": { nivel: "baixo", pctAtraso: 0, totalAberto: 0 },
  "Beatriz Lemos": { nivel: "baixo", pctAtraso: 8, totalAberto: 18_400 },
  "Joana Maciel": { nivel: "baixo", pctAtraso: 10, totalAberto: 2_100 },
  "Tiago Sá": { nivel: "alto", pctAtraso: 71, totalAberto: 1_920 },
};

// Util para agrupamento (preparação Camada 10 — sem UI no momento)
export function agruparCobrancas(
  lista: Cobranca[],
  por: "corretor" | "origem" | "mes",
): Record<string, Cobranca[]> {
  return lista.reduce<Record<string, Cobranca[]>>((acc, c) => {
    const key = por === "corretor" ? c.corretor : por === "origem" ? c.origem : c.vencimento.split("/")[1] ?? "—";
    (acc[key] ||= []).push(c);
    return acc;
  }, {});
}

export type VendaDetalhada = {
  id: string;
  imovel: string;
  valor: number;
  comissaoTotal: number;
  splits: { nome: string; valor: number; tipo: "Captador" | "Parceiro" | "Fee Ubroker" }[];
};

export const vendasDetalhadas: VendaDetalhada[] = [
  {
    id: "VD-118",
    imovel: "Cobertura Linear · Jardim Icaraí",
    valor: 2_350_000,
    comissaoTotal: 141_000,
    splits: [
      { nome: "Alessandra Freixo", valor: 84_600, tipo: "Captador" },
      { nome: "Ramon Capone", valor: 42_300, tipo: "Parceiro" },
      { nome: "Ubroker", valor: 14_100, tipo: "Fee Ubroker" },
    ],
  },
  {
    id: "VD-117",
    imovel: "Casa de Praia · Camboinhas",
    valor: 3_450_000,
    comissaoTotal: 207_000,
    splits: [
      { nome: "Denise Molinaro", valor: 124_200, tipo: "Captador" },
      { nome: "Aldemar Souza", valor: 62_100, tipo: "Parceiro" },
      { nome: "Ubroker", valor: 20_700, tipo: "Fee Ubroker" },
    ],
  },
  {
    id: "VD-116",
    imovel: "Studio · São Francisco",
    valor: 380_000,
    comissaoTotal: 22_800,
    splits: [
      { nome: "Ramon Capone", valor: 19_380, tipo: "Captador" },
      { nome: "Ubroker", valor: 3_420, tipo: "Fee Ubroker" },
    ],
  },
];

export type StatusConciliacao = "Confirmada" | "Divergente" | "Pendente" | "Parcial";
export type StatusOperacionalCobranca = "Em cobrança" | "Em negociação" | "Promessa de pagamento" | "Sem retorno" | "—";

export type ConciliacaoSplit = { nome: string; valor: number; tipo: "Captador" | "Parceiro" | "Fee Ubroker" };
export type ConciliacaoInteracaoTipo = "Ligação" | "WhatsApp" | "E-mail" | "Mensagem" | "Negociação";
export type ConciliacaoInteracao = { tipo: ConciliacaoInteracaoTipo; obs: string; data: string; autor: string };
export type ConciliacaoAuditoria = { data: string; autor: string; acao: string; valorAnterior?: number; valorNovo?: number };

export type ResponsavelCobranca = { tipo: "admin" | "operador"; nome: string };
export type ComprovantePagamento = { nome: string; tipo: "PDF" | "Imagem"; referencia?: string; enviadoEm: string };
export type ContratoAplicado = { versao: string; data: string; regras: string };
export type HistoricoCorretorFin = {
  pagamentosAtrasoPct: number;
  tempoMedioPagamentoDias: number;
  totalPagoHub: number;
  totalAberto: number;
};

export type Conciliacao = {
  id: string;
  venda: string;
  corretor: string;
  esperado: number;
  recebido: number;
  status: StatusConciliacao;
  // V2 — contexto da venda
  imovel: string;
  vgv: number;
  tipo: "Parceria" | "Lead Ubroker" | "SaaS";
  comissaoPct: number;
  comissaoTotal: number;
  splits: ConciliacaoSplit[];
  // V2 — temporalidade e operação
  criadoEm: string;
  faturadoEm: string;
  pagoEm?: string;
  diasDesdeFatura: number;
  statusOperacional: StatusOperacionalCobranca;
  interacoes: ConciliacaoInteracao[];
  auditoria: ConciliacaoAuditoria[];
  // V3 — governança final
  responsavel?: ResponsavelCobranca;
  slaDias: number;
  previsaoPagamento?: string;
  comprovante?: ComprovantePagamento;
  contrato: ContratoAplicado;
  historicoCorretor: HistoricoCorretorFin;
};

export const RESPONSAVEIS_DISPONIVEIS: ResponsavelCobranca[] = [
  { tipo: "admin", nome: "Superadmin" },
  { tipo: "operador", nome: "Operador Cobranças" },
  { tipo: "operador", nome: "Operador Financeiro" },
];

export function calcularSLA(c: Conciliacao): { restanteDias: number; atrasado: boolean } {
  if (c.status === "Confirmada") return { restanteDias: 0, atrasado: false };
  // diasDesdeFatura é a referência (dias decorridos desde fatura emitida)
  const decorridos = c.diasDesdeFatura;
  const restante = c.slaDias - decorridos;
  return { restanteDias: restante, atrasado: restante < 0 };
}

export function calcularPrioridade(c: Conciliacao): number {
  if (c.status === "Confirmada") return -1;
  const histRisco = corretorRisco[c.corretor]?.nivel ?? "baixo";
  const pesoRisco = histRisco === "alto" ? 30 : histRisco === "medio" ? 15 : 0;
  const valor = Math.max(c.esperado - c.recebido, 0);
  const sla = calcularSLA(c);
  const atrasoExtra = sla.atrasado ? Math.abs(sla.restanteDias) * 5 : 0;
  return valor / 1000 + c.diasDesdeFatura * 2 + atrasoExtra + pesoRisco;
}

export type AgrupadoCorretor = {
  corretor: string;
  casos: number;
  totalDevido: number;
  totalRecebido: number;
  totalAtraso: number;
  inadimplenciaPct: number;
};

export function agruparPorCorretor(lista: Conciliacao[]): AgrupadoCorretor[] {
  const grupos: Record<string, AgrupadoCorretor> = {};
  for (const c of lista) {
    const g = (grupos[c.corretor] ||= {
      corretor: c.corretor, casos: 0, totalDevido: 0, totalRecebido: 0, totalAtraso: 0, inadimplenciaPct: 0,
    });
    g.casos += 1;
    g.totalDevido += c.esperado;
    g.totalRecebido += c.recebido;
    const sla = calcularSLA(c);
    if (sla.atrasado || c.status === "Pendente") g.totalAtraso += Math.max(c.esperado - c.recebido, 0);
  }
  return Object.values(grupos).map((g) => ({
    ...g,
    inadimplenciaPct: g.totalDevido > 0 ? (g.totalAtraso / g.totalDevido) * 100 : 0,
  })).sort((a, b) => b.totalAtraso - a.totalAtraso);
}

export function calcularStatusConciliacao(esperado: number, recebido: number): StatusConciliacao {
  if (recebido === 0) return "Pendente";
  if (recebido === esperado) return "Confirmada";
  if (recebido < esperado) return "Parcial";
  return "Divergente"; // recebido > esperado também é divergente
}

const CONTRATO_PADRAO: ContratoAplicado = { versao: "v1.2", data: "01/01/2026", regras: "6% comissão · 60/30/10 captador/parceiro/fee Ubroker" };

const _conciliacoesBase: Omit<Conciliacao, "slaDias" | "contrato" | "historicoCorretor" | "responsavel" | "previsaoPagamento" | "comprovante">[] = [
  {
    id: "CC-441", venda: "VD-118", corretor: "Alessandra Freixo",
    esperado: 14_100, recebido: 14_100, status: "Confirmada",
    imovel: "Cobertura Linear · Jardim Icaraí", vgv: 2_350_000, tipo: "Parceria",
    comissaoPct: 6, comissaoTotal: 141_000,
    splits: [
      { nome: "Alessandra Freixo", valor: 84_600, tipo: "Captador" },
      { nome: "Ramon Capone", valor: 42_300, tipo: "Parceiro" },
      { nome: "Ubroker", valor: 14_100, tipo: "Fee Ubroker" },
    ],
    criadoEm: "10/04", faturadoEm: "18/04", pagoEm: "26/04", diasDesdeFatura: 10,
    statusOperacional: "—",
    interacoes: [],
    auditoria: [
      { data: "10/04 09:12", autor: "Sistema", acao: "Cobrança criada" },
      { data: "18/04 14:02", autor: "Sistema", acao: "Fatura enviada" },
      { data: "26/04 11:40", autor: "Superadmin", acao: "Pagamento confirmado", valorAnterior: 0, valorNovo: 14_100 },
    ],
  },
  {
    id: "CC-440", venda: "VD-117", corretor: "Denise Molinaro",
    esperado: 20_700, recebido: 18_900, status: "Parcial",
    imovel: "Casa de Praia · Camboinhas", vgv: 3_450_000, tipo: "Parceria",
    comissaoPct: 6, comissaoTotal: 207_000,
    splits: [
      { nome: "Denise Molinaro", valor: 124_200, tipo: "Captador" },
      { nome: "Aldemar Souza", valor: 62_100, tipo: "Parceiro" },
      { nome: "Ubroker", valor: 20_700, tipo: "Fee Ubroker" },
    ],
    criadoEm: "12/04", faturadoEm: "20/04", pagoEm: "27/04", diasDesdeFatura: 8,
    statusOperacional: "Em negociação",
    interacoes: [
      { tipo: "Ligação", obs: "Corretora confirmou diferença por taxa de TED. Vai complementar.", data: "27/04 16:20", autor: "Superadmin" },
    ],
    auditoria: [
      { data: "12/04 10:00", autor: "Sistema", acao: "Cobrança criada" },
      { data: "20/04 09:30", autor: "Sistema", acao: "Fatura enviada" },
      { data: "27/04 15:10", autor: "Superadmin", acao: "Recebimento parcial registrado", valorAnterior: 0, valorNovo: 18_900 },
    ],
  },
  {
    id: "CC-439", venda: "VD-116", corretor: "Ramon Capone",
    esperado: 3_420, recebido: 0, status: "Pendente",
    imovel: "Studio · São Francisco", vgv: 380_000, tipo: "Lead Ubroker",
    comissaoPct: 6, comissaoTotal: 22_800,
    splits: [
      { nome: "Ramon Capone", valor: 19_380, tipo: "Captador" },
      { nome: "Ubroker", valor: 3_420, tipo: "Fee Ubroker" },
    ],
    criadoEm: "01/04", faturadoEm: "08/04", diasDesdeFatura: 20,
    statusOperacional: "Em cobrança",
    interacoes: [
      { tipo: "Mensagem", obs: "Enviado lembrete via WhatsApp.", data: "22/04 10:14", autor: "Superadmin" },
      { tipo: "Ligação", obs: "Sem retorno.", data: "25/04 14:00", autor: "Superadmin" },
    ],
    auditoria: [
      { data: "01/04 08:00", autor: "Sistema", acao: "Cobrança criada" },
      { data: "08/04 09:00", autor: "Sistema", acao: "Fatura enviada" },
      { data: "22/04 10:14", autor: "Superadmin", acao: "Tentativa de cobrança registrada" },
    ],
  },
  {
    id: "CC-438", venda: "VD-115", corretor: "Marcos Iglesias",
    esperado: 9_400, recebido: 9_400, status: "Confirmada",
    imovel: "Apartamento Charitas", vgv: 1_560_000, tipo: "Parceria",
    comissaoPct: 6, comissaoTotal: 93_600,
    splits: [
      { nome: "Marcos Iglesias", valor: 56_160, tipo: "Captador" },
      { nome: "Beatriz Lemos", valor: 28_080, tipo: "Parceiro" },
      { nome: "Ubroker", valor: 9_360, tipo: "Fee Ubroker" },
    ],
    criadoEm: "05/04", faturadoEm: "12/04", pagoEm: "21/04", diasDesdeFatura: 16,
    statusOperacional: "—",
    interacoes: [],
    auditoria: [
      { data: "05/04 09:00", autor: "Sistema", acao: "Cobrança criada" },
      { data: "12/04 11:00", autor: "Sistema", acao: "Fatura enviada" },
      { data: "21/04 10:00", autor: "Superadmin", acao: "Pagamento confirmado", valorAnterior: 0, valorNovo: 9_400 },
    ],
  },
  {
    id: "CC-437", venda: "VD-114", corretor: "Pedro Verissimo",
    esperado: 12_400, recebido: 14_800, status: "Divergente",
    imovel: "Casa Itaipu", vgv: 1_180_000, tipo: "Parceria",
    comissaoPct: 6, comissaoTotal: 70_800,
    splits: [
      { nome: "Pedro Verissimo", valor: 42_480, tipo: "Captador" },
      { nome: "Aldemar Souza", valor: 21_240, tipo: "Parceiro" },
      { nome: "Ubroker", valor: 7_080, tipo: "Fee Ubroker" },
    ],
    criadoEm: "02/04", faturadoEm: "10/04", pagoEm: "24/04", diasDesdeFatura: 18,
    statusOperacional: "Promessa de pagamento",
    interacoes: [
      { tipo: "Negociação", obs: "Corretor pagou a mais. Investigar origem.", data: "24/04 18:00", autor: "Superadmin" },
    ],
    auditoria: [
      { data: "02/04 09:00", autor: "Sistema", acao: "Cobrança criada" },
      { data: "10/04 10:00", autor: "Sistema", acao: "Fatura enviada" },
      { data: "24/04 17:30", autor: "Superadmin", acao: "Recebimento divergente registrado", valorAnterior: 0, valorNovo: 14_800 },
    ],
  },
  {
    id: "CC-436", venda: "VD-113", corretor: "Tiago Sá",
    esperado: 4_800, recebido: 0, status: "Pendente",
    imovel: "Loft Centro Histórico", vgv: 720_000, tipo: "Lead Ubroker",
    comissaoPct: 6, comissaoTotal: 43_200,
    splits: [
      { nome: "Tiago Sá", valor: 38_400, tipo: "Captador" },
      { nome: "Ubroker", valor: 4_800, tipo: "Fee Ubroker" },
    ],
    criadoEm: "20/03", faturadoEm: "28/03", diasDesdeFatura: 31,
    statusOperacional: "Sem retorno",
    interacoes: [
      { tipo: "Mensagem", obs: "Enviado e-mail formal de cobrança.", data: "10/04 09:00", autor: "Superadmin" },
      { tipo: "Ligação", obs: "Caixa postal.", data: "18/04 14:30", autor: "Superadmin" },
      { tipo: "Ligação", obs: "Caixa postal novamente.", data: "25/04 10:00", autor: "Superadmin" },
    ],
    auditoria: [
      { data: "20/03 09:00", autor: "Sistema", acao: "Cobrança criada" },
      { data: "28/03 09:00", autor: "Sistema", acao: "Fatura enviada" },
      { data: "10/04 09:00", autor: "Superadmin", acao: "Tentativa de cobrança registrada" },
      { data: "18/04 14:30", autor: "Superadmin", acao: "Tentativa de cobrança registrada" },
    ],
  },
  {
    id: "CC-435", venda: "VD-112", corretor: "Beatriz Lemos",
    esperado: 18_400, recebido: 11_200, status: "Parcial",
    imovel: "Cobertura Vista Mar · Icaraí", vgv: 3_060_000, tipo: "Parceria",
    comissaoPct: 6, comissaoTotal: 183_600,
    splits: [
      { nome: "Beatriz Lemos", valor: 110_160, tipo: "Captador" },
      { nome: "Denise Molinaro", valor: 55_080, tipo: "Parceiro" },
      { nome: "Ubroker", valor: 18_360, tipo: "Fee Ubroker" },
    ],
    criadoEm: "08/04", faturadoEm: "15/04", pagoEm: "26/04", diasDesdeFatura: 13,
    statusOperacional: "Promessa de pagamento",
    interacoes: [
      { tipo: "Negociação", obs: "Pagou 60%, complemento previsto para 02/05.", data: "26/04 11:00", autor: "Superadmin" },
    ],
    auditoria: [
      { data: "08/04 09:00", autor: "Sistema", acao: "Cobrança criada" },
      { data: "15/04 10:00", autor: "Sistema", acao: "Fatura enviada" },
      { data: "26/04 10:50", autor: "Superadmin", acao: "Recebimento parcial registrado", valorAnterior: 0, valorNovo: 11_200 },
    ],
  },
  {
    id: "CC-434", venda: "VD-111", corretor: "Aldemar Souza",
    esperado: 6_200, recebido: 6_200, status: "Confirmada",
    imovel: "Casa Maricá · Itaipuaçu", vgv: 1_032_000, tipo: "Parceria",
    comissaoPct: 6, comissaoTotal: 61_920,
    splits: [
      { nome: "Aldemar Souza", valor: 37_152, tipo: "Captador" },
      { nome: "Ramon Capone", valor: 18_576, tipo: "Parceiro" },
      { nome: "Ubroker", valor: 6_192, tipo: "Fee Ubroker" },
    ],
    criadoEm: "06/04", faturadoEm: "13/04", pagoEm: "22/04", diasDesdeFatura: 15,
    statusOperacional: "—",
    interacoes: [],
    auditoria: [
      { data: "06/04 09:00", autor: "Sistema", acao: "Cobrança criada" },
      { data: "13/04 10:00", autor: "Sistema", acao: "Fatura enviada" },
      { data: "22/04 09:30", autor: "Superadmin", acao: "Pagamento confirmado", valorAnterior: 0, valorNovo: 6_200 },
    ],
  },
];

// V3 — overrides de governança por id (responsavel, sla, previsão, comprovante, contrato, historicoCorretor)
const _govOverrides: Record<string, Partial<Conciliacao>> = {
  "CC-441": {
    responsavel: { tipo: "admin", nome: "Superadmin" }, slaDias: 3,
    contrato: CONTRATO_PADRAO,
    historicoCorretor: { pagamentosAtrasoPct: 8, tempoMedioPagamentoDias: 9, totalPagoHub: 184_300, totalAberto: 0 },
    comprovante: { nome: "comprovante-cc441.pdf", tipo: "PDF", referencia: "PIX · BB", enviadoEm: "26/04 11:42" },
  },
  "CC-440": {
    responsavel: { tipo: "operador", nome: "Operador Cobranças" }, slaDias: 3,
    previsaoPagamento: "30/04",
    contrato: CONTRATO_PADRAO,
    historicoCorretor: { pagamentosAtrasoPct: 18, tempoMedioPagamentoDias: 12, totalPagoHub: 96_400, totalAberto: 1_800 },
  },
  "CC-439": {
    // não atribuído de propósito — alerta visual
    slaDias: 5,
    contrato: CONTRATO_PADRAO,
    historicoCorretor: { pagamentosAtrasoPct: 42, tempoMedioPagamentoDias: 22, totalPagoHub: 38_900, totalAberto: 3_420 },
  },
  "CC-438": {
    responsavel: { tipo: "admin", nome: "Superadmin" }, slaDias: 3,
    contrato: CONTRATO_PADRAO,
    historicoCorretor: { pagamentosAtrasoPct: 5, tempoMedioPagamentoDias: 8, totalPagoHub: 142_700, totalAberto: 0 },
  },
  "CC-437": {
    responsavel: { tipo: "operador", nome: "Operador Financeiro" }, slaDias: 3,
    previsaoPagamento: "29/04",
    contrato: CONTRATO_PADRAO,
    historicoCorretor: { pagamentosAtrasoPct: 22, tempoMedioPagamentoDias: 14, totalPagoHub: 71_200, totalAberto: 0 },
  },
  "CC-436": {
    responsavel: { tipo: "operador", nome: "Operador Cobranças" }, slaDias: 5,
    contrato: CONTRATO_PADRAO,
    historicoCorretor: { pagamentosAtrasoPct: 55, tempoMedioPagamentoDias: 28, totalPagoHub: 12_400, totalAberto: 4_800 },
  },
  "CC-435": {
    responsavel: { tipo: "operador", nome: "Operador Cobranças" }, slaDias: 3,
    previsaoPagamento: "02/05",
    contrato: CONTRATO_PADRAO,
    historicoCorretor: { pagamentosAtrasoPct: 28, tempoMedioPagamentoDias: 16, totalPagoHub: 88_700, totalAberto: 7_200 },
  },
  "CC-434": {
    responsavel: { tipo: "admin", nome: "Superadmin" }, slaDias: 3,
    contrato: CONTRATO_PADRAO,
    historicoCorretor: { pagamentosAtrasoPct: 12, tempoMedioPagamentoDias: 11, totalPagoHub: 64_300, totalAberto: 0 },
  },
};

export const conciliacoes: Conciliacao[] = _conciliacoesBase.map((c) => ({
  slaDias: 3,
  contrato: CONTRATO_PADRAO,
  historicoCorretor: { pagamentosAtrasoPct: 0, tempoMedioPagamentoDias: 0, totalPagoHub: 0, totalAberto: 0 },
  ...c,
  ..._govOverrides[c.id],
} as Conciliacao));

export type Disputa = {
  id: string;
  partes: [string, string];
  motivo: string;
  status: "Aberta" | "Em análise" | "Resolvida";
  data: string;
};

export const disputas: Disputa[] = [
  { id: "D-022", partes: ["Aldemar Souza", "Pedro Verissimo"], motivo: "Divergência sobre captação do lead L-1041 (Camila Andrade).", status: "Em análise", data: "26/04" },
  { id: "D-021", partes: ["Ramon Capone", "Joana Maciel"], motivo: "Comissão de parceria não repassada após fechamento do Studio São Francisco.", status: "Aberta", data: "27/04" },
  { id: "D-020", partes: ["Denise Molinaro", "Beatriz Lemos"], motivo: "Cliente atribuído a duas indicações em paralelo.", status: "Resolvida", data: "20/04" },
];

export type BypassAlerta = {
  id: string;
  corretor: string;
  lead: string;
  indicio: string;
  risco: "Alto" | "Médio";
};

export const bypassAlertas: BypassAlerta[] = [
  { id: "BP-008", corretor: "Rafael Couto", lead: "L-1024 · Igor Mascarenhas", indicio: "Lead recebido pela Ubroker, fechado fora do sistema (CRECI registrado em outra imobiliária).", risco: "Alto" },
  { id: "BP-007", corretor: "Tiago Sá", lead: "L-1037 · Marcelo Pinheiro", indicio: "Conversa migrada do Inbox Ubroker para WhatsApp pessoal sem registro de proposta.", risco: "Médio" },
  { id: "BP-006", corretor: "Carla Souza", lead: "L-1029 · Dr. Carlos Andrade", indicio: "Imóvel removido do marketplace 48h antes da venda registrada externamente.", risco: "Alto" },
];

export type AuditLog = {
  id: string;
  ator: string;
  acao: string;
  alvo: string;
  tipo: "Venda" | "Parceria" | "Contrato" | "Bloqueio" | "Regra" | "Pagamento";
  data: string;
  critico?: boolean;
};

export const auditLogs: AuditLog[] = [
  { id: "L-9912", ator: "Alessandra Freixo", acao: "registrou venda", alvo: "VD-118 · Cobertura Linear", tipo: "Venda", data: "Hoje 10:24", critico: true },
  { id: "L-9911", ator: "Ramon Capone", acao: "criou parceria com", alvo: "Aldemar Souza · IM-006", tipo: "Parceria", data: "Hoje 09:18" },
  { id: "L-9910", ator: "Denise Molinaro", acao: "assinou contrato", alvo: "VD-117 · Casa Camboinhas", tipo: "Contrato", data: "Ontem 18:42", critico: true },
  { id: "L-9909", ator: "Superadmin", acao: "alterou regra", alvo: "Fee Ubroker (parceria) 10% → 12%", tipo: "Regra", data: "Ontem 14:02", critico: true },
  { id: "L-9908", ator: "Superadmin", acao: "bloqueou usuário", alvo: "Rafael Couto · suspeita de bypass", tipo: "Bloqueio", data: "Ontem 11:30", critico: true },
  { id: "L-9907", ator: "Sistema", acao: "confirmou pagamento", alvo: "CB-2035 · Marcos Iglesias", tipo: "Pagamento", data: "Ontem 09:00" },
  { id: "L-9906", ator: "Pedro Verissimo", acao: "registrou venda", alvo: "VD-115 · Apt 2 suítes Charitas", tipo: "Venda", data: "2 dias atrás" },
  { id: "L-9905", ator: "Beatriz Lemos", acao: "criou parceria com", alvo: "Denise Molinaro · IM-002", tipo: "Parceria", data: "2 dias atrás" },
];

export type IALog = {
  id: string;
  lead: string;
  canal: "WhatsApp" | "Instagram" | "Marketplace";
  score: number;
  resultado: "Qualificado" | "Em qualificação" | "Descartado";
  data: string;
};

export const iaLogs: IALog[] = [
  { id: "IA-3401", lead: "Camila Andrade", canal: "WhatsApp", score: 92, resultado: "Qualificado", data: "Hoje 11:30" },
  { id: "IA-3400", lead: "Felipe Goulart", canal: "Marketplace", score: 78, resultado: "Qualificado", data: "Hoje 08:12" },
  { id: "IA-3399", lead: "Vanessa Ribeiro", canal: "Instagram", score: 64, resultado: "Em qualificação", data: "Hoje 02:44" },
  { id: "IA-3398", lead: "Marcelo Pinheiro", canal: "Instagram", score: 41, resultado: "Descartado", data: "Ontem 22:10" },
  { id: "IA-3397", lead: "Patrícia Lemos", canal: "WhatsApp", score: 79, resultado: "Qualificado", data: "Ontem 18:02" },
  { id: "IA-3396", lead: "Renata Couto", canal: "Marketplace", score: 58, resultado: "Em qualificação", data: "Ontem 14:21" },
];

export const inboxCanais = [
  { canal: "WhatsApp", conectados: 612, conversas: 4_280, semResposta: 124 },
  { canal: "Instagram", conectados: 488, conversas: 2_140, semResposta: 86 },
  { canal: "Marketplace", conectados: 750, conversas: 1_820, semResposta: 42 },
  { canal: "E-mail", conectados: 318, conversas: 940, semResposta: 18 },
];

export type ReferralNode = {
  nome: string;
  mrr: number;
  filhos?: ReferralNode[];
};

export const referralTree: ReferralNode = {
  nome: "Ramon Capone",
  mrr: 480,
  filhos: [
    {
      nome: "Joana Maciel",
      mrr: 240,
      filhos: [
        { nome: "Lúcia Mota", mrr: 120 },
        { nome: "Pedro Inácio", mrr: 120 },
      ],
    },
    {
      nome: "Pedro Verissimo",
      mrr: 360,
      filhos: [
        { nome: "Carla Souza", mrr: 120 },
        { nome: "Bruno Lemos", mrr: 240, filhos: [{ nome: "Tatiana Reis", mrr: 120 }] },
      ],
    },
    {
      nome: "Carla Fontes",
      mrr: 120,
    },
    {
      nome: "Tiago Sá",
      mrr: 120,
    },
  ],
};

export const adminParcerias = [
  { id: "P-2201", imovel: "Cobertura Linear · Jardim Icaraí", captador: "Alessandra Freixo", parceiro: "Ramon Capone", status: "Finalizada" as const, comissao: 126_900 },
  { id: "P-2200", imovel: "Casa Camboinhas Beach", captador: "Denise Molinaro", parceiro: "Aldemar Souza", status: "Finalizada" as const, comissao: 186_300 },
  { id: "P-2199", imovel: "Apartamento Charitas", captador: "Pedro Verissimo", parceiro: "Beatriz Lemos", status: "Ativa" as const, comissao: 89_400 },
  { id: "P-2198", imovel: "Casa Itaipu", captador: "Aldemar Souza", parceiro: "Ramon Capone", status: "Ativa" as const, comissao: 70_800 },
  { id: "P-2197", imovel: "Loft Centro Histórico", captador: "Carla Fontes", parceiro: "Marcos Iglesias", status: "Cancelada" as const, comissao: 0 },
  { id: "P-2196", imovel: "Sala Comercial Centro Empresarial", captador: "Beatriz Lemos", parceiro: "Joana Maciel", status: "Ativa" as const, comissao: 49_200 },
];

export const adminLeadsOrigem = [
  { origem: "IA", total: 1_842, qualificados: 1_124 },
  { origem: "Inbox", total: 1_204, qualificados: 612 },
  { origem: "Marketplace", total: 880, qualificados: 318 },
  { origem: "Indicação", total: 412, qualificados: 290 },
];

export const adminKpis = {
  receitaTotal: 4_812_400,
  receitaMes: 612_800,
  mrrSaas: 142_200,
  receitaPorOrigem: {
    comissao: 3_840_200,
    saas: 612_400,
    indicacoes: 359_800,
  },
  corretoresAtivos: 752,
  leadsGerados: 4_338,
  parceriasAtivas: 184,
  vendasRegistradas: 96,
  receitaEvolucao: [
    { mes: "Mai", v: 320 },
    { mes: "Jun", v: 388 },
    { mes: "Jul", v: 422 },
    { mes: "Ago", v: 498 },
    { mes: "Set", v: 540 },
    { mes: "Out", v: 612 },
  ],
};

// ============== Despesas (visão de resultado) ==============

export type CategoriaDespesa =
  | "Marketing"
  | "Tecnologia"
  | "Operacional"
  | "Jurídico"
  | "Administrativo"
  | "Outros";

export const CATEGORIAS_DESPESA: CategoriaDespesa[] = [
  "Marketing",
  "Tecnologia",
  "Operacional",
  "Jurídico",
  "Administrativo",
  "Outros",
];

export type TipoDespesa = "Fixo" | "Variável";
export type StatusDespesa = "Pago" | "A pagar";

export type Despesa = {
  id: string;
  data: string; // dd/mm
  categoria: CategoriaDespesa;
  descricao: string;
  tipo: TipoDespesa;
  valor: number;
  status: StatusDespesa;
  observacao?: string;
  responsavel?: string;
};

export const despesasMock: Despesa[] = [
  { id: "DP-1001", data: "03/04", categoria: "Tecnologia", descricao: "Infraestrutura cloud (AWS)", tipo: "Fixo", valor: 4_800, status: "Pago", responsavel: "Financeiro" },
  { id: "DP-1002", data: "05/04", categoria: "Marketing", descricao: "Mídia paga — Meta Ads", tipo: "Variável", valor: 6_200, status: "Pago", responsavel: "Marketing" },
  { id: "DP-1003", data: "08/04", categoria: "Administrativo", descricao: "Folha de pagamento (parcial)", tipo: "Fixo", valor: 18_400, status: "Pago", responsavel: "RH" },
  { id: "DP-1004", data: "10/04", categoria: "Jurídico", descricao: "Honorários advocatícios", tipo: "Fixo", valor: 3_500, status: "Pago", responsavel: "Jurídico" },
  { id: "DP-1005", data: "14/04", categoria: "Operacional", descricao: "Aluguel sede + condomínio", tipo: "Fixo", valor: 7_200, status: "Pago", responsavel: "Financeiro" },
  { id: "DP-1006", data: "18/04", categoria: "Marketing", descricao: "Produção de conteúdo institucional", tipo: "Variável", valor: 2_900, status: "A pagar", responsavel: "Marketing", observacao: "Vence em 28/04" },
  { id: "DP-1007", data: "20/04", categoria: "Tecnologia", descricao: "SaaS — CRM e ferramentas", tipo: "Fixo", valor: 1_850, status: "Pago", responsavel: "TI" },
  { id: "DP-1008", data: "22/04", categoria: "Operacional", descricao: "Logística e deslocamentos", tipo: "Variável", valor: 1_240, status: "A pagar", responsavel: "Operações" },
  { id: "DP-1009", data: "24/04", categoria: "Administrativo", descricao: "Material de escritório", tipo: "Variável", valor: 680, status: "Pago" },
  { id: "DP-1010", data: "26/04", categoria: "Outros", descricao: "Treinamento equipe comercial", tipo: "Variável", valor: 3_100, status: "A pagar", responsavel: "RH", observacao: "Workshop com consultoria externa" },
];

// ============== Camada estratégica do Dashboard ==============

export const adminKpisExtra = {
  receitaMesAnterior: 540_000,
  inadimplenciaAtualPct: 8.4,
  inadimplenciaMesAnteriorPct: 6.1,
  conversaoMesPct: 14.2,
  conversaoMesAnteriorPct: 16.0,
  margemMesAnteriorPct: 28.5,
};

export type RegiaoDemanda = { regiao: string; leads: number; visitas: number };
export type TipoImovelBuscado = { label: string; buscas: number };
export type FaixaPreco = { min: number; max: number; share: number };
export type ConversaoOrigem = { origem: string; pct: number };

export const inteligenciaMercado = {
  regioesDemanda: [
    { regiao: "Niterói · Icaraí", leads: 612, visitas: 184 },
    { regiao: "São Paulo · Pinheiros", leads: 488, visitas: 142 },
    { regiao: "Rio · Barra da Tijuca", leads: 402, visitas: 118 },
    { regiao: "Maricá · Centro", leads: 318, visitas: 92 },
    { regiao: "Curitiba · Batel", leads: 244, visitas: 68 },
  ] as RegiaoDemanda[],
  tiposImovel: [
    { label: "Apartamento 2 quartos", buscas: 1_842 },
    { label: "Cobertura", buscas: 1_204 },
    { label: "Casa", buscas: 980 },
    { label: "Studio", buscas: 612 },
    { label: "Sala comercial", buscas: 318 },
  ] as TipoImovelBuscado[],
  faixaPrecoDominante: { min: 500_000, max: 1_000_000, share: 38 } as FaixaPreco,
  faixasPrecoSecundarias: [
    { min: 1_000_000, max: 2_000_000, share: 27 },
    { min: 250_000, max: 500_000, share: 19 },
  ] as FaixaPreco[],
  conversaoPorOrigem: [
    { origem: "Indicação", pct: 31 },
    { origem: "Parceria", pct: 24 },
    { origem: "Lead Ubroker", pct: 18 },
  ] as ConversaoOrigem[],
};

export type CorretorTop = { id: string; nome: string; avatar: string; receita: number; conversaoPct: number };
export type CorretorBaixa = { id: string; nome: string; avatar: string; motivo: string; severidade: "amber" | "red" };

export const performanceCorretores = {
  top: [
    { id: "U-004", nome: "Denise Molinaro", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=128&q=80", receita: 312_400, conversaoPct: 34 },
    { id: "U-012", nome: "Beatriz Lemos", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&q=80", receita: 215_600, conversaoPct: 29 },
    { id: "U-002", nome: "Alessandra Freixo", avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=128&q=80", receita: 184_200, conversaoPct: 27 },
    { id: "U-003", nome: "Aldemar Souza", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=128&q=80", receita: 142_800, conversaoPct: 24 },
    { id: "U-001", nome: "Ramon Cardozo Capone", avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=128&q=80", receita: 96_480, conversaoPct: 21 },
  ] as CorretorTop[],
  baixaPerformance: [
    { id: "U-011", nome: "Rafael Couto", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=128&q=80", motivo: "Bloqueado · 32d sem login", severidade: "red" },
    { id: "U-009", nome: "Carla Souza", avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=128&q=80", motivo: "Inativa há 21 dias", severidade: "red" },
    { id: "U-008", nome: "Tiago Sá", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=128&q=80", motivo: "Conversão 4% · 71% atraso", severidade: "amber" },
    { id: "U-005", nome: "Joana Maciel", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=128&q=80", motivo: "Conversão 6% · poucos leads", severidade: "amber" },
  ] as CorretorBaixa[],
};

// ============================================================
// Rede de Indicações — datasets aditivos (não altera referralTree)
// ============================================================

export type RedeIndicacaoStatus = "Ativo" | "Teste" | "Inativo";
export type RedeProduto = "IA" | "Inbox" | "Combo" | "—";

export type RedeIndicacaoItem = {
  id: string;
  nome: string;
  /** @deprecated nível absoluto legado — a UI calcula nível RELATIVO via getRedeRelativa */
  nivel: 1 | 2 | 3;
  indicador: string;
  /** id do indicador direto. null = raiz (não foi indicado por ninguém). */
  indicadorId: string | null;
  indicados: number;
  status: RedeIndicacaoStatus;
  produto: RedeProduto;
  mrr: number;
  receitaAcumulada: number;
  receitaPaga: number;
  receitaPendente: number;
  dataEntrada: string; // dd/mm/aaaa
  crescimentoPct: number;
};

export const redeIndicacoes: RedeIndicacaoItem[] = [
  // Raiz da rede
  { id: "RI-000", nome: "Ramon Capone", nivel: 1, indicador: "—", indicadorId: null, indicados: 4, status: "Ativo", produto: "Combo", mrr: 480, receitaAcumulada: 8_640, receitaPaga: 8_160, receitaPendente: 480, dataEntrada: "01/01/2025", crescimentoPct: 12 },
  // N1 — indicados diretos por Ramon
  { id: "RI-001", nome: "Joana Maciel", nivel: 1, indicador: "Ramon Capone", indicadorId: "RI-000", indicados: 2, status: "Inativo", produto: "Combo", mrr: 240, receitaAcumulada: 2_880, receitaPaga: 2_400, receitaPendente: 480, dataEntrada: "12/03/2025", crescimentoPct: -18 },
  { id: "RI-002", nome: "Pedro Verissimo", nivel: 1, indicador: "Ramon Capone", indicadorId: "RI-000", indicados: 2, status: "Ativo", produto: "Combo", mrr: 360, receitaAcumulada: 4_320, receitaPaga: 3_960, receitaPendente: 360, dataEntrada: "08/02/2025", crescimentoPct: 22 },
  { id: "RI-003", nome: "Carla Fontes", nivel: 1, indicador: "Ramon Capone", indicadorId: "RI-000", indicados: 1, status: "Ativo", produto: "IA", mrr: 120, receitaAcumulada: 1_440, receitaPaga: 1_320, receitaPendente: 120, dataEntrada: "21/04/2025", crescimentoPct: 8 },
  { id: "RI-004", nome: "Tiago Sá", nivel: 1, indicador: "Ramon Capone", indicadorId: "RI-000", indicados: 0, status: "Teste", produto: "Inbox", mrr: 120, receitaAcumulada: 360, receitaPaga: 240, receitaPendente: 120, dataEntrada: "02/10/2025", crescimentoPct: 0 },
  // N2 (indicados por N1)
  { id: "RI-005", nome: "Lúcia Mota", nivel: 2, indicador: "Joana Maciel", indicadorId: "RI-001", indicados: 1, status: "Ativo", produto: "IA", mrr: 120, receitaAcumulada: 1_080, receitaPaga: 960, receitaPendente: 120, dataEntrada: "18/05/2025", crescimentoPct: 12 },
  { id: "RI-006", nome: "Pedro Inácio", nivel: 2, indicador: "Joana Maciel", indicadorId: "RI-001", indicados: 0, status: "Inativo", produto: "Inbox", mrr: 120, receitaAcumulada: 720, receitaPaga: 720, receitaPendente: 0, dataEntrada: "22/06/2025", crescimentoPct: -25 },
  { id: "RI-007", nome: "Carla Souza", nivel: 2, indicador: "Pedro Verissimo", indicadorId: "RI-002", indicados: 2, status: "Ativo", produto: "Combo", mrr: 120, receitaAcumulada: 1_320, receitaPaga: 1_200, receitaPendente: 120, dataEntrada: "10/04/2025", crescimentoPct: 6 },
  { id: "RI-008", nome: "Bruno Lemos", nivel: 2, indicador: "Pedro Verissimo", indicadorId: "RI-002", indicados: 2, status: "Ativo", produto: "Combo", mrr: 240, receitaAcumulada: 2_640, receitaPaga: 2_400, receitaPendente: 240, dataEntrada: "14/03/2025", crescimentoPct: 18 },
  { id: "RI-009", nome: "Diego Prado", nivel: 2, indicador: "Carla Fontes", indicadorId: "RI-003", indicados: 0, status: "Teste", produto: "IA", mrr: 0, receitaAcumulada: 0, receitaPaga: 0, receitaPendente: 0, dataEntrada: "12/10/2025", crescimentoPct: 0 },
  // N3 (indicados por N2)
  { id: "RI-010", nome: "Tatiana Reis", nivel: 3, indicador: "Bruno Lemos", indicadorId: "RI-008", indicados: 0, status: "Ativo", produto: "IA", mrr: 120, receitaAcumulada: 720, receitaPaga: 600, receitaPendente: 120, dataEntrada: "11/07/2025", crescimentoPct: 14 },
  { id: "RI-011", nome: "Felipe Andrade", nivel: 3, indicador: "Carla Souza", indicadorId: "RI-007", indicados: 0, status: "Ativo", produto: "Inbox", mrr: 120, receitaAcumulada: 480, receitaPaga: 360, receitaPendente: 120, dataEntrada: "20/08/2025", crescimentoPct: 9 },
  { id: "RI-012", nome: "Marina Lopes", nivel: 3, indicador: "Lúcia Mota", indicadorId: "RI-005", indicados: 0, status: "Ativo", produto: "Combo", mrr: 120, receitaAcumulada: 600, receitaPaga: 480, receitaPendente: 120, dataEntrada: "05/07/2025", crescimentoPct: 11 },
  { id: "RI-013", nome: "Otávio Pires", nivel: 3, indicador: "Bruno Lemos", indicadorId: "RI-008", indicados: 0, status: "Inativo", produto: "IA", mrr: 0, receitaAcumulada: 240, receitaPaga: 240, receitaPendente: 0, dataEntrada: "02/06/2025", crescimentoPct: -40 },
  { id: "RI-014", nome: "Nina Bastos", nivel: 3, indicador: "Carla Souza", indicadorId: "RI-007", indicados: 0, status: "Teste", produto: "Inbox", mrr: 0, receitaAcumulada: 0, receitaPaga: 0, receitaPendente: 0, dataEntrada: "18/10/2025", crescimentoPct: 0 },
];

// ===== Helpers de grafo (níveis RELATIVOS ao usuário base) =====

export type RedeRelativaEntry = { item: RedeIndicacaoItem; nivelRelativo: number };

/** Filhos diretos (indicados imediatos) de um corretor base. */
export function getIndicadosDiretos(baseId: string): RedeIndicacaoItem[] {
  return redeIndicacoes.filter((r) => r.indicadorId === baseId);
}

/**
 * BFS a partir de baseId. Retorna apenas DESCENDENTES (não inclui o próprio base),
 * com o nível relativo (1 = filho direto, 2 = neto, 3 = bisneto, etc.).
 */
export function getRedeRelativa(baseId: string): Map<string, RedeRelativaEntry> {
  const out = new Map<string, RedeRelativaEntry>();
  const queue: { id: string; nivel: number }[] = [{ id: baseId, nivel: 0 }];
  const visited = new Set<string>([baseId]);
  while (queue.length) {
    const cur = queue.shift()!;
    const filhos = getIndicadosDiretos(cur.id);
    for (const f of filhos) {
      if (visited.has(f.id)) continue;
      visited.add(f.id);
      out.set(f.id, { item: f, nivelRelativo: cur.nivel + 1 });
      queue.push({ id: f.id, nivel: cur.nivel + 1 });
    }
  }
  return out;
}

export const redeIndicacoesPeriodoAnterior = {
  totalIndicados: 12,
  mrrN1: 780,
  mrrN2: 540,
  mrrN3: 420,
  receitaTotal: 1_740,
};

export type RedeAlertaSeveridade = "atencao" | "critico";
export type RedeAlerta = {
  id: string;
  severidade: RedeAlertaSeveridade;
  titulo: string;
  descricao: string;
  corretor?: string;
};

export const redeAlertas: RedeAlerta[] = [
  { id: "AL-1", severidade: "critico", titulo: "Joana Maciel parou de gerar receita", descricao: "Sem novos indicados há 38 dias · MRR caiu 18%.", corretor: "Joana Maciel" },
  { id: "AL-2", severidade: "atencao", titulo: "Queda de 12% na rede em outubro", descricao: "MRR consolidado abaixo do mês anterior." },
  { id: "AL-3", severidade: "atencao", titulo: "3 indicados em churn neste mês", descricao: "Pedro Inácio, Otávio Pires e 1 indicado N2 deixaram a rede." },
  { id: "AL-4", severidade: "critico", titulo: "Redução da receita recorrente", descricao: "Receita recorrente total recuou R$ 180/mês vs período anterior." },
];

export const redeInsights = {
  concentracaoTop: 64, // % da receita gerada pelos top 3
  profundidadeMedia: 2.3,
  conversaoPorNivel: [
    { nivel: 1, pct: 62 },
    { nivel: 2, pct: 38 },
    { nivel: 3, pct: 21 },
  ],
  evolucaoRede: [
    { mes: "Mai", indicados: 6, mrr: 720 },
    { mes: "Jun", indicados: 8, mrr: 960 },
    { mes: "Jul", indicados: 10, mrr: 1_200 },
    { mes: "Ago", indicados: 11, mrr: 1_320 },
    { mes: "Set", indicados: 13, mrr: 1_560 },
    { mes: "Out", indicados: 14, mrr: 1_680 },
  ],
};

export const redeRepassesMock = [
  { data: "30/10/2025", valor: 120, status: "Pago" as const },
  { data: "30/09/2025", valor: 240, status: "Pago" as const },
  { data: "30/08/2025", valor: 240, status: "Pago" as const },
  { data: "30/07/2025", valor: 120, status: "Pago" as const },
  { data: "30/06/2025", valor: 240, status: "Pago" as const },
  { data: "30/05/2025", valor: 120, status: "Pago" as const },
];
