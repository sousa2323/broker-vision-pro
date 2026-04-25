import { createFileRoute, Link } from "@tanstack/react-router";
import { brokers } from "@/data/mock";
import { ArrowRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/parcerias/")({
  component: PartnersPage,
});

const compatColors: Record<string, string> = {
  Alta: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Média: "bg-amber-50 text-amber-700 border-amber-200",
  Baixa: "bg-slate-50 text-slate-600 border-slate-200",
};

function PartnersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Rede de parcerias</h1>
        <p className="text-sm text-muted-foreground">
          {brokers.length} corretores parceiros · Comissão compartilhada · Carteira combinada de {brokers.reduce((a, b) => a + b.imoveis, 0)} imóveis
        </p>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {brokers.map((b) => (
          <article key={b.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <img src={b.foto} alt={b.nome} className="h-14 w-14 rounded-full object-cover" />
              <div className="min-w-0">
                <div className="font-medium">{b.nome}</div>
                <div className="truncate text-xs text-muted-foreground">{b.agencia}</div>
              </div>
            </div>
            <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {b.regiao}</div>
              <div>{b.especialidade}</div>
              <div className="num">{b.imoveis} imóveis ativos</div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px]", compatColors[b.compatibilidade])}>
                Compat. {b.compatibilidade}
              </span>
              <Link
                to="/app/parcerias/$id"
                params={{ id: b.id }}
                className="inline-flex items-center gap-1 text-sm text-brand"
              >
                Ver perfil <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
