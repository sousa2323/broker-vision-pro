import { createFileRoute } from "@tanstack/react-router";
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
} from "lucide-react";
import { leads, type Lead, type LeadOrigin, type LeadStatus, formatBRL } from "@/data/mock";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
const REGIOES = ["Icaraí", "Santa Rosa", "São Francisco", "Charitas", "Ingá", "Itacoatiara", "Camboinhas", "Niterói"];

function inferTipo(interesse: string) {
  const low = interesse.toLowerCase();
  const hit = TIPOS.find((t) => low.includes(t));
  if (!hit) return "Imóvel residencial";
  return hit.charAt(0).toUpperCase() + hit.slice(1);
}

function inferRegiao(interesse: string) {
  const hits = REGIOES.filter((r) => interesse.includes(r));
  if (hits.length === 0) return "Niterói / RJ";
  return hits.slice(0, 2).join(" · ");
}

const FILTROS_RAPIDOS = ["Todos", "Hoje", "Atrasados", "Sem contato", "Quentes", "Visitas", "Proposta", "Perdidos"] as const;
type FiltroRapido = (typeof FILTROS_RAPIDOS)[number];

function isAtivo(l: Lead) {
  return l.status !== "Fechado" && l.status !== "Perdido";
}
function isAtrasado(l: Lead) {
  const u = l.ultimaInteracao.toLowerCase();
  return isAtivo(l) && (u.includes("dia") || u.includes("semana"));
}
function isHoje(l: Lead) {
  return l.ultimaInteracao.toLowerCase().includes("hoje") || l.ultimaInteracao.toLowerCase().includes("min") || l.ultimaInteracao.toLowerCase().includes("h");
}

type AcaoTipo = "ligar" | "whatsapp" | "visita" | "followup" | "enviar" | "nenhum";
function getProximaAcao(l: Lead): { tipo: AcaoTipo; label: string; icon: React.ReactNode } {
  switch (l.status) {
    case "Novo": return { tipo: "ligar", label: "Ligar agora", icon: <Phone className="h-3.5 w-3.5" /> };
    case "Qualificado": return { tipo: "whatsapp", label: "Enviar WhatsApp", icon: <MessageCircle className="h-3.5 w-3.5" /> };
    case "Visita": return { tipo: "visita", label: "Confirmar visita hoje", icon: <Calendar className="h-3.5 w-3.5" /> };
    case "Proposta": return { tipo: "followup", label: "Fazer follow-up", icon: <Send className="h-3.5 w-3.5" /> };
    default: return { tipo: "nenhum", label: "—", icon: null };
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
  if (n === "alta") return { label: "Alta prioridade", emoji: "🔴", chip: "bg-red-50 text-red-700 border border-red-100", border: "border-l-red-500" };
  if (n === "media") return { label: "Média prioridade", emoji: "🟡", chip: "bg-amber-50 text-amber-800 border border-amber-100", border: "border-l-amber-400" };
  return { label: "Baixa prioridade", emoji: "⚪", chip: "bg-slate-50 text-slate-600 border border-slate-200", border: "border-l-transparent" };
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
  if (u === "atrasado") return { label: `Atrasado há ${l.ultimaInteracao}`, chip: "bg-red-50 text-red-700 border-red-100", dot: "bg-red-500", border: "border-l-red-500" };
  if (u === "hoje") return { label: "Fazer hoje", chip: "bg-amber-50 text-amber-800 border-amber-100", dot: "bg-amber-400", border: "border-l-amber-400" };
  return { label: "Futuro", chip: "bg-slate-50 text-slate-600 border-slate-200", dot: "bg-slate-300", border: "border-l-transparent" };
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
    { dia: 1, titulo: "Ligação inicial", status: passou("Qualificado") ? "concluido" : atrasado ? "atrasado" : "pendente" },
    { dia: 1, titulo: "WhatsApp de apresentação", status: passou("Qualificado") ? "concluido" : "pendente" },
    { dia: 2, titulo: "Follow-up", status: passou("Visita") ? "concluido" : atrasado ? "atrasado" : "pendente" },
    { dia: 2, titulo: "Envio de imóveis compatíveis", status: passou("Visita") ? "concluido" : "pendente" },
    { dia: 3, titulo: "Prova social", status: passou("Proposta") ? "concluido" : "pendente" },
    { dia: 3, titulo: "Nova tentativa de contato", status: passou("Proposta") ? "concluido" : "pendente" },
  ];
}

