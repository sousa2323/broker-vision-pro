import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { iaLogs, adminLeadsOrigem } from "@/data/admin-mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/ia")({
  component: IAAdmin,
});

function IAAdmin() {
  const total = adminLeadsOrigem.find((o) => o.origem === "IA")!;
  const taxa = Math.round((total.qualificados / total.total) * 100);

  const semana = [
    { d: "Seg", v: 240 },
    { d: "Ter", v: 312 },
    { d: "Qua", v: 288 },
    { d: "Qui", v: 360 },
    { d: "Sex", v: 412 },
    { d: "Sáb", v: 184 },
    { d: "Dom", v: 96 },
  ];
  const max = Math.max(...semana.map((s) => s.v));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">IA Assistente</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Performance global do atendimento automatizado.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI label="Leads atendidos" value={total.total.toLocaleString("pt-BR")} />
        <KPI label="Leads qualificados" value={total.qualificados.toLocaleString("pt-BR")} />
        <KPI label="Taxa de qualificação" value={`${taxa}%`} tone="green" />
        <KPI label="Tempo médio resposta" value="42s" />
      </section>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" /> Atendimentos por dia (semana)
        </div>
        <div className="flex items-end gap-3 h-40">
          {semana.map((s) => (
            <div key={s.d} className="flex flex-1 flex-col items-center gap-2">
              <div className="num text-xs text-muted-foreground">{s.v}</div>
              <div
                className="w-full rounded-t-md bg-navy"
                style={{ height: `${(s.v / max) * 100}%` }}
              />
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {s.d}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Logs de atendimento
        </div>
        <table className="w-full text-sm">
          <thead className="bg-surface">
            <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Lead</th>
              <th className="px-4 py-3">Canal</th>
              <th className="px-4 py-3 text-right">Score</th>
              <th className="px-4 py-3">Resultado</th>
              <th className="px-4 py-3">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {iaLogs.map((l) => (
              <tr key={l.id} className="hover:bg-surface/60">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{l.id}</td>
                <td className="px-4 py-3 font-medium">{l.lead}</td>
                <td className="px-4 py-3 text-muted-foreground">{l.canal}</td>
                <td className="px-4 py-3 text-right num">{l.score}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs",
                      l.resultado === "Qualificado" && "bg-emerald-50 text-emerald-700",
                      l.resultado === "Em qualificação" && "bg-amber-50 text-amber-700",
                      l.resultado === "Descartado" && "bg-red-50 text-red-700",
                    )}
                  >
                    {l.resultado}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{l.data}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KPI({ label, value, tone }: { label: string; value: string; tone?: "green" }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className={cn("mt-2 num font-display text-2xl", tone === "green" && "text-emerald-700")}>
        {value}
      </div>
    </div>
  );
}
