// Static fictional data for the Ubroker MVP. No persistence, no APIs.

export const broker = {
  name: "Ramon Cardozo Capone",
  email: "ramon.capone@ubroker.com.br",
  phone: "+55 21 99812-4477",
  region: "Niterói / RJ",
  plan: "Free",
  creci: "RJ-78342",
  avatar:
    "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=256&h=256&fit=crop&q=80",
};

export const kpis = {
  vgv: 3_200_000,
  faturamento: 96_000,
  comissaoMedia: 0.03,
  vendidosMes: 2,
  ticketMedio: 800_000,
  leadsNovos: 18,
  emAtendimento: 12,
  propostas: 5,
  ganhosIndicacao: 480,
  metaIsencao: 600,
};

export const salesEvolution = [
  { mes: "Mai", vgv: 1.6, faturamento: 48 },
  { mes: "Jun", vgv: 2.1, faturamento: 63 },
  { mes: "Jul", vgv: 1.9, faturamento: 57 },
  { mes: "Ago", vgv: 2.8, faturamento: 84 },
  { mes: "Set", vgv: 2.4, faturamento: 72 },
  { mes: "Out", vgv: 3.2, faturamento: 96 },
];

export type LeadStatus = "Novo" | "Qualificado" | "Visita" | "Proposta" | "Fechado" | "Perdido";
export type LeadOrigin = "Instagram" | "WhatsApp" | "Marketplace" | "Indicação" | "Outro";

export type LeadEtapa =
  | "Novo"
  | "Tentativa de contato"
  | "Contatado"
  | "Qualificado"
  | "Atendimento"
  | "Visita"
  | "Proposta"
  | "Venda"
  | "Perdido";

export type LeadTemperatura = "quente" | "morno" | "frio";
export type LeadOrigemComercial = "manual" | "plataforma" | "ia" | "parceria";
export type ProximaAcaoTipo =
  | "ligar"
  | "whatsapp"
  | "follow-up"
  | "confirmar-visita"
  | "enviar-imoveis"
  | "registrar-feedback"
  | "reativar"
  | "marcar-perdido";

export interface ProximaAcao {
  tipo: ProximaAcaoTipo;
  label: string;
  prazo: string;
  status: "hoje" | "atrasado" | "proximo" | "concluido";
  motivo?: string;
}

export interface CadenciaItem {
  dia: number;
  titulo: string;
  status: "pendente" | "concluido" | "atrasado";
}

export interface VisitaLead {
  data: string;
  status: string;
  imovel: string;
  feedback?: string;
}

export interface Qualificacao {
  perfil?: string;
  tipoImovel?: string;
  regiao?: string;
  orcamento?: number;
  capacidade?: string;
  prazo?: string;
  motivacao?: string;
  objecoes?: string;
  observacoes?: string;
}

export interface VinculoComercial {
  origemComercial: LeadOrigemComercial;
  feeAplicavel?: boolean;
  contratoId?: string;
  parceiro?: string;
  resumoVinculo?: string;
}

export interface LeadOps {
  etapa: LeadEtapa;
  temperatura: LeadTemperatura;
  proximaAcao: ProximaAcao;
  cadencia: CadenciaItem[];
  visitas?: VisitaLead[];
  qualificacao?: Qualificacao;
  vinculo: VinculoComercial;
  ultimoCanal?: "WhatsApp" | "Instagram" | "Ligação" | "Email" | "IA" | "Marketplace";
  ultimoResumo?: string;
  alertas?: string[];
}

export interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  origem: LeadOrigin;
  origemDetalhe?: string;
  interesse: string;
  status: LeadStatus;
  ultimaInteracao: string;
  orcamento: number;
  historico: { data: string; tipo: string; texto: string }[];
}

