import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Filter, Plus, Search } from "lucide-react";
import { leads, type Lead, formatBRL } from "@/data/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/leads")({
  component: LeadsPage,
});

const statusColor: Record<string, string> = {
  Novo: "bg-slate-100 text-slate-800",
  Qualificado: "bg-blue-50 text-blue-700",
  Visita: "bg-amber-50 text-amber-800",
  Proposta: "bg-violet-50 text-violet-800",
  Fechado: "bg-emerald-50 text-emerald-800",
  Perdido: "bg-rose-50 text-rose-700",
};

function LeadsPage() {
  const [selected, setSelected] = useState<Lead>(leads[0]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
      <section className="rounded-2xl border border-border bg-card">
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
                <th className="px-4 py-3">Orçamento</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Atualização</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr
                  key={l.id}
                  onClick={() => setSelected(l)}
                  className={cn(
                    "cursor-pointer border-b border-border transition hover:bg-surface",
                    selected.id === l.id && "bg-surface"
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-surface text-xs font-medium">
                        {l.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <div className="font-medium">{l.nome}</div>
                        <div className="text-xs text-muted-foreground">{l.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{l.origem}</div>
                    {l.origemDetalhe && <div className="text-xs text-muted-foreground">{l.origemDetalhe}</div>}
                  </td>
                  <td className="num px-4 py-3">{formatBRL(l.orcamento)}</td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs", statusColor[l.status])}>{l.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{l.ultimaInteracao}</td>
                </tr>
              ))}
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
          </div>
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs", statusColor[selected.status])}>{selected.status}</span>
        </div>
        <div className="space-y-1 text-sm text-muted-foreground">
          <div>{selected.email}</div>
          <div>{selected.telefone}</div>
        </div>
        <div className="rounded-xl bg-surface p-4">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Origem</div>
          <div className="mt-1 text-sm">{selected.origem}{selected.origemDetalhe ? ` · ${selected.origemDetalhe}` : ""}</div>
        </div>
        <div className="rounded-xl border border-border p-4">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Interesse</div>
          <p className="mt-2 text-sm leading-relaxed">{selected.interesse}</p>
          <div className="mt-3 num text-sm font-medium">Orçamento {formatBRL(selected.orcamento)}</div>
        </div>
        <div>
          <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Histórico</div>
          <ol className="space-y-3">
            {selected.historico.map((h, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" />
                <div>
                  <div className="text-xs text-muted-foreground">{h.data} · {h.tipo}</div>
                  <div>{h.texto}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button className="rounded-md bg-navy px-3 py-2 text-sm text-navy-foreground">Registrar contato</button>
          <button className="rounded-md border border-border px-3 py-2 text-sm">Ver no pipeline</button>
        </div>
      </aside>
    </div>
  );
}
