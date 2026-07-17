import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { useMemo, useState } from "react";
import {
  Calendar,
  ClipboardCheck,
  Filter,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Send,
  Wallet,
  X,
  ArrowRight,
  Copy,
  Sparkles,
  User as UserIcon,
  Search as SearchIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Flame,
  Activity,
  Bot,
  Zap,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { formatBRL } from "@/lib/format";
import { useSession } from "@/lib/auth";
import {
  useLeads,
  createLead,
  updateLeadStatus,
  addLeadEvent,
  nextLeadStatus,
  LEAD_ORIGINS,
  type Lead,
  type LeadOrigin,
  type LeadStatus,
} from "@/lib/leads";
import { ESTADOS_BR } from "@/lib/estados";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/app/leads")({
  component: LeadsPage,
});

const statusColor: Record<LeadStatus, string> = {
  Novo: "bg-slate-100 text-slate-700",
  Qualificado: "bg-blue-50 text-blue-700",
  Visita: "bg-orange-50 text-orange-800",
  Proposta: "bg-violet-50 text-violet-800",
  Fechado: "bg-emerald-50 text-emerald-800",
  Perdido: "bg-red-50 text-red-700",
};

type Prioridade = "quente" | "morno" | "frio" | "neutro";

function getPrioridade(status: LeadStatus): Prioridade {
  if (status === "Proposta" || status === "Visita" || status === "Fechado") return "quente";
  if (status === "Qualificado") return "morno";
  if (status === "Novo") return "frio";
  return "neutro";
}

const COMISSAO_RATE = 0.03;
function getComissao(orcamento: number) {
  return orcamento * COMISSAO_RATE;
}

function isOrigemQualificada(origem: LeadOrigin) {
  return origem === "Indicação" || origem === "Marketplace";
}

const TIPOS = ["cobertura", "casa", "apartamento", "studio", "loft", "sala", "terreno"];
// Heurística de fallback: usada apenas para inferir a localização de leads antigos
// que não têm os campos estruturados estado/cidade. Não alimenta mais o filtro.
const REGIOES = [
  "Icaraí",
  "Santa Rosa",
  "São Francisco",
  "Charitas",
  "Ingá",
  "Itacoatiara",
  "Camboinhas",
  "Niterói",
];

function inferTipo(interesse: string) {
  const low = interesse.toLowerCase();
  const hit = TIPOS.find((t) => low.includes(t));
  if (!hit) return "Imóvel residencial";
  return hit.charAt(0).toUpperCase() + hit.slice(1);
}

function inferRegiao(interesse: string) {
  const hits = REGIOES.filter((r) => interesse.includes(r));
  if (hits.length === 0) return "Não informado";
  return hits.slice(0, 2).join(" · ");
}

/** Localização do lead: prefere os campos reais (cidade/estado); cai na heurística para legados. */
function localidade(l: Lead) {
  if (l.cidade || l.estado) return [l.cidade, l.estado].filter(Boolean).join(" / ");
  return inferRegiao(l.interesse);
}

/** Só a cidade/região (sem UF), para uso em textos/scripts. */
function localidadeCurta(l: Lead) {
  if (l.cidade) return l.cidade;
  if (l.estado) return l.estado;
  return inferRegiao(l.interesse).split(" ")[0];
}

const FILTROS_RAPIDOS = [
  "Todos",
  "Hoje",
  "Atrasados",
  "Sem contato",
  "Quentes",
  "Visitas",
  "Proposta",
  "Perdidos",
] as const;
type FiltroRapido = (typeof FILTROS_RAPIDOS)[number];

function isAtivo(l: Lead) {
  return l.status !== "Fechado" && l.status !== "Perdido";
}
function daysAgo(l: Lead) {
  return Math.floor((Date.now() - new Date(l.lastInteractionAt).getTime()) / 86_400_000);
}
function isAtrasado(l: Lead) {
  return isAtivo(l) && daysAgo(l) >= 2;
}
function isHoje(l: Lead) {
  return daysAgo(l) === 0;
}

type AcaoTipo = "ligar" | "whatsapp" | "visita" | "followup" | "enviar" | "nenhum";
function getProximaAcao(l: Lead): { tipo: AcaoTipo; label: string; icon: React.ReactNode } {
  switch (l.status) {
    case "Novo":
      return { tipo: "ligar", label: "Ligar agora", icon: <Phone className="h-3.5 w-3.5" /> };
    case "Qualificado":
      return {
        tipo: "whatsapp",
        label: "Enviar WhatsApp",
        icon: <MessageCircle className="h-3.5 w-3.5" />,
      };
    case "Visita":
      return {
        tipo: "visita",
        label: "Confirmar visita hoje",
        icon: <Calendar className="h-3.5 w-3.5" />,
      };
    case "Proposta":
      return { tipo: "followup", label: "Fazer follow-up", icon: <Send className="h-3.5 w-3.5" /> };
    default:
      return { tipo: "nenhum", label: "—", icon: null };
  }
}

type Urgencia = "atrasado" | "hoje" | "futuro";
function getUrgencia(l: Lead): Urgencia {
  if (!isAtivo(l)) return "futuro";
  if (isAtrasado(l)) return "atrasado";
  if (isHoje(l) || l.status === "Visita" || l.status === "Proposta") return "hoje";
  return "futuro";
}
function getUrgenciaRank(u: Urgencia) {
  return u === "atrasado" ? 0 : u === "hoje" ? 1 : 2;
}
type Nivel = "alta" | "media" | "baixa";
function getNivel(l: Lead, ctx: { topComissao: number; medianaComissao: number }): Nivel {
  if (!isAtivo(l)) return "baixa";
  const prio = getPrioridade(l.status);
  const urg = getUrgencia(l);
  const com = getComissao(l.orcamento);
  if (urg === "atrasado") return "alta";
  if (prio === "quente" && urg === "hoje") return "alta";
  if (com >= ctx.topComissao) return "alta";
  if (urg === "hoje") return "media";
  if (prio === "morno" && com >= ctx.medianaComissao) return "media";
  return "baixa";
}
function getNivelMeta(n: Nivel) {
  if (n === "alta")
    return {
      label: "Alta prioridade",
      emoji: "🔴",
      chip: "bg-red-50 text-red-700 border border-red-100",
      border: "border-l-red-500",
    };
  if (n === "media")
    return {
      label: "Média prioridade",
      emoji: "🟡",
      chip: "bg-amber-50 text-amber-800 border border-amber-100",
      border: "border-l-amber-400",
    };
  return {
    label: "Baixa prioridade",
    emoji: "⚪",
    chip: "bg-slate-50 text-slate-600 border border-slate-200",
    border: "border-l-transparent",
  };
}
function getNivelRank(n: Nivel) {
  return n === "alta" ? 0 : n === "media" ? 1 : 2;
}
function getReforco(l: Lead): string | null {
  if (!isAtivo(l)) return null;
  if (isAtrasado(l)) return `Sem resposta há ${l.ultimaInteracao}`;
  if (l.status === "Visita" && isHoje(l)) return "Visita hoje — ainda não confirmada";
  if (l.status === "Proposta") return "Proposta enviada — sem retorno";
  if (getPrioridade(l.status) === "quente" && !isHoje(l)) return "Lead quente sem contato";
  return null;
}

function getUrgenciaMeta(u: Urgencia, l: Lead) {
  if (u === "atrasado")
    return {
      label: `Atrasado há ${l.ultimaInteracao}`,
      chip: "bg-red-50 text-red-700 border-red-100",
      dot: "bg-red-500",
      border: "border-l-red-500",
    };
  if (u === "hoje")
    return {
      label: "Fazer hoje",
      chip: "bg-amber-50 text-amber-800 border-amber-100",
      dot: "bg-amber-400",
      border: "border-l-amber-400",
    };
  return {
    label: "Futuro",
    chip: "bg-slate-50 text-slate-600 border-slate-200",
    dot: "bg-slate-300",
    border: "border-l-transparent",
  };
}

function getCanalUltimo(l: Lead): { canal: string; quando: string } {
  const h = l.historico?.[0];
  if (!h) return { canal: "—", quando: l.ultimaInteracao };
  return { canal: h.tipo, quando: l.ultimaInteracao };
}

function getAlertasContexto(l: Lead): string[] {
  const out: string[] = [];
  if (l.status === "Visita" && isHoje(l)) out.push("Visita hoje às 15h");
  if (l.status === "Proposta") out.push("Proposta sem retorno há 2 dias");
  if (isAtrasado(l)) out.push(`Lead sem contato há ${l.ultimaInteracao}`);
  if (l.historico?.some((h) => h.tipo === "IA")) out.push("Lead qualificado pela IA");
  return out;
}

type CadenciaItem = { dia: number; titulo: string; status: "pendente" | "concluido" | "atrasado" };
function getCadenciaPlano(l: Lead): CadenciaItem[] {
  const atrasado = isAtrasado(l);
  const passou = (s: LeadStatus) => {
    const ord: LeadStatus[] = ["Novo", "Qualificado", "Visita", "Proposta", "Fechado"];
    return ord.indexOf(l.status) >= ord.indexOf(s);
  };
  return [
    {
      dia: 1,
      titulo: "Ligação inicial",
      status: passou("Qualificado") ? "concluido" : atrasado ? "atrasado" : "pendente",
    },
    {
      dia: 1,
      titulo: "WhatsApp de apresentação",
      status: passou("Qualificado") ? "concluido" : "pendente",
    },
    {
      dia: 2,
      titulo: "Follow-up",
      status: passou("Visita") ? "concluido" : atrasado ? "atrasado" : "pendente",
    },
    {
      dia: 2,
      titulo: "Envio de imóveis compatíveis",
      status: passou("Visita") ? "concluido" : "pendente",
    },
    { dia: 3, titulo: "Prova social", status: passou("Proposta") ? "concluido" : "pendente" },
    {
      dia: 3,
      titulo: "Nova tentativa de contato",
      status: passou("Proposta") ? "concluido" : "pendente",
    },
  ];
}

