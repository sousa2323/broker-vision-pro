import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  MapPin,
  Bed,
  Bath,
  Car,
  Maximize2,
  DoorOpen,
  Pencil,
  Share2,
  Image as ImageIcon,
  Flame,
  Loader2,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/format";
import { getProperty, type Property } from "@/lib/properties";
import { usePropertyMediaUrls } from "@/lib/media";
import { useActivities } from "@/lib/activities";
import { STATUS_STYLES, getComissao, isAltaDemanda } from "@/lib/imoveis";

export const Route = createFileRoute("/app/imoveis/$id")({
  component: PropertyDetail,
});

function PropertyDetail() {
  const { id } = Route.useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const { activities } = useActivities();
  const mediaUrls = usePropertyMediaUrls([
    ...(property?.fotos ?? []),
    property?.foto,
    property?.video,
  ]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getProperty(id).then((p) => {
      if (!cancelled) {
        setProperty(p);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="grid place-items-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <h2 className="font-display text-xl">Imóvel não encontrado</h2>
        <Link to="/app/imoveis" className="mt-4 inline-block text-brand">
          Voltar ao inventário
        </Link>
      </div>
    );
  }

  const status = property.status;
  const visitas = activities.filter(
    (a) => a.property_id === property.id && a.tipo === "Visita",
  ).length;
  const comissao = getComissao(property.valor);
  const altaDemanda = isAltaDemanda(property);

  const fotos = property.fotos?.length ? property.fotos : property.foto ? [property.foto] : [];
  const fotoAtualPath = fotos[activeIdx] ?? fotos[0] ?? null;
  const fotoAtual = fotoAtualPath ? (mediaUrls[fotoAtualPath] ?? null) : null;
  const videoUrl = property.video ? (mediaUrls[property.video] ?? null) : null;

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
          <div>
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-surface">
              {fotoAtual ? (
                <img src={fotoAtual} alt={property.nome} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-muted-foreground">
                  <ImageIcon className="h-10 w-10" />
                </div>
              )}
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

            {fotos.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {fotos.map((f, i) => (
                  <button
                    key={f + i}
                    type="button"
                    onClick={() => setActiveIdx(i)}
                    className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border transition ${
                      i === activeIdx
                        ? "border-brand ring-1 ring-brand"
                        : "border-border opacity-80 hover:opacity-100"
                    }`}
                  >
                    {mediaUrls[f] && (
                      <img src={mediaUrls[f]} alt="" className="h-full w-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {videoUrl && (
            <div className="overflow-hidden rounded-2xl border border-border bg-black">
              <video src={videoUrl} controls className="max-h-[420px] w-full" />
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Descrição</div>
            <p className="mt-2 leading-relaxed">{property.descricao || "Sem descrição."}</p>

            <div className="mt-5 flex items-center gap-4 border-t border-border pt-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Bed className="h-4 w-4" />
                {property.quartos} quartos
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Bath className="h-4 w-4" />
                {property.suites} suítes
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Car className="h-4 w-4" />
                {property.vagas} vagas
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Maximize2 className="h-4 w-4" />
                {property.area}m²
              </span>
            </div>
          </div>
        </div>

        {/* Coluna lateral */}
        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="num font-display text-2xl">{formatBRL(property.valor)}</div>
            <h1 className="mt-1 font-display text-lg leading-snug">{property.nome}</h1>
            <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {property.endereco || "—"}
            </div>
            <div className="text-sm text-muted-foreground">
              {[property.bairro, property.cidade].filter(Boolean).join(", ") || "—"}
            </div>

            <div className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              Comissão estimada {formatBRL(comissao)}
            </div>

            <div className="mt-5 space-y-2">
              <Button asChild className="w-full bg-navy text-navy-foreground hover:bg-navy/90">
                <Link to="/app/imoveis">
                  <Pencil className="h-4 w-4" /> Editar no inventário
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  navigator.clipboard?.writeText(`${location.origin}/app/imoveis/${property.id}`);
                  toast.success("Link copiado", { description: property.nome });
                }}
              >
                <Share2 className="h-4 w-4" /> Compartilhar
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Performance
            </div>
            <div className="mt-3 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <DoorOpen className="h-4 w-4" /> Visitas agendadas
                </span>
                <span className="num font-medium">{visitas}</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              As visitas são contabilizadas a partir das atividades vinculadas a este imóvel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