export const leadOps: Record<string, LeadOps> = {
  "L-1042": {
    etapa: "Qualificado",
    temperatura: "morno",
    proximaAcao: {
      tipo: "ligar",
      label: "Ligar para João agora",
      prazo: "Atrasado há 2h",
      status: "atrasado",
      motivo: "Dia 2 da cadência. Lead qualificado e sem retorno desde manhã.",
    },
    cadencia: [
      { dia: 1, titulo: "Ligação inicial", status: "concluido" },
      { dia: 1, titulo: "WhatsApp de apresentação", status: "concluido" },
      { dia: 2, titulo: "Follow-up por ligação", status: "atrasado" },
      { dia: 2, titulo: "Envio de imóveis compatíveis", status: "pendente" },
      { dia: 3, titulo: "Prova social + nova tentativa", status: "pendente" },
    ],
    visitas: [{ data: "Sáb, 10h", status: "Confirmada", imovel: "Cobertura Edifício Marine — Icaraí" }],
    qualificacao: {
      perfil: "Casado, 3 filhos, home office",
      tipoImovel: "Casa com área externa",
      regiao: "Icaraí / Santa Rosa",
      orcamento: 1_000_000,
      capacidade: "Entrada 30% + financiamento",
      prazo: "60 a 90 dias",
      motivacao: "Filhos em escola próxima",
      objecoes: "Receio de obras antes da mudança",
    },
    vinculo: {
      origemComercial: "manual",
      feeAplicavel: false,
      resumoVinculo: "Lead cadastrado manualmente após contato direto via Instagram.",
    },
    ultimoCanal: "WhatsApp",
    ultimoResumo: "Pediu fotos da varanda do imóvel em Icaraí.",
    alertas: ["Cadência atrasada", "Sem retorno há 2h"],
  },
  "L-1041": {
    etapa: "Visita",
    temperatura: "quente",
    proximaAcao: {
      tipo: "confirmar-visita",
      label: "Confirmar visita de hoje 15h",
      prazo: "Hoje, 14h",
      status: "hoje",
      motivo: "Visita marcada à cobertura Marine. Confirmar 1h antes.",
    },
    cadencia: [
      { dia: 1, titulo: "WhatsApp inicial", status: "concluido" },
      { dia: 1, titulo: "Envio de dossiê", status: "concluido" },
      { dia: 2, titulo: "Confirmação da visita", status: "pendente" },
      { dia: 3, titulo: "Pós-visita + feedback", status: "pendente" },
    ],
    visitas: [{ data: "Hoje, 15h", status: "Confirmada", imovel: "Cobertura Marine — Icaraí" }],
    qualificacao: {
      perfil: "Solteira, 34, mudando do ABC",
      tipoImovel: "Cobertura duplex 2 suítes",
      regiao: "Icaraí / Santa Rosa",
      orcamento: 1_600_000,
      capacidade: "À vista parcial + financiamento",
      prazo: "30 dias",
      motivacao: "Vista mar e varanda gourmet",
    },
    vinculo: {
      origemComercial: "plataforma",
      feeAplicavel: true,
      resumoVinculo: "Lead recebido via WhatsApp Business da Ubroker. Fee de plataforma de 10% sobre comissão.",
    },
    ultimoCanal: "WhatsApp",
    ultimoResumo: "Confirmou visita à cobertura do Edifício Marine.",
    alertas: ["Visita hoje 15h", "Lead quente"],
  },
  "L-1040": {
    etapa: "Proposta",
    temperatura: "quente",
    proximaAcao: {
      tipo: "follow-up",
      label: "Follow-up da proposta enviada",
      prazo: "Hoje, 17h",
      status: "hoje",
      motivo: "Proposta R$ 1.150.000 enviada ontem. Sem retorno até agora.",
    },
    cadencia: [
      { dia: 1, titulo: "Visita realizada", status: "concluido" },
      { dia: 2, titulo: "Segunda visita com a filha", status: "concluido" },
      { dia: 3, titulo: "Envio de proposta", status: "concluido" },
      { dia: 4, titulo: "Follow-up da proposta", status: "pendente" },
    ],
    visitas: [
      { data: "Ontem, 10h", status: "Realizada", imovel: "Casa térrea Itaipu", feedback: "Família muito interessada" },
    ],
    qualificacao: {
      perfil: "Casal aposentado",
      tipoImovel: "Casa térrea condomínio fechado",
      regiao: "Itaipu",
      orcamento: 1_200_000,
      capacidade: "À vista (vendendo apto Flamengo)",
      prazo: "45 dias",
      motivacao: "Tranquilidade e segurança",
    },
    vinculo: {
      origemComercial: "parceria",
      feeAplicavel: true,
      contratoId: "PRC-2310",
      parceiro: "Aldemar Souza · Homesphere",
      resumoVinculo: "Indicação qualificada via parceria Homesphere. Repasse 25% sobre comissão líquida.",
    },
    ultimoCanal: "Email",
    ultimoResumo: "Proposta enviada: R$ 1.150.000 com financiamento Caixa.",
    alertas: ["Proposta sem retorno há 18h"],
  },
  "L-1039": {
    etapa: "Novo",
    temperatura: "quente",
    proximaAcao: {
      tipo: "ligar",
      label: "Primeiro contato — ligar agora",
      prazo: "Hoje, 11h",
      status: "hoje",
      motivo: "Lead novo do marketplace há 4h. SLA de primeiro contato: 6h.",
    },
    cadencia: [
      { dia: 1, titulo: "Ligação inicial", status: "pendente" },
      { dia: 1, titulo: "WhatsApp de apresentação", status: "pendente" },
      { dia: 2, titulo: "Envio de opções", status: "pendente" },
    ],
    qualificacao: {
      perfil: "CTO de startup, mudando para o Rio",
      tipoImovel: "Apartamento alto padrão",
      regiao: "Icaraí",
      orcamento: 1_400_000,
      prazo: "60 dias",
      motivacao: "Mudança de cidade",
    },
    vinculo: {
      origemComercial: "plataforma",
      feeAplicavel: true,
      resumoVinculo: "Lead capturado via portal Ubroker Marketplace. Fee de 10%.",
    },
    ultimoCanal: "Marketplace",
    ultimoResumo: "Lead capturado via portal. Ainda sem contato.",
    alertas: ["Sem primeiro contato há 4h"],
  },
  "L-1038": {
    etapa: "Qualificado",
    temperatura: "morno",
    proximaAcao: {
      tipo: "enviar-imoveis",
      label: "Enviar 3 opções no Ingá",
      prazo: "Hoje, 16h",
      status: "hoje",
      motivo: "Cliente pediu prédios anos 60. Selecionar e enviar dossiê.",
    },
    cadencia: [
      { dia: 1, titulo: "Ligação inicial", status: "concluido" },
      { dia: 2, titulo: "Envio de imóveis compatíveis", status: "pendente" },
      { dia: 3, titulo: "Agendar visita", status: "pendente" },
    ],
    qualificacao: {
      perfil: "Arquiteta, 41 anos",
      tipoImovel: "Apartamento para reformar",
      regiao: "Ingá",
      orcamento: 950_000,
      motivacao: "Charme arquitetônico",
    },
    vinculo: {
      origemComercial: "manual",
      feeAplicavel: false,
      resumoVinculo: "Lead conhecido em evento Casa Cor 2025.",
    },
    ultimoCanal: "Ligação",
    ultimoResumo: "Conversa de 22min sobre prédios dos anos 60 no Ingá.",
  },
  "L-1037": {
    etapa: "Novo",
    temperatura: "morno",
    proximaAcao: {
      tipo: "whatsapp",
      label: "Responder DM com rentabilidade",
      prazo: "Atrasado há 6h",
      status: "atrasado",
      motivo: "Pediu rentabilidade média da região e ainda não recebeu retorno.",
    },
    cadencia: [
      { dia: 1, titulo: "Resposta inicial via Instagram", status: "atrasado" },
      { dia: 1, titulo: "Envio de planilha de rentabilidade", status: "pendente" },
    ],
    qualificacao: {
      perfil: "Investidor",
      tipoImovel: "2 unidades para temporada",
      regiao: "Itacoatiara",
      orcamento: 1_200_000,
      motivacao: "Rentabilidade",
    },
    vinculo: {
      origemComercial: "ia",
      feeAplicavel: true,
      resumoVinculo: "Lead recebido e qualificado pela IA Assistente da Ubroker.",
    },
    ultimoCanal: "Instagram",
    ultimoResumo: "Pediu rentabilidade média da região.",
    alertas: ["Sem resposta há 6h", "Lead qualificado pela IA"],
  },
  "L-1036": {
    etapa: "Qualificado",
    temperatura: "quente",
    proximaAcao: {
      tipo: "ligar",
      label: "Ligar e propor visita ao Ed. Vista Bay",
      prazo: "Hoje, 13h",
      status: "hoje",
      motivo: "IA qualificou com score 79. Cliente sinalizou urgência (escola).",
    },
    cadencia: [
      { dia: 1, titulo: "Ligação de qualificação", status: "pendente" },
      { dia: 2, titulo: "Envio de 3 apartamentos", status: "pendente" },
    ],
    qualificacao: {
      perfil: "Médica, 38, divorciada, 2 filhos",
      tipoImovel: "Apto 3 quartos",
      regiao: "São Francisco",
      orcamento: 1_100_000,
      prazo: "Antes do início do ano letivo",
    },
    vinculo: {
      origemComercial: "ia",
      feeAplicavel: true,
      resumoVinculo: "Qualificação automática IA Assistente. Score 79.",
    },
    ultimoCanal: "IA",
    ultimoResumo: "Lead qualificado pela assistente. Score 79.",
    alertas: ["Lead qualificado pela IA"],
  },
  "L-1035": {
    etapa: "Visita",
    temperatura: "morno",
    proximaAcao: {
      tipo: "confirmar-visita",
      label: "Confirmar visita amanhã 14h",
      prazo: "Amanhã",
      status: "proximo",
      motivo: "Visita à sala 1208 do Centro Empresarial Niterói.",
    },
    cadencia: [
      { dia: 1, titulo: "Ligação inicial", status: "concluido" },
      { dia: 2, titulo: "Agendamento de visita", status: "concluido" },
      { dia: 3, titulo: "Confirmação 24h antes", status: "pendente" },
    ],
    visitas: [{ data: "Amanhã, 14h", status: "Agendada", imovel: "Sala 1208 — CE Niterói" }],
    vinculo: {
      origemComercial: "manual",
      feeAplicavel: false,
      resumoVinculo: "Indicação direta de cliente antiga (Sra. Marlene).",
    },
    ultimoCanal: "Ligação",
    ultimoResumo: "Visita à sala 1208 marcada para amanhã 14h.",
  },
  "L-1034": {
    etapa: "Novo",
    temperatura: "frio",
    proximaAcao: {
      tipo: "whatsapp",
      label: "Apresentação inicial via WhatsApp",
      prazo: "Hoje, 18h",
      status: "hoje",
      motivo: "Lead novo do marketplace, primeiro imóvel. Tom consultivo.",
    },
    cadencia: [
      { dia: 1, titulo: "WhatsApp de apresentação", status: "pendente" },
      { dia: 2, titulo: "Envio de guia primeiro imóvel", status: "pendente" },
    ],
    qualificacao: {
      perfil: "Recém-casada, sem filhos",
      tipoImovel: "1 ou 2 quartos",
      regiao: "Santa Rosa / Vital Brazil",
      orcamento: 550_000,
      prazo: "6 meses",
      motivacao: "Sair do aluguel",
    },
    vinculo: {
      origemComercial: "plataforma",
      feeAplicavel: true,
      resumoVinculo: "Lead capturado via Ubroker Marketplace.",
    },
    ultimoCanal: "Marketplace",
    ultimoResumo: "Lead novo capturado.",
    alertas: ["Sem primeiro contato há 8h"],
  },
  "L-1033": {
    etapa: "Proposta",
    temperatura: "quente",
    proximaAcao: {
      tipo: "follow-up",
      label: "Responder contraproposta",
      prazo: "Atrasado há 1d",
      status: "atrasado",
      motivo: "Casal aguarda resposta da contraproposta R$ 1.420.000.",
    },
    cadencia: [
      { dia: 1, titulo: "Visitas (2)", status: "concluido" },
      { dia: 2, titulo: "Envio de proposta", status: "concluido" },
      { dia: 3, titulo: "Negociação contraproposta", status: "atrasado" },
    ],
    qualificacao: {
      perfil: "Casal jovem com bebê",
      tipoImovel: "Apto 3 quartos com lazer",
      regiao: "Charitas",
      orcamento: 1_500_000,
      prazo: "Imediato",
    },
    vinculo: {
      origemComercial: "manual",
      feeAplicavel: false,
      resumoVinculo: "Lead direto via WhatsApp.",
    },
    ultimoCanal: "WhatsApp",
    ultimoResumo: "Contraproposta: R$ 1.420.000 + 36x.",
    alertas: ["Proposta sem retorno há 2 dias"],
  },
};