const SCRIPTS_LIB = [
  {
    categoria: "Primeiro contato",
    titulo: "Apresentação inicial",
    objetivo: "Quebrar o gelo e marcar conversa",
    texto:
      "Oi {nome}, aqui é o Ramon da Ubroker. Vi seu interesse em {tipo} em {regiao}. Posso te ligar rapidinho pra entender o que você procura?",
  },
  {
    categoria: "Reativação",
    titulo: "Lead frio retorno",
    objetivo: "Trazer de volta lead sem resposta",
    texto:
      "Oi {nome}, tudo bem? Apareceram opções novas que combinam com o que conversamos. Quer dar uma olhada?",
  },
  {
    categoria: "Follow-up",
    titulo: "Follow-up D2",
    objetivo: "Manter cadência e mostrar interesse",
    texto: "{nome}, separei mais 2 imóveis dentro do seu perfil. Quer que eu envie agora?",
  },
  {
    categoria: "Confirmação de visita",
    titulo: "Confirmação 24h antes",
    objetivo: "Reduzir no-show",
    texto: "{nome}, só confirmando nossa visita amanhã. Posso te enviar a localização?",
  },
  {
    categoria: "Pós-visita",
    titulo: "Feedback pós-visita",
    objetivo: "Capturar percepção e avançar etapa",
    texto: "E aí {nome}, o que achou do imóvel? Quero te ajudar a decidir com calma.",
  },
  {
    categoria: "Proposta",
    titulo: "Envio de proposta",
    objetivo: "Apresentar condições e fechar",
    texto: "{nome}, preparei a proposta. Posso te enviar os detalhes agora?",
  },
];

const MOTIVOS_PERDA = [
  "Sem retorno",
  "Sem perfil",
  "Comprou outro imóvel",
  "Sem crédito",
  "Momento errado",
  "Valor acima",
  "Não gostou da região",
  "Outro",
];

const TIPOS_INTERACAO = [
  "Ligação",
  "WhatsApp",
  "Reunião",
  "Visita",
  "Observação",
  "Follow-up",
] as const;

const TEMPLATES_WA = [
  {
    titulo: "Apresentação",
    texto: "Oi {nome}, sou da Ubroker. Vi seu interesse em {tipo} em {regiao}.",
  },
  {
    titulo: "Confirmação visita",
    texto: "{nome}, confirmando nossa visita. Posso te mandar a localização?",
  },
  { titulo: "Follow-up", texto: "{nome}, alguma dúvida sobre o imóvel? Posso te ligar 5 min?" },
  { titulo: "Pós-visita", texto: "{nome}, o que achou do imóvel? Posso preparar uma proposta?" },
];