const SCRIPTS_LIB = [
  { categoria: "Primeiro contato", titulo: "Apresentação inicial", objetivo: "Quebrar o gelo e marcar conversa", texto: "Oi {nome}, aqui é o Ramon da Ubroker. Vi seu interesse em {tipo} em {regiao}. Posso te ligar rapidinho pra entender o que você procura?" },
  { categoria: "Reativação", titulo: "Lead frio retorno", objetivo: "Trazer de volta lead sem resposta", texto: "Oi {nome}, tudo bem? Apareceram opções novas que combinam com o que conversamos. Quer dar uma olhada?" },
  { categoria: "Follow-up", titulo: "Follow-up D2", objetivo: "Manter cadência e mostrar interesse", texto: "{nome}, separei mais 2 imóveis dentro do seu perfil. Quer que eu envie agora?" },
  { categoria: "Confirmação de visita", titulo: "Confirmação 24h antes", objetivo: "Reduzir no-show", texto: "{nome}, só confirmando nossa visita amanhã. Posso te enviar a localização?" },
  { categoria: "Pós-visita", titulo: "Feedback pós-visita", objetivo: "Capturar percepção e avançar etapa", texto: "E aí {nome}, o que achou do imóvel? Quero te ajudar a decidir com calma." },
  { categoria: "Proposta", titulo: "Envio de proposta", objetivo: "Apresentar condições e fechar", texto: "{nome}, preparei a proposta. Posso te enviar os detalhes agora?" },
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

const TIPOS_INTERACAO = ["Ligação", "WhatsApp", "Reunião", "Visita", "Observação", "Follow-up"] as const;

const TEMPLATES_WA = [
  { titulo: "Apresentação", texto: "Oi {nome}, sou da Ubroker. Vi seu interesse em {tipo} em {regiao}." },
  { titulo: "Confirmação visita", texto: "{nome}, confirmando nossa visita. Posso te mandar a localização?" },
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
  const bonus = l.status === "Proposta" ? 10 : l.status === "Visita" ? 7 : l.status === "Qualificado" ? 4 : 0;
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
  const u = l.ultimaInteracao.toLowerCase();
  if (u.includes("min")) return { label: l.ultimaInteracao, tone: "good" };
  if (u.includes("h")) return { label: l.ultimaInteracao, tone: "good" };
  if (u.includes("hoje")) return { label: l.ultimaInteracao, tone: "good" };
  if (u.includes("ontem") || u.includes("1 dia") || u.includes("2 dia")) return { label: l.ultimaInteracao, tone: "warn" };
  return { label: l.ultimaInteracao, tone: "danger" };
}
function getSlaProximaAcao(l: Lead): { label: string; atrasado: boolean; etapa: string } {
  const cad = getCadenciaDetalhada(l);
  const proximo = cad.find((c) => c.status === "atrasado") ?? cad.find((c) => c.status === "hoje") ?? cad.find((c) => c.status === "pendente");
  if (!proximo) return { label: "Sem SLA", atrasado: false, etapa: "—" };
  const atrasado = proximo.status === "atrasado";
  return { label: `${proximo.canal} · ${proximo.sla}`, atrasado, etapa: `Dia ${proximo.dia} · ${proximo.objetivo}` };
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
  const map: Record<CanalKind, JSX.Element> = {
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
  out.push({ icon: "⏰", label: `${l.ultimaInteracao} sem interação`, tone: isAtrasado(l) ? "warn" : "neutral" });
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
      icon: h.tipo.includes("WhatsApp") ? "💬" : h.tipo.includes("Liga") ? "📞" : h.tipo.includes("Visita") ? "📅" : h.tipo.includes("IA") ? "🧠" : "📝",
      label: `${h.tipo} — ${h.texto}`,
      quando: h.data,
      tone: i === 0 ? "good" : "neutral",
    });
  });
  if (isAtrasado(l)) out.splice(1, 0, { icon: "⚠️", label: "Sem resposta do cliente", quando: `há ${l.ultimaInteracao}`, tone: "warn" });
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
  if (tipo.includes("Liga")) return `Enviar imóveis compatíveis em ${inferRegiao(l.interesse).split(" ")[0]} até o fim do dia.`;
  if (tipo.includes("WhatsApp")) return "Aguardar resposta por 4h e fazer follow-up se necessário.";
  if (tipo.includes("Visita")) return "Registrar feedback pós-visita e avançar para proposta.";
  if (tipo.includes("IA")) return "Confirmar qualificação por ligação e marcar visita.";
  return "Agendar próxima ação na cadência.";
}

type CadenciaDet = { dia: number; titulo: string; canal: string; objetivo: string; sla: string; status: "pendente" | "concluido" | "atrasado" | "hoje"; script: string };
function getCadenciaDetalhada(l: Lead): CadenciaDet[] {
  const passou = (s: LeadStatus) => {
    const ord: LeadStatus[] = ["Novo", "Qualificado", "Visita", "Proposta", "Fechado"];
    return ord.indexOf(l.status) >= ord.indexOf(s);
  };
  const atrasado = isAtrasado(l);
  return [
    { dia: 1, titulo: "Ligação inicial", canal: "Telefone", objetivo: "Qualificar o lead", sla: "2h", status: passou("Qualificado") ? "concluido" : atrasado ? "atrasado" : "hoje", script: "Apresentação inicial" },
    { dia: 1, titulo: "WhatsApp de apresentação", canal: "WhatsApp", objetivo: "Confirmar interesse", sla: "4h", status: passou("Qualificado") ? "concluido" : "hoje", script: "Apresentação" },
    { dia: 2, titulo: "Follow-up", canal: "WhatsApp", objetivo: "Manter cadência", sla: "24h", status: passou("Visita") ? "concluido" : atrasado ? "atrasado" : "pendente", script: "Follow-up D2" },
    { dia: 2, titulo: "Envio de imóveis compatíveis", canal: "WhatsApp", objetivo: "Mostrar valor", sla: "24h", status: passou("Visita") ? "concluido" : "pendente", script: "" },
    { dia: 3, titulo: "Confirmar visita", canal: "Ligação", objetivo: "Reduzir no-show", sla: "24h", status: passou("Visita") ? "concluido" : "pendente", script: "Confirmação 24h antes" },
    { dia: 4, titulo: "Pós-visita", canal: "WhatsApp", objetivo: "Avançar para proposta", sla: "12h", status: passou("Proposta") ? "concluido" : "pendente", script: "Feedback pós-visita" },
  ];
}

