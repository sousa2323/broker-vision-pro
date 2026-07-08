import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Plus, Target, Brain, AlertTriangle, Clock, ListChecks, Activity, Zap, Loader2 } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { useLeads, type Lead } from "@/lib/leads";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/pipeline")({
  component: PipelinePage,
});

type StageId = "Novo" | "Qualificado" | "Visita" | "Proposta" | "Fechado";
type Card = {
  id: string;
  cliente: string;
  imovel: string;
  valor: number;
  dias: number;
  tag?: string;
  proximaAcao?: string;
};
type Stage = { id: StageId; cards: Card[]; color: string };

const STAGE_ORDER: { id: StageId; color: string }[] = [
  { id: "Novo", color: "bg-slate-200" },
  { id: "Qualificado", color: "bg-blue-200" },
  { id: "Visita", color: "bg-amber-200" },
  { id: "Proposta", color: "bg-violet-200" },
  { id: "Fechado", color: "bg-emerald-200" },
];

function daysSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

function shortInteresse(s: string): string {
  if (!s) return "—";
  return s.length > 46 ? s.slice(0, 46).trimEnd() + "…" : s;
}

/** Converte os leads reais em colunas do pipeline (exclui "Perdido"). */
function buildStages(leads: Lead[]): Stage[] {
  return STAGE_ORDER.map(({ id, color }) => ({
    id,
    color,
    cards: leads
      .filter((l) => l.status === id)
      .map<Card>((l) => ({
        id: l.id,
        cliente: l.nome,
        imovel: shortInteresse(l.interesse),
        valor: l.orcamento,
        dias: daysSince(l.lastInteractionAt),
      })),
  }));
}

type Urgencia = "ok" | "atencao" | "urgente";
function getUrgencia(dias: number): Urgencia {
  if (dias <= 1) return "ok";
  if (dias <= 3) return "atencao";
  return "urgente";
}

const COMISSAO_RATE = 0.03;
function getComissao(valor: number) {
  return valor * COMISSAO_RATE;
}

function urgenciaLabel(dias: number): string {
  if (dias === 0) return "Última ação hoje";
  if (dias <= 1) return `Há ${dias}d`;
  if (dias <= 3) return `Sem interação há ${dias}d`;
  return `Sem interação há ${dias}d · agir`;
}

const urgenciaClass: Record<Urgencia, string> = {
  ok: "bg-slate-100 text-slate-600",
  atencao: "bg-amber-50 text-amber-800 border border-amber-100",
  urgente: "bg-red-50 text-red-700 border border-red-100",
};

// ============= Operational intelligence helpers (derived) =============

function getScoreOperacional(c: Card, stageId: StageId): number {
  let score = 50;
  if (c.valor >= 3_000_000) score += 20;
  else if (c.valor >= 1_500_000) score += 14;
  else if (c.valor >= 800_000) score += 8;
  else score += 3;
  if (stageId === "Proposta") score += 18;
  else if (stageId === "Visita") score += 12;
  else if (stageId === "Qualificado") score += 6;
  else if (stageId === "Fechado") score += 10;
  if (c.dias >= 6) score -= 18;
  else if (c.dias >= 4) score -= 10;
  else if (c.dias >= 2) score -= 4;
  else score += 4;
  if (c.tag) {
    const t = c.tag.toLowerCase();
    if (t.includes("score")) score += 6;
    if (t.includes("à vista") || t.includes("a vista")) score += 10;
    if (t.includes("ia")) score += 4;
    if (/h\b|sábado|domingo|hoje/.test(t)) score += 6;
  }
  return Math.max(10, Math.min(99, Math.round(score)));
}

type Risco = "baixo" | "medio" | "alto";
function getRiscoPerda(c: Card, stageId: StageId): Risco {
  if (stageId === "Fechado") return "baixo";
  if (stageId === "Proposta") {
    if (c.dias >= 2) return "alto";
    if (c.dias >= 1) return "medio";
    return "baixo";
  }
  if (stageId === "Visita") {
    if (c.dias >= 5) return "alto";
    if (c.dias >= 3) return "medio";
    return "baixo";
  }
  if (stageId === "Qualificado") {
    if (c.dias >= 5) return "alto";
    if (c.dias >= 3) return "medio";
    return "baixo";
  }
  if (c.dias >= 2) return "medio";
  return "baixo";
}