export const COMISSAO_RATE = 0.03;

export function getLeadOps(id: string): LeadOps {
  if (leadOps[id]) return leadOps[id];
  // Fallback derivado para leads sem ops detalhada
  return {
    etapa: "Novo",
    temperatura: "frio",
    proximaAcao: {
      tipo: "follow-up",
      label: "Definir próxima ação",
      prazo: "Sem prazo",
      status: "proximo",
    },
    cadencia: [{ dia: 1, titulo: "Definir cadência inicial", status: "pendente" }],
    vinculo: { origemComercial: "manual" },
  };
}

export const leads: Lead[] = [
  {
    id: "L-1042",
    nome: "João Mendes",
    email: "joao.mendes@gmail.com",
    telefone: "+55 21 98841-2233",
    origem: "Instagram",
    interesse:
      "João, casado, 3 filhos, trabalha em home office, busca casa com área externa, próximo a escola, orçamento de R$ 1.000.000.",
    status: "Qualificado",
    ultimaInteracao: "há 2h",
    orcamento: 1_000_000,
    historico: [
      { data: "Hoje, 09:14", tipo: "WhatsApp", texto: "Pediu fotos da varanda do imóvel em Icaraí." },
      { data: "Ontem, 18:02", tipo: "Visita", texto: "Visita confirmada para sábado às 10h." },
      { data: "Seg, 14:20", tipo: "IA", texto: "Lead qualificado pela assistente. Score 87." },
    ],
  },
  {
    id: "L-1041",
    nome: "Camila Andrade",
    email: "camila.andrade@outlook.com",
    telefone: "+55 21 99102-7766",
    origem: "WhatsApp",
    interesse:
      "Camila, 34, solteira, mudando do ABC paulista. Busca cobertura duplex 2 suítes em Icaraí ou Santa Rosa, vista mar, varanda gourmet, vaga dupla. Até R$ 1.6mi.",
    status: "Visita",
    ultimaInteracao: "há 30min",
    orcamento: 1_600_000,
    historico: [
      { data: "Hoje, 11:30", tipo: "WhatsApp", texto: "Confirmou visita à cobertura do Edifício Marine." },
      { data: "Hoje, 09:01", tipo: "E-mail", texto: "Enviado dossiê com 3 opções." },
    ],
  },
  {
    id: "L-1040",
    nome: "Roberto e Lúcia Tavares",
    email: "rtavares@gmail.com",
    telefone: "+55 21 99887-1010",
    origem: "Indicação",
    origemDetalhe: "Indicação de Aldemar (Homesphere)",
    interesse:
      "Casal aposentado vindendo apartamento no Flamengo. Querem casa térrea em condomínio fechado em Itaipu, 3 dorm, jardim, perto de mercado. R$ 1.2mi.",
    status: "Proposta",
    ultimaInteracao: "ontem",
    orcamento: 1_200_000,
    historico: [
      { data: "Ontem, 17:48", tipo: "Proposta", texto: "Proposta enviada: R$ 1.150.000 com financiamento Caixa." },
      { data: "Ontem, 10:15", tipo: "Visita", texto: "Segunda visita realizada com a filha." },
    ],
  },
  {
    id: "L-1039",
    nome: "Felipe Goulart",
    email: "felipe.g@startup.io",
    telefone: "+55 21 98220-4321",
    origem: "Marketplace",
    interesse:
      "CTO de startup em São Paulo, mudando para o Rio. Busca apartamento alto padrão em Icaraí, 2 suítes, home office, academia no prédio. Até R$ 1.4mi.",
    status: "Novo",
    ultimaInteracao: "há 4h",
    orcamento: 1_400_000,
    historico: [{ data: "Hoje, 08:12", tipo: "Marketplace", texto: "Lead capturado via PilarHomes-like portal." }],
  },
  {
    id: "L-1038",
    nome: "Ana Beatriz Souza",
    email: "ana.souza@uol.com.br",
    telefone: "+55 21 97744-2299",
    origem: "Outro",
    origemDetalhe: "Evento Casa Cor 2025",
    interesse:
      "Arquiteta, 41 anos. Busca apartamento para reformar no Ingá, pé direito alto, prédio antigo charmoso. Até R$ 950k.",
    status: "Qualificado",
    ultimaInteracao: "há 1d",
    orcamento: 950_000,
    historico: [
      { data: "Ontem, 19:30", tipo: "Ligação", texto: "Conversa de 22min sobre prédios dos anos 60 no Ingá." },
    ],
  },
  {
    id: "L-1037",
    nome: "Marcelo Pinheiro",
    email: "marcelo.p@empresa.com",
    telefone: "+55 21 99001-4488",
    origem: "Instagram",
    interesse: "Investidor. Quer 2 unidades para locação por temporada em Itacoatiara. R$ 600k cada.",
    status: "Novo",
    ultimaInteracao: "há 6h",
    orcamento: 1_200_000,
    historico: [{ data: "Hoje, 06:44", tipo: "DM Instagram", texto: "Pediu rentabilidade média da região." }],
  },
  {
    id: "L-1036",
    nome: "Patrícia Lemos",
    email: "patricia.lemos@gmail.com",
    telefone: "+55 21 98155-7733",
    origem: "WhatsApp",
    interesse:
      "Médica, 38, divorciada, 2 filhos pequenos. Quer apartamento 3 quartos em São Francisco, perto da escola Pentágono. Até R$ 1.1mi.",
    status: "Qualificado",
    ultimaInteracao: "há 3h",
    orcamento: 1_100_000,
    historico: [
      { data: "Hoje, 10:02", tipo: "IA", texto: "Lead qualificado pela assistente. Score 79." },
    ],
  },
  {
    id: "L-1035",
    nome: "Eduardo Bastos",
    email: "edu.bastos@advogados.com.br",
    telefone: "+55 21 99654-1144",
    origem: "Indicação",
    origemDetalhe: "Indicação de cliente antigo (Sra. Marlene)",
    interesse:
      "Sócio de escritório de advocacia. Quer sala comercial no Centro Empresarial Niterói, 80m². Até R$ 850k.",
    status: "Visita",
    ultimaInteracao: "há 5h",
    orcamento: 850_000,
    historico: [
      { data: "Hoje, 09:40", tipo: "Visita", texto: "Visita à sala 1208 marcada para amanhã 14h." },
    ],
  },
  {
    id: "L-1034",
    nome: "Renata Couto",
    email: "renata.couto@gmail.com",
    telefone: "+55 21 98800-6655",
    origem: "Marketplace",
    interesse:
      "Recém-casada, sem filhos. Busca primeiro imóvel, 1 ou 2 quartos em Santa Rosa ou Vital Brazil. R$ 550k.",
    status: "Novo",
    ultimaInteracao: "há 8h",
    orcamento: 550_000,
    historico: [{ data: "Hoje, 04:21", tipo: "Marketplace", texto: "Lead novo capturado." }],
  },
  {
    id: "L-1033",
    nome: "Gustavo e Helena",
    email: "gustavo.helena@gmail.com",
    telefone: "+55 21 99332-8821",
    origem: "WhatsApp",
    interesse: "Casal jovem com bebê. Apartamento 3 quartos com lazer completo em Charitas. R$ 1.5mi.",
    status: "Proposta",
    ultimaInteracao: "ontem",
    orcamento: 1_500_000,
    historico: [
      { data: "Ontem, 16:00", tipo: "Proposta", texto: "Contraproposta: R$ 1.420.000 + 36x." },
    ],
  },
  {
    id: "L-1032",
    nome: "Bruno Tavares",
    email: "bruno.t@hotmail.com",
    telefone: "+55 21 98777-0011",
    origem: "Instagram",
    interesse: "Engenheiro, 29. Apto 1 quarto Icaraí até R$ 480k.",
    status: "Perdido",
    ultimaInteracao: "há 5d",
    orcamento: 480_000,
    historico: [{ data: "Quinta", tipo: "Nota", texto: "Fechou com outro corretor — apto na Av. Roberto Silveira." }],
  },
  {
    id: "L-1031",
    nome: "Família Okamura",
    email: "okamura.fam@gmail.com",
    telefone: "+55 21 99114-5532",
    origem: "Indicação",
    origemDetalhe: "Indicação de Denise (Denise no Jardins)",
    interesse:
      "Família vinda de São Paulo. Casa em Camboinhas, 4 suítes, piscina, perto da praia. Até R$ 3.5mi.",
    status: "Visita",
    ultimaInteracao: "há 1d",
    orcamento: 3_500_000,
    historico: [
      { data: "Ontem", tipo: "Visita", texto: "Visita à Casa Camboinhas Beach realizada — bem impressionados." },
    ],
  },
  {
    id: "L-1030",
    nome: "Larissa Moura",
    email: "larissa.moura@gmail.com",
    telefone: "+55 21 98442-9911",
    origem: "WhatsApp",
    interesse: "Mãe solo, 2 filhas. Apartamento 3 quartos Pendotiba, condomínio com playground. R$ 720k.",
    status: "Qualificado",
    ultimaInteracao: "há 2d",
    orcamento: 720_000,
    historico: [{ data: "Anteontem", tipo: "IA", texto: "Qualificada pela IA. Pediu visita." }],
  },
  {
    id: "L-1029",
    nome: "Dr. Carlos Andrade",
    email: "carlos.andrade@hospital.com",
    telefone: "+55 21 99001-3344",
    origem: "Indicação",
    origemDetalhe: "Indicação de Alessandra Freixo",
    interesse: "Cardiologista. Cobertura no Jardim Icaraí, 4 suítes, vista mar. R$ 4.2mi.",
    status: "Proposta",
    ultimaInteracao: "há 6h",
    orcamento: 4_200_000,
    historico: [
      { data: "Hoje, 10:20", tipo: "Proposta", texto: "Proposta enviada R$ 4.000.000 à vista." },
    ],
  },
  {
    id: "L-1028",
    nome: "Vanessa Ribeiro",
    email: "vanessa.r@gmail.com",
    telefone: "+55 21 98521-7766",
    origem: "Instagram",
    interesse: "Designer de interiores. Busca loft no Centro Histórico para morar e atender clientes. R$ 690k.",
    status: "Novo",
    ultimaInteracao: "há 9h",
    orcamento: 690_000,
    historico: [{ data: "Hoje, 02:44", tipo: "DM Instagram", texto: "Curtiu 4 publicações e enviou mensagem." }],
  },
  {
    id: "L-1027",
    nome: "Sr. Aristides Coelho",
    email: "ari.coelho@gmail.com",
    telefone: "+55 21 99887-2200",
    origem: "Outro",
    origemDetalhe: "Conhecido do clube",
    interesse: "Aposentado, viúvo. Quer trocar casa em Itaipu por apartamento térreo Icaraí. R$ 900k.",
    status: "Qualificado",
    ultimaInteracao: "há 3d",
    orcamento: 900_000,
    historico: [{ data: "3 dias", tipo: "Ligação", texto: "Conversa sobre permuta + diferença em dinheiro." }],
  },
  {
    id: "L-1026",
    nome: "Tatiana Reis",
    email: "tati.reis@gmail.com",
    telefone: "+55 21 98112-4499",
    origem: "Marketplace",
    interesse: "Quer apartamento 2 quartos no Ingá com elevador e portaria 24h. R$ 620k.",
    status: "Novo",
    ultimaInteracao: "há 11h",
    orcamento: 620_000,
    historico: [{ data: "Madrugada", tipo: "Marketplace", texto: "Lead novo." }],
  },
  {
    id: "L-1025",
    nome: "Família Castilho",
    email: "castilho.fam@gmail.com",
    telefone: "+55 21 99443-1100",
    origem: "Indicação",
    origemDetalhe: "Indicação de Aldemar e Thiago",
    interesse: "Casa com 4 quartos em Piratininga, projeto contemporâneo. R$ 2.8mi.",
    status: "Visita",
    ultimaInteracao: "há 1d",
    orcamento: 2_800_000,
    historico: [{ data: "Ontem", tipo: "Visita", texto: "Visita à Casa Piratininga Sul agendada." }],
  },
  {
    id: "L-1024",
    nome: "Igor Mascarenhas",
    email: "igor.m@empresa.com",
    telefone: "+55 21 98220-7733",
    origem: "WhatsApp",
    interesse: "Médico recém-formado. Studio em São Francisco até R$ 380k.",
    status: "Fechado",
    ultimaInteracao: "há 8d",
    orcamento: 380_000,
    historico: [{ data: "Semana passada", tipo: "Fechamento", texto: "Contrato assinado. Comissão R$ 11.400." }],
  },
  {
    id: "L-1023",
    nome: "Sofia Caldas",
    email: "sofia.caldas@gmail.com",
    telefone: "+55 21 99332-1166",
    origem: "Instagram",
    interesse: "Família, 2 filhos pequenos. Cobertura linear em Icaraí com playground privativo. R$ 2.1mi.",
    status: "Fechado",
    ultimaInteracao: "há 12d",
    orcamento: 2_100_000,
    historico: [{ data: "12 dias", tipo: "Fechamento", texto: "Venda concluída. Comissão R$ 84.600." }],
  },
  {
    id: "L-1022",
    nome: "Thiago Bernardes",
    email: "thiago.b@gmail.com",
    telefone: "+55 21 98744-3322",
    origem: "Marketplace",
    interesse: "Solteiro, 31. Apartamento 1 quarto reformado em Icaraí até R$ 520k.",
    status: "Qualificado",
    ultimaInteracao: "há 1d",
    orcamento: 520_000,
    historico: [{ data: "Ontem", tipo: "IA", texto: "Qualificado pela IA. Score 82." }],
  },
];

