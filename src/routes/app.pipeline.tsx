import { createFileRoute } from "@tanstack/react-router";
import { Plus, Target } from "lucide-react";
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

function isDestaque(card: Card, stageId: StageId) {
  return (stageId === "Visita" || stageId === "Proposta") && card.valor >= 1_500_000;
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

function PipelinePage() {
  const allCards = stages.flatMap((s) => s.cards);
  const totalVgv = allCards.reduce((a, b) => a + b.valor, 0);
  const totalCount = allCards.length;

  const proximasFechamento = stages.reduce((acc, s) => {
    if (s.id === "Proposta") return acc + s.cards.length;
    if (s.id === "Visita") return acc + s.cards.filter((c) => c.valor >= 1_500_000).length;
    return acc;
  }, 0);

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
                  const destaque = isDestaque(c, s.id);
                  const urg = getUrgencia(c.dias);
                  const proxima = c.proximaAcao ?? proximaAcaoDefault[s.id];
                  const isFechado = s.id === "Fechado";
                  return (
                    <li
                      key={c.id}
                      className={cn(
                        "rounded-xl border border-border bg-background p-3 shadow-sm transition hover:shadow-md",
                        destaque && "ring-1 ring-brand/40 shadow-md"
                      )}
                    >
                      <div className="mb-1 flex items-start justify-between gap-2">
                        {destaque ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-medium text-brand">
                            🎯 Foco
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
                      <div className="mt-1.5 text-[11px] text-muted-foreground">
                        Próximo passo: <span className="font-medium text-foreground">{proxima}</span>
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