const riscoClass: Record<Risco, string> = {
  baixo: "bg-slate-100 text-slate-600",
  medio: "bg-amber-50 text-amber-800 border border-amber-100",
  alto: "bg-red-50 text-red-700 border border-red-100",
};
const riscoLabel: Record<Risco, string> = {
  baixo: "Baixo risco",
  medio: "Médio risco",
  alto: "Alto risco",
};

function getPrioridade(c: Card, stageId: StageId): boolean {
  if (stageId === "Fechado") return false;
  if (c.valor >= 1_500_000 && (stageId === "Visita" || stageId === "Proposta")) return true;
  if (stageId === "Proposta" && c.dias >= 1) return true;
  if (stageId === "Visita" && c.tag) return true;
  if (getScoreOperacional(c, stageId) >= 85) return true;
  if (getRiscoPerda(c, stageId) === "alto") return true;
  return false;
}

function getComandoAcao(c: Card, stageId: StageId): string {
  if (stageId === "Fechado") return "Iniciar pós-venda";
  if (stageId === "Proposta") return c.dias >= 1 ? "Cobrar decisão" : "Acompanhar proposta";
  if (stageId === "Visita") {
    if (c.tag && /h\b|sábado|domingo|hoje/i.test(c.tag)) return "Confirmar visita";
    if (c.dias >= 3) return "Reagendar visita";
    return "Enviar proposta";
  }
  if (stageId === "Qualificado") {
    if (c.dias >= 4) return "Ligar agora";
    return "Agendar visita";
  }
  if (c.dias === 0) return "Ligar agora";
  if (c.dias >= 2) return "Enviar imóveis";
  return "Qualificar lead";
}

function getMotivoPrioridade(c: Card, stageId: StageId): string {
  if (stageId === "Visita" && c.tag) return `Visita ${c.tag.toLowerCase()}`;
  if (stageId === "Proposta") {
    if (c.dias === 0) return "Proposta enviada hoje";
    return `${c.dias}d sem retorno do cliente`;
  }
  if (stageId === "Visita" && c.dias >= 4) return `${c.dias}d sem confirmação`;
  if (stageId === "Qualificado" && c.dias >= 4) return `Lead quente parado há ${c.dias}d`;
  if (stageId === "Novo" && c.dias === 0) return "Lead novo aguardando abordagem";
  if (c.dias >= 4) return `Sem interação há ${c.dias}d`;
  return "Oportunidade prioritária";
}

type FilaItem = { card: Card; stageId: StageId; score: number };
function buildFilaDoDia(stages: Stage[]): FilaItem[] {
  const items: FilaItem[] = [];
  for (const s of stages) {
    if (s.id === "Fechado") continue;
    for (const c of s.cards) {
      const score = getScoreOperacional(c, s.id);
      const isVisitaHoje = s.id === "Visita" && !!c.tag;
      const isPropostaParada = s.id === "Proposta" && c.dias >= 1;
      const isAtrasado = c.dias >= 4;
      const isLeadNovo = s.id === "Novo" && c.dias === 0;
      const isQualificadoQuente = s.id === "Qualificado" && score >= 70;
      if (isVisitaHoje || isPropostaParada || isAtrasado || isLeadNovo || isQualificadoQuente) {
        items.push({ card: c, stageId: s.id, score });
      }
    }
  }
  const weight = (it: FilaItem) => {
    let w = it.score;
    if (it.stageId === "Visita" && it.card.tag) w += 30;
    if (it.stageId === "Proposta" && it.card.dias >= 1) w += 25;
    if (it.card.dias >= 4) w += 15;
    if (it.stageId === "Novo" && it.card.dias === 0) w += 8;
    return w;
  };
  return items.sort((a, b) => weight(b) - weight(a)).slice(0, 5);
}