export type Property = {
  id: string;
  nome: string;
  endereco: string;
  bairro: string;
  cidade: string;
  valor: number;
  quartos: number;
  suites: number;
  vagas: number;
  area: number;
  descricao: string;
  destaque?: boolean;
  marketplace: boolean;
  foto: string;
  brokerId?: string;
};

export const properties: Property[] = [
  {
    id: "IM-001",
    nome: "Apartamento 3 quartos em Icaraí",
    endereco: "Rua Tavares de Macedo, 421",
    bairro: "Icaraí",
    cidade: "Niterói",
    valor: 850_000,
    quartos: 3,
    suites: 1,
    vagas: 2,
    area: 110,
    descricao:
      "Imóvel reformado, varanda ampla com sol da manhã, cozinha americana com ilha de quartzo, próximo ao Campo de São Bento. Ideal para famílias.",
    destaque: true,
    marketplace: true,
    foto: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80",
  },
  {
    id: "IM-002",
    nome: "Cobertura duplex no Jardim Icaraí",
    endereco: "Rua Miguel de Frias, 188",
    bairro: "Jardim Icaraí",
    cidade: "Niterói",
    valor: 2_350_000,
    quartos: 4,
    suites: 3,
    vagas: 3,
    area: 240,
    descricao:
      "Cobertura linear com piscina privativa, vista mar 270°, sala em três ambientes, churrasqueira e sauna. Andar único no edifício, alto padrão construtivo.",
    destaque: true,
    marketplace: true,
    foto: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80",
  },
  {
    id: "IM-003",
    nome: "Casa em condomínio em Itaipu",
    endereco: "Estrada Frei Orlando, 920",
    bairro: "Itaipu",
    cidade: "Niterói",
    valor: 1_180_000,
    quartos: 3,
    suites: 1,
    vagas: 2,
    area: 180,
    descricao:
      "Térrea, jardim com piscina aquecida, projeto de paisagismo do escritório Burle Marx Associados. Condomínio com segurança 24h e clube social.",
    marketplace: true,
    foto: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80",
  },
  {
    id: "IM-004",
    nome: "Apartamento 2 suítes em Charitas",
    endereco: "Av. Quintino Bocaiúva, 511",
    bairro: "Charitas",
    cidade: "Niterói",
    valor: 1_490_000,
    quartos: 2,
    suites: 2,
    vagas: 2,
    area: 132,
    descricao:
      "Frente para o mar, sala com living de 9m, varanda gourmet integrada, lazer completo com spa, piscina coberta e marina.",
    marketplace: true,
    foto: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80",
  },
  {
    id: "IM-005",
    nome: "Loft no Centro Histórico",
    endereco: "Rua da Conceição, 76",
    bairro: "Centro",
    cidade: "Niterói",
    valor: 690_000,
    quartos: 1,
    suites: 1,
    vagas: 1,
    area: 78,
    descricao:
      "Pé direito de 4,2m, fachada tombada, mezanino para escritório. Excelente para profissionais criativos.",
    marketplace: false,
    foto: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200&q=80",
  },
  {
    id: "IM-006",
    nome: "Casa de praia em Camboinhas",
    endereco: "Rua Tetiaroa, 14",
    bairro: "Camboinhas",
    cidade: "Niterói",
    valor: 3_450_000,
    quartos: 4,
    suites: 4,
    vagas: 4,
    area: 410,
    descricao:
      "300m da praia, projeto contemporâneo, piscina infinita, espelho d'água na entrada, automação completa, painel solar.",
    destaque: true,
    marketplace: true,
    foto: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80",
  },
  {
    id: "IM-007",
    nome: "Studio reformado em São Francisco",
    endereco: "Rua General Rondon, 355",
    bairro: "São Francisco",
    cidade: "Niterói",
    valor: 380_000,
    quartos: 1,
    suites: 0,
    vagas: 1,
    area: 38,
    descricao:
      "Reforma com acabamento porcelanato 90x90, marcenaria sob medida, cozinha integrada. Pronto para morar ou rentabilizar.",
    marketplace: true,
    foto: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80",
  },
  {
    id: "IM-008",
    nome: "Sala comercial no Centro Empresarial",
    endereco: "Av. Marquês de Paraná, 200",
    bairro: "Centro",
    cidade: "Niterói",
    valor: 820_000,
    quartos: 0,
    suites: 0,
    vagas: 2,
    area: 80,
    descricao:
      "Sala com vista panorâmica, ar central, infraestrutura para 12 estações, copa privativa, andar com auditório compartilhado.",
    marketplace: false,
    foto: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
  },
  {
    id: "IM-009",
    nome: "Apartamento 3 quartos em Pendotiba",
    endereco: "Estrada Caetano Monteiro, 880",
    bairro: "Pendotiba",
    cidade: "Niterói",
    valor: 720_000,
    quartos: 3,
    suites: 1,
    vagas: 2,
    area: 98,
    descricao:
      "Condomínio clube com playground, brinquedoteca, piscinas adulto e infantil. Próximo a colégios bilíngues.",
    marketplace: true,
    foto: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80",
  },
  {
    id: "IM-010",
    nome: "Apartamento charme no Ingá",
    endereco: "Rua Presidente Backer, 102",
    bairro: "Ingá",
    cidade: "Niterói",
    valor: 950_000,
    quartos: 3,
    suites: 1,
    vagas: 1,
    area: 145,
    descricao:
      "Edifício dos anos 60 totalmente revitalizado, pé direito alto, taco de peroba original, ideal para reforma autoral.",
    marketplace: true,
    foto: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
  },
  {
    id: "IM-011",
    nome: "Cobertura no Marine Building",
    endereco: "Rua Gavião Peixoto, 340",
    bairro: "Icaraí",
    cidade: "Niterói",
    valor: 1_590_000,
    quartos: 2,
    suites: 2,
    vagas: 2,
    area: 168,
    descricao:
      "Duplex com terraço gourmet, vista mar, hidromassagem privativa, dois andares com escada flutuante.",
    marketplace: true,
    foto: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
  },
  {
    id: "IM-012",
    nome: "Casa contemporânea em Piratininga",
    endereco: "Rua Belmiro Marin, 55",
    bairro: "Piratininga",
    cidade: "Niterói",
    valor: 2_790_000,
    quartos: 4,
    suites: 3,
    vagas: 4,
    area: 360,
    descricao:
      "Projeto contemporâneo com áreas integradas, piscina raia de 18m, cinema privativo, espaço fitness, automação Crestron.",
    marketplace: true,
    foto: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
  },
];