const QUALIF_BLOCOS = (l: Lead) => [
  { titulo: "Perfil", campos: [["Nome", l.nome], ["Família", "Casal com 1 filho"], ["Profissão", "—"], ["Cidade", "Niterói / RJ"]] },
  { titulo: "Busca", campos: [["Tipo", inferTipo(l.interesse)], ["Região", inferRegiao(l.interesse)], ["Faixa de valor", formatBRL(l.orcamento)], ["Características", "Varanda, vista, 2+ vagas"]] },
  { titulo: "Financeiro", campos: [["Possui crédito?", "Pré-aprovado"], ["Entrada", "30% disponível"], ["Financiamento", "Sim · Caixa"], ["Prazo de compra", "3-6 meses"]] },
  { titulo: "Decisão", campos: [["Momento", "Pronto para decidir"], ["Motivação", "Mudança de imóvel"], ["Objeções", "—"], ["Urgência", l.status === "Proposta" ? "Alta" : "Média"]] },
];

function getVisitaInfo(l: Lead) {
  if (l.status !== "Visita") return null;
  return {
    imovel: `${inferTipo(l.interesse)} em ${inferRegiao(l.interesse).split(" ")[0]}`,
    quando: "Sábado, 10h",
    endereco: `Rua Lopes Trovão, 200 — ${inferRegiao(l.interesse).split(" ")[0]}`,
    status: "Agendada" as const,
  };
}

type FiltrosAv = {
  origem: string;
  etapa: string;
  regiao: string;
  tipo: string;
  orcamentoMax: string;
};
const FILTROS_AV_VAZIO: FiltrosAv = { origem: "", etapa: "", regiao: "", tipo: "", orcamentoMax: "" };

