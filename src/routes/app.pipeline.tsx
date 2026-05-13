import { createFileRoute } from "@tanstack/react-router";
import { Plus, Target, Brain, AlertTriangle, Clock, ListChecks, Activity, Zap } from "lucide-react";
import { formatBRL } from "@/data/mock";
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

const stages: { id: StageId; cards: Card[]; color: string }[] = [
  {
    id: "Novo", color: "bg-slate-200",
    cards: [
      { id: "P-1", cliente: "Felipe Goulart", imovel: "Apto 2 suítes Icaraí", valor: 1_400_000, dias: 0, tag: "IA qualificando" },
      { id: "P-2", cliente: "Renata Couto", imovel: "Apto 2 quartos Santa Rosa", valor: 550_000, dias: 1 },
      { id: "P-3", cliente: "Tatiana Reis", imovel: "Apto 2 quartos Ingá", valor: 620_000, dias: 1 },
      { id: "P-4", cliente: "Vanessa Ribeiro", imovel: "Loft Centro", valor: 690_000, dias: 1 },
      { id: "P-5", cliente: "Marcelo Pinheiro", imovel: "2 unidades temporada", valor: 1_200_000, dias: 0 },
      { id: "P-6", cliente: "Bruno Tavares (recompra)", imovel: "Apto 1 quarto Icaraí", valor: 480_000, dias: 2 },
    ],
  },
  {
    id: "Qualificado", color: "bg-blue-200",
    cards: [
      { id: "P-7", cliente: "João Mendes", imovel: "Apto 3 quartos Icaraí", valor: 1_000_000, dias: 3, tag: "Score 87" },
      { id: "P-8", cliente: "Ana Beatriz Souza", imovel: "Apto reformar Ingá", valor: 950_000, dias: 4 },
      { id: "P-9", cliente: "Patrícia Lemos", imovel: "Apto 3 quartos São Francisco", valor: 1_100_000, dias: 2 },
      { id: "P-10", cliente: "Larissa Moura", imovel: "Apto 3 quartos Pendotiba", valor: 720_000, dias: 5 },
      { id: "P-11", cliente: "Sr. Aristides Coelho", imovel: "Permuta + Apto Icaraí", valor: 900_000, dias: 6 },
    ],
  },
  {
    id: "Visita", color: "bg-amber-200",
    cards: [
      { id: "P-12", cliente: "Camila Andrade", imovel: "Cobertura Marine Building", valor: 1_590_000, dias: 4, tag: "Sábado 10h", proximaAcao: "confirmar visita sábado" },
      { id: "P-13", cliente: "Eduardo Bastos", imovel: "Sala 1208 Centro Empresarial", valor: 820_000, dias: 2 },
      { id: "P-14", cliente: "Família Okamura", imovel: "Casa Camboinhas Beach", valor: 3_450_000, dias: 7 },
      { id: "P-15", cliente: "Família Castilho", imovel: "Casa Piratininga Sul", valor: 2_790_000, dias: 3 },
    ],
  },
  {
    id: "Proposta", color: "bg-violet-200",
    cards: [
      { id: "P-16", cliente: "Roberto e Lúcia Tavares", imovel: "Casa Itaipu", valor: 1_150_000, dias: 1, proximaAcao: "follow-up de decisão" },
      { id: "P-17", cliente: "Gustavo e Helena", imovel: "Apto Charitas", valor: 1_420_000, dias: 2 },
      { id: "P-18", cliente: "Dr. Carlos Andrade", imovel: "Cobertura Jardim Icaraí", valor: 4_000_000, dias: 0, tag: "À vista" },
    ],
  },
  {
    id: "Fechado", color: "bg-emerald-200",
    cards: [
      { id: "P-19", cliente: "Sofia Caldas", imovel: "Cobertura Linear Icaraí", valor: 2_100_000, dias: 12 },
      { id: "P-20", cliente: "Igor Mascarenhas", imovel: "Studio São Francisco", valor: 380_000, dias: 8 },
    ],
  },
];

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

const proximaAcaoDefault: Record<StageId, string> = {
  Novo: "qualificar lead",
  Qualificado: "agendar visita",
  Visita: "enviar proposta",
  Proposta: "follow-up de decisão",
  Fechado: "iniciar pós-venda",
};

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