export type Broker = {
  id: string;
  nome: string;
  agencia: string;
  regiao: string;
  especialidade: string;
  imoveis: number;
  compatibilidade: "Alta" | "Média" | "Baixa";
  foto: string;
  bio: string;
  inventoryIds: string[];
};

export const brokers: Broker[] = [
  {
    id: "B-01",
    nome: "Alessandra Freixo",
    agencia: "Olhar de Corretora",
    regiao: "Icaraí · Jardim Icaraí",
    especialidade: "Alto padrão · Coberturas",
    imoveis: 28,
    compatibilidade: "Alta",
    foto: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80",
    bio: "12 anos no mercado de alto padrão de Niterói. Especialista em coberturas e imóveis com vista mar. Carteira premium de compradores PJ.",
    inventoryIds: ["IM-002", "IM-011", "IM-006"],
  },
  {
    id: "B-02",
    nome: "Aldemar e Thiago",
    agencia: "Homesphere",
    regiao: "Niterói · Maricá",
    especialidade: "Casas em condomínio fechado",
    imoveis: 41,
    compatibilidade: "Alta",
    foto: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80",
    bio: "Dupla com 15 anos juntos. Atuam de Itacoatiara a Maricá com casas em condomínios e terrenos.",
    inventoryIds: ["IM-003", "IM-006", "IM-012"],
  },
  {
    id: "B-03",
    nome: "Denise Molinaro",
    agencia: "Denise no Jardins",
    regiao: "São Paulo · Jardins",
    especialidade: "Apartamentos premium SP",
    imoveis: 62,
    compatibilidade: "Média",
    foto: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80",
    bio: "Forte em transferência SP→RJ. Indica clientes mudando para o Rio com perfil acima de R$ 2mi.",
    inventoryIds: ["IM-004", "IM-002"],
  },
  {
    id: "B-04",
    nome: "Marcos Botelho",
    agencia: "Botelho Imóveis",
    regiao: "São Francisco · Charitas",
    especialidade: "Imóveis pé na areia",
    imoveis: 19,
    compatibilidade: "Alta",
    foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    bio: "Boutique focada em imóveis frente-mar. Atendimento concierge.",
    inventoryIds: ["IM-004", "IM-011"],
  },
  {
    id: "B-05",
    nome: "Juliana Marques",
    agencia: "JM Negócios",
    regiao: "Pendotiba · Itaipu",
    especialidade: "Condomínios com lazer",
    imoveis: 33,
    compatibilidade: "Média",
    foto: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80",
    bio: "Especialista em famílias com crianças, conhece todos os condomínios da região oceânica.",
    inventoryIds: ["IM-009", "IM-003"],
  },
  {
    id: "B-06",
    nome: "Ricardo Pacheco",
    agencia: "Pacheco Comercial",
    regiao: "Centro · São Domingos",
    especialidade: "Salas e prédios comerciais",
    imoveis: 22,
    compatibilidade: "Baixa",
    foto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
    bio: "Único corretor 100% comercial em Niterói. Carteira de inquilinos PJ.",
    inventoryIds: ["IM-008", "IM-005"],
  },
  {
    id: "B-07",
    nome: "Patrícia Caldeira",
    agencia: "Caldeira Boutique",
    regiao: "Ingá · Centro Histórico",
    especialidade: "Imóveis de charme",
    imoveis: 14,
    compatibilidade: "Alta",
    foto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80",
    bio: "Curadoria de imóveis antigos com história. Atende arquitetos e designers.",
    inventoryIds: ["IM-010", "IM-005"],
  },
  {
    id: "B-08",
    nome: "Henrique Lopes",
    agencia: "Lopes & Filhos",
    regiao: "Curitiba · Batel",
    especialidade: "Alto padrão Curitiba",
    imoveis: 47,
    compatibilidade: "Média",
    foto: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80",
    bio: "Parceria estratégica para indicações cross-cidade.",
    inventoryIds: ["IM-002"],
  },
];

