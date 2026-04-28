import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Ban, ArrowUpRight } from "lucide-react";
import { adminBrokers } from "@/data/admin-mock";
import { formatBRL } from "@/data/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/usuarios")({
  component: UsuariosAdmin,
});

type Filtro = "Todos" | "Pro" | "Free" | "Bloqueados";

function UsuariosAdmin() {
  const [filtro, setFiltro] = useState<Filtro>("Todos");
  const [busca, setBusca] = useState("");

  const lista = adminBrokers.filter((u) => {
    if (filtro === "Pro" && u.plano !== "Pro") return false;
    if (filtro === "Free" && u.plano !== "Free") return false;
    if (filtro === "Bloqueados" && u.status !== "Bloqueado") return false;
    if (busca && !u.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Usuários</h1>
        <p className="mt-1 text-sm text-muted-foreground">Corretores cadastrados na plataforma.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["Todos", "Pro", "Free", "Bloqueados"] as Filtro[]).map((f) => (
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
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar corretor…"
            className="bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-surface">
            <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-3">Corretor</th>
              <th className="px-4 py-3">CRECI</th>
              <th className="px-4 py-3">Cidade</th>
              <th className="px-4 py-3">Plano</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Receita gerada</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {lista.map((u) => (
              <tr key={u.id} className="hover:bg-surface/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={u.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                    <div>
                      <div className="font-medium">{u.nome}</div>
                      <div className="text-xs text-muted-foreground">{u.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{u.creci}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.cidade}</td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-xs",
                    u.plano === "Pro" ? "bg-warm/15 text-warm" : "bg-surface text-muted-foreground",
                  )}>{u.plano}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-xs",
                    u.status === "Ativo" && "bg-emerald-50 text-emerald-700",
                    u.status === "Inativo" && "bg-surface text-muted-foreground",
                    u.status === "Bloqueado" && "bg-red-50 text-red-700",
                  )}>{u.status}</span>
                </td>
                <td className="px-4 py-3 text-right num">{formatBRL(u.receita)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-surface hover:text-foreground" title="Alterar plano">
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                    <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-700" title="Bloquear">
                      <Ban className="h-4 w-4" />
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
