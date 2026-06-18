import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  MapPin,
  Bed,
  Bath,
  Car,
  Maximize2,
  Users,
  DoorOpen,
  FileText,
  Pencil,
  Share2,
  Image as ImageIcon,
  Flame,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { properties, formatBRL } from "@/data/mock";
import { Button } from "@/components/ui/button";
import {
  INITIAL_STATUS,
  STATUS_STYLES,
  getInteressados,
  getVisitas,
  getPropostas,
  getComissao,
  isAltaDemanda,
} from "@/lib/imoveis";

export const Route = createFileRoute("/app/imoveis/$id")({
  component: PropertyDetail,
  notFoundComponent: () => (
    <div className="rounded-2xl border border-border bg-card p-8 text-center">
      <h2 className="font-display text-xl">Imóvel não encontrado</h2>
      <Link to="/app/imoveis" className="mt-4 inline-block text-brand">
        Voltar ao inventário
      </Link>
    </div>
  ),
});

function PropertyDetail() {
  const { id } = Route.useParams();
  const property = properties.find((p) => p.id === id);
  if (!property) throw notFound();

  const status = INITIAL_STATUS[property.id] ?? "Ativo";
  const interessados = getInteressados(property.id);
  const visitas = getVisitas(property.id);
  const propostas = getPropostas(property.id);
  const comissao = getComissao(property.valor);
  const altaDemanda = isAltaDemanda(property);

  return (
    <div className="space-y-8">
      <Toaster position="top-right" richColors />

      <Link
        to="/app/imoveis"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para imóveis
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Coluna principal */}
        <div className="space-y-6 lg:col-span-2">
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-border">
            <img src={property.foto} alt={property.nome} className="h-full w-full object-cover" />
            {property.marketplace && (
              <span className="absolute left-3 top-3 rounded-full bg-navy/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest text-navy-foreground">
                Marketplace B2C
              </span>
            )}
            {altaDemanda && (
              <span className="absolute left-3 top-10 inline-flex items-center gap-1 rounded-full bg-brand/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest text-white">
                <Flame className="h-3 w-3" /> Alta demanda
              </span>
            )}
            <span
              className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${STATUS_STYLES[status]}`}
            >
              {status}
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Descrição</div>
            <p className="mt-2 leading-relaxed">{property.descricao}</p>

            <div className="mt-5 flex items-center gap-4 border-t border-border pt-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Bed className="h-4 w-4" />{property.quartos} quartos</span>
              <span className="inline-flex items-center gap-1.5"><Bath className="h-4 w-4" />{property.suites} suítes</span>
              <span className="inline-flex items-center gap-1.5"><Car className="h-4 w-4" />{property.vagas} vagas</span>
              <span className="inline-flex items-center gap-1.5"><Maximize2 className="h-4 w-4" />{property.area}m²</span>
            </div>
          </div>
        </div>

        {/* Coluna lateral */}
        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="num font-display text-2xl">{formatBRL(property.valor)}</div>
            <h1 className="mt-1 font-display text-lg leading-snug">{property.nome}</h1>
            <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {property.endereco}
            </div>
            <div className="text-sm text-muted-foreground">{property.bairro}, {property.cidade}</div>

            <div className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              Comissão estimada {formatBRL(comissao)}
            </div>

            <div className="mt-5 space-y-2">
              <Button
                className="w-full bg-navy text-navy-foreground hover:bg-navy/90"
                onClick={() => toast("Editar imóvel", { description: property.id })}
              >
                <Pencil className="h-4 w-4" /> Editar imóvel
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => toast("Adicionar mídia", { description: property.nome })}
              >
                <ImageIcon className="h-4 w-4" /> Mídia
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  navigator.clipboard?.writeText(`${property.nome} — ${property.endereco}`);
                  toast.success("Link copiado", { description: property.nome });
                }}
              >
                <Share2 className="h-4 w-4" /> Compartilhar
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Performance</div>
            <div className="mt-3 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" /> Interessados</span>
                <span className="num font-medium">{interessados}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-muted-foreground"><DoorOpen className="h-4 w-4" /> Visitas</span>
                <span className="num font-medium">{visitas}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-muted-foreground"><FileText className="h-4 w-4" /> Propostas</span>
                <span className="num font-medium">{propostas}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