function PipelinePage() {
  const { leads, loading } = useLeads();
  const stages = useMemo(() => buildStages(leads), [leads]);

  const allCards = stages.flatMap((s) => s.cards.map((c) => ({ c, stageId: s.id })));
  const allValues = stages.flatMap((s) => s.cards);
  const totalVgv = allValues.reduce((a, b) => a + b.valor, 0);
  const totalCount = allValues.length;

  const proximasFechamento = stages.reduce((acc, s) => {
    if (s.id === "Proposta") return acc + s.cards.length;
    if (s.id === "Visita") return acc + s.cards.filter((c) => c.valor >= 1_500_000).length;
    return acc;
  }, 0);

  const fila = buildFilaDoDia(stages);

  const ativas = stages
    .filter((s) => s.id !== "Fechado")
    .reduce((a, s) => a + s.cards.length, 0);
  const negligenciados = allValues.filter((c) => c.dias >= 4).length;
  const cadenciasAtraso = allCards.filter(
    ({ c, stageId }) => (stageId === "Visita" || stageId === "Proposta") && c.dias >= 3,
  ).length;
  const propostasAbertas = stages.find((s) => s.id === "Proposta")?.cards.length ?? 0;
  const taxaConversao = totalCount > 0
    ? Math.round(((stages.find((s) => s.id === "Fechado")?.cards.length ?? 0) / totalCount) * 100)
    : 0;

  if (loading) {
    return (
      <div className="grid place-items-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl">Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            {totalCount} {totalCount === 1 ? "oportunidade" : "oportunidades"} · VGV {formatBRL(totalVgv)}
          </p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-brand">
            <Target className="h-4 w-4" />
            {proximasFechamento} próximas de fechamento
          </p>
        </div>
        <Link
          to="/app/leads"
          className="inline-flex items-center gap-2 rounded-md bg-navy px-3 py-2 text-sm text-navy-foreground"
        >
          <Plus className="h-4 w-4" /> Nova oportunidade
        </Link>
      </div>

      {totalCount === 0 ? (
        <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-border bg-card py-24 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-surface text-muted-foreground">
            <Target className="h-7 w-7" />
          </div>
          <div className="font-display text-lg">Seu pipeline está vazio</div>
          <p className="max-w-sm text-sm text-muted-foreground">
            Cadastre leads para acompanhá-los pelas etapas até o fechamento.
          </p>
          <Link
            to="/app/leads"
            className="mt-1 inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm text-navy-foreground"
          >
            <Plus className="h-4 w-4" /> Ir para Leads
          </Link>
        </div>
      ) : (
        <>
          {/* Fila Operacional do Dia */}
          <section className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-lg leading-tight">Hoje você precisa executar</h2>
                <p className="text-xs text-muted-foreground">
                  Prioridades operacionais recomendadas pela Ubroker IA.
                </p>
              </div>
              <span className="hidden shrink-0 items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand sm:inline-flex">
                <Zap className="h-3 w-3" /> {fila.length} ações priorizadas
              </span>
            </div>
            {fila.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma execução pendente — bom trabalho.</p>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {fila.map(({ card, stageId }) => {
                  const risco = getRiscoPerda(card, stageId);
                  const acao = getComandoAcao(card, stageId);
                  const motivo = getMotivoPrioridade(card, stageId);
                  return (
                    <div
                      key={card.id}
                      className="flex min-w-[260px] max-w-[280px] flex-col rounded-xl border border-border bg-background p-3 shadow-sm transition hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{card.cliente}</div>
                          <div className="mt-0.5 inline-flex items-center rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-medium text-brand">
                            {acao}
                          </div>
                        </div>
                        <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium", riscoClass[risco])}>
                          {riscoLabel[risco]}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-1 text-[11px] text-muted-foreground">{motivo}</p>
                      <div className="mt-2 num text-[12px] font-semibold">{formatBRL(card.valor)}</div>
                      <Link
                        to="/app/leads"
                        className="mt-3 inline-flex h-8 items-center justify-center rounded-md bg-navy px-3 text-xs font-medium text-navy-foreground transition active:scale-[0.98]"
                      >
                        Executar agora
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* KPIs operacionais (reais) */}
          <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              { icon: ListChecks, label: "Oportunidades ativas", value: String(ativas), hint: "em andamento" },
              { icon: Activity, label: "Propostas abertas", value: String(propostasAbertas), hint: "aguardando decisão" },
              { icon: AlertTriangle, label: "Leads negligenciados", value: String(negligenciados), hint: "≥ 4 dias" },
              { icon: Clock, label: "Cadências em atraso", value: String(cadenciasAtraso), hint: "Visita/Proposta" },
              { icon: Brain, label: "Taxa de conversão", value: `${taxaConversao}%`, hint: "fechados/total" },
            ].map((k) => {
              const Icon = k.icon;
              return (
                <div key={k.label} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    <Icon className="h-3 w-3" /> {k.label}
                  </div>
                  <div className="num mt-1 text-[20px] font-semibold leading-tight">{k.value}</div>
                  <div className="text-[10px] text-muted-foreground">{k.hint}</div>
                </div>
              );
            })}
          </section>

          {/* Kanban */}
          <div className="grid auto-cols-[300px] grid-flow-col gap-4 overflow-x-auto pb-4 lg:auto-cols-[1fr] lg:grid-flow-row lg:grid-cols-5">
            {stages.map((s) => {
              const stageVgv = s.cards.reduce((a, b) => a + b.valor, 0);
              return (
                <div key={s.id} className="rounded-2xl bg-card p-3">
                  <div className="flex items-center justify-between px-2 pb-2">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
                      <span className="font-medium">{s.id}</span>
                      <span className="text-xs text-muted-foreground">({s.cards.length})</span>
                    </div>
                    <span className="num text-xs text-muted-foreground">
                      {(stageVgv / 1_000_000).toFixed(1)}mi
                    </span>
                  </div>
                  {s.id === "Proposta" && s.cards.length > 0 && (
                    <div className="mb-2 inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                      Aguardando decisão
                    </div>
                  )}
                  {s.id === "Fechado" && s.cards.length > 0 && (
                    <div className="mb-2 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      Concluídos
                    </div>
                  )}
                  {s.cards.length === 0 ? (
                    <p className="px-2 py-6 text-center text-[11px] text-muted-foreground">Vazio</p>
                  ) : (
                    <ul className="space-y-2">
                      {s.cards.map((c) => {
                        const prioritario = getPrioridade(c, s.id);
                        const urg = getUrgencia(c.dias);
                        const score = getScoreOperacional(c, s.id);
                        const risco = getRiscoPerda(c, s.id);
                        const acao = c.proximaAcao ?? getComandoAcao(c, s.id);
                        const isFechado = s.id === "Fechado";
                        const scoreColor =
                          score >= 80
                            ? "text-emerald-700"
                            : score >= 50
                              ? "text-amber-700"
                              : "text-red-700";
                        return (
                          <li
                            key={c.id}
                            className={cn(
                              "rounded-xl border border-border bg-background p-3 shadow-sm transition hover:shadow-md",
                              prioritario && "border-l-2 border-l-brand shadow-md ring-1 ring-brand/20",
                            )}
                          >
                            <div className="mb-1 flex items-start justify-between gap-2">
                              {prioritario ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-medium text-brand">
                                  Prioritário
                                </span>
                              ) : (
                                <span />
                              )}
                              {isFechado ? (
                                <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                                  Fechado
                                </span>
                              ) : (
                                <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", urgenciaClass[urg])}>
                                  {urgenciaLabel(c.dias)}
                                </span>
                              )}
                            </div>
                            <div className="text-sm font-medium">{c.cliente}</div>
                            <div className="mt-0.5 text-xs text-muted-foreground">{c.imovel}</div>
                            <div className="mt-2 num text-sm font-semibold">{formatBRL(c.valor)}</div>
                            <div className="num text-[11px] text-emerald-700">
                              Comissão est. {formatBRL(getComissao(c.valor))}
                            </div>
                            {!isFechado && (
                              <div className="mt-1.5 flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                  <Brain className="h-3 w-3" />
                                  Score <span className={cn("font-semibold", scoreColor)}>{score}</span>
                                </span>
                                <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", riscoClass[risco])}>
                                  {riscoLabel[risco]}
                                </span>
                              </div>
                            )}
                            <div className="mt-1.5 text-[11px] text-muted-foreground">
                              Ação: <span className="font-semibold text-foreground">{acao}</span>
                            </div>
                            {c.tag && (
                              <div className="mt-2 inline-block rounded-full bg-brand/10 px-2 py-0.5 text-[10px] text-brand">{c.tag}</div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
