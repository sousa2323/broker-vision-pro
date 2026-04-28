import { createFileRoute } from "@tanstack/react-router";
import { properties, formatBRL } from "@/data/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/imoveis")({
  component: ImoveisAdmin,
});

const corretoresPorImovel = ["Ramon Capone", "Alessandra Freixo", "Aldemar Souza", "Denise Molinaro", "Pedro Verissimo", "Beatriz Lemos", "Marcos Iglesias", "Carla Fontes"];
const statusPossiveis = ["Ativo", "Ativo", "Ativo", "Vendido", "Ativo", "Vendido", "Ativo", "Removido", "Ativo", "Ativo"] as const;

function ImoveisAdmin() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Imóveis</h1>
        <p className="mt-1 text-sm text-muted-foreground">Inventário global da plataforma.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-surface">
            <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-3">Imóvel</th>
              <th className="px-4 py-3">Bairro</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-4 py-3">Corretor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Marketplace</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {properties.slice(0, 14).map((p, i) => {
              const status = statusPossiveis[i % statusPossiveis.length];
              return (
                <tr key={p.id} className="hover:bg-surface/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.foto} alt="" className="h-12 w-16 rounded-md object-cover" />
                      <div>
                        <div className="font-medium">{p.nome}</div>
                        <div className="text-xs text-muted-foreground">{p.id} · {p.area}m²</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.bairro}</td>
                  <td className="px-4 py-3 text-right num">{formatBRL(p.valor)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{corretoresPorImovel[i % corretoresPorImovel.length]}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-xs",
                      status === "Ativo" && "bg-emerald-50 text-emerald-700",
                      status === "Vendido" && "bg-blue-50 text-blue-700",
                      status === "Removido" && "bg-red-50 text-red-700",
                    )}>{status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {p.marketplace ? (
                      <span className="rounded-full bg-warm/15 px-2 py-0.5 text-xs text-warm">Sim</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
