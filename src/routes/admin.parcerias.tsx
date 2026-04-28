import { createFileRoute } from "@tanstack/react-router";
import { FileText, GitBranch } from "lucide-react";
import { adminParcerias } from "@/data/admin-mock";
import { formatBRL } from "@/data/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/parcerias")({
  component: ParceriasAdmin,
});

function ParceriasAdmin() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Parcerias</h1>
        <p className="mt-1 text-sm text-muted-foreground">Operação compartilhada entre corretores.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <KPI label="Ativas" value={adminParcerias.filter((p) => p.status === "Ativa").length} tone="amber" />
        <KPI label="Finalizadas" value={adminParcerias.filter((p) => p.status === "Finalizada").length} tone="green" />
        <KPI label="Canceladas" value={adminParcerias.filter((p) => p.status === "Cancelada").length} tone="red" />
      </section>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-surface">
            <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Imóvel</th>
              <th className="px-4 py-3">Captador</th>
              <th className="px-4 py-3">Parceiro</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Comissão</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {adminParcerias.map((p) => (
              <tr key={p.id} className="hover:bg-surface/60">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.id}</td>
                <td className="px-4 py-3 font-medium">{p.imovel}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.captador}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.parceiro}</td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-xs",
                    p.status === "Ativa" && "bg-amber-50 text-amber-700",
                    p.status === "Finalizada" && "bg-emerald-50 text-emerald-700",
                    p.status === "Cancelada" && "bg-red-50 text-red-700",
                  )}>{p.status}</span>
                </td>
                <td className="px-4 py-3 text-right num">{p.comissao ? formatBRL(p.comissao) : "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-surface hover:text-foreground" title="Ver contrato">
                      <FileText className="h-4 w-4" />
                    </button>
                    <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-surface hover:text-foreground" title="Pipeline compartilhado">
                      <GitBranch className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KPI({ label, value, tone }: { label: string; value: number; tone: "amber" | "green" | "red" }) {
  const cls = tone === "amber" ? "text-amber-700" : tone === "green" ? "text-emerald-700" : "text-red-700";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={cn("mt-2 num font-display text-2xl", cls)}>{value}</div>
    </div>
  );
}
