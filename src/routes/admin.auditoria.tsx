import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ShoppingBag, Handshake, FileSignature, Ban, Settings as SettingsIcon, Wallet } from "lucide-react";
import { auditLogs, type AuditLog } from "@/data/admin-mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/auditoria")({
  component: AuditoriaAdmin,
});

const iconByTipo: Record<AuditLog["tipo"], React.ComponentType<{ className?: string }>> = {
  Venda: ShoppingBag,
  Parceria: Handshake,
  Contrato: FileSignature,
  Bloqueio: Ban,
  Regra: SettingsIcon,
  Pagamento: Wallet,
};

type Filtro = "Todos" | AuditLog["tipo"];

function AuditoriaAdmin() {
  const [filtro, setFiltro] = useState<Filtro>("Todos");
  const lista = filtro === "Todos" ? auditLogs : auditLogs.filter((l) => l.tipo === filtro);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Auditoria</h1>
        <p className="mt-1 text-sm text-muted-foreground">Logs de ações e eventos críticos da plataforma.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["Todos", "Venda", "Parceria", "Contrato", "Bloqueio", "Regra", "Pagamento"] as Filtro[]).map((f) => (
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

      <div className="rounded-xl border border-border bg-card">
        <ul className="divide-y divide-border">
          {lista.map((l) => {
            const Icon = iconByTipo[l.tipo];
            return (
              <li key={l.id} className={cn("flex items-start gap-3 px-5 py-4", l.critico && "bg-red-50/30")}>
                <span className={cn(
                  "mt-0.5 grid h-8 w-8 place-items-center rounded-full",
                  l.critico ? "bg-red-100 text-red-700" : "bg-surface text-muted-foreground",
                )}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm">
                    <span className="font-medium">{l.ator}</span>{" "}
                    <span className="text-muted-foreground">{l.acao}</span>{" "}
                    <span className="font-medium">{l.alvo}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono">{l.id}</span>
                    <span>·</span>
                    <span>{l.tipo}</span>
                    <span>·</span>
                    <span>{l.data}</span>
                    {l.critico && <span className="ml-1 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">Crítico</span>}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