function hashCode(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function getScoreLead(l: Lead) {
  const base = 60 + (hashCode(l.id) % 30);
  const bonus =
    l.status === "Proposta" ? 10 : l.status === "Visita" ? 7 : l.status === "Qualificado" ? 4 : 0;
  return Math.min(98, base + bonus);
}
function getChanceConversao(l: Lead) {
  const s = getScoreLead(l);
  return Math.min(95, Math.round(s * 0.85));
}
function getEstagioDecisao(l: Lead) {
  if (l.status === "Proposta" || l.status === "Visita") return "Alto";
  if (l.status === "Qualificado") return "Médio";
  return "Baixo";
}
function getTempoMedioResp(l: Lead) {
  return ["8min", "14min", "22min", "31min", "47min"][hashCode(l.id) % 5];
}

type Tone = "good" | "warn" | "danger" | "neutral";
function getScoreTone(score: number): Tone {
  if (score >= 80) return "good";
  if (score >= 50) return "warn";
  return "danger";
}
function getTempoSemInteracao(l: Lead): { label: string; tone: Tone } {
  const d = daysAgo(l);
  const tone: Tone = d === 0 ? "good" : d <= 2 ? "warn" : "danger";
  return { label: l.ultimaInteracao, tone };
}
function getSlaProximaAcao(l: Lead): { label: string; atrasado: boolean; etapa: string } {
  const cad = getCadenciaDetalhada(l);
  const proximo =
    cad.find((c) => c.status === "atrasado") ??
    cad.find((c) => c.status === "hoje") ??
    cad.find((c) => c.status === "pendente");
  if (!proximo) return { label: "Sem SLA", atrasado: false, etapa: "—" };
  const atrasado = proximo.status === "atrasado";
  return {
    label: `${proximo.canal} · ${proximo.sla}`,
    atrasado,
    etapa: `Dia ${proximo.dia} · ${proximo.objetivo}`,
  };
}
function getProgressoCadencia(l: Lead): { feitos: number; total: number; pct: number } {
  const cad = getCadenciaDetalhada(l);
  const feitos = cad.filter((c) => c.status === "concluido").length;
  return { feitos, total: cad.length, pct: Math.round((feitos / cad.length) * 100) };
}
type CanalKind = "whatsapp" | "ligacao" | "visita" | "ia" | "sistema" | "proposta";
function getCanalKind(tipo: string): CanalKind {
  const t = tipo.toLowerCase();
  if (t.includes("whats")) return "whatsapp";
  if (t.includes("liga") || t.includes("telefone")) return "ligacao";
  if (t.includes("visit")) return "visita";
  if (t.includes("ia") || t.includes("bot")) return "ia";
  if (t.includes("propos")) return "proposta";
  return "sistema";
}
const canalDot: Record<CanalKind, string> = {
  whatsapp: "bg-emerald-500",
  ligacao: "bg-amber-500",
  visita: "bg-blue-500",
  ia: "bg-violet-500",
  proposta: "bg-rose-500",
  sistema: "bg-slate-400",
};
const canalBadge: Record<CanalKind, string> = {
  whatsapp: "bg-emerald-50 text-emerald-700 border-emerald-100",
  ligacao: "bg-amber-50 text-amber-800 border-amber-100",
  visita: "bg-blue-50 text-blue-700 border-blue-100",
  ia: "bg-violet-50 text-violet-700 border-violet-100",
  proposta: "bg-rose-50 text-rose-700 border-rose-100",
  sistema: "bg-slate-50 text-slate-600 border-slate-200",
};
function CanalIcon({ kind, className }: { kind: CanalKind; className?: string }) {
  const map: Record<CanalKind, React.ReactElement> = {
    whatsapp: <MessageCircle className={className} />,
    ligacao: <Phone className={className} />,
    visita: <Calendar className={className} />,
    ia: <Sparkles className={className} />,
    proposta: <ClipboardCheck className={className} />,
    sistema: <Activity className={className} />,
  };
  return map[kind];
}
function getMicroContexto(tipo: string, indexFromTop: number): string | null {
  const k = getCanalKind(tipo);
  if (indexFromTop === 0) {
    if (k === "whatsapp") return "Lead respondeu em 12min";
    if (k === "ligacao") return "Conversa de 6min";
    if (k === "ia") return "Score +5";
    if (k === "visita") return "Confirmada";
  }
  if (indexFromTop === 1) return "Follow-up em 1h";
  return null;
}

type StatusOp = { icon: string; label: string; tone: "neutral" | "warn" | "danger" | "good" };
function getStatusOperacional(l: Lead): StatusOp[] {
  const out: StatusOp[] = [];
  const prio = getPrioridade(l.status);
  out.push({
    icon: prio === "quente" ? "🔴" : prio === "morno" ? "🟡" : "🔵",
    label: prio === "quente" ? "Lead quente" : prio === "morno" ? "Lead morno" : "Lead frio",
    tone: prio === "quente" ? "danger" : prio === "morno" ? "warn" : "neutral",
  });
  out.push({ icon: "📈", label: `Score ${getScoreLead(l)}`, tone: "neutral" });
  out.push({
    icon: "⏰",
    label: `${l.ultimaInteracao} sem interação`,
    tone: isAtrasado(l) ? "warn" : "neutral",
  });
  if (isAtrasado(l)) out.push({ icon: "⚠️", label: "Cadência atrasada", tone: "danger" });
  if (l.status === "Visita") out.push({ icon: "📅", label: "Visita amanhã 15h", tone: "good" });
  if (l.status === "Proposta") out.push({ icon: "📄", label: "Proposta em aberto", tone: "warn" });
  return out;
}

function getMotivos(l: Lead): string[] {
  const out: string[] = [];
  if (l.status === "Visita") {
    out.push("Visita marcada para hoje às 15h");
    out.push("Sem confirmação há 18h");
    out.push("Risco médio de no-show");
  } else if (l.status === "Proposta") {
    out.push("Proposta enviada há 2 dias");
    out.push("Sem retorno do cliente");
    out.push("Risco de perda para concorrente");
  } else if (l.status === "Qualificado") {
    out.push("Lead qualificado pela IA");
    out.push("Aguardando envio de imóveis compatíveis");
  } else if (l.status === "Novo") {
    out.push("Lead capturado recentemente");
    out.push("Primeiro contato não realizado");
  }
  if (isAtrasado(l)) out.push(`Sem interação há ${l.ultimaInteracao}`);
  return out.slice(0, 3);
}

type TLItem = { icon: string; label: string; quando: string; tone: "good" | "warn" | "neutral" };
function getTimelineOperacional(l: Lead): TLItem[] {
  const out: TLItem[] = [];
  l.historico.slice(0, 4).forEach((h, i) => {
    out.push({
      icon: h.tipo.includes("WhatsApp")
        ? "💬"
        : h.tipo.includes("Liga")
          ? "📞"
          : h.tipo.includes("Visita")
            ? "📅"
            : h.tipo.includes("IA")
              ? "🧠"
              : "📝",
      label: `${h.tipo} — ${h.texto}`,
      quando: h.data,
      tone: i === 0 ? "good" : "neutral",
    });
  });
  if (isAtrasado(l))
    out.splice(1, 0, {
      icon: "⚠️",
      label: "Sem resposta do cliente",
      quando: `há ${l.ultimaInteracao}`,
      tone: "warn",
    });
  return out;
}

function getAlertasComportamentais(l: Lead): string[] {
  const out: string[] = [];
  if (isAtrasado(l)) out.push("Sem resposta");
  if (getPrioridade(l.status) === "quente" && isAtrasado(l)) out.push("Quente parado");
  if (l.status === "Proposta") out.push("Proposta sem retorno");
  if (l.status === "Visita") out.push("Visita sem confirmação");
  return out;
}

function getSugestaoPosInteracao(tipo: string, l: Lead): string {
  if (tipo.includes("Liga"))
    return `Enviar imóveis compatíveis em ${localidadeCurta(l)} até o fim do dia.`;
  if (tipo.includes("WhatsApp")) return "Aguardar resposta por 4h e fazer follow-up se necessário.";
  if (tipo.includes("Visita")) return "Registrar feedback pós-visita e avançar para proposta.";
  if (tipo.includes("IA")) return "Confirmar qualificação por ligação e marcar visita.";
  return "Agendar próxima ação na cadência.";
}

type CadenciaDet = {
  dia: number;
  titulo: string;
  canal: string;
  objetivo: string;
  sla: string;
  status: "pendente" | "concluido" | "atrasado" | "hoje";
  script: string;
};
function getCadenciaDetalhada(l: Lead): CadenciaDet[] {
  const passou = (s: LeadStatus) => {
    const ord: LeadStatus[] = ["Novo", "Qualificado", "Visita", "Proposta", "Fechado"];
    return ord.indexOf(l.status) >= ord.indexOf(s);
  };
  const atrasado = isAtrasado(l);
  return [
    {
      dia: 1,
      titulo: "Ligação inicial",
      canal: "Telefone",
      objetivo: "Qualificar o lead",
      sla: "2h",
      status: passou("Qualificado") ? "concluido" : atrasado ? "atrasado" : "hoje",
      script: "Apresentação inicial",
    },
    {
      dia: 1,
      titulo: "WhatsApp de apresentação",
      canal: "WhatsApp",
      objetivo: "Confirmar interesse",
      sla: "4h",
      status: passou("Qualificado") ? "concluido" : "hoje",
      script: "Apresentação",
    },
    {
      dia: 2,
      titulo: "Follow-up",
      canal: "WhatsApp",
      objetivo: "Manter cadência",
      sla: "24h",
      status: passou("Visita") ? "concluido" : atrasado ? "atrasado" : "pendente",
      script: "Follow-up D2",
    },
    {
      dia: 2,
      titulo: "Envio de imóveis compatíveis",
      canal: "WhatsApp",
      objetivo: "Mostrar valor",
      sla: "24h",
      status: passou("Visita") ? "concluido" : "pendente",
      script: "",
    },
    {
      dia: 3,
      titulo: "Confirmar visita",
      canal: "Ligação",
      objetivo: "Reduzir no-show",
      sla: "24h",
      status: passou("Visita") ? "concluido" : "pendente",
      script: "Confirmação 24h antes",
    },
    {
      dia: 4,
      titulo: "Pós-visita",
      canal: "WhatsApp",
      objetivo: "Avançar para proposta",
      sla: "12h",
      status: passou("Proposta") ? "concluido" : "pendente",
      script: "Feedback pós-visita",
    },
  ];
}

const QUALIF_BLOCOS = (l: Lead) => [
  {
    titulo: "Perfil",
    campos: [
      ["Nome", l.nome],
      ["Família", "Casal com 1 filho"],
      ["Profissão", "—"],
      ["Cidade", localidade(l)],
    ],
  },
  {
    titulo: "Busca",
    campos: [
      ["Tipo", inferTipo(l.interesse)],
      ["Região", localidade(l)],
      ["Faixa de valor", formatBRL(l.orcamento)],
      ["Características", "Varanda, vista, 2+ vagas"],
    ],
  },
  {
    titulo: "Financeiro",
    campos: [
      ["Possui crédito?", "Pré-aprovado"],
      ["Entrada", "30% disponível"],
      ["Financiamento", "Sim · Caixa"],
      ["Prazo de compra", "3-6 meses"],
    ],
  },
  {
    titulo: "Decisão",
    campos: [
      ["Momento", "Pronto para decidir"],
      ["Motivação", "Mudança de imóvel"],
      ["Objeções", "—"],
      ["Urgência", l.status === "Proposta" ? "Alta" : "Média"],
    ],
  },
];

function getVisitaInfo(l: Lead) {
  if (l.status !== "Visita") return null;
  return {
    imovel: `${inferTipo(l.interesse)} em ${localidadeCurta(l)}`,
    quando: "Sábado, 10h",
    endereco: `Rua Lopes Trovão, 200 — ${localidadeCurta(l)}`,
    status: "Agendada" as const,
  };
}

type FiltrosAv = {
  origem: string;
  etapa: string;
  estado: string;
  tipo: string;
  orcamentoMax: string;
};
const FILTROS_AV_VAZIO: FiltrosAv = {
  origem: "",
  etapa: "",
  estado: "",
  tipo: "",
  orcamentoMax: "",
};

function LeadsView({
  leads,
  refetch,
  brokerId,
  onNovoLead,
}: {
  leads: Lead[];
  refetch: () => Promise<void> | void;
  brokerId: string | undefined;
  onNovoLead: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filtroRapido, setFiltroRapido] = useState<FiltroRapido>("Todos");
  const [busca, setBusca] = useState("");
  const [filtrosOpen, setFiltrosOpen] = useState(false);
  const [filtrosAv, setFiltrosAv] = useState<FiltrosAv>(FILTROS_AV_VAZIO);
  const [filtrosAvAplicados, setFiltrosAvAplicados] = useState<FiltrosAv>(FILTROS_AV_VAZIO);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [perdaOpen, setPerdaOpen] = useState(false);
  const [perdaMotivo, setPerdaMotivo] = useState("");
  const [perdaObs, setPerdaObs] = useState("");
  const [registroOpen, setRegistroOpen] = useState(false);
  const [registroTipo, setRegistroTipo] = useState<string>("Ligação");
  const [registroTexto, setRegistroTexto] = useState("");
  const [waTexto, setWaTexto] = useState("");

  const aFazerHoje = leads.filter(
    (l) => isAtivo(l) && (isHoje(l) || l.status === "Qualificado" || l.status === "Proposta"),
  ).length;
  const atrasados = leads.filter(isAtrasado).length;
  const semContato = leads.filter((l) => l.status === "Novo").length;
  const visitasHoje = Math.max(1, leads.filter((l) => l.status === "Visita" && isHoje(l)).length);
  const vgvQuente = leads
    .filter((l) => isAtivo(l) && getPrioridade(l.status) === "quente")
    .reduce((s, l) => s + l.orcamento, 0);
  const vgvQuenteFmt =
    vgvQuente >= 1_000_000 ? `R$ ${(vgvQuente / 1_000_000).toFixed(1)}mi` : formatBRL(vgvQuente);

  const comissoesAtivas = leads
    .filter(isAtivo)
    .map((l) => getComissao(l.orcamento))
    .sort((a, b) => b - a);
  const topComissao =
    comissoesAtivas[Math.max(0, Math.floor(comissoesAtivas.length * 0.2) - 1)] ?? Infinity;
  const medianaComissao = comissoesAtivas[Math.floor(comissoesAtivas.length / 2)] ?? 0;
  const nivelCtx = useMemo(
    () => ({ topComissao, medianaComissao }),
    [topComissao, medianaComissao],
  );

  const leadsFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const f = filtrosAvAplicados;
    return leads
      .filter((l) => {
        switch (filtroRapido) {
          case "Hoje":
            if (!isHoje(l)) return false;
            break;
          case "Atrasados":
            if (!isAtrasado(l)) return false;
            break;
          case "Sem contato":
            if (l.status !== "Novo") return false;
            break;
          case "Quentes":
            if (getPrioridade(l.status) !== "quente") return false;
            break;
          case "Visitas":
            if (l.status !== "Visita") return false;
            break;
          case "Proposta":
            if (l.status !== "Proposta") return false;
            break;
          case "Perdidos":
            if (l.status !== "Perdido") return false;
            break;
        }
        if (
          q &&
          !(
            l.nome.toLowerCase().includes(q) ||
            l.id.toLowerCase().includes(q) ||
            l.interesse.toLowerCase().includes(q)
          )
        )
          return false;
        if (f.origem && l.origem !== f.origem) return false;
        if (f.etapa && l.status !== f.etapa) return false;
        if (f.estado && l.estado !== f.estado) return false;
        if (f.tipo && !l.interesse.toLowerCase().includes(f.tipo.toLowerCase())) return false;
        if (f.orcamentoMax && l.orcamento > Number(f.orcamentoMax)) return false;
        return true;
      })
      .slice()
      .sort((a, b) => {
        const aAtivo = isAtivo(a) ? 0 : 1;
        const bAtivo = isAtivo(b) ? 0 : 1;
        if (aAtivo !== bAtivo) return aAtivo - bAtivo;
        const ra = getNivelRank(getNivel(a, nivelCtx));
        const rb = getNivelRank(getNivel(b, nivelCtx));
        if (ra !== rb) return ra - rb;
        return getComissao(b.orcamento) - getComissao(a.orcamento);
      });
  }, [leads, filtroRapido, busca, filtrosAvAplicados, nivelCtx]);

  const cards = [
    {
      label: "A fazer hoje",
      value: aFazerHoje,
      sub: "Ligações, WhatsApp e follow-ups previstos.",
      accent: false,
    },
    { label: "Atrasados", value: atrasados, sub: "Leads com ação fora do prazo.", accent: true },
    {
      label: "Sem contato",
      value: semContato,
      sub: "Novos leads ainda sem primeira abordagem.",
      accent: false,
    },
    {
      label: "Visitas hoje",
      value: visitasHoje,
      sub: "Atendimentos confirmados para hoje.",
      accent: false,
    },
    {
      label: "VGV em leads quentes",
      value: vgvQuenteFmt,
      sub: "Potencial estimado das oportunidades prioritárias.",
      accent: false,
      highlight: true,
    },
  ];

  const selected = leads.find((l) => l.id === selectedId) ?? leads[0];
  const selectedAcao = getProximaAcao(selected);
  const selectedUrg = getUrgencia(selected);
  const selectedNivel = getNivel(selected, nivelCtx);
  const selectedNivelMeta = getNivelMeta(selectedNivel);
  const selectedReforco = getReforco(selected);
  const selectedPrio = getPrioridade(selected.status);
  const selectedComissao = getComissao(selected.orcamento);
  const selectedAlertas = getAlertasContexto(selected);
  const primeiroNome = selected.nome.split(" ")[0];
  const subtextoUrg =
    selectedUrg === "atrasado"
      ? `Lead sem resposta há ${selected.ultimaInteracao}`
      : selectedUrg === "hoje"
        ? "Ação prevista para hoje"
        : "Sem prazo imediato";

  const proximaEtapa = nextLeadStatus(selected.status);
  const podeAgendarVisita = !["Visita", "Fechado", "Perdido"].includes(selected.status);

  const waUrl = (tel: string) => {
    const d = tel.replace(/\D/g, "");
    return `https://wa.me/${d.startsWith("55") ? d : "55" + d}`;
  };

  async function registrarContato(tipo: string, texto: string) {
    if (brokerId) await addLeadEvent(brokerId, selected.id, tipo, texto);
    await refetch();
  }

  async function avancarPara(status: LeadStatus, msg: string) {
    const ok = await updateLeadStatus(selected.id, status);
    if (ok) {
      await refetch();
      toast.success(msg);
    } else {
      toast.error("Não foi possível atualizar o lead.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl">Leads</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Sua central diária de execução comercial. Veja o que fazer, quando fazer e quais
            oportunidades priorizar.
          </p>
        </div>
        <button
          onClick={onNovoLead}
          className="inline-flex items-center gap-2 rounded-md bg-navy px-3 py-2 text-sm text-navy-foreground"
        >
          <Plus className="h-4 w-4" /> Novo lead
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {cards.map((c) => (
          <div
            key={c.label}
            className={cn(
              "rounded-xl border bg-card px-4 py-3",
              c.accent ? "border-red-200 bg-red-50/40" : "border-border",
              c.highlight && "border-emerald-200 bg-emerald-50/40",
            )}
          >
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              {c.label}
            </div>
            <div
              className={cn(
                "mt-1 text-2xl font-semibold leading-none",
                c.accent && "text-red-700",
                c.highlight && "text-emerald-700 num",
              )}
            >
              {c.value}
            </div>
            <div className="mt-1.5 text-xs text-muted-foreground">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTROS_RAPIDOS.map((f) => (
          <button
            key={f}
            onClick={() => setFiltroRapido(f)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition",
              filtroRapido === f
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
        <section className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between gap-4 border-b border-border p-4">
            <div className="flex flex-1 items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar lead por nome, ID ou interesse"
                className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
              />
            </div>
            <button
              onClick={() => setFiltrosOpen(true)}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
            >
              <Filter className="h-4 w-4" /> Filtros
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Origem</th>
                  <th className="px-4 py-3">Potencial</th>
                  <th className="px-4 py-3">Etapa</th>
                  <th className="px-4 py-3">Próxima ação</th>
                  <th className="px-4 py-3">Prazo</th>
                  <th className="px-4 py-3">Última interação</th>
                </tr>
              </thead>
              <tbody>
                {leadsFiltrados.map((l) => {
                  const acao = getProximaAcao(l);
                  const urg = getUrgencia(l);
                  const urgMeta = getUrgenciaMeta(urg, l);
                  const qualificada = isOrigemQualificada(l.origem);
                  const comissao = getComissao(l.orcamento);
                  const nivel = getNivel(l, nivelCtx);
                  const nivelMeta = getNivelMeta(nivel);
                  const reforco = getReforco(l);
                  const ult = getCanalUltimo(l);
                  return (
                    <tr
                      key={l.id}
                      onClick={() => setSelectedId(l.id)}
                      className={cn(
                        "cursor-pointer border-b border-l-4 border-border transition hover:bg-surface",
                        nivelMeta.border,
                        selected.id === l.id && "bg-surface",
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-full bg-surface text-xs font-medium">
                            {l.nome
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-medium">{l.nome}</span>
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                                  nivelMeta.chip,
                                )}
                              >
                                <span aria-hidden>{nivelMeta.emoji}</span>
                                {nivelMeta.label}
                              </span>
                            </div>
                            <div className="text-[10px] text-muted-foreground/70">{l.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm">
                          <span className="truncate">{l.origem}</span>
                          {qualificada && (
                            <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] font-medium uppercase tracking-wider text-amber-800">
                              qual.
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-base font-semibold text-emerald-700">
                          <Wallet className="h-4 w-4" />
                          <span className="num">{formatBRL(comissao)}</span>
                        </div>
                        <div className="num mt-0.5 text-xs text-muted-foreground">
                          Imóvel: {formatBRL(l.orcamento)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-xs",
                            statusColor[l.status],
                          )}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {acao.tipo === "nenhum" ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <div>
                            <div className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                              <span
                                className={cn(
                                  "grid h-6 w-6 place-items-center rounded-md",
                                  acao.tipo === "whatsapp"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : acao.tipo === "ligar"
                                      ? "bg-navy/10 text-navy"
                                      : acao.tipo === "visita"
                                        ? "bg-orange-50 text-orange-700"
                                        : "bg-violet-50 text-violet-700",
                                )}
                              >
                                {acao.icon}
                              </span>
                              {acao.label}
                            </div>
                            {nivel === "alta" && reforco && (
                              <div className="mt-1 text-[11px] font-medium text-red-600">
                                ⚠️ {reforco}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                            urgMeta.chip,
                          )}
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full", urgMeta.dot)} />
                          {urgMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">{ult.canal}</div>
                        <div className="text-[11px] text-muted-foreground">{ult.quando}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Detail panel */}
        <aside className="sticky top-24 h-fit space-y-4 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] text-muted-foreground/70">{selected.id}</div>
              <div className="font-display text-2xl">{selected.nome}</div>
              <span
                className={cn(
                  "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                  selectedNivelMeta.chip,
                )}
              >
                <span aria-hidden>{selectedNivelMeta.emoji}</span>
                {selectedNivelMeta.label}
              </span>
            </div>
            <span
              className={cn("rounded-full px-2.5 py-0.5 text-xs", statusColor[selected.status])}
            >
              {selected.status}
            </span>
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div>{selected.email}</div>
            <div>{selected.telefone}</div>
          </div>

          {selectedAlertas.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedAlertas.map((a) => (
                <span
                  key={a}
                  className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800 border border-amber-100"
                >
                  {a}
                </span>
              ))}
            </div>
          )}

          {/* Bloco principal: Próxima ação recomendada */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-emerald-800">
              <Wallet className="h-3.5 w-3.5" /> Próxima ação recomendada
            </div>
            <div className="num mt-1 text-2xl font-semibold text-emerald-700">
              {formatBRL(selectedComissao)}
            </div>
            {selectedAcao.tipo !== "nenhum" && (
              <div className="mt-3 flex items-center gap-2 text-sm font-medium text-foreground">
                <ArrowRight className="h-4 w-4 text-emerald-700" />
                {selectedAcao.label} {primeiroNome}
              </div>
            )}
            <div className="mt-1 text-xs text-muted-foreground">{subtextoUrg}</div>
            {selectedNivel === "alta" && selectedReforco && (
              <div className="mt-2 rounded-md bg-red-50 px-2 py-1.5 text-xs font-medium text-red-700">
                ⚠️ {selectedReforco}
              </div>
            )}
            {selectedNivel === "alta" && selectedPrio === "quente" && (
              <div className="mt-1 text-xs font-medium text-red-700">
                ⚠️ Lead quente em risco de esfriar
              </div>
            )}
          </div>

          {/* CTAs principais */}
          <div className="grid grid-cols-3 gap-2">
            <button
              disabled={!selected.telefone}
              onClick={async () => {
                window.open(`tel:${selected.telefone}`);
                await registrarContato("Ligação", "Ligação iniciada");
                toast.success("Ligação registrada");
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-navy px-2 py-2 text-xs font-medium text-navy-foreground disabled:opacity-50"
            >
              <Phone className="h-3.5 w-3.5" /> Ligar
            </button>
            <button
              disabled={!selected.telefone}
              onClick={async () => {
                window.open(waUrl(selected.telefone), "_blank");
                await registrarContato("WhatsApp", "Conversa aberta no WhatsApp");
                toast.success("WhatsApp registrado");
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-2 py-2 text-xs font-medium text-white disabled:opacity-50"
            >
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </button>
            <button
              onClick={() => setRegistroOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-2 py-2 text-xs font-medium"
            >
              <ClipboardCheck className="h-3.5 w-3.5" /> Registrar
            </button>
          </div>

          {/* Ações secundárias */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setRegistroOpen(true)}
              className="rounded-md border border-border px-2 py-2 text-xs hover:bg-surface"
            >
              Registrar interação
            </button>
            <button
              disabled={!podeAgendarVisita}
              onClick={() => avancarPara("Visita", "Visita agendada")}
              className="rounded-md border border-border px-2 py-2 text-xs hover:bg-surface disabled:opacity-50"
            >
              Agendar visita
            </button>
            <button
              disabled={!proximaEtapa}
              onClick={() => proximaEtapa && avancarPara(proximaEtapa, `Etapa avançada para ${proximaEtapa}`)}
              className="rounded-md border border-border px-2 py-2 text-xs hover:bg-surface disabled:opacity-50"
            >
              Avançar etapa
            </button>
            <button
              onClick={() => setPerdaOpen(true)}
              className="rounded-md border border-border px-2 py-2 text-xs hover:bg-surface text-red-700"
            >
              Marcar como perdido
            </button>
          </div>

          <button
            onClick={() => setDrawerOpen(true)}
            className="w-full rounded-md bg-foreground px-3 py-2.5 text-sm font-medium text-background hover:opacity-90"
          >
            Ver operação completa
          </button>

          {/* Resumo rápido */}
          <div className="rounded-xl border border-border p-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Resumo rápido
            </div>
            <dl className="mt-2 space-y-1.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Tipo de imóvel</dt>
                <dd className="font-medium">{inferTipo(selected.interesse)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Região</dt>
                <dd className="font-medium text-right">{localidade(selected)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Valor do imóvel</dt>
                <dd className="num font-medium">{formatBRL(selected.orcamento)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl bg-surface p-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Origem</div>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <span>
                {selected.origem}
                {selected.origemDetalhe ? ` · ${selected.origemDetalhe}` : ""}
              </span>
              {isOrigemQualificada(selected.origem) && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-800">
                  qualificada
                </span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Interesse</div>
            <p className="mt-2 text-sm leading-relaxed">{selected.interesse}</p>
          </div>
        </aside>
      </div>

      {/* Filtros avançados (Dialog) */}
      <Dialog open={filtrosOpen} onOpenChange={setFiltrosOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Filtros avançados</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Origem</span>
              <select
                value={filtrosAv.origem}
                onChange={(e) => setFiltrosAv({ ...filtrosAv, origem: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5"
              >
                <option value="">Todas</option>
                {(
                  ["Instagram", "WhatsApp", "Marketplace", "Indicação", "Outro"] as LeadOrigin[]
                ).map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Etapa</span>
              <select
                value={filtrosAv.etapa}
                onChange={(e) => setFiltrosAv({ ...filtrosAv, etapa: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5"
              >
                <option value="">Todas</option>
                {(
                  [
                    "Novo",
                    "Qualificado",
                    "Visita",
                    "Proposta",
                    "Fechado",
                    "Perdido",
                  ] as LeadStatus[]
                ).map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Estado</span>
              <select
                value={filtrosAv.estado}
                onChange={(e) => setFiltrosAv({ ...filtrosAv, estado: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5"
              >
                <option value="">Todos</option>
                {ESTADOS_BR.map((e) => (
                  <option key={e.uf} value={e.uf}>
                    {e.nome} ({e.uf})
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Tipo de imóvel</span>
              <select
                value={filtrosAv.tipo}
                onChange={(e) => setFiltrosAv({ ...filtrosAv, tipo: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5"
              >
                <option value="">Todos</option>
                {TIPOS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="col-span-2 space-y-1">
              <span className="text-xs text-muted-foreground">Orçamento máximo (R$)</span>
              <input
                type="number"
                value={filtrosAv.orcamentoMax}
                onChange={(e) => setFiltrosAv({ ...filtrosAv, orcamentoMax: e.target.value })}
                placeholder="Ex.: 1500000"
                className="w-full rounded-md border border-border bg-background px-2 py-1.5"
              />
            </label>
          </div>
          <DialogFooter>
            <button
              onClick={() => {
                setFiltrosAv(FILTROS_AV_VAZIO);
                setFiltrosAvAplicados(FILTROS_AV_VAZIO);
              }}
              className="rounded-md border border-border px-3 py-2 text-sm"
            >
              Limpar
            </button>
            <button
              onClick={() => {
                setFiltrosAvAplicados(filtrosAv);
                setFiltrosOpen(false);
              }}
              className="rounded-md bg-foreground px-3 py-2 text-sm text-background"
            >
              Aplicar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Operação do Lead */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <div className="relative flex h-[90vh] max-h-[900px] w-[96vw] max-w-[1400px] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl md:w-[88vw]">
            <Tabs defaultValue="execucao" className="flex h-full min-h-0 flex-1 flex-col">
              {/* Scroll único */}
              <div className="flex-1 overflow-y-auto">
                {/* HEADER STICKY */}
                <div className="sticky top-0 z-30 border-b border-border bg-background px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2">
                        <h2 className="font-display text-xl leading-tight">{selected.nome}</h2>
                        <span className="text-[11px] text-muted-foreground/70">{selected.id}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px]",
                            statusColor[selected.status],
                          )}
                        >
                          {selected.status}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                            selectedNivelMeta.chip,
                          )}
                        >
                          <span aria-hidden>{selectedNivelMeta.emoji}</span>
                          {selectedNivelMeta.label}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-medium",
                            selectedPrio === "quente"
                              ? "bg-red-50 text-red-700"
                              : selectedPrio === "morno"
                                ? "bg-amber-50 text-amber-800"
                                : "bg-blue-50 text-blue-700",
                          )}
                        >
                          {selectedPrio === "quente"
                            ? "🔥 Quente"
                            : selectedPrio === "morno"
                              ? "🌤 Morno"
                              : "❄️ Frio"}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => setPerdaOpen(true)}
                        className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-surface hover:text-red-700"
                      >
                        Marcar como perdido
                      </button>
                      <button
                        onClick={() => setDrawerOpen(false)}
                        className="rounded-md p-1.5 hover:bg-surface"
                        aria-label="Fechar"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* TABS STICKY */}
                <div className="sticky top-[88px] z-20 border-b border-border bg-background px-6 pt-3">
                  <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-0 bg-transparent p-0">
                    {[
                      ["execucao", "Execução"],
                      ["cadencia", "Cadência"],
                      ["interacoes", "Interações"],
                      ["whatsapp", "WhatsApp"],
                      ["visitas", "Visitas"],
                      ["qualificacao", "Qualificação"],
                      ["scripts", "Scripts"],
                      ["historico", "Histórico"],
                    ].map(([v, l]) => (
                      <TabsTrigger
                        key={v}
                        value={v}
                        className="rounded-none border-b-2 border-transparent bg-transparent px-3 pb-3 pt-1 text-sm shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                      >
                        {l}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {/* MISSION CONTROL BAR (sticky abaixo das tabs) */}
                {(() => {
                  const score = getScoreLead(selected);
                  const scoreTone = getScoreTone(score);
                  const tsi = getTempoSemInteracao(selected);
                  const sla = getSlaProximaAcao(selected);
                  const chance = getChanceConversao(selected);
                  const dotByTone: Record<Tone, string> = {
                    good: "bg-emerald-500",
                    warn: "bg-amber-500",
                    danger: "bg-red-500",
                    neutral: "bg-slate-400",
                  };
                  const Pill = ({
                    label,
                    value,
                    tone,
                    danger,
                    children,
                  }: {
                    label: string;
                    value?: React.ReactNode;
                    tone?: Tone;
                    danger?: boolean;
                    children?: React.ReactNode;
                  }) => (
                    <div
                      className={cn(
                        "flex h-11 min-w-[120px] items-center gap-2.5 rounded-md border px-3 transition-colors",
                        danger
                          ? "border-red-200 bg-red-50/60"
                          : "border-border bg-card hover:border-foreground/20",
                      )}
                    >
                      {tone && (
                        <span
                          className={cn(
                            "h-2 w-2 shrink-0 rounded-full",
                            dotByTone[tone],
                            tone === "danger" && "animate-pulse",
                          )}
                        />
                      )}
                      <div className="min-w-0">
                        <div className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                          {label}
                        </div>
                        <div
                          className={cn(
                            "text-[13px] font-medium leading-tight",
                            danger && "text-red-700",
                          )}
                        >
                          {value ?? children}
                        </div>
                      </div>
                    </div>
                  );
                  return (
                    <div className="sticky top-[140px] z-10 border-b border-border bg-background/95 px-6 py-3 backdrop-blur">
                      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                        <Pill label="Comissão" value={formatBRL(selectedComissao)} />
                        <Pill label="VGV" value={formatBRL(selected.orcamento)} />
                        <Pill
                          label="Score IA"
                          tone={scoreTone}
                          value={<span className="num">{score}</span>}
                        />
                        <Pill label="Conversão">
                          <div className="flex items-center gap-1.5">
                            <span className="num">{chance}%</span>
                            <span className="h-1 w-10 overflow-hidden rounded-full bg-muted">
                              <span
                                className="block h-full rounded-full bg-emerald-500"
                                style={{ width: `${chance}%` }}
                              />
                            </span>
                          </div>
                        </Pill>
                        <Pill label="Sem interação" tone={tsi.tone} value={tsi.label} />
                        <Pill
                          label="SLA"
                          danger={sla.atrasado}
                          value={
                            <span className="inline-flex items-center gap-1">
                              {sla.atrasado && <AlertCircle className="h-3 w-3" />}
                              {sla.label}
                            </span>
                          }
                        />
                        <Pill
                          label="Temperatura"
                          value={
                            selectedPrio === "quente"
                              ? "🔥 Quente"
                              : selectedPrio === "morno"
                                ? "🌤 Morno"
                                : "❄️ Frio"
                          }
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* CONTEÚDO */}
                <div className="px-6 py-6">
                  {/* EXECUÇÃO */}
                  <TabsContent value="execucao" className="mt-0 space-y-6">
                    {/* NÍVEL 1 — Próxima ação (HERÓI) */}
                    {(() => {
                      const sla = getSlaProximaAcao(selected);
                      const isWa = selectedAcao.tipo === "whatsapp";
                      const isCall = selectedAcao.tipo === "ligar";
                      const ctaLabel =
                        selectedAcao.tipo === "whatsapp"
                          ? "Enviar WhatsApp agora"
                          : selectedAcao.tipo === "ligar"
                            ? "Ligar agora"
                            : selectedAcao.tipo === "visita"
                              ? "Confirmar visita"
                              : selectedAcao.tipo === "followup"
                                ? "Fazer follow-up"
                                : "Definir próxima ação";
                      const CtaIcon = isWa
                        ? MessageCircle
                        : isCall
                          ? Phone
                          : selectedAcao.tipo === "visita"
                            ? Calendar
                            : Send;
                      const ctaColor = isWa
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-navy text-navy-foreground hover:opacity-90";
                      const score = getScoreLead(selected);
                      const impacto = sla.atrasado
                        ? "Atraso reduz a chance de conversão neste lead."
                        : score >= 80
                          ? "Lead com alta probabilidade de conversão — agir agora maximiza o resultado."
                          : "Manter cadência aumenta a chance de avançar para a próxima etapa.";
                      return (
                        <div className="rounded-2xl border border-border border-l-4 border-l-primary bg-gradient-to-br from-surface to-background p-6 shadow-md transition-all hover:shadow-lg md:p-7">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
                              <Activity className="h-3 w-3" />
                              {sla.etapa}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-800">
                              <Flame className="h-3 w-3" />
                              {selectedNivelMeta.label}
                            </span>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]",
                                sla.atrasado
                                  ? "border-red-200 bg-red-50 text-red-700"
                                  : "border-border bg-background text-muted-foreground",
                              )}
                            >
                              <Clock className="h-3 w-3" />
                              {sla.atrasado ? "Atrasado · impacta conversão" : `SLA ${sla.label}`}
                            </span>
                          </div>
                          <div className="mt-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                            Próxima ação recomendada
                          </div>
                          <div className="mt-1 text-2xl font-semibold leading-tight md:text-3xl">
                            {selectedAcao.tipo !== "nenhum"
                              ? `${ctaLabel.replace(" agora", "")} com ${primeiroNome}`
                              : "Sem ação imediata"}
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground">{impacto}</div>
                          {getMotivos(selected).length > 0 && (
                            <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                              {getMotivos(selected).map((m) => (
                                <li key={m} className="flex items-start gap-2">
                                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
                                  <span>{m}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                          <div className="mt-6 flex flex-wrap items-center gap-3">
                            <button
                              className={cn(
                                "inline-flex h-12 items-center justify-center gap-2 rounded-md px-6 text-base font-semibold shadow-sm transition-transform active:scale-[0.98]",
                                ctaColor,
                              )}
                            >
                              <CtaIcon className="h-5 w-5" /> {ctaLabel}
                            </button>
                            <button className="text-xs text-muted-foreground transition-colors hover:text-foreground hover:underline">
                              Ver alternativas
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Status operacional — pills horizontais */}
                    <div className="flex flex-wrap gap-2">
                      {getStatusOperacional(selected).map((s, i) => (
                        <span
                          key={i}
                          className={cn(
                            "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] transition-colors",
                            s.tone === "danger"
                              ? "border-red-100 bg-red-50 text-red-700"
                              : s.tone === "warn"
                                ? "border-amber-100 bg-amber-50 text-amber-800"
                                : s.tone === "good"
                                  ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                                  : "border-border bg-surface text-foreground",
                          )}
                        >
                          {s.tone === "danger" && (
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                          )}
                          <span aria-hidden>{s.icon}</span>
                          {s.label}
                        </span>
                      ))}
                    </div>

                    {/* Botões secundários — neutros */}
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                      <button className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-border bg-background text-xs font-medium transition-colors hover:bg-surface active:scale-[0.98]">
                        <Phone className="h-3.5 w-3.5" /> Ligar
                      </button>
                      <button
                        onClick={() => setRegistroOpen(true)}
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-border bg-background text-xs font-medium transition-colors hover:bg-surface active:scale-[0.98]"
                      >
                        <Plus className="h-3.5 w-3.5" /> Registrar
                      </button>
                      <button className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-border bg-background text-xs font-medium transition-colors hover:bg-surface active:scale-[0.98]">
                        <Calendar className="h-3.5 w-3.5" /> Agendar
                      </button>
                      <button className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-border bg-background text-xs font-medium transition-colors hover:bg-surface active:scale-[0.98]">
                        <ArrowRight className="h-3.5 w-3.5" /> Avançar
                      </button>
                    </div>

                    {/* NÍVEL 2 — Timeline operacional VIVA */}
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                        Timeline operacional
                      </div>
                      <ol className="relative ml-2 mt-3 space-y-5 border-l-2 border-border pl-5">
                        <span className="pointer-events-none absolute -left-[1px] top-0 h-10 w-[2px] bg-gradient-to-b from-primary/40 to-transparent" />
                        {getTimelineOperacional(selected).map((t, i) => {
                          const kind: CanalKind = t.label.toLowerCase().includes("sem resposta")
                            ? "sistema"
                            : getCanalKind(t.label);
                          return (
                            <li
                              key={i}
                              className="group relative -mx-2 rounded px-2 text-sm transition-colors hover:bg-surface/60"
                            >
                              <span
                                className={cn(
                                  "absolute -left-[26px] top-1 grid h-4 w-4 place-items-center rounded-full text-white shadow-sm",
                                  t.tone === "warn" ? "bg-amber-500" : canalDot[kind],
                                )}
                              >
                                <CanalIcon kind={kind} className="h-2.5 w-2.5" />
                              </span>
                              <div className="flex items-start justify-between gap-3">
                                <div
                                  className={cn(
                                    "leading-snug",
                                    t.tone === "warn" && "text-amber-800",
                                  )}
                                >
                                  {t.label}
                                </div>
                                <div className="shrink-0 text-[10px] text-muted-foreground/70">
                                  {t.quando}
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                    </div>

                    {/* NÍVEL 2 — Cadência ativa */}
                    <div className="rounded-xl border border-border bg-card p-5 transition-all hover:border-foreground/20">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <div className="text-sm font-semibold">Cadência ativa</div>
                          <div className="text-xs text-muted-foreground">
                            Sequência operacional em andamento
                          </div>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          Qualificação Premium
                        </span>
                      </div>
                      <ul className="mt-4 space-y-2">
                        {getCadenciaDetalhada(selected)
                          .slice(0, 6)
                          .map((c, i) => {
                            const tone =
                              c.status === "concluido"
                                ? "bg-emerald-50 text-emerald-700"
                                : c.status === "atrasado"
                                  ? "bg-red-50 text-red-700"
                                  : c.status === "hoje"
                                    ? "bg-amber-50 text-amber-800"
                                    : "bg-slate-100 text-slate-600";
                            const StatusIcon =
                              c.status === "concluido"
                                ? CheckCircle2
                                : c.status === "atrasado"
                                  ? AlertCircle
                                  : c.status === "hoje"
                                    ? Clock
                                    : Activity;
                            const iconColor =
                              c.status === "concluido"
                                ? "text-emerald-600"
                                : c.status === "atrasado"
                                  ? "text-red-600"
                                  : c.status === "hoje"
                                    ? "text-amber-600"
                                    : "text-slate-400";
                            return (
                              <li
                                key={i}
                                className={cn(
                                  "flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5 text-sm transition-colors hover:bg-surface/40",
                                  c.status === "atrasado" &&
                                    "border-l-2 border-l-red-400 bg-red-50/30",
                                  c.status === "concluido" && "opacity-70",
                                )}
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <StatusIcon className={cn("h-4 w-4 shrink-0", iconColor)} />
                                  <div className="min-w-0">
                                    <div
                                      className={cn(
                                        "truncate",
                                        c.status === "concluido" && "line-through",
                                      )}
                                    >
                                      {c.titulo}
                                    </div>
                                    <div className="text-[11px] text-muted-foreground">
                                      {c.canal} · SLA {c.sla}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                                      tone,
                                    )}
                                  >
                                    {c.status === "concluido"
                                      ? "Concluído"
                                      : c.status === "atrasado"
                                        ? "Atrasado"
                                        : c.status === "hoje"
                                          ? "Hoje"
                                          : "Pendente"}
                                  </span>
                                  {c.status !== "concluido" && (
                                    <button className="rounded-md border border-border px-2 py-0.5 text-[10px] transition-colors hover:bg-surface">
                                      Concluir
                                    </button>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                      </ul>
                    </div>

                    {/* NÍVEL 2 — Métricas rápidas */}
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                        Métricas do lead
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-3 md:grid-cols-6">
                        {[
                          { k: "Score", v: String(getScoreLead(selected)) },
                          { k: "Potencial", v: formatBRL(selected.orcamento) },
                          { k: "Comissão", v: formatBRL(selectedComissao) },
                          { k: "Conversão", v: `${getChanceConversao(selected)}%` },
                          { k: "Resposta média", v: getTempoMedioResp(selected) },
                          { k: "Decisão", v: getEstagioDecisao(selected) },
                        ].map((m) => (
                          <div
                            key={m.k}
                            className="rounded-lg border border-border bg-card p-3 transition-all hover:border-foreground/20 hover:shadow-sm"
                          >
                            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                              {m.k}
                            </div>
                            <div className="num mt-1 text-sm font-semibold">{m.v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* CADÊNCIA */}
                  <TabsContent value="cadencia" className="mt-0 space-y-6">
                    {(() => {
                      const prog = getProgressoCadencia(selected);
                      return (
                        <div className="rounded-xl border border-border bg-card p-5">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold">
                                Cadência: Qualificação Premium
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {prog.feitos} de {prog.total} etapas concluídas
                              </div>
                            </div>
                            <div className="flex gap-1.5">
                              <button className="rounded-md border border-border px-2 py-1 text-[11px] transition-colors hover:bg-surface">
                                Pausar
                              </button>
                              <button className="rounded-md border border-border px-2 py-1 text-[11px] transition-colors hover:bg-surface">
                                Reiniciar
                              </button>
                              <button className="rounded-md border border-border px-2 py-1 text-[11px] transition-colors hover:bg-surface">
                                Trocar
                              </button>
                            </div>
                          </div>
                          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-all"
                              style={{ width: `${prog.pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                    {[1, 2, 3, 4].map((d) => {
                      const itens = getCadenciaDetalhada(selected).filter((c) => c.dia === d);
                      if (itens.length === 0) return null;
                      const feitos = itens.filter((i) => i.status === "concluido").length;
                      const objetivoDia =
                        d === 1
                          ? "Primeiro contato"
                          : d === 2
                            ? "Engajamento"
                            : d === 3
                              ? "Avanço"
                              : "Conversão";
                      return (
                        <div
                          key={d}
                          className="rounded-xl border border-border bg-card p-5 transition-all hover:border-foreground/20"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                                Dia {d} · {objetivoDia}
                              </div>
                            </div>
                            <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] text-muted-foreground">
                              {feitos}/{itens.length} concluídas
                            </span>
                          </div>
                          <ul className="mt-4 space-y-2">
                            {itens.map((c, i) => {
                              const StatusIcon =
                                c.status === "concluido"
                                  ? CheckCircle2
                                  : c.status === "atrasado"
                                    ? AlertCircle
                                    : c.status === "hoje"
                                      ? Clock
                                      : Activity;
                              const iconColor =
                                c.status === "concluido"
                                  ? "text-emerald-600"
                                  : c.status === "atrasado"
                                    ? "text-red-600"
                                    : c.status === "hoje"
                                      ? "text-amber-600"
                                      : "text-slate-400";
                              return (
                                <li
                                  key={i}
                                  className={cn(
                                    "rounded-md border border-border bg-background px-3 py-2.5 text-sm transition-colors hover:bg-surface/40",
                                    c.status === "atrasado" &&
                                      "border-l-2 border-l-red-400 bg-red-50/30",
                                    c.status === "concluido" && "opacity-70",
                                  )}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-2.5">
                                      <StatusIcon className={cn("h-4 w-4 shrink-0", iconColor)} />
                                      <div
                                        className={cn(
                                          "font-medium",
                                          c.status === "concluido" && "line-through",
                                        )}
                                      >
                                        {c.titulo}
                                      </div>
                                    </div>
                                    <span
                                      className={cn(
                                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                                        c.status === "concluido"
                                          ? "bg-emerald-50 text-emerald-700"
                                          : c.status === "atrasado"
                                            ? "bg-red-50 text-red-700"
                                            : c.status === "hoje"
                                              ? "bg-amber-50 text-amber-800"
                                              : "bg-slate-100 text-slate-600",
                                      )}
                                    >
                                      {c.status === "concluido"
                                        ? "Concluído"
                                        : c.status === "atrasado"
                                          ? "Atrasado"
                                          : c.status === "hoje"
                                            ? "Hoje"
                                            : "Pendente"}
                                    </span>
                                  </div>
                                  <div className="mt-1 pl-6 text-[11px] text-muted-foreground">
                                    {c.canal} · {c.objetivo} · SLA {c.sla}
                                  </div>
                                  {c.script && (
                                    <div className="mt-1 pl-6 text-[11px] italic text-muted-foreground">
                                      Script: {c.script}
                                    </div>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      );
                    })}
                  </TabsContent>

                  {/* INTERAÇÕES */}
                  <TabsContent value="interacoes" className="mt-0 space-y-4">
                    <div className="flex justify-end">
                      <button
                        onClick={() => setRegistroOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs text-background transition-transform active:scale-[0.98]"
                      >
                        <Plus className="h-3 w-3" /> Registrar interação
                      </button>
                    </div>
                    <ol className="space-y-3">
                      {selected.historico.map((h, i) => {
                        const kind = getCanalKind(h.tipo);
                        const micro = getMicroContexto(h.tipo, i);
                        return (
                          <li
                            key={i}
                            className="rounded-xl border border-border bg-card p-4 text-sm transition-all hover:border-foreground/20 hover:shadow-sm"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5">
                                <span
                                  className={cn(
                                    "grid h-7 w-7 place-items-center rounded-full text-white",
                                    canalDot[kind],
                                  )}
                                >
                                  <CanalIcon kind={kind} className="h-3.5 w-3.5" />
                                </span>
                                <div>
                                  <div className="text-sm font-medium">{h.tipo}</div>
                                  <div className="text-[11px] text-muted-foreground">
                                    {h.data} · Você
                                  </div>
                                </div>
                              </div>
                              {micro && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">
                                  <Zap className="h-2.5 w-2.5" />
                                  {micro}
                                </span>
                              )}
                            </div>
                            <div className="mt-3 text-foreground">{h.texto}</div>
                            <div className="mt-3 flex items-start gap-2 rounded-md border-l-2 border-l-primary/40 bg-primary/5 px-3 py-2 text-[11px] text-muted-foreground">
                              <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                              <div>
                                <span className="text-foreground">Próxima ação sugerida: </span>
                                {getSugestaoPosInteracao(h.tipo, selected)}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </TabsContent>

                  {/* WHATSAPP */}
                  <TabsContent value="whatsapp" className="mt-0 space-y-4">
                    <div className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-muted-foreground">
                        <span>Última conversa</span>
                        <span className="normal-case tracking-normal">
                          {selected.historico.find((h) => h.tipo.includes("WhatsApp"))?.data ?? "—"}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-foreground/80">
                        {selected.historico.find((h) => h.tipo.includes("WhatsApp"))?.texto ??
                          "Sem conversa registrada."}
                      </div>
                    </div>
                    <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-background p-5 transition-all hover:shadow-md">
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-2">
                          <span className="grid h-7 w-7 place-items-center rounded-full bg-violet-600 text-white">
                            <Bot className="h-4 w-4" />
                          </span>
                          <div>
                            <div className="text-sm font-semibold text-violet-900">
                              Assistente IA
                            </div>
                            <div className="text-[10px] uppercase tracking-widest text-violet-700/80">
                              Sugestão personalizada
                            </div>
                          </div>
                        </div>
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-800">
                          +12% conversão
                        </span>
                      </div>
                      <div className="mt-3 rounded-md bg-background/60 p-3 text-sm text-foreground">{`${primeiroNome}, separei 3 imóveis alinhados ao que você comentou sobre ${inferTipo(selected.interesse).toLowerCase()} em ${localidadeCurta(selected)}.`}</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            setWaTexto(
                              `${primeiroNome}, separei 3 imóveis alinhados ao que você comentou.`,
                            )
                          }
                          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-violet-600 px-3 text-xs font-medium text-white transition-colors hover:bg-violet-700"
                        >
                          <Sparkles className="h-3.5 w-3.5" /> Usar sugestão
                        </button>
                        <button className="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-xs transition-colors hover:bg-surface">
                          Editar
                        </button>
                        <button
                          onClick={() => navigator.clipboard?.writeText(waTexto)}
                          className="inline-flex h-9 items-center gap-1 rounded-md border border-border bg-background px-3 text-xs transition-colors hover:bg-surface"
                        >
                          <Copy className="h-3 w-3" /> Copiar
                        </button>
                      </div>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                          Mensagem
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {waTexto.length} caracteres
                        </div>
                      </div>
                      <textarea
                        value={waTexto}
                        onChange={(e) => setWaTexto(e.target.value)}
                        placeholder="Escreva uma mensagem..."
                        className="mt-2 min-h-[140px] w-full rounded-md border border-border bg-background p-3 text-sm focus:border-foreground/30 focus:outline-none"
                      />
                      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                        <button className="inline-flex h-9 items-center gap-1 rounded-md px-3 text-xs text-muted-foreground transition-colors hover:bg-surface hover:text-foreground">
                          Salvar como template
                        </button>
                        <button className="inline-flex h-9 items-center gap-1.5 rounded-md bg-emerald-600 px-4 text-xs font-medium text-white transition-colors hover:bg-emerald-700">
                          <Send className="h-3.5 w-3.5" /> Enviar
                        </button>
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                        Templates rápidos
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
                        {TEMPLATES_WA.map((t) => {
                          const txt = t.texto
                            .replace("{nome}", primeiroNome)
                            .replace("{tipo}", inferTipo(selected.interesse).toLowerCase())
                            .replace("{regiao}", localidadeCurta(selected));
                          return (
                            <button
                              key={t.titulo}
                              onClick={() => setWaTexto(txt)}
                              className="group rounded-md border border-border bg-card p-3 text-left text-xs transition-all hover:border-foreground/20 hover:shadow-sm"
                            >
                              <div className="flex items-center justify-between">
                                <div className="text-xs font-semibold">{t.titulo}</div>
                                <span className="text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                                  Usar →
                                </span>
                              </div>
                              <div className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                                {txt}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </TabsContent>

                  {/* VISITAS */}
                  <TabsContent value="visitas" className="mt-0 space-y-4">
                    {(() => {
                      const v = getVisitaInfo(selected);
                      if (!v)
                        return (
                          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
                            <div className="grid h-14 w-14 place-items-center rounded-full bg-surface text-muted-foreground">
                              <Calendar className="h-6 w-6" />
                            </div>
                            <div className="text-sm font-medium">
                              Nenhuma visita agendada ainda.
                            </div>
                            <div className="max-w-sm text-xs text-muted-foreground">
                              Agende uma visita para acelerar a qualificação e aumentar a chance de
                              conversão deste lead.
                            </div>
                            <button className="mt-2 inline-flex h-10 items-center gap-2 rounded-md bg-navy px-4 text-sm font-medium text-navy-foreground hover:opacity-90">
                              <Calendar className="h-4 w-4" /> Agendar primeira visita
                            </button>
                          </div>
                        );
                      return (
                        <div className="rounded-xl border border-border bg-card p-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-semibold">{v.imovel}</div>
                              <div className="text-xs text-muted-foreground">{v.endereco}</div>
                            </div>
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-800">
                              {v.status}
                            </span>
                          </div>
                          <div className="mt-3 text-sm">{v.quando}</div>
                          <textarea
                            placeholder="Feedback ou observações..."
                            className="mt-4 h-24 w-full rounded-md border border-border bg-background p-3 text-sm"
                          />
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white">
                              Confirmar visita
                            </button>
                            <button className="rounded-md border border-border px-3 py-1.5 text-xs">
                              Registrar feedback
                            </button>
                            <button className="rounded-md border border-border px-3 py-1.5 text-xs">
                              Reagendar
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </TabsContent>

                  {/* QUALIFICAÇÃO */}
                  <TabsContent value="qualificacao" className="mt-0">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {QUALIF_BLOCOS(selected).map((b, idx) => {
                        const cfg = [
                          { Icon: UserIcon, color: "border-t-blue-400" },
                          { Icon: SearchIcon, color: "border-t-violet-400" },
                          { Icon: Wallet, color: "border-t-emerald-400" },
                          { Icon: CheckCircle2, color: "border-t-amber-400" },
                        ][idx];
                        const Icon = cfg.Icon;
                        return (
                          <div
                            key={b.titulo}
                            className={cn(
                              "rounded-xl border border-border border-t-2 bg-card p-5 transition-all hover:border-foreground/20 hover:shadow-sm",
                              cfg.color,
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                                {b.titulo}
                              </div>
                            </div>
                            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-sm">
                              {b.campos.map(([k, v]) => (
                                <React.Fragment key={k}>
                                  <dt className="text-xs text-muted-foreground">{k}</dt>
                                  <dd className="text-right text-sm font-medium">{v}</dd>
                                </React.Fragment>
                              ))}
                            </dl>
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>

                  {/* SCRIPTS */}
                  <TabsContent value="scripts" className="mt-0 space-y-3">
                    {SCRIPTS_LIB.map((s) => {
                      const texto = s.texto
                        .replace("{nome}", primeiroNome)
                        .replace("{tipo}", inferTipo(selected.interesse))
                        .replace("{regiao}", localidade(selected));
                      return (
                        <div
                          key={s.titulo}
                          className="rounded-xl border border-border bg-card p-4 transition-all hover:border-foreground/20 hover:shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                                <div className="text-sm font-semibold">{s.titulo}</div>
                                <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                                  {s.categoria}
                                </span>
                              </div>
                              <div className="mt-0.5 text-[11px] text-muted-foreground">
                                {s.objetivo}
                              </div>
                            </div>
                            <button
                              onClick={() => navigator.clipboard?.writeText(texto)}
                              className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                            >
                              <Copy className="h-3 w-3" /> Copiar
                            </button>
                          </div>
                          <p className="mt-3 rounded-md bg-surface/60 p-3 text-sm leading-relaxed text-foreground/85">
                            {texto}
                          </p>
                        </div>
                      );
                    })}
                  </TabsContent>

                  {/* HISTÓRICO */}
                  <TabsContent value="historico" className="mt-0">
                    {(() => {
                      type Ev = {
                        quando: string;
                        titulo: string;
                        texto?: string;
                        kind: CanalKind;
                        origemLabel: string;
                        grupo: string;
                      };
                      const eventos: Ev[] = [
                        {
                          quando: "agora",
                          titulo: `Lead em ${selected.status}`,
                          kind: "sistema",
                          origemLabel: "Sistema",
                          grupo: "Hoje",
                        },
                        ...selected.historico.map((h) => {
                          const k = getCanalKind(h.tipo);
                          const grupo =
                            h.data.toLowerCase().includes("hoje") ||
                            h.data.toLowerCase().includes("min")
                              ? "Hoje"
                              : h.data.toLowerCase().includes("ontem")
                                ? "Ontem"
                                : h.data.toLowerCase().includes("dia")
                                  ? "Esta semana"
                                  : "Anterior";
                          return {
                            quando: h.data,
                            titulo: h.tipo,
                            texto: h.texto,
                            kind: k,
                            origemLabel:
                              k === "ia"
                                ? "IA"
                                : k === "whatsapp"
                                  ? "WhatsApp"
                                  : k === "ligacao"
                                    ? "Corretor"
                                    : k === "visita"
                                      ? "Corretor"
                                      : "Sistema",
                            grupo,
                          };
                        }),
                        {
                          quando: "origem",
                          titulo: `Lead criado via ${selected.origem}`,
                          kind: "sistema",
                          origemLabel: "Sistema",
                          grupo: "Anterior",
                        },
                      ];
                      const grupos = ["Hoje", "Ontem", "Esta semana", "Anterior"] as const;
                      return (
                        <div className="space-y-5">
                          {grupos.map((g) => {
                            const items = eventos.filter((e) => e.grupo === g);
                            if (items.length === 0) return null;
                            return (
                              <div key={g}>
                                <div className="mb-3 border-b border-dashed border-border py-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                                  {g}
                                </div>
                                <ol className="relative ml-2 space-y-4 border-l-2 border-border pl-5">
                                  {items.map((ev, i) => (
                                    <li
                                      key={i}
                                      className="group relative -mx-2 rounded px-2 text-sm transition-colors hover:bg-surface/60"
                                    >
                                      <span
                                        className={cn(
                                          "absolute -left-[26px] top-1 grid h-4 w-4 place-items-center rounded-full text-white shadow-sm",
                                          canalDot[ev.kind],
                                        )}
                                      >
                                        <CanalIcon kind={ev.kind} className="h-2.5 w-2.5" />
                                      </span>
                                      <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium">{ev.titulo}</span>
                                          <span
                                            className={cn(
                                              "rounded border px-1.5 py-0.5 text-[10px]",
                                              canalBadge[ev.kind],
                                            )}
                                          >
                                            {ev.origemLabel}
                                          </span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground/70">
                                          {ev.quando}
                                        </span>
                                      </div>
                                      {ev.texto && (
                                        <div className="mt-1 text-sm text-muted-foreground">
                                          {ev.texto}
                                        </div>
                                      )}
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </TabsContent>
                </div>
              </div>
            </Tabs>
          </div>
        </div>
      )}

      {/* Modal: Marcar como perdido */}
      <Dialog open={perdaOpen} onOpenChange={setPerdaOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Marcar lead como perdido</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">Motivo *</span>
              <select
                value={perdaMotivo}
                onChange={(e) => setPerdaMotivo(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5"
              >
                <option value="">Selecione um motivo</option>
                {MOTIVOS_PERDA.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">Observação *</span>
              <textarea
                value={perdaObs}
                onChange={(e) => setPerdaObs(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5"
                placeholder="Conte o que aconteceu..."
              />
            </label>
          </div>
          <DialogFooter>
            <button
              onClick={() => setPerdaOpen(false)}
              className="rounded-md border border-border px-3 py-2 text-sm"
            >
              Cancelar
            </button>
            <button
              disabled={!perdaMotivo || !perdaObs.trim()}
              onClick={async () => {
                const ok = await updateLeadStatus(
                  selected.id,
                  "Perdido",
                  `${perdaMotivo} — ${perdaObs}`,
                );
                setPerdaOpen(false);
                setPerdaMotivo("");
                setPerdaObs("");
                if (ok) {
                  await refetch();
                  toast.success("Lead marcado como perdido");
                } else {
                  toast.error("Não foi possível atualizar o lead.");
                }
              }}
              className="rounded-md bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              Confirmar perda
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Registrar interação */}
      <Dialog open={registroOpen} onOpenChange={setRegistroOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar interação</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">Tipo</span>
              <select
                value={registroTipo}
                onChange={(e) => setRegistroTipo(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5"
              >
                {TIPOS_INTERACAO.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">Resumo</span>
              <textarea
                value={registroTexto}
                onChange={(e) => setRegistroTexto(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5"
                placeholder="O que foi conversado?"
              />
            </label>
          </div>
          <DialogFooter>
            <button
              onClick={() => setRegistroOpen(false)}
              className="rounded-md border border-border px-3 py-2 text-sm"
            >
              Cancelar
            </button>
            <button
              disabled={!registroTexto.trim() || !brokerId}
              onClick={async () => {
                if (!brokerId) return;
                const ok = await addLeadEvent(brokerId, selected.id, registroTipo, registroTexto);
                setRegistroOpen(false);
                setRegistroTexto("");
                if (ok) {
                  await refetch();
                  toast.success("Interação registrada");
                } else {
                  toast.error("Não foi possível registrar a interação.");
                }
              }}
              className="rounded-md bg-foreground px-3 py-2 text-sm text-background disabled:opacity-50"
            >
              Salvar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LeadsPage() {
  const { session } = useSession();
  const { leads, loading, refetch } = useLeads();
  const [novoOpen, setNovoOpen] = useState(false);
  const brokerId = session?.user.id;

  return (
    <>
      {loading ? (
        <div className="grid place-items-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <EmptyLeads onNovoLead={() => setNovoOpen(true)} />
      ) : (
        <LeadsView
          leads={leads}
          refetch={refetch}
          brokerId={brokerId}
          onNovoLead={() => setNovoOpen(true)}
        />
      )}
      <NovoLeadModal
        open={novoOpen}
        onOpenChange={setNovoOpen}
        brokerId={brokerId}
        onCreated={refetch}
      />
    </>
  );
}

function EmptyLeads({ onNovoLead }: { onNovoLead: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl">Leads</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Sua central diária de execução comercial.
          </p>
        </div>
        <button
          onClick={onNovoLead}
          className="inline-flex items-center gap-2 rounded-md bg-navy px-3 py-2 text-sm text-navy-foreground"
        >
          <Plus className="h-4 w-4" /> Novo lead
        </button>
      </div>
      <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-border bg-card py-24 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-surface text-muted-foreground">
          <UserIcon className="h-7 w-7" />
        </div>
        <div className="font-display text-lg">Nenhum lead ainda</div>
        <p className="max-w-sm text-sm text-muted-foreground">
          Cadastre seu primeiro lead para começar a acompanhar oportunidades e priorizar sua rotina.
        </p>
        <button
          onClick={onNovoLead}
          className="mt-1 inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm text-navy-foreground"
        >
          <Plus className="h-4 w-4" /> Novo lead
        </button>
      </div>
    </div>
  );
}

function NovoLeadModal({
  open,
  onOpenChange,
  brokerId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  brokerId: string | undefined;
  onCreated: () => Promise<void> | void;
}) {
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    email: "",
    origem: "WhatsApp" as LeadOrigin,
    estado: "",
    cidade: "",
    interesse: "",
    orcamento: "",
  });
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!brokerId) return;
    if (!form.nome.trim()) {
      toast.error("Informe o nome do lead");
      return;
    }
    setSaving(true);
    const created = await createLead(brokerId, {
      nome: form.nome,
      telefone: form.telefone || undefined,
      email: form.email || undefined,
      origem: form.origem,
      estado: form.estado || undefined,
      cidade: form.cidade || undefined,
      interesse: form.interesse || undefined,
      orcamento: Number(form.orcamento) || 0,
    });
    setSaving(false);
    if (created) {
      toast.success("Lead cadastrado");
      setForm({
        nome: "",
        telefone: "",
        email: "",
        origem: "WhatsApp",
        estado: "",
        cidade: "",
        interesse: "",
        orcamento: "",
      });
      onOpenChange(false);
      await onCreated();
    } else {
      toast.error("Não foi possível cadastrar o lead.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo lead</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <label className="col-span-2 space-y-1">
            <span className="text-xs text-muted-foreground">Nome *</span>
            <input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5"
              placeholder="Ex.: João Mendes"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Telefone</span>
            <input
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5"
              placeholder="+55 21 9..."
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">E-mail</span>
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5"
              placeholder="email@exemplo.com"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Origem</span>
            <select
              value={form.origem}
              onChange={(e) => setForm({ ...form, origem: e.target.value as LeadOrigin })}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5"
            >
              {LEAD_ORIGINS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Orçamento (R$)</span>
            <input
              type="number"
              value={form.orcamento}
              onChange={(e) => setForm({ ...form, orcamento: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5"
              placeholder="1000000"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Estado</span>
            <select
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5"
            >
              <option value="">Selecione</option>
              {ESTADOS_BR.map((e) => (
                <option key={e.uf} value={e.uf}>
                  {e.nome} ({e.uf})
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Cidade / Região</span>
            <input
              value={form.cidade}
              onChange={(e) => setForm({ ...form, cidade: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5"
              placeholder="Ex.: Pinheiros"
            />
          </label>
          <label className="col-span-2 space-y-1">
            <span className="text-xs text-muted-foreground">Interesse</span>
            <textarea
              value={form.interesse}
              onChange={(e) => setForm({ ...form, interesse: e.target.value })}
              rows={3}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5"
              placeholder="O que o lead procura (tipo, região, características)…"
            />
          </label>
        </div>
        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-md border border-border px-3 py-2 text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-navy px-3 py-2 text-sm text-navy-foreground disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Cadastrar lead
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
