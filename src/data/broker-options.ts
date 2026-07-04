// Taxonomia do perfil profissional do corretor — usada no cadastro,
// no perfil e (futuramente) no matching/distribuição de leads.

export const ESPECIALIDADES = [
  "Coberturas",
  "Casas em condomínio",
  "Alto padrão",
  "Apartamentos compactos",
  "Lançamentos",
  "Pé na areia",
];

export const TIPOS_IMOVEL = ["Residencial", "Comercial", "Terreno", "Lançamentos", "Temporada"];

export const PERFIS_CLIENTE = ["Família", "Investidor", "Primeira compra", "Mudança interestadual"];

export const TICKETS = [
  "Até R$ 500k",
  "R$ 500k – R$ 1M",
  "R$ 1M – R$ 3M",
  "R$ 3M – R$ 10M",
  "Acima de R$ 10M",
];

export const DISPONIBILIDADES = [
  { value: "integral", label: "Integral — atendo em horário comercial e além" },
  { value: "parcial", label: "Parcial — concilio com outras atividades" },
  { value: "fins-de-semana", label: "Fins de semana e plantões" },
];

export const CANAIS = [
  { id: "whatsapp", label: "WhatsApp", description: "Canal principal de atendimento e Inbox" },
  { id: "instagram", label: "Instagram", description: "Direct integrado ao Inbox" },
  { id: "email", label: "E-mail", description: "Conversas por e-mail centralizadas" },
] as const;

export type CanalId = (typeof CANAIS)[number]["id"];
