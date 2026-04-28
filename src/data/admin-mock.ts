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

export const conciliacoes: Conciliacao[] = [
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
