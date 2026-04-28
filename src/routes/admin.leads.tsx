import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { leads, formatBRL } from "@/data/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/leads")({
  component: LeadsAdmin,
});

const corretores = ["Ramon Capone", "Alessandra Freixo", "Aldemar Souza", "Denise Molinaro", "Pedro Verissimo", "Beatriz Lemos"];

type FiltroOrigem = "Todos" | "IA" | "Inbox" | "Marketplace" | "Indicação";

function LeadsAdmin() {
  const [filtro, setFiltro] = useState<FiltroOrigem>("Todos");

  // Map origem do mock para origem admin (IA / Inbox / Marketplace / Indicação)
  const origemMap = (o: string): "IA" | "Inbox" | "Marketplace" | "Indicação" => {
    if (o === "Marketplace") return "Marketplace";
    if (o === "Indicação") return "Indicação";
    if (o === "WhatsApp" || o === "Instagram") return "Inbox";
    return "IA";
  };

  const lista = leads.filter((l) => filtro === "Todos" || origemMap(l.origem) === filtro);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Leads</h1>
        <p className="mt-1 text-sm text-muted-foreground">Todos os leads gerados pela plataforma.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["Todos", "IA", "Inbox", "Marketplace", "Indicação"] as FiltroOrigem[]).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition",
              filtro === f ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-surface">
            <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Lead</th>
              <th className="px-4 py-3">Origem</th>
              <th className="px-4 py-3">Corretor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Orçamento</th>
              <th className="px-4 py-3">Última interação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {lista.map((l, i) => (
              <tr key={l.id} className="hover:bg-surface/60">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{l.id}</td>
                <td className="px-4 py-3 font-medium">{l.nome}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{origemMap(l.origem)}</span></td>
                <td className="px-4 py-3 text-muted-foreground">{corretores[i % corretores.length]}</td>
                <td className="px-4 py-3 text-xs">{l.status}</td>
                <td className="px-4 py-3 text-right num">{formatBRL(l.orcamento)}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{l.ultimaInteracao}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