export type ActivityItem = {
  id: string;
  data: string;
  hora: string;
  tipo: "Ligação" | "Visita" | "Follow-up" | "E-mail" | "Reunião";
  cliente: string;
  imovel?: string;
  nota: string;
};

export const atividades: ActivityItem[] = [
  { id: "A-01", data: "Hoje", hora: "09:30", tipo: "Ligação", cliente: "Camila Andrade", nota: "Confirmar visita de sábado." },
  { id: "A-02", data: "Hoje", hora: "11:00", tipo: "Visita", cliente: "Família Castilho", imovel: "Casa contemporânea em Piratininga", nota: "Acompanhar arquiteta da família." },
  { id: "A-03", data: "Hoje", hora: "14:00", tipo: "Reunião", cliente: "Aldemar (Homesphere)", nota: "Alinhamento de comissão sobre Casa Camboinhas." },
  { id: "A-04", data: "Hoje", hora: "16:30", tipo: "Follow-up", cliente: "Felipe Goulart", nota: "Enviar 3 opções por e-mail e marcar visita virtual." },
  { id: "A-05", data: "Amanhã", hora: "10:00", tipo: "Visita", cliente: "Eduardo Bastos", imovel: "Sala comercial no Centro Empresarial", nota: "Levar planta da sala 1208." },
  { id: "A-06", data: "Amanhã", hora: "15:00", tipo: "Ligação", cliente: "Patrícia Lemos", nota: "Apresentar 2 opções em São Francisco." },
  { id: "A-07", data: "Sex 28", hora: "11:30", tipo: "Visita", cliente: "Família Okamura", imovel: "Casa de praia em Camboinhas", nota: "Segunda visita com pais dos compradores." },
  { id: "A-08", data: "Sex 28", hora: "17:00", tipo: "E-mail", cliente: "Dr. Carlos Andrade", nota: "Enviar proposta revisada com condições à vista." },
];

