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

const SCRIPTS = [
  { titulo: "Primeiro contato", texto: "Oi {nome}, aqui é o Ramon da Ubroker. Vi seu interesse em {tipo} em {regiao}. Posso te ligar rapidinho pra entender o que você procura?" },
  { titulo: "Reativação", texto: "Oi {nome}, tudo bem? Apareceram opções novas que combinam com o que conversamos. Quer dar uma olhada?" },
  { titulo: "Confirmação de visita", texto: "{nome}, só confirmando nossa visita amanhã. Posso te enviar a localização?" },
  { titulo: "Pós-visita", texto: "E aí {nome}, o que achou do imóvel? Quero te ajudar a decidir com calma." },
  { titulo: "Proposta", texto: "{nome}, preparei a proposta. Posso te enviar os detalhes agora?" },
];

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

      {/* Drawer Operação do Lead */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto bg-background shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-background p-5">
              <div>
                <div className="text-[10px] text-muted-foreground/70">{selected.id} · Operação do Lead</div>
                <div className="font-display text-xl">{selected.nome}</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px]", statusColor[selected.status])}>{selected.status}</span>
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", selectedNivelMeta.chip)}>
                    <span aria-hidden>{selectedNivelMeta.emoji}</span>{selectedNivelMeta.label}
                  </span>
                </div>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="rounded-md p-1.5 hover:bg-surface"><X className="h-4 w-4" /></button>
            </div>

            <div className="p-5">
              <Tabs defaultValue="execucao">
                <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-surface">
                  <TabsTrigger value="execucao">Execução</TabsTrigger>
                  <TabsTrigger value="cadencia">Cadência</TabsTrigger>
                  <TabsTrigger value="interacoes">Interações</TabsTrigger>
                  <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
                  <TabsTrigger value="visitas">Visitas</TabsTrigger>
                  <TabsTrigger value="qualificacao">Qualificação</TabsTrigger>
                  <TabsTrigger value="scripts">Scripts</TabsTrigger>
                  <TabsTrigger value="historico">Histórico</TabsTrigger>
                </TabsList>

                <TabsContent value="execucao" className="space-y-4">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                    <div className="text-[11px] uppercase tracking-widest text-emerald-800">Próxima ação recomendada</div>
                    <div className="mt-2 text-base font-medium">
                      {selectedAcao.tipo !== "nenhum" ? `${selectedAcao.label} ${primeiroNome}` : "Sem ação imediata"}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{subtextoUrg}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">Tarefas de hoje</div>
                    <ul className="mt-2 space-y-1.5 text-sm">
                      {selectedAcao.tipo !== "nenhum" ? (
                        <li className="rounded-md border border-border px-3 py-2">{selectedAcao.label} — {primeiroNome}</li>
                      ) : (
                        <li className="text-muted-foreground">Sem tarefas para hoje.</li>
                      )}
                    </ul>
                  </div>
                  {isAtrasado(selected) && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-red-700">Tarefas atrasadas</div>
                      <ul className="mt-2 space-y-1.5 text-sm">
                        <li className="rounded-md border border-red-200 bg-red-50/50 px-3 py-2 text-red-800">
                          {selectedAcao.label} — atrasado há {selected.ultimaInteracao}
                        </li>
                      </ul>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button className="rounded-md bg-navy px-3 py-2 text-xs text-navy-foreground">Avançar etapa</button>
                    <button className="rounded-md border border-border px-3 py-2 text-xs">Registrar interação</button>
                  </div>
                </TabsContent>

                <TabsContent value="cadencia" className="space-y-3">
                  {[1, 2, 3].map((d) => (
                    <div key={d}>
                      <div className="text-xs uppercase tracking-widest text-muted-foreground">Dia {d}</div>
                      <ul className="mt-2 space-y-1.5">
                        {getCadenciaPlano(selected).filter((c) => c.dia === d).map((c, i) => (
                          <li key={i} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                            <span>{c.titulo}</span>
                            <span className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-medium",
                              c.status === "concluido" ? "bg-emerald-50 text-emerald-700" :
                              c.status === "atrasado" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"
                            )}>
                              {c.status === "concluido" ? "Concluído" : c.status === "atrasado" ? "Atrasado" : "Pendente"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="interacoes">
                  <ol className="space-y-3">
                    {selected.historico.map((h, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <div className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", i === 0 ? "bg-brand ring-2 ring-brand/20" : "bg-muted-foreground/40")} />
                        <div>
                          <div className="text-xs text-muted-foreground">{h.data} · {h.tipo} · Ramon</div>
                          <div className={cn(i === 0 && "font-medium")}>{h.texto}</div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </TabsContent>

                <TabsContent value="whatsapp" className="space-y-3">
                  <div className="rounded-md border border-border p-3 text-sm">
                    <div className="text-xs text-muted-foreground">Última mensagem</div>
                    <div className="mt-1">{selected.historico.find((h) => h.tipo === "WhatsApp")?.texto ?? "Sem mensagens registradas."}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Mensagem sugerida</div>
                    <textarea
                      defaultValue={`Oi ${primeiroNome}, tudo bem? Separei algumas opções que combinam com o que você procura. Posso te enviar?`}
                      className="mt-1 h-28 w-full rounded-md border border-border bg-background p-2 text-sm"
                    />
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-xs font-medium text-white">
                    <Send className="h-3.5 w-3.5" /> Enviar mensagem sugerida
                  </button>
                </TabsContent>

                <TabsContent value="visitas">
                  {selected.status === "Visita" ? (
                    <div className="rounded-md border border-border p-3 text-sm">
                      <div className="font-medium">Sábado, 10h</div>
                      <div className="text-muted-foreground">Apartamento em {inferRegiao(selected.interesse)}</div>
                      <div className="mt-2"><span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-800">A confirmar</span></div>
                      <textarea placeholder="Feedback da visita..." className="mt-3 h-20 w-full rounded-md border border-border bg-background p-2 text-sm" />
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                      Nenhuma visita agendada.
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="qualificacao">
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      ["Perfil do cliente", selected.interesse.split(",").slice(0, 2).join(",") || "—"],
                      ["Tipo de imóvel", inferTipo(selected.interesse)],
                      ["Região", inferRegiao(selected.interesse)],
                      ["Orçamento", formatBRL(selected.orcamento)],
                      ["Capacidade financeira", "A confirmar"],
                      ["Prazo de compra", "3-6 meses"],
                      ["Motivação", "Mudança de imóvel"],
                      ["Objeções", "—"],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-md border border-border p-3">
                        <dt className="text-xs text-muted-foreground">{k}</dt>
                        <dd className="mt-0.5 font-medium">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </TabsContent>

                <TabsContent value="scripts" className="space-y-2">
                  {SCRIPTS.map((s) => {
                    const texto = s.texto
                      .replace("{nome}", primeiroNome)
                      .replace("{tipo}", inferTipo(selected.interesse))
                      .replace("{regiao}", inferRegiao(selected.interesse));
                    return (
                      <div key={s.titulo} className="rounded-md border border-border p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                            {s.titulo}
                          </div>
                          <button onClick={() => navigator.clipboard?.writeText(texto)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                            <Copy className="h-3 w-3" /> Copiar
                          </button>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{texto}</p>
                      </div>
                    );
                  })}
                </TabsContent>

                <TabsContent value="historico">
                  <ol className="space-y-3">
                    <li className="flex gap-3 text-sm">
                      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-muted-foreground/40" />
                      <div>
                        <div className="text-xs text-muted-foreground">Etapa atual</div>
                        <div>Lead em <span className="font-medium">{selected.status}</span></div>
                      </div>
                    </li>
                    {selected.historico.map((h, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-muted-foreground/40" />
                        <div>
                          <div className="text-xs text-muted-foreground">{h.data} · {h.tipo}</div>
                          <div>{h.texto}</div>
                        </div>
                      </li>
                    ))}
                    <li className="flex gap-3 text-sm">
                      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-muted-foreground/40" />
                      <div>
                        <div className="text-xs text-muted-foreground">Origem</div>
                        <div>Lead criado via {selected.origem}</div>
                      </div>
                    </li>
                  </ol>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
