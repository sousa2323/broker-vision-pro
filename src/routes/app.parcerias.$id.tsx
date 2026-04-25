import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Bed, Bath, Car, Handshake, Maximize2, MapPin } from "lucide-react";
import { brokers, properties, formatBRL } from "@/data/mock";

export const Route = createFileRoute("/app/parcerias/$id")({
  component: BrokerDetail,
  notFoundComponent: () => (
    <div className="rounded-2xl border border-border bg-card p-8 text-center">
      <h2 className="font-display text-xl">Corretor não encontrado</h2>
      <Link to="/app/parcerias" className="mt-4 inline-block text-brand">Voltar à lista</Link>
    </div>
  ),
});

function BrokerDetail() {
  const { id } = Route.useParams();
  const broker = brokers.find((b) => b.id === id);
  if (!broker) throw notFound();

  const inv = properties.filter((p) => broker.inventoryIds.includes(p.id));

  return (
    <div className="space-y-8">
      <Link to="/app/parcerias" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar à rede
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-1">
          <img src={broker.foto} alt={broker.nome} className="aspect-square w-full rounded-2xl object-cover" />
          <h1 className="mt-5 font-display text-2xl">{broker.nome}</h1>
          <div className="text-sm text-muted-foreground">{broker.agencia}</div>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> {broker.regiao}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4 text-sm">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Especialidade</div>
              <div>{broker.especialidade}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Imóveis</div>
              <div className="num">{broker.imoveis}</div>
            </div>
          </div>
          <button className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-navy px-4 py-2.5 text-sm text-navy-foreground">
            <Handshake className="h-4 w-4" /> Solicitar parceria
          </button>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Sobre</div>
            <p className="mt-2 leading-relaxed">{broker.bio}</p>
          </div>
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-xl">Inventário do parceiro</h2>
              <div className="text-xs text-muted-foreground">{inv.length} imóveis</div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {inv.map((p) => (
                <article key={p.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                  <img src={p.foto} alt={p.nome} className="aspect-[16/10] w-full object-cover" />
                  <div className="p-5">
                    <div className="num font-display text-lg">{formatBRL(p.valor)}</div>
                    <div className="mt-1 font-medium">{p.nome}</div>
                    <div className="text-xs text-muted-foreground">{p.bairro}, {p.cidade}</div>
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Bed className="h-3.5 w-3.5" />{p.quartos}</span>
                      <span className="inline-flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{p.suites}</span>
                      <span className="inline-flex items-center gap-1"><Car className="h-3.5 w-3.5" />{p.vagas}</span>
                      <span className="inline-flex items-center gap-1"><Maximize2 className="h-3.5 w-3.5" />{p.area}m²</span>
                    </div>
                    <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-surface">
                      <Handshake className="h-4 w-4" /> Solicitar parceria neste imóvel
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