// ============= Operational intelligence helpers (derived from mock) =============

function getScoreOperacional(c: Card, stageId: StageId): number {
  let score = 50;
  // VGV weight
  if (c.valor >= 3_000_000) score += 20;
  else if (c.valor >= 1_500_000) score += 14;
  else if (c.valor >= 800_000) score += 8;
  else score += 3;
  // Stage weight
  if (stageId === "Proposta") score += 18;
  else if (stageId === "Visita") score += 12;
  else if (stageId === "Qualificado") score += 6;
  else if (stageId === "Fechado") score += 10;
  // Inactivity penalty
  if (c.dias >= 6) score -= 18;
  else if (c.dias >= 4) score -= 10;
  else if (c.dias >= 2) score -= 4;
  else score += 4;
  // Tag boosts
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
  // Novo
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
  // Novo
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
function buildFilaDoDia(): FilaItem[] {
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
  // Priority weighting
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
  const allCards = stages.flatMap((s) => s.cards.map((c) => ({ c, stageId: s.id })));
  const allValues = stages.flatMap((s) => s.cards);
  const totalVgv = allValues.reduce((a, b) => a + b.valor, 0);
  const totalCount = allValues.length;

  const proximasFechamento = stages.reduce((acc, s) => {
    if (s.id === "Proposta") return acc + s.cards.length;
    if (s.id === "Visita") return acc + s.cards.filter((c) => c.valor >= 1_500_000).length;
    return acc;
  }, 0);

  const fila = buildFilaDoDia();

  // Operational KPIs (derived)
  const negligenciados = allValues.filter((c) => c.dias >= 4).length;
  const cadenciasAtraso = allCards.filter(
    ({ c, stageId }) => (stageId === "Visita" || stageId === "Proposta") && c.dias >= 3
  ).length;
  const totalTarefasDia = fila.length + cadenciasAtraso + 8; // mock-coherent baseline
  const concluidasDia = Math.max(0, totalTarefasDia - fila.length - 2);
  const taxaExecucao = Math.round((concluidasDia / totalTarefasDia) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl">Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            {totalCount} oportunidades · VGV {formatBRL(totalVgv)}
          </p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-brand">
            <Target className="h-4 w-4" />
            {proximasFechamento} oportunidades próximas de fechamento
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-navy px-3 py-2 text-sm text-navy-foreground">
          <Plus className="h-4 w-4" /> Nova oportunidade
        </button>
      </div>

      {/* ============= Fila Operacional do Dia ============= */}
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
                  <button className="mt-3 inline-flex h-8 items-center justify-center rounded-md bg-navy px-3 text-xs font-medium text-navy-foreground transition active:scale-[0.98]">
                    Executar agora
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ============= KPIs operacionais ============= */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { icon: ListChecks, label: "Execução do dia", value: `${concluidasDia}/${totalTarefasDia}`, hint: "tarefas" },
          { icon: Clock, label: "Tempo médio resp.", value: "1h42", hint: "últimos 7d" },
          { icon: AlertTriangle, label: "Leads negligenciados", value: String(negligenciados), hint: "≥ 4 dias" },
          { icon: Activity, label: "Cadências em atraso", value: String(cadenciasAtraso), hint: "Visita/Proposta" },
          { icon: Brain, label: "Taxa de execução", value: `${taxaExecucao}%`, hint: "operacional" },
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

      {/* ============= Kanban ============= */}
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
              {s.id === "Proposta" && (
                <div className="mb-2 inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                  Aguardando decisão
                </div>
              )}
              {s.id === "Fechado" && (
                <div className="mb-2 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                  Concluídos no mês
                </div>
              )}
              <ul className="space-y-2">
                {s.cards.map((c) => {
                  const prioritario = getPrioridade(c, s.id);
                  const urg = getUrgencia(c.dias);
                  const score = getScoreOperacional(c, s.id);
                  const risco = getRiscoPerda(c, s.id);
                  const acao = c.proximaAcao ?? getComandoAcao(c, s.id);
                  const isFechado = s.id === "Fechado";
                  const fallbackProxima = c.proximaAcao ?? proximaAcaoDefault[s.id];
                  void fallbackProxima;
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
                        prioritario && "border-l-2 border-l-brand shadow-md ring-1 ring-brand/20"
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
                            Fechado em {c.dias}d
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
