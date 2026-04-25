import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Filter, Flame, Plus, Search, Snowflake, Sparkles, Zap } from "lucide-react";
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

const prioridadeMeta: Record<Prioridade, { label: string; chip: string; border: string; icon: React.ReactNode }> = {
  quente: {
    label: "Quente",
    chip: "bg-red-50 text-red-700 border border-red-100",
    border: "border-l-red-500",
    icon: <Flame className="h-3 w-3" />,
  },
  morno: {
    label: "Morno",
    chip: "bg-amber-50 text-amber-800 border border-amber-100",
    border: "border-l-amber-400",
    icon: <Zap className="h-3 w-3" />,
  },
  frio: {
    label: "Frio",
    chip: "bg-sky-50 text-sky-700 border border-sky-100",
    border: "border-l-sky-300",
    icon: <Snowflake className="h-3 w-3" />,
  },
  neutro: {
    label: "—",
    chip: "bg-slate-100 text-slate-600 border border-slate-200",
    border: "border-l-transparent",
    icon: null,
  },
};

const COMISSAO_RATE = 0.03;
function getComissao(orcamento: number) {
  return orcamento * COMISSAO_RATE;
}

function isOrigemQualificada(origem: LeadOrigin) {
  return origem === "Indicação" || origem === "Marketplace";
}

const TIPOS = ["cobertura", "casa", "apartamento", "studio", "loft", "sala", "terreno"];
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
  if (hits.length === 0) return "Niterói / RJ";
  return hits.slice(0, 2).join(" · ");
}

function LeadsPage() {
  const [selected, setSelected] = useState<Lead>(leads[0]);
  const ativos = leads.filter((l) => l.status !== "Fechado" && l.status !== "Perdido").length;

  const selectedPrio = getPrioridade(selected.status);
  const ultimaAcao = selected.historico[0]?.data;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
      <section className="rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between gap-4 border-b border-border bg-surface/40 px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Flame className="h-4 w-4 text-red-500" />
            <span className="text-muted-foreground">Oportunidades em andamento:</span>
            <span className="font-semibold text-foreground">{ativos} leads ativos</span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 border-b border-border p-4">
          <div className="flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm text-muted-foreground">
            <Search className="h-4 w-4" /> Buscar lead
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
              <Filter className="h-4 w-4" /> Filtros
            </button>
            <button className="inline-flex items-center gap-2 rounded-md bg-navy px-3 py-2 text-sm text-navy-foreground">
              <Plus className="h-4 w-4" /> Novo lead
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-4 py-3">Lead</th>
                <th className="px-4 py-3">Origem</th>
                <th className="px-4 py-3">Orçamento & comissão</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Atualização</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => {
                const prio = getPrioridade(l.status);
                const meta = prioridadeMeta[prio];
                const qualificada = isOrigemQualificada(l.origem);
                return (
                  <tr
                    key={l.id}
                    onClick={() => setSelected(l)}
                    className={cn(
                      "cursor-pointer border-b border-l-4 border-border transition hover:bg-surface",
                      meta.border,
                      selected.id === l.id && "bg-surface"
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-surface text-xs font-medium">
                          {l.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{l.nome}</span>
                            {prio !== "neutro" && (
                              <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium", meta.chip)}>
                                {meta.icon}
                                {meta.label}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{l.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {qualificada ? (
                        <div className="inline-flex flex-col rounded-md border border-amber-200 bg-amber-50/60 px-2 py-1">
                          <span className="text-sm text-amber-900">{l.origem}</span>
                          <span className="text-[10px] uppercase tracking-wider text-amber-700">qualificada</span>
                        </div>
                      ) : (
                        <>
                          <div>{l.origem}</div>
                          {l.origemDetalhe && <div className="text-xs text-muted-foreground">{l.origemDetalhe}</div>}
                        </>
                      )}
                    </td>
                    <td className="num px-4 py-3">
                      <div>{formatBRL(l.orcamento)}</div>
                      <div className="text-xs text-emerald-700">Comissão est. {formatBRL(getComissao(l.orcamento))}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs", statusColor[l.status])}>{l.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{l.ultimaInteracao}</td>
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
            <div className="text-xs text-muted-foreground">{selected.id}</div>
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
              <dt className="text-muted-foreground">Orçamento</dt>
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

        {/* Potencial de negócio */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-emerald-800">
            <Sparkles className="h-3.5 w-3.5" /> Potencial de negócio
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <div className="text-[11px] text-muted-foreground">Valor estimado</div>
              <div className="num text-lg font-semibold">{formatBRL(selected.orcamento)}</div>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Comissão estimada</div>
              <div className="num text-lg font-semibold text-emerald-700">{formatBRL(getComissao(selected.orcamento))}</div>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Histórico</div>
            {ultimaAcao && (
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
                Última ação: {ultimaAcao}
              </span>
            )}
          </div>
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
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button className="rounded-md bg-navy px-3 py-2 text-sm text-navy-foreground">Registrar interação</button>
          <button className="rounded-md border border-border px-3 py-2 text-sm">Mover para pipeline</button>
        </div>
      </aside>
    </div>
  );
}