export const aiConversations = [
  {
    id: "AI-1",
    leadName: "Felipe Goulart",
    canal: "Marketplace",
    status: "Qualificando",
    score: 64,
    mensagens: [
      { from: "lead", text: "Oi, vi um anúncio de apartamento 2 suítes em Icaraí." },
      { from: "ai", text: "Olá Felipe! Sou a assistente virtual do Ramon. Posso te ajudar a encontrar o imóvel ideal — você está pensando em mudança em quanto tempo?" },
      { from: "lead", text: "Próximos 60 dias. Estou vindo de SP." },
      { from: "ai", text: "Perfeito. Para acelerar, você prefere prédio com academia e coworking?" },
      { from: "lead", text: "Sim, e home office é essencial." },
      { from: "ai", text: "Anotado. Qual o ticket que você está considerando?" },
      { from: "lead", text: "Até 1.4mi." },
      { from: "ai", text: "Ótimo. Tenho 3 opções alinhadas. Posso pedir ao Ramon para te mandar agora?" },
    ],
    extracted: {
      Orçamento: "R$ 1.400.000",
      Região: "Icaraí",
      Prazo: "60 dias",
      "Perfil familiar": "Solteiro, home office",
      Diferenciais: "Academia, coworking",
    },
  },
  {
    id: "AI-2",
    leadName: "Renata Couto",
    canal: "WhatsApp",
    status: "Qualificado ✓",
    score: 88,
    mensagens: [
      { from: "lead", text: "Quero ver opções de 2 quartos em Santa Rosa" },
      { from: "ai", text: "Oi Renata! Para refinar: você pretende financiar ou comprar à vista?" },
      { from: "lead", text: "Financiar 80%. Tenho 110k de entrada." },
      { from: "ai", text: "Anotado. É seu primeiro imóvel?" },
      { from: "lead", text: "Sim!" },
      { from: "ai", text: "Você se beneficia do Minha Casa Minha Vida ampliado. Posso reservar 3 visitas para sábado?" },
      { from: "lead", text: "Pode sim, manhã se possível." },
      { from: "ai", text: "Marquei sábado 10h, 11h e 12h. O Ramon vai confirmar com você ainda hoje 👋" },
    ],
    extracted: {
      Orçamento: "R$ 550.000",
      Entrada: "R$ 110.000",
      "Primeiro imóvel": "Sim",
      Região: "Santa Rosa / Vital Brazil",
      Visitas: "Sábado, 3 imóveis",
    },
  },
  {
    id: "AI-3",
    leadName: "Marcelo Pinheiro",
    canal: "Instagram",
    status: "Em conversa",
    score: 51,
    mensagens: [
      { from: "lead", text: "Quanto rende um imóvel de temporada em Itacoatiara?" },
      { from: "ai", text: "Boa pergunta Marcelo! A média da região em 2025 está em 0,9% a 1,1% ao mês líquido. Posso te mandar um relatório?" },
      { from: "lead", text: "Manda sim" },
    ],
    extracted: {
      Interesse: "Investimento temporada",
      Região: "Itacoatiara",
      "Ticket alvo": "R$ 600k x 2",
    },
  },
];

