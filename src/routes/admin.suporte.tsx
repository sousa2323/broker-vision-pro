import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, ShieldAlert, Search } from "lucide-react";
import { disputas, bypassAlertas } from "@/data/admin-mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/suporte")({
  component: SuporteAdmin,
});

type Tab = "disputas" | "contestacoes" | "bypass";

function SuporteAdmin() {
  const [tab, setTab] = useState<Tab>("disputas");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Suporte / Disputas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Casos abertos entre corretores, contestações e bypass.
        </p>
      </div>

      <div className="flex items-center gap-1 border-b border-border">
        <TabBtn active={tab === "disputas"} onClick={() => setTab("disputas")}>
          Disputas ({disputas.length})
        </TabBtn>
        <TabBtn active={tab === "contestacoes"} onClick={() => setTab("contestacoes")}>
          Contestações de venda
        </TabBtn>
        <TabBtn active={tab === "bypass"} onClick={() => setTab("bypass")}>
          Possíveis bypass ({bypassAlertas.length})
        </TabBtn>
      </div>

      {tab === "disputas" && (
        <div className="grid gap-3 lg:grid-cols-2">
          {disputas.map((d) => (
            <div key={d.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">
                    {d.id} · {d.data}
                  </div>
                  <div className="mt-1 font-display text-lg">
                    {d.partes[0]} <span className="text-muted-foreground">vs</span> {d.partes[1]}
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs",
                    d.status === "Aberta" && "bg-red-50 text-red-700",
                    d.status === "Em análise" && "bg-amber-50 text-amber-700",
                    d.status === "Resolvida" && "bg-emerald-50 text-emerald-700",
                  )}
                >
                  {d.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{d.motivo}</p>
              <div className="mt-4 flex justify-end">
                <button className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs hover:bg-surface">
                  <Search className="h-3.5 w-3.5" /> Abrir caso
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "contestacoes" && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-surface">
              <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3">Venda</th>
                <th className="px-4 py-3">Contestada por</th>
                <th className="px-4 py-3">Motivo</th>
                <th className="px-4 py-3 text-right">Valor em risco</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                {
                  v: "VD-117",
                  q: "Aldemar Souza",
                  m: "Discordância sobre split de comissão.",
                  r: "R$ 18.900",
                  s: "Em análise" as const,
                },
                {
                  v: "VD-114",
                  q: "Pedro Verissimo",
                  m: "Cliente alega comissão duplicada cobrada.",
                  r: "R$ 6.400",
                  s: "Aberta" as const,
                },
                {
                  v: "VD-110",
                  q: "Beatriz Lemos",
                  m: "Fee Ubroker contestado por divergência de regra.",
                  r: "R$ 2.100",
                  s: "Resolvida" as const,
                },
              ].map((c, i) => (
                <tr key={i} className="hover:bg-surface/60">
                  <td className="px-4 py-3 font-mono text-xs">{c.v}</td>
                  <td className="px-4 py-3">{c.q}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.m}</td>
                  <td className="px-4 py-3 text-right num text-amber-700">{c.r}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs",
                        c.s === "Aberta" && "bg-red-50 text-red-700",
                        c.s === "Em análise" && "bg-amber-50 text-amber-700",
                        c.s === "Resolvida" && "bg-emerald-50 text-emerald-700",
                      )}
                    >
                      {c.s}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "bypass" && (
        <div className="space-y-3">
          {bypassAlertas.map((b) => (
            <div
              key={b.id}
              className={cn(
                "rounded-xl border p-5",
                b.risco === "Alto"
                  ? "border-red-200 bg-red-50/40"
                  : "border-amber-200 bg-amber-50/40",
              )}
            >
              <div className="flex items-start gap-4">
                <span
                  className={cn(
                    "mt-0.5 grid h-9 w-9 place-items-center rounded-full",
                    b.risco === "Alto" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700",
                  )}
                >
                  {b.risco === "Alto" ? (
                    <ShieldAlert className="h-5 w-5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{b.id}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest",
                        b.risco === "Alto"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700",
                      )}
                    >
                      Risco {b.risco}
                    </span>
                  </div>
                  <div className="mt-1 font-display text-lg">{b.corretor}</div>
                  <div className="text-xs text-muted-foreground">{b.lead}</div>
                  <p className="mt-2 text-sm">{b.indicio}</p>
                </div>
                <button className="rounded-md bg-foreground px-3 py-1.5 text-xs text-background hover:opacity-90">
                  Investigar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "border-b-2 px-4 py-2.5 text-sm transition",
        active
          ? "border-foreground text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
