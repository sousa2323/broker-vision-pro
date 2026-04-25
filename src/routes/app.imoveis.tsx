import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, MapPin, Bed, Bath, Car, Maximize2, X } from "lucide-react";
import { properties, formatBRL } from "@/data/mock";

export const Route = createFileRoute("/app/imoveis")({
  component: InventoryPage,
});

function InventoryPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl">Meu inventário</h1>
          <p className="text-sm text-muted-foreground">
            {properties.length} imóveis · {properties.filter((p) => p.marketplace).length} disponíveis no marketplace B2C
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-warm px-4 py-2.5 text-sm font-medium text-warm-foreground hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> Adicionar imóvel
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {properties.map((p) => (
          <article key={p.id} className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="relative aspect-[4/3] overflow-hidden">
              <img src={p.foto} alt={p.nome} className="h-full w-full object-cover" />
              {p.marketplace && (
                <span className="absolute left-3 top-3 rounded-full bg-navy/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest text-navy-foreground">
                  Marketplace B2C
                </span>
              )}
              {p.destaque && (
                <span className="absolute right-3 top-3 rounded-full bg-warm px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest text-warm-foreground">
                  Destaque
                </span>
              )}
            </div>
            <div className="p-5">
              <div className="num font-display text-xl">{formatBRL(p.valor)}</div>
              <h3 className="mt-1 line-clamp-1 text-sm font-medium">{p.nome}</h3>
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {p.bairro}, {p.cidade}
              </div>
              <p className="mt-3 line-clamp-3 text-xs text-muted-foreground">{p.descricao}</p>
              <div className="mt-4 flex items-center gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Bed className="h-3.5 w-3.5" />{p.quartos}</span>
                <span className="inline-flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{p.suites}</span>
                <span className="inline-flex items-center gap-1"><Car className="h-3.5 w-3.5" />{p.vagas}</span>
                <span className="inline-flex items-center gap-1"><Maximize2 className="h-3.5 w-3.5" />{p.area}m²</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-card p-8 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl">Adicionar imóvel</h2>
                <p className="text-sm text-muted-foreground">Será disponibilizado também no marketplace B2C.</p>
              </div>
              <button onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-full bg-surface">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setOpen(false); }} className="grid grid-cols-2 gap-4">
              <Field label="Nome do imóvel" placeholder="Apartamento 3 quartos em Icaraí" full />
              <Field label="Endereço" placeholder="Rua Tavares de Macedo, 421" full />
              <Field label="Bairro" placeholder="Icaraí" />
              <Field label="Cidade" placeholder="Niterói" />
              <Field label="Valor (R$)" placeholder="850000" />
              <Field label="Área (m²)" placeholder="110" />
              <Field label="Quartos" placeholder="3" />
              <Field label="Suítes" placeholder="1" />
              <Field label="Vagas" placeholder="2" />
              <div className="col-span-2">
                <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">Descrição</label>
                <textarea
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  rows={4}
                  placeholder="Imóvel reformado, varanda ampla..."
                />
              </div>
              <div className="col-span-2 flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-border px-4 py-2 text-sm">Cancelar</button>
                <button className="rounded-md bg-navy px-4 py-2 text-sm text-navy-foreground">Publicar imóvel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, placeholder, full }: { label: string; placeholder?: string; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">{label}</label>
      <input className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder={placeholder} />
    </div>
  );
}