export const inboxConversations = [
  {
    id: "C-1",
    canal: "WhatsApp" as const,
    nome: "Camila Andrade",
    leadId: "L-1041",
    ultimaMsg: "Confirmo a visita sábado 10h ✨",
    hora: "11:32",
    naoLidas: 0,
    online: true,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    mensagens: [
      { from: "you" as const, text: "Camila, confirmando: visita sábado às 10h, encontro na portaria do Marine.", hora: "10:14" },
      { from: "them" as const, text: "Confirmo a visita sábado 10h ✨", hora: "11:32" },
    ],
  },
  {
    id: "C-2",
    canal: "WhatsApp" as const,
    nome: "João Mendes",
    leadId: "L-1042",
    ultimaMsg: "Tem fotos da varanda?",
    hora: "09:14",
    naoLidas: 2,
    online: true,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    mensagens: [
      { from: "them" as const, text: "Bom dia Ramon!", hora: "09:13" },
      { from: "them" as const, text: "Tem fotos da varanda?", hora: "09:14" },
    ],
  },
  {
    id: "C-3",
    canal: "Instagram" as const,
    nome: "Vanessa Ribeiro",
    leadId: "L-1028",
    ultimaMsg: "Adorei o loft do Centro 🤍",
    hora: "Ontem",
    naoLidas: 1,
    online: false,
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
    mensagens: [
      { from: "them" as const, text: "Adorei o loft do Centro 🤍", hora: "Ontem 21:04" },
    ],
  },
  {
    id: "C-4",
    canal: "Marketplace" as const,
    nome: "Felipe Goulart",
    leadId: "L-1039",
    ultimaMsg: "[IA] Posso pedir ao Ramon para te mandar agora?",
    hora: "08:12",
    naoLidas: 0,
    online: false,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
    mensagens: [
      { from: "them" as const, text: "Vi o anúncio do 2 suítes em Icaraí.", hora: "08:10" },
      { from: "you" as const, text: "[IA] Olá Felipe! Sou a assistente virtual do Ramon...", hora: "08:11" },
    ],
  },
  {
    id: "C-5",
    canal: "WhatsApp" as const,
    nome: "Roberto Tavares",
    leadId: "L-1040",
    ultimaMsg: "Vou conversar com a Lúcia hoje à noite",
    hora: "Ontem",
    naoLidas: 0,
    online: false,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
    mensagens: [
      { from: "you" as const, text: "Roberto, segue proposta R$ 1.150.000 com Caixa.", hora: "17:48" },
      { from: "them" as const, text: "Vou conversar com a Lúcia hoje à noite", hora: "18:02" },
    ],
  },
];

export const earnings = {
  total: 96_480,
  comissao: 96_000,
  saas: 480,
  transactions: [
    { id: "T-01", data: "20 out 2025", tipo: "Comissão", descricao: "Venda Cobertura Linear · Sofia Caldas", valor: 84_600 },
    { id: "T-02", data: "12 out 2025", tipo: "Comissão", descricao: "Venda Studio São Francisco · Igor Mascarenhas", valor: 11_400 },
    { id: "T-03", data: "01 out 2025", tipo: "SaaS", descricao: "Recorrência indicação · Joana M.", valor: 120 },
    { id: "T-04", data: "01 out 2025", tipo: "SaaS", descricao: "Recorrência indicação · Pedro V.", valor: 120 },
    { id: "T-05", data: "01 out 2025", tipo: "SaaS", descricao: "Recorrência indicação · Carla F.", valor: 120 },
    { id: "T-06", data: "01 out 2025", tipo: "SaaS", descricao: "Recorrência indicação · Tiago S.", valor: 120 },
  ],
};

export const referrals = {
  link: "ubroker.com.br/r/ramon-capone",
  ativos: [
    { nome: "Joana Maciel", agencia: "Maciel Imóveis", plano: "Pro", mrr: 120, status: "Ativo" },
    { nome: "Pedro Verissimo", agencia: "Verissimo & Co.", plano: "Pro", mrr: 120, status: "Ativo" },
    { nome: "Carla Fontes", agencia: "Fontes Boutique", plano: "Pro", mrr: 120, status: "Ativo" },
    { nome: "Tiago Sá", agencia: "TS Negócios", plano: "Pro", mrr: 120, status: "Ativo" },
  ],
};

export const pipelineStages = [
  { id: "Novo", count: 6, color: "bg-slate-200 text-slate-800" },
  { id: "Qualificado", count: 5, color: "bg-blue-100 text-blue-800" },
  { id: "Visita", count: 4, color: "bg-amber-100 text-amber-800" },
  { id: "Proposta", count: 3, color: "bg-violet-100 text-violet-800" },
  { id: "Fechado", count: 2, color: "bg-emerald-100 text-emerald-800" },
] as const;

export const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const formatBRLcompact = (n: number) => {
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}mi`;
  if (n >= 1_000) return `R$ ${(n / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}k`;
  return formatBRL(n);
};
