import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Calendar, ClipboardCheck, Filter, Flame, MessageCircle, Phone, Plus, Search, Send, Snowflake, Wallet, Zap } from "lucide-react";
import { leads, type Lead, type LeadOrigin, type LeadStatus, formatBRL } from "@/data/mock";
import { cn } from "@/lib/utils";

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

const prioridadeMeta: Record<Prioridade, { label: string; chip: string; icon: React.ReactNode }> = {
  quente: { label: "Quente", chip: "bg-red-50 text-red-700 border border-red-100", icon: <Flame className="h-3 w-3" /> },
  morno: { label: "Morno", chip: "bg-amber-50 text-amber-800 border border-amber-100", icon: <Zap className="h-3 w-3" /> },
  frio: { label: "Frio", chip: "bg-sky-50 text-sky-700 border border-sky-100", icon: <Snowflake className="h-3 w-3" /> },
  neutro: { label: "—", chip: "bg-slate-100 text-slate-600 border border-slate-200", icon: null },
};

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

const FILTROS_RAPIDOS = ["Todos", "Hoje", "Atrasados", "Sem contato", "Quentes", "Visitas", "Proposta"] as const;
type FiltroRapido = (typeof FILTROS_RAPIDOS)[number];

function isAtivo(l: Lead) {
  return l.status !== "Fechado" && l.status !== "Perdido";
}
function isAtrasado(l: Lead) {
  const u = l.ultimaInteracao.toLowerCase();
  return isAtivo(l) && (u.includes("dia") || u.includes("semana"));
}
function isHoje(l: Lead) {
  return l.ultimaInteracao.toLowerCase().includes("hoje");
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
function getNivel(
  l: Lead,
  ctx: { topComissao: number; medianaComissao: number }
): Nivel {
  if (!isAtivo(l)) return "baixa";
  const prio = getPrioridade(l.status);
  const urg = getUrgencia(l);
  const com = getComissao(l.orcamento);
  const acaoPendente = l.status !== "Fechado" && l.status !== "Perdido";
  if (urg === "atrasado") return "alta";
  if (prio === "quente" && urg === "hoje") return "alta";
  if (com >= ctx.topComissao && acaoPendente) return "alta";
  if (urg === "hoje") return "media";
  if (prio === "morno" && com >= ctx.medianaComissao) return "media";
  if (prio === "frio") return "baixa";
  return "baixa";
}
function getNivelMeta(n: Nivel) {
  if (n === "alta") return {
    label: "Alta prioridade",
    emoji: "🔴",
    chip: "bg-red-50 text-red-700 border border-red-100",
    border: "border-l-red-500",
  };
  if (n === "media") return {
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
  if (u === "atrasado") return {
    label: `Atrasado há ${l.ultimaInteracao}`,
    chip: "bg-red-50 text-red-700 border-red-100",
    dot: "bg-red-500",
    border: "border-l-red-500",
  };
  if (u === "hoje") return {
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

function LeadsPage() {
  const [selected, setSelected] = useState<Lead>(leads[0]);
  const [filtroRapido, setFiltroRapido] = useState<FiltroRapido>("Todos");

  const aFazerHoje = leads.filter((l) => isAtivo(l) && (isHoje(l) || l.status === "Qualificado" || l.status === "Proposta")).length;
  const atrasados = leads.filter(isAtrasado).length;
  const semContato = leads.filter((l) => l.status === "Novo").length;
  const visitasHoje = Math.max(1, leads.filter((l) => l.status === "Visita" && isHoje(l)).length);

  const comissoesAtivas = leads.filter(isAtivo).map((l) => getComissao(l.orcamento)).sort((a, b) => b - a);
  const topComissao = comissoesAtivas[Math.max(0, Math.floor(comissoesAtivas.length * 0.2) - 1)] ?? Infinity;
  const medianaComissao = comissoesAtivas[Math.floor(comissoesAtivas.length / 2)] ?? 0;
  const nivelCtx = { topComissao, medianaComissao };

  const leadsFiltrados = leads
    .filter((l) => {
      switch (filtroRapido) {
        case "Hoje": return isHoje(l);
        case "Atrasados": return isAtrasado(l);
        case "Sem contato": return l.status === "Novo";
        case "Quentes": return getPrioridade(l.status) === "quente";
        case "Visitas": return l.status === "Visita";
        case "Proposta": return l.status === "Proposta";
        default: return true;
      }
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

  const cards = [
    { label: "A fazer hoje", value: aFazerHoje, sub: "Ligações, WhatsApp e follow-ups previstos.", accent: false },
    { label: "Atrasados", value: atrasados, sub: "Leads com ação fora do prazo.", accent: true },
    { label: "Sem contato", value: semContato, sub: "Novos leads ainda sem primeira abordagem.", accent: false },
    { label: "Visitas hoje", value: visitasHoje, sub: "Atendimentos confirmados para hoje.", accent: false },
  ];

  const selectedAcao = getProximaAcao(selected);
  const selectedUrg = getUrgencia(selected);
  const selectedNivel = getNivel(selected, nivelCtx);
  const selectedNivelMeta = getNivelMeta(selectedNivel);
  const selectedReforco = getReforco(selected);
  const selectedPrio = getPrioridade(selected.status);
  const selectedComissao = getComissao(selected.orcamento);
  const primeiroNome = selected.nome.split(" ")[0];
  const subtextoUrg =
    selectedUrg === "atrasado"
      ? `Lead sem resposta há ${selected.ultimaInteracao}`
      : selectedUrg === "hoje"
      ? "Ação prevista para hoje"
      : "Sem prazo imediato";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl">Leads</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Sua central diária de execução comercial. Priorize contatos, acompanhe atrasos e avance oportunidades.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-navy px-3 py-2 text-sm text-navy-foreground">
          <Plus className="h-4 w-4" /> Novo lead
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className={cn(
              "rounded-xl border bg-card px-4 py-3",
              c.accent ? "border-red-200 bg-red-50/40" : "border-border"
            )}
          >
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{c.label}</div>
            <div className={cn("mt-1 text-2xl font-semibold leading-none", c.accent && "text-red-700")}>{c.value}</div>
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
            <div className="flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm text-muted-foreground">
              <Search className="h-4 w-4" /> Buscar lead
            </div>
            <button className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
              <Filter className="h-4 w-4" /> Filtros
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Potencial</th>
                  <th className="px-4 py-3">Próxima ação</th>
                  <th className="px-4 py-3">Prazo</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Origem</th>
                </tr>
              </thead>
              <tbody>
                {leadsFiltrados.map((l) => {
                  const prio = getPrioridade(l.status);
                  const meta = prioridadeMeta[prio];
                  const acao = getProximaAcao(l);
                  const urg = getUrgencia(l);
                  const urgMeta = getUrgenciaMeta(urg, l);
                  const qualificada = isOrigemQualificada(l.origem);
                  const comissao = getComissao(l.orcamento);
                  return (
                    <tr
                      key={l.id}
                      onClick={() => setSelected(l)}
                      className={cn(
                        "cursor-pointer border-b border-l-4 border-border transition hover:bg-surface",
                        urgMeta.border,
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
                              {prio !== "neutro" && (
                                <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium", meta.chip)}>
                                  {meta.icon}
                                  {meta.label}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground/70">{l.id}</div>
                          </div>
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
                        {acao.tipo === "nenhum" ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
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
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium", urgMeta.chip)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", urgMeta.dot)} />
                          {urgMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs", statusColor[l.status])}>{l.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm">
                          <span className="truncate">{l.origem}</span>
                          {qualificada && (
                            <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] font-medium uppercase tracking-wider text-amber-800">qual.</span>
                          )}
                        </div>
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
              {selectedPrio !== "neutro" && (
                <span className={cn("mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", prioridadeMeta[selectedPrio].chip)}>
                  {prioridadeMeta[selectedPrio].icon}
                  {prioridadeMeta[selectedPrio].label}
                </span>
              )}
            </div>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs", statusColor[selected.status])}>{selected.status}</span>
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div>{selected.email}</div>
            <div>{selected.telefone}</div>
          </div>

          {/* Bloco principal: Oportunidade + ação */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-emerald-800">
              <Wallet className="h-3.5 w-3.5" /> Potencial
            </div>
            <div className="num mt-1 text-2xl font-semibold text-emerald-700">{formatBRL(selectedComissao)}</div>
            {selectedAcao.tipo !== "nenhum" && (
              <div className="mt-3 flex items-center gap-2 text-sm font-medium text-foreground">
                <span className="text-emerald-700">➡️</span>
                {selectedAcao.label} {primeiroNome}
              </div>
            )}
            <div className="mt-1 text-xs text-muted-foreground">{subtextoUrg}</div>
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

          <div>
            <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Histórico</div>
            <ol className="space-y-3">
              {selected.historico.map((h, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <div className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", i === 0 ? "bg-brand ring-2 ring-brand/20" : "bg-muted-foreground/40")} />
                  <div>
                    <div className="text-xs text-muted-foreground">{h.data} · {h.tipo}</div>
                    <div className={cn(i === 0 && "font-medium")}>{h.texto}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
