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

export type Cobranca = {
  id: string;
  corretor: string;
  origem: "Parceria" | "Lead Ubroker" | "SaaS";
  valor: number;
  vencimento: string;
  status: "Pendente" | "Faturado" | "Pago" | "Atrasado";
};

export const cobrancas: Cobranca[] = [
  { id: "CB-2041", corretor: "Alessandra Freixo", origem: "Parceria", valor: 8_400, vencimento: "28/04", status: "Atrasado" },
  { id: "CB-2040", corretor: "Aldemar Souza", origem: "Lead Ubroker", valor: 3_200, vencimento: "30/04", status: "Pendente" },
  { id: "CB-2039", corretor: "Denise Molinaro", origem: "Parceria", valor: 14_600, vencimento: "02/05", status: "Faturado" },
  { id: "CB-2038", corretor: "Ramon Capone", origem: "SaaS", valor: 120, vencimento: "01/05", status: "Pago" },
  { id: "CB-2037", corretor: "Pedro Verissimo", origem: "Parceria", valor: 6_800, vencimento: "22/04", status: "Atrasado" },
  { id: "CB-2036", corretor: "Carla Fontes", origem: "Lead Ubroker", valor: 4_400, vencimento: "05/05", status: "Faturado" },
  { id: "CB-2035", corretor: "Marcos Iglesias", origem: "Parceria", valor: 9_200, vencimento: "26/04", status: "Pago" },
  { id: "CB-2034", corretor: "Beatriz Lemos", origem: "SaaS", valor: 240, vencimento: "01/05", status: "Pago" },
  { id: "CB-2033", corretor: "Joana Maciel", origem: "Lead Ubroker", valor: 2_100, vencimento: "29/04", status: "Pendente" },
  { id: "CB-2032", corretor: "Tiago Sá", origem: "SaaS", valor: 120, vencimento: "20/04", status: "Atrasado" },
];

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

export type Conciliacao = {
  id: string;
  venda: string;
  corretor: string;
  esperado: number;
  recebido: number;
  status: "Pendente" | "Confirmada" | "Divergente";
};

export const conciliacoes: Conciliacao[] = [
  { id: "CC-441", venda: "VD-118", corretor: "Alessandra Freixo", esperado: 14_100, recebido: 14_100, status: "Confirmada" },
  { id: "CC-440", venda: "VD-117", corretor: "Denise Molinaro", esperado: 20_700, recebido: 18_900, status: "Divergente" },
  { id: "CC-439", venda: "VD-116", corretor: "Ramon Capone", esperado: 3_420, recebido: 0, status: "Pendente" },
  { id: "CC-438", venda: "VD-115", corretor: "Marcos Iglesias", esperado: 9_400, recebido: 9_400, status: "Confirmada" },
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