function LeadsPage() {
  const [selected, setSelected] = useState<Lead>(leads[0]);
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

  const aFazerHoje = leads.filter((l) => isAtivo(l) && (isHoje(l) || l.status === "Qualificado" || l.status === "Proposta")).length;
  const atrasados = leads.filter(isAtrasado).length;
  const semContato = leads.filter((l) => l.status === "Novo").length;
  const visitasHoje = Math.max(1, leads.filter((l) => l.status === "Visita" && isHoje(l)).length);
  const vgvQuente = leads.filter((l) => isAtivo(l) && getPrioridade(l.status) === "quente").reduce((s, l) => s + l.orcamento, 0);
  const vgvQuenteFmt = vgvQuente >= 1_000_000 ? `R$ ${(vgvQuente / 1_000_000).toFixed(1)}mi` : formatBRL(vgvQuente);

  const comissoesAtivas = leads.filter(isAtivo).map((l) => getComissao(l.orcamento)).sort((a, b) => b - a);
  const topComissao = comissoesAtivas[Math.max(0, Math.floor(comissoesAtivas.length * 0.2) - 1)] ?? Infinity;
  const medianaComissao = comissoesAtivas[Math.floor(comissoesAtivas.length / 2)] ?? 0;
  const nivelCtx = { topComissao, medianaComissao };

  const leadsFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const f = filtrosAvAplicados;
    return leads
      .filter((l) => {
        switch (filtroRapido) {
          case "Hoje": if (!isHoje(l)) return false; break;
          case "Atrasados": if (!isAtrasado(l)) return false; break;
          case "Sem contato": if (l.status !== "Novo") return false; break;
          case "Quentes": if (getPrioridade(l.status) !== "quente") return false; break;
          case "Visitas": if (l.status !== "Visita") return false; break;
          case "Proposta": if (l.status !== "Proposta") return false; break;
          case "Perdidos": if (l.status !== "Perdido") return false; break;
        }
        if (q && !(l.nome.toLowerCase().includes(q) || l.id.toLowerCase().includes(q) || l.interesse.toLowerCase().includes(q))) return false;
        if (f.origem && l.origem !== f.origem) return false;
        if (f.etapa && l.status !== f.etapa) return false;
        if (f.regiao && !l.interesse.includes(f.regiao)) return false;
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
  }, [filtroRapido, busca, filtrosAvAplicados, nivelCtx]);

  const cards = [
    { label: "A fazer hoje", value: aFazerHoje, sub: "Ligações, WhatsApp e follow-ups previstos.", accent: false },
    { label: "Atrasados", value: atrasados, sub: "Leads com ação fora do prazo.", accent: true },
    { label: "Sem contato", value: semContato, sub: "Novos leads ainda sem primeira abordagem.", accent: false },
    { label: "Visitas hoje", value: visitasHoje, sub: "Atendimentos confirmados para hoje.", accent: false },
    { label: "VGV em leads quentes", value: vgvQuenteFmt, sub: "Potencial estimado das oportunidades prioritárias.", accent: false, highlight: true },
  ];

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
    selectedUrg === "atrasado" ? `Lead sem resposta há ${selected.ultimaInteracao}` :
    selectedUrg === "hoje" ? "Ação prevista para hoje" : "Sem prazo imediato";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl">Leads</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Sua central diária de execução comercial. Veja o que fazer, quando fazer e quais oportunidades priorizar.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-navy px-3 py-2 text-sm text-navy-foreground">
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
              c.highlight && "border-emerald-200 bg-emerald-50/40"
            )}
          >
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{c.label}</div>
            <div className={cn(
              "mt-1 text-2xl font-semibold leading-none",
              c.accent && "text-red-700",
              c.highlight && "text-emerald-700 num"
            )}>{c.value}</div>
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
                : "border-border bg-card text-muted-foreground hover:text-foreground"
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
            <button onClick={() => setFiltrosOpen(true)} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
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
                      onClick={() => setSelected(l)}
                      className={cn(
                        "cursor-pointer border-b border-l-4 border-border transition hover:bg-surface",
                        nivelMeta.border,
                        selected.id === l.id && "bg-surface"
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-full bg-surface text-xs font-medium">
                            {l.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-medium">{l.nome}</span>
                              <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium", nivelMeta.chip)}>
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
                            <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] font-medium uppercase tracking-wider text-amber-800">qual.</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-base font-semibold text-emerald-700">
                          <Wallet className="h-4 w-4" />
                          <span className="num">{formatBRL(comissao)}</span>
                        </div>
                        <div className="num mt-0.5 text-xs text-muted-foreground">Imóvel: {formatBRL(l.orcamento)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs", statusColor[l.status])}>{l.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        {acao.tipo === "nenhum" ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <div>
                            <div className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                              <span className={cn(
                                "grid h-6 w-6 place-items-center rounded-md",
                                acao.tipo === "whatsapp" ? "bg-emerald-50 text-emerald-700"
                                  : acao.tipo === "ligar" ? "bg-navy/10 text-navy"
                                  : acao.tipo === "visita" ? "bg-orange-50 text-orange-700"
                                  : "bg-violet-50 text-violet-700"
                              )}>
                                {acao.icon}
                              </span>
                              {acao.label}
                            </div>
                            {nivel === "alta" && reforco && (
                              <div className="mt-1 text-[11px] font-medium text-red-600">⚠️ {reforco}</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium", urgMeta.chip)}>
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
              <span className={cn("mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", selectedNivelMeta.chip)}>
                <span aria-hidden>{selectedNivelMeta.emoji}</span>
                {selectedNivelMeta.label}
              </span>
            </div>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs", statusColor[selected.status])}>{selected.status}</span>
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div>{selected.email}</div>
            <div>{selected.telefone}</div>
          </div>

          {selectedAlertas.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedAlertas.map((a) => (
                <span key={a} className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800 border border-amber-100">
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
            <div className="num mt-1 text-2xl font-semibold text-emerald-700">{formatBRL(selectedComissao)}</div>
            {selectedAcao.tipo !== "nenhum" && (
              <div className="mt-3 flex items-center gap-2 text-sm font-medium text-foreground">
                <ArrowRight className="h-4 w-4 text-emerald-700" />
                {selectedAcao.label} {primeiroNome}
              </div>
            )}
            <div className="mt-1 text-xs text-muted-foreground">{subtextoUrg}</div>
            {selectedNivel === "alta" && selectedReforco && (
              <div className="mt-2 rounded-md bg-red-50 px-2 py-1.5 text-xs font-medium text-red-700">⚠️ {selectedReforco}</div>
            )}
            {selectedNivel === "alta" && selectedPrio === "quente" && (
              <div className="mt-1 text-xs font-medium text-red-700">⚠️ Lead quente em risco de esfriar</div>
            )}
          </div>

          {/* CTAs principais */}
          <div className="grid grid-cols-3 gap-2">
            <button className="inline-flex items-center justify-center gap-1.5 rounded-md bg-navy px-2 py-2 text-xs font-medium text-navy-foreground">
              <Phone className="h-3.5 w-3.5" /> Ligar
            </button>
            <button className="inline-flex items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-2 py-2 text-xs font-medium text-white">
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </button>
            <button className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-2 py-2 text-xs font-medium">
              <ClipboardCheck className="h-3.5 w-3.5" /> Registrar
            </button>
          </div>

          {/* Ações secundárias */}
          <div className="grid grid-cols-2 gap-2">
            <button className="rounded-md border border-border px-2 py-2 text-xs hover:bg-surface">Registrar interação</button>
            <button className="rounded-md border border-border px-2 py-2 text-xs hover:bg-surface">Agendar visita</button>
            <button className="rounded-md border border-border px-2 py-2 text-xs hover:bg-surface">Avançar etapa</button>
            <button className="rounded-md border border-border px-2 py-2 text-xs hover:bg-surface text-red-700">Marcar como perdido</button>
          </div>

          <button
            onClick={() => setDrawerOpen(true)}
            className="w-full rounded-md bg-foreground px-3 py-2.5 text-sm font-medium text-background hover:opacity-90"
          >
            Ver operação completa
          </button>

          {/* Resumo rápido */}
          <div className="rounded-xl border border-border p-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Resumo rápido</div>
            <dl className="mt-2 space-y-1.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Tipo de imóvel</dt>
                <dd className="font-medium">{inferTipo(selected.interesse)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Região</dt>
                <dd className="font-medium text-right">{inferRegiao(selected.interesse)}</dd>
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
              <span>{selected.origem}{selected.origemDetalhe ? ` · ${selected.origemDetalhe}` : ""}</span>
              {isOrigemQualificada(selected.origem) && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-800">qualificada</span>
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
              <select value={filtrosAv.origem} onChange={(e) => setFiltrosAv({ ...filtrosAv, origem: e.target.value })} className="w-full rounded-md border border-border bg-background px-2 py-1.5">
                <option value="">Todas</option>
                {(["Instagram", "WhatsApp", "Marketplace", "Indicação", "Outro"] as LeadOrigin[]).map((o) => <option key={o}>{o}</option>)}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Etapa</span>
              <select value={filtrosAv.etapa} onChange={(e) => setFiltrosAv({ ...filtrosAv, etapa: e.target.value })} className="w-full rounded-md border border-border bg-background px-2 py-1.5">
                <option value="">Todas</option>
                {(["Novo", "Qualificado", "Visita", "Proposta", "Fechado", "Perdido"] as LeadStatus[]).map((o) => <option key={o}>{o}</option>)}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Região</span>
              <select value={filtrosAv.regiao} onChange={(e) => setFiltrosAv({ ...filtrosAv, regiao: e.target.value })} className="w-full rounded-md border border-border bg-background px-2 py-1.5">
                <option value="">Todas</option>
                {REGIOES.map((r) => <option key={r}>{r}</option>)}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Tipo de imóvel</span>
              <select value={filtrosAv.tipo} onChange={(e) => setFiltrosAv({ ...filtrosAv, tipo: e.target.value })} className="w-full rounded-md border border-border bg-background px-2 py-1.5">
                <option value="">Todos</option>
                {TIPOS.map((t) => <option key={t}>{t}</option>)}
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
              onClick={() => { setFiltrosAv(FILTROS_AV_VAZIO); setFiltrosAvAplicados(FILTROS_AV_VAZIO); }}
              className="rounded-md border border-border px-3 py-2 text-sm"
            >Limpar</button>
            <button
              onClick={() => { setFiltrosAvAplicados(filtrosAv); setFiltrosOpen(false); }}
              className="rounded-md bg-foreground px-3 py-2 text-sm text-background"
            >Aplicar</button>
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
                        <span className={cn("rounded-full px-2 py-0.5 text-[11px]", statusColor[selected.status])}>{selected.status}</span>
                        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", selectedNivelMeta.chip)}>
                          <span aria-hidden>{selectedNivelMeta.emoji}</span>{selectedNivelMeta.label}
                        </span>
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-medium",
                          selectedPrio === "quente" ? "bg-red-50 text-red-700" :
                          selectedPrio === "morno" ? "bg-amber-50 text-amber-800" : "bg-blue-50 text-blue-700"
                        )}>
                          {selectedPrio === "quente" ? "🔥 Quente" : selectedPrio === "morno" ? "🌤 Morno" : "❄️ Frio"}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => setPerdaOpen(true)}
                        className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-surface hover:text-red-700"
                      >Marcar como perdido</button>
                      <button onClick={() => setDrawerOpen(false)} className="rounded-md p-1.5 hover:bg-surface" aria-label="Fechar"><X className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>

                {/* TABS STICKY */}
                <div className="sticky top-[88px] z-20 border-b border-border bg-background px-6 pt-3">
                  <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-0 bg-transparent p-0">
                    {[
                      ["execucao","Execução"],["cadencia","Cadência"],["interacoes","Interações"],
                      ["whatsapp","WhatsApp"],["visitas","Visitas"],["qualificacao","Qualificação"],
                      ["scripts","Scripts"],["historico","Histórico"],
                    ].map(([v,l]) => (
                      <TabsTrigger
                        key={v}
                        value={v}
                        className="rounded-none border-b-2 border-transparent bg-transparent px-3 pb-3 pt-1 text-sm shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                      >{l}</TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {/* CONTEÚDO */}
                <div className="px-6 py-6">

                {/* EXECUÇÃO */}
                <TabsContent value="execucao" className="mt-0 space-y-6">
                  {/* NÍVEL 1 — Próxima ação (herói) */}
                  <div className="rounded-xl border border-primary/30 bg-surface p-6 shadow-sm">
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Próxima ação recomendada</div>
                    <div className="mt-2 text-2xl font-semibold leading-tight">
                      {selectedAcao.tipo !== "nenhum" ? `${selectedAcao.label} com ${primeiroNome}` : "Sem ação imediata"}
                    </div>
                    {getMotivos(selected).length > 0 && (
                      <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                        {getMotivos(selected).map((m) => (
                          <li key={m} className="flex gap-2"><span className="text-primary">•</span>{m}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Botões operacionais — grid uniforme */}
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                    <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-navy text-sm font-medium text-navy-foreground hover:opacity-90"><Phone className="h-4 w-4" /> Ligar</button>
                    <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-emerald-600 text-sm font-medium text-white hover:opacity-90"><MessageCircle className="h-4 w-4" /> WhatsApp</button>
                    <button onClick={() => setRegistroOpen(true)} className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-background text-sm font-medium hover:bg-surface"><Plus className="h-4 w-4" /> Registrar</button>
                    <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-background text-sm font-medium hover:bg-surface"><Calendar className="h-4 w-4" /> Agendar visita</button>
                    <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-background text-sm font-medium hover:bg-surface"><ArrowRight className="h-4 w-4" /> Avançar etapa</button>
                  </div>

                  {/* NÍVEL 2 — Status operacional */}
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Status operacional</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {getStatusOperacional(selected).map((s, i) => (
                        <span
                          key={i}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
                            s.tone === "danger" ? "border-red-100 bg-red-50 text-red-700" :
                            s.tone === "warn" ? "border-amber-100 bg-amber-50 text-amber-800" :
                            s.tone === "good" ? "border-emerald-100 bg-emerald-50 text-emerald-700" :
                            "border-border bg-surface text-foreground"
                          )}
                        >
                          <span aria-hidden>{s.icon}</span>{s.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* NÍVEL 2 — Timeline */}
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Timeline operacional</div>
                    <ol className="ml-2 mt-3 space-y-4 border-l border-border pl-4">
                      {getTimelineOperacional(selected).map((t, i) => (
                        <li key={i} className="relative text-sm">
                          <span className="absolute -left-[22px] top-1 grid h-3.5 w-3.5 place-items-center rounded-full border border-border bg-background text-[10px]">{t.icon}</span>
                          <div className={cn(
                            "leading-snug",
                            t.tone === "warn" && "text-amber-800"
                          )}>{t.label}</div>
                          <div className="text-xs text-muted-foreground">{t.quando}</div>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* NÍVEL 2 — Cadência ativa */}
                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <div className="text-sm font-semibold">Cadência ativa</div>
                        <div className="text-xs text-muted-foreground">Sequência operacional em andamento</div>
                      </div>
                      <span className="text-[11px] text-muted-foreground">Qualificação Premium</span>
                    </div>
                    <ul className="mt-4 space-y-2">
                      {getCadenciaDetalhada(selected).slice(0, 6).map((c, i) => {
                        const tone =
                          c.status === "concluido" ? "bg-emerald-50 text-emerald-700" :
                          c.status === "atrasado" ? "bg-red-50 text-red-700" :
                          c.status === "hoje" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600";
                        const icon = c.status === "concluido" ? "☑" : c.status === "atrasado" ? "⚠" : "⬜";
                        return (
                          <li key={i} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5 text-sm">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="text-base">{icon}</span>
                              <div className="min-w-0">
                                <div className="truncate">{c.titulo}</div>
                                <div className="text-[11px] text-muted-foreground">{c.canal} · SLA {c.sla}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", tone)}>
                                {c.status === "concluido" ? "Concluído" : c.status === "atrasado" ? "Atrasado" : c.status === "hoje" ? "Hoje" : "Pendente"}
                              </span>
                              {c.status !== "concluido" && (
                                <button className="rounded-md border border-border px-2 py-0.5 text-[10px] hover:bg-surface">Concluir</button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* NÍVEL 2 — Métricas rápidas */}
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Métricas do lead</div>
                    <div className="mt-3 grid grid-cols-3 gap-3 md:grid-cols-6">
                      {[
                        { k: "Score", v: String(getScoreLead(selected)) },
                        { k: "Potencial", v: formatBRL(selected.orcamento) },
                        { k: "Comissão", v: formatBRL(selectedComissao) },
                        { k: "Conversão", v: `${getChanceConversao(selected)}%` },
                        { k: "Resposta média", v: getTempoMedioResp(selected) },
                        { k: "Decisão", v: getEstagioDecisao(selected) },
                      ].map((m) => (
                        <div key={m.k} className="rounded-lg border border-border bg-card p-3">
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{m.k}</div>
                          <div className="num mt-1 text-sm font-semibold">{m.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* CADÊNCIA */}
                <TabsContent value="cadencia" className="mt-0 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">Cadência: Qualificação Premium</div>
                      <div className="text-xs text-muted-foreground">Jornada operacional do lead</div>
                    </div>
                    <div className="flex gap-1.5">
                      <button className="rounded-md border border-border px-2 py-1 text-[11px]">Pausar</button>
                      <button className="rounded-md border border-border px-2 py-1 text-[11px]">Reiniciar</button>
                      <button className="rounded-md border border-border px-2 py-1 text-[11px]">Trocar</button>
                    </div>
                  </div>
                  {[1, 2, 3, 4].map((d) => {
                    const itens = getCadenciaDetalhada(selected).filter((c) => c.dia === d);
                    if (itens.length === 0) return null;
                    return (
                      <div key={d} className="rounded-xl border border-border p-3">
                        <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Dia {d}</div>
                        <ul className="mt-2 space-y-1.5">
                          {itens.map((c, i) => (
                            <li key={i} className="rounded-md border border-border bg-surface/50 px-3 py-2 text-sm">
                              <div className="flex items-center justify-between">
                                <div className="font-medium">{c.titulo}</div>
                                <span className={cn(
                                  "rounded-full px-2 py-0.5 text-[10px] font-medium",
                                  c.status === "concluido" ? "bg-emerald-50 text-emerald-700" :
                                  c.status === "atrasado" ? "bg-red-50 text-red-700" :
                                  c.status === "hoje" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600"
                                )}>{c.status === "concluido" ? "Concluído" : c.status === "atrasado" ? "Atrasado" : c.status === "hoje" ? "Hoje" : "Pendente"}</span>
                              </div>
                              <div className="mt-0.5 text-[11px] text-muted-foreground">{c.canal} · {c.objetivo} · SLA {c.sla}</div>
                              {c.script && <div className="mt-1 text-[11px] italic text-muted-foreground">Script: {c.script}</div>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </TabsContent>

                {/* INTERAÇÕES */}
                <TabsContent value="interacoes" className="mt-0 space-y-4">
                  <div className="flex justify-end">
                    <button onClick={() => setRegistroOpen(true)} className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs text-background">
                      <Plus className="h-3 w-3" /> Registrar interação
                    </button>
                  </div>
                  <ol className="space-y-2">
                    {selected.historico.map((h, i) => (
                      <li key={i} className="rounded-xl border border-border p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-medium">
                            <span>{h.tipo.includes("WhatsApp") ? "💬" : h.tipo.includes("Liga") ? "📞" : h.tipo.includes("Visita") ? "📅" : h.tipo.includes("IA") ? "🧠" : "📝"}</span>
                            {h.tipo}
                          </div>
                          <div className="text-[11px] text-muted-foreground">{h.data} · Você</div>
                        </div>
                        <div className="mt-1 text-foreground">{h.texto}</div>
                        <div className="mt-2 rounded-md bg-surface px-2 py-1.5 text-[11px] text-muted-foreground">
                          ➡ Próxima ação sugerida: <span className="text-foreground">{getSugestaoPosInteracao(h.tipo, selected)}</span>
                        </div>
                      </li>
                    ))}
                  </ol>
                </TabsContent>

                {/* WHATSAPP */}
                <TabsContent value="whatsapp" className="mt-0 space-y-4">
                  <div className="rounded-xl border border-border p-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Última conversa</span>
                      <span>{selected.historico.find((h) => h.tipo.includes("WhatsApp"))?.data ?? "—"}</span>
                    </div>
                    <div className="mt-1 text-sm">{selected.historico.find((h) => h.tipo.includes("WhatsApp"))?.texto ?? "Sem conversa registrada."}</div>
                  </div>
                  <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-3">
                    <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-violet-800">
                      <Sparkles className="h-3 w-3" /> Sugestão IA
                    </div>
                    <div className="mt-1 text-sm">{`${primeiroNome}, separei 3 imóveis alinhados ao que você comentou sobre ${inferTipo(selected.interesse).toLowerCase()} em ${inferRegiao(selected.interesse).split(" ")[0]}.`}</div>
                    <div className="mt-2 flex gap-1.5">
                      <button onClick={() => setWaTexto(`${primeiroNome}, separei 3 imóveis alinhados ao que você comentou.`)} className="rounded-md bg-violet-600 px-2.5 py-1 text-[11px] text-white">Usar sugestão</button>
                      <button className="rounded-md border border-border px-2.5 py-1 text-[11px]">Editar</button>
                      <button onClick={() => navigator.clipboard?.writeText(waTexto)} className="rounded-md border border-border px-2.5 py-1 text-[11px]">Copiar</button>
                    </div>
                  </div>
                  <textarea
                    value={waTexto}
                    onChange={(e) => setWaTexto(e.target.value)}
                    placeholder="Escreva uma mensagem..."
                    className="h-24 w-full rounded-md border border-border bg-background p-2 text-sm"
                  />
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Templates rápidos</div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {TEMPLATES_WA.map((t) => {
                        const txt = t.texto.replace("{nome}", primeiroNome).replace("{tipo}", inferTipo(selected.interesse).toLowerCase()).replace("{regiao}", inferRegiao(selected.interesse).split(" ")[0]);
                        return (
                          <button key={t.titulo} onClick={() => setWaTexto(txt)} className="rounded-md border border-border bg-card p-2 text-left text-xs hover:bg-surface">
                            <div className="font-medium">{t.titulo}</div>
                            <div className="line-clamp-2 text-muted-foreground">{txt}</div>
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
                    if (!v) return (
                      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
                        <div className="grid h-14 w-14 place-items-center rounded-full bg-surface text-muted-foreground">
                          <Calendar className="h-6 w-6" />
                        </div>
                        <div className="text-sm font-medium">Nenhuma visita agendada ainda.</div>
                        <div className="max-w-sm text-xs text-muted-foreground">Agende uma visita para acelerar a qualificação e aumentar a chance de conversão deste lead.</div>
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
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-800">{v.status}</span>
                        </div>
                        <div className="mt-3 text-sm">{v.quando}</div>
                        <textarea placeholder="Feedback ou observações..." className="mt-4 h-24 w-full rounded-md border border-border bg-background p-3 text-sm" />
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white">Confirmar visita</button>
                          <button className="rounded-md border border-border px-3 py-1.5 text-xs">Registrar feedback</button>
                          <button className="rounded-md border border-border px-3 py-1.5 text-xs">Reagendar</button>
                        </div>
                      </div>
                    );
                  })()}
                </TabsContent>

                {/* QUALIFICAÇÃO */}
                <TabsContent value="qualificacao" className="mt-0">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {QUALIF_BLOCOS(selected).map((b) => (
                      <div key={b.titulo} className="rounded-xl border border-border bg-card p-5">
                        <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{b.titulo}</div>
                        <dl className="mt-3 space-y-2 text-sm">
                          {b.campos.map(([k, v]) => (
                            <div key={k} className="flex items-baseline justify-between gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0">
                              <dt className="text-xs text-muted-foreground">{k}</dt>
                              <dd className="text-right text-sm font-medium">{v}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* SCRIPTS */}
                <TabsContent value="scripts" className="mt-0 space-y-4">
                  {SCRIPTS_LIB.map((s) => {
                    const texto = s.texto
                      .replace("{nome}", primeiroNome)
                      .replace("{tipo}", inferTipo(selected.interesse))
                      .replace("{regiao}", inferRegiao(selected.interesse));
                    return (
                      <div key={s.titulo} className="rounded-xl border border-border bg-card p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.categoria}</div>
                            <div className="mt-0.5 flex items-center gap-2 text-sm font-semibold">
                              <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                              {s.titulo}
                            </div>
                            <div className="mt-0.5 text-xs text-muted-foreground">Objetivo: {s.objetivo}</div>
                          </div>
                          <button onClick={() => navigator.clipboard?.writeText(texto)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-surface hover:text-foreground">
                            <Copy className="h-3 w-3" /> Copiar
                          </button>
                        </div>
                        <p className="mt-3 rounded-md bg-surface p-3 text-sm text-foreground/80">{texto}</p>
                      </div>
                    );
                  })}
                </TabsContent>

                {/* HISTÓRICO */}
                <TabsContent value="historico" className="mt-0">
                  <ol className="space-y-2.5 border-l border-border pl-4">
                    <li className="relative text-sm">
                      <span className="absolute -left-[19px] top-1 h-2 w-2 rounded-full bg-emerald-500" />
                      <div className="text-[11px] text-muted-foreground">Sistema · agora</div>
                      <div>Lead em <span className="font-medium">{selected.status}</span></div>
                    </li>
                    {selected.historico.map((h, i) => (
                      <li key={i} className="relative text-sm">
                        <span className="absolute -left-[19px] top-1 h-2 w-2 rounded-full bg-muted-foreground/40" />
                        <div className="text-[11px] text-muted-foreground">{h.data} · {h.tipo} · Você</div>
                        <div>{h.texto}</div>
                      </li>
                    ))}
                    <li className="relative text-sm">
                      <span className="absolute -left-[19px] top-1 h-2 w-2 rounded-full bg-muted-foreground/40" />
                      <div className="text-[11px] text-muted-foreground">Origem</div>
                      <div>Lead criado via {selected.origem}</div>
                    </li>
                  </ol>
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
              <select value={perdaMotivo} onChange={(e) => setPerdaMotivo(e.target.value)} className="w-full rounded-md border border-border bg-background px-2 py-1.5">
                <option value="">Selecione um motivo</option>
                {MOTIVOS_PERDA.map((m) => <option key={m}>{m}</option>)}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">Observação *</span>
              <textarea value={perdaObs} onChange={(e) => setPerdaObs(e.target.value)} rows={3} className="w-full rounded-md border border-border bg-background px-2 py-1.5" placeholder="Conte o que aconteceu..." />
            </label>
          </div>
          <DialogFooter>
            <button onClick={() => setPerdaOpen(false)} className="rounded-md border border-border px-3 py-2 text-sm">Cancelar</button>
            <button
              disabled={!perdaMotivo || !perdaObs.trim()}
              onClick={() => { setPerdaOpen(false); setPerdaMotivo(""); setPerdaObs(""); }}
              className="rounded-md bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-50"
            >Confirmar perda</button>
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
              <select value={registroTipo} onChange={(e) => setRegistroTipo(e.target.value)} className="w-full rounded-md border border-border bg-background px-2 py-1.5">
                {TIPOS_INTERACAO.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">Resumo</span>
              <textarea value={registroTexto} onChange={(e) => setRegistroTexto(e.target.value)} rows={3} className="w-full rounded-md border border-border bg-background px-2 py-1.5" placeholder="O que foi conversado?" />
            </label>
          </div>
          <DialogFooter>
            <button onClick={() => setRegistroOpen(false)} className="rounded-md border border-border px-3 py-2 text-sm">Cancelar</button>
            <button
              onClick={() => { setRegistroOpen(false); setRegistroTexto(""); }}
              className="rounded-md bg-foreground px-3 py-2 text-sm text-background"
            >Salvar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
