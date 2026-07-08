import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  MapPin,
  Bed,
  Bath,
  Car,
  Maximize2,
  X,
  DoorOpen,
  Eye,
  Pencil,
  Share2,
  Image as ImageIcon,
  ChevronDown,
  AlertTriangle,
  Upload,
  Video,
  Flame,
  Loader2,
  Building2,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/format";
import { useSession } from "@/lib/auth";
import { useActivities } from "@/lib/activities";
import {
  useProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  EMPTY_PROPERTY,
  type Property,
  type PropertyInput,
  type PropertyStatus,
} from "@/lib/properties";
import { STATUSES, STATUS_STYLES, getComissao, isAltaDemanda } from "@/lib/imoveis";

export const Route = createFileRoute("/app/imoveis/")({
  component: InventoryPage,
});

type ModalState =
  | { kind: "none" }
  | { kind: "form"; property: Property | null }
  | { kind: "venda"; property: Property }
  | { kind: "exclusao"; property: Property }
  | { kind: "midia"; property: Property };

function InventoryPage() {
  const { session } = useSession();
  const { properties, loading, refetch } = useProperties();
  const { activities } = useActivities();
  const [modal, setModal] = useState<ModalState>({ kind: "none" });

  // Visitas reais: atividades do tipo "Visita" vinculadas ao imóvel
  const visitasPorImovel = useMemo(() => {
    const m: Record<string, number> = {};
    for (const a of activities) {
      if (a.property_id && a.tipo === "Visita") m[a.property_id] = (m[a.property_id] ?? 0) + 1;
    }
    return m;
  }, [activities]);

  async function applyStatus(p: Property, s: PropertyStatus) {
    const ok = await updateProperty(p.id, { status: s });
    if (ok) {
      await refetch();
      toast.success(`Status atualizado · ${p.nome}`, { description: `Agora "${s}".` });
    } else {
      toast.error("Não foi possível atualizar o status.");
    }
  }

  const handleStatusPick = (p: Property, s: PropertyStatus) => {
    if (s === "Vendido") return setModal({ kind: "venda", property: p });
    if (s === "Excluído") return setModal({ kind: "exclusao", property: p });
    applyStatus(p, s);
  };

  const marketplaceCount = properties.filter((p) => p.marketplace).length;

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl">Meu inventário</h1>
          <p className="text-sm text-muted-foreground">
            {properties.length} {properties.length === 1 ? "imóvel" : "imóveis"} ·{" "}
            {marketplaceCount} no marketplace B2C
          </p>
        </div>
        <button
          onClick={() => setModal({ kind: "form", property: null })}
          className="inline-flex items-center gap-2 rounded-md bg-warm px-4 py-2.5 text-sm font-medium text-warm-foreground hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> Adicionar imóvel
        </button>
      </div>

      {loading ? (
        <div className="grid place-items-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : properties.length === 0 ? (
        <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-border bg-card py-24 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-surface text-muted-foreground">
            <Building2 className="h-7 w-7" />
          </div>
          <div className="font-display text-lg">Nenhum imóvel ainda</div>
          <p className="max-w-sm text-sm text-muted-foreground">
            Cadastre seu primeiro imóvel para começar a receber leads e acompanhar sua performance.
          </p>
          <button
            onClick={() => setModal({ kind: "form", property: null })}
            className="mt-1 inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm text-navy-foreground"
          >
            <Plus className="h-4 w-4" /> Adicionar imóvel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {properties.map((p) => {
            const status = p.status;
            const visitas = visitasPorImovel[p.id] ?? 0;
            const comissao = getComissao(p.valor);
            const altaDemanda = isAltaDemanda(p);
            const excluido = status === "Excluído";

            return (
              <article
                key={p.id}
                className={[
                  "overflow-hidden rounded-2xl border border-border bg-card transition",
                  altaDemanda ? "ring-1 ring-brand/30" : "",
                  excluido ? "opacity-60" : "",
                ].join(" ")}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-surface">
                  {p.foto ? (
                    <img src={p.foto} alt={p.nome} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-muted-foreground">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                  {p.marketplace && (
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

                <div className="p-5">
                  <div className={`num font-display text-xl ${excluido ? "line-through" : ""}`}>
                    {formatBRL(p.valor)}
                  </div>
                  <h3 className="mt-1 line-clamp-1 text-sm font-medium">{p.nome}</h3>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {[p.bairro, p.cidade].filter(Boolean).join(", ") || "—"}
                  </div>

                  {/* Performance real */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <DoorOpen className="h-3 w-3" /> {visitas} {visitas === 1 ? "visita" : "visitas"}
                    </span>
                    <span className="text-xs font-medium text-emerald-700">
                      Comissão estimada {formatBRL(comissao)}
                    </span>
                  </div>

                  {/* Specs */}
                  <div className="mt-4 flex items-center gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Bed className="h-3.5 w-3.5" />{p.quartos}</span>
                    <span className="inline-flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{p.suites}</span>
                    <span className="inline-flex items-center gap-1"><Car className="h-3.5 w-3.5" />{p.vagas}</span>
                    <span className="inline-flex items-center gap-1"><Maximize2 className="h-3.5 w-3.5" />{p.area}m²</span>
                  </div>

                  {/* Ações rápidas */}
                  <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
                    <Link
                      to="/app/imoveis/$id"
                      params={{ id: p.id }}
                      className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Ver</span>
                    </Link>
                    <CardAction
                      icon={<Pencil className="h-3.5 w-3.5" />}
                      label="Editar"
                      onClick={() => setModal({ kind: "form", property: p })}
                    />
                    <CardAction
                      icon={<Share2 className="h-3.5 w-3.5" />}
                      label="Compartilhar"
                      onClick={() => {
                        navigator.clipboard?.writeText(`${location.origin}/app/imoveis/${p.id}`);
                        toast.success("Link copiado", { description: p.nome });
                      }}
                    />
                    <CardAction
                      icon={<ImageIcon className="h-3.5 w-3.5" />}
                      label="Mídia"
                      onClick={() => setModal({ kind: "midia", property: p })}
                    />

                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="ml-auto inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] hover:bg-accent">
                          Status <ChevronDown className="h-3 w-3" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-1" align="end">
                        {STATUSES.map((s) => (
                          <button
                            key={s}
                            onClick={() => handleStatusPick(p, s)}
                            className={`flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-xs hover:bg-accent ${
                              s === "Excluído" ? "text-rose-700" : ""
                            }`}
                          >
                            <span>{s}</span>
                            {s === status && <span className="text-[10px] opacity-60">atual</span>}
                          </button>
                        ))}
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal cadastro / edição */}
      <PropertyFormModal
        state={modal}
        brokerId={session?.user.id}
        onClose={() => setModal({ kind: "none" })}
        onSaved={async () => {
          setModal({ kind: "none" });
          await refetch();
        }}
      />

      {/* Modal Venda */}
      <VendaModal
        state={modal}
        onClose={() => setModal({ kind: "none" })}
        onConfirm={async (p) => {
          await applyStatus(p, "Vendido");
          setModal({ kind: "none" });
        }}
      />

      {/* Modal Exclusão */}
      <ExclusaoModal
        state={modal}
        onClose={() => setModal({ kind: "none" })}
        onConfirm={async (p) => {
          const ok = await deleteProperty(p.id);
          setModal({ kind: "none" });
          if (ok) {
            await refetch();
            toast.success(`Imóvel removido do inventário · ${p.nome}`);
          } else {
            toast.error("Não foi possível remover o imóvel.");
          }
        }}
      />

      {/* Modal Mídia */}
      <MidiaModal state={modal} onClose={() => setModal({ kind: "none" })} />
    </div>
  );
}

function CardAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function PropertyFormModal({
  state,
  brokerId,
  onClose,
  onSaved,
}: {
  state: ModalState;
  brokerId: string | undefined;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isOpen = state.kind === "form";
  const editing = state.kind === "form" ? state.property : null;

  const [form, setForm] = useState<PropertyInput>(EMPTY_PROPERTY);
  const [saving, setSaving] = useState(false);
  // reseta o formulário sempre que abre (novo) ou muda o imóvel editado
  const formKey = editing?.id ?? (isOpen ? "novo" : "fechado");
  useEffect(() => {
    if (!isOpen) return;
    setForm(
      editing
        ? {
            nome: editing.nome,
            endereco: editing.endereco ?? "",
            bairro: editing.bairro ?? "",
            cidade: editing.cidade ?? "",
            valor: editing.valor,
            quartos: editing.quartos,
            suites: editing.suites,
            vagas: editing.vagas,
            area: editing.area,
            descricao: editing.descricao ?? "",
            destaque: editing.destaque,
            marketplace: editing.marketplace,
            foto: editing.foto ?? "",
            status: editing.status,
          }
        : EMPTY_PROPERTY,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formKey]);

  const upd = <K extends keyof PropertyInput>(k: K, v: PropertyInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!brokerId) return;
    if (!form.nome.trim()) {
      toast.error("Informe o nome do imóvel.");
      return;
    }
    setSaving(true);
    const result = editing
      ? await updateProperty(editing.id, form)
      : await createProperty(brokerId, form);
    setSaving(false);
    if (result) {
      toast.success(editing ? "Imóvel atualizado" : "Imóvel cadastrado");
      onSaved();
    } else {
      toast.error("Não foi possível salvar o imóvel.");
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar imóvel" : "Adicionar imóvel"}</DialogTitle>
          <DialogDescription>
            {form.marketplace
              ? "Este imóvel será exibido no marketplace B2C e poderá receber leads."
              : "Ative o marketplace para receber leads de compradores."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <FormField label="Nome do imóvel" full value={form.nome} onChange={(v) => upd("nome", v)} placeholder="Apartamento 3 quartos em Icaraí" />
          <FormField label="Endereço" full value={form.endereco ?? ""} onChange={(v) => upd("endereco", v)} placeholder="Rua Tavares de Macedo, 421" />
          <FormField label="Bairro" value={form.bairro ?? ""} onChange={(v) => upd("bairro", v)} placeholder="Icaraí" />
          <FormField label="Cidade" value={form.cidade ?? ""} onChange={(v) => upd("cidade", v)} placeholder="Niterói" />
          <FormField label="Valor (R$)" type="number" value={String(form.valor || "")} onChange={(v) => upd("valor", Number(v) || 0)} placeholder="850000" />
          <FormField label="Área (m²)" type="number" value={String(form.area || "")} onChange={(v) => upd("area", Number(v) || 0)} placeholder="110" />
          <FormField label="Quartos" type="number" value={String(form.quartos || "")} onChange={(v) => upd("quartos", Number(v) || 0)} placeholder="3" />
          <FormField label="Suítes" type="number" value={String(form.suites || "")} onChange={(v) => upd("suites", Number(v) || 0)} placeholder="1" />
          <FormField label="Vagas" type="number" value={String(form.vagas || "")} onChange={(v) => upd("vagas", Number(v) || 0)} placeholder="2" />
          <FormField label="Foto (URL)" value={form.foto ?? ""} onChange={(v) => upd("foto", v)} placeholder="https://..." />
          <div className="col-span-2">
            <Label>Descrição</Label>
            <textarea
              value={form.descricao ?? ""}
              onChange={(e) => upd("descricao", e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              rows={4}
              placeholder="Imóvel reformado, varanda ampla..."
            />
          </div>
          <label className="col-span-2 inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.marketplace}
              onChange={(e) => upd("marketplace", e.target.checked)}
            />
            Disponibilizar no marketplace B2C
          </label>
          <DialogFooter className="col-span-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              {editing ? "Salvar alterações" : "Cadastrar imóvel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function VendaModal({
  state,
  onClose,
  onConfirm,
}: {
  state: ModalState;
  onClose: () => void;
  onConfirm: (p: Property) => void;
}) {
  const isOpen = state.kind === "venda";
  const property = state.kind === "venda" ? state.property : null;
  const valorPadrao = useMemo(() => (property ? String(property.valor) : ""), [property]);

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Registrar venda do imóvel</DialogTitle>
          <DialogDescription>
            Para manter a rastreabilidade da operação, registre as informações principais desta venda.
          </DialogDescription>
        </DialogHeader>

        {property && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onConfirm(property);
            }}
            className="grid grid-cols-2 gap-4"
          >
            <FormFieldStatic label="Data da venda" type="date" />
            <FormFieldStatic label="Valor final (R$)" type="number" defaultValue={valorPadrao} />
            <div className="col-span-2">
              <Label>Origem do comprador</Label>
              <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                <option>Marketplace</option>
                <option>Instagram</option>
                <option>WhatsApp</option>
                <option>Indicação</option>
                <option>Outro</option>
              </select>
            </div>
            <RadioRow name="parceria" label="Houve parceria com outro corretor?" />
            <RadioRow name="ubroker" label="Foi negociado dentro da Ubroker?" />
            <div className="col-span-2">
              <Label>Observações</Label>
              <textarea
                rows={3}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="Detalhes da negociação..."
              />
            </div>
            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit">Confirmar venda</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ExclusaoModal({
  state,
  onClose,
  onConfirm,
}: {
  state: ModalState;
  onClose: () => void;
  onConfirm: (p: Property) => void;
}) {
  const isOpen = state.kind === "exclusao";
  const property = state.kind === "exclusao" ? state.property : null;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Remover imóvel do inventário</DialogTitle>
          <DialogDescription>
            Informe o motivo da exclusão. Esta ação remove o imóvel definitivamente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Esta ação não poderá ser desfeita.</p>
        </div>

        {property && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onConfirm(property);
            }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="col-span-2">
              <Label>Motivo da exclusão</Label>
              <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                <option>Imóvel vendido</option>
                <option>Proprietário retirou da venda</option>
                <option>Imóvel indisponível</option>
                <option>Cadastro duplicado</option>
                <option>Erro de cadastro</option>
                <option>Outro</option>
              </select>
            </div>
            <div className="col-span-2">
              <Label>Observações</Label>
              <textarea
                rows={3}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="Descreva o motivo com mais detalhes..."
              />
            </div>
            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" variant="destructive">Confirmar exclusão</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MidiaModal({ state, onClose }: { state: ModalState; onClose: () => void }) {
  const isOpen = state.kind === "midia";
  const property = state.kind === "midia" ? state.property : null;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Adicionar mídia</DialogTitle>
          <DialogDescription>
            Fotos e vídeos aumentam a performance do imóvel no marketplace.
          </DialogDescription>
        </DialogHeader>

        {property && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => toast("Selecione fotos no seu dispositivo")}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface px-6 py-10 text-center text-sm text-muted-foreground hover:bg-accent"
            >
              <Upload className="h-6 w-6" />
              <span>Arraste fotos ou clique para selecionar</span>
              <span className="text-[11px]">JPG ou PNG · até 10MB cada</span>
            </button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => toast("Selecione um vídeo")}
            >
              <Video className="mr-1 h-4 w-4" /> Adicionar vídeo
            </Button>

            {property.foto && (
              <div>
                <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
                  Galeria atual
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <img src={property.foto} alt="" className="aspect-square rounded-md object-cover" />
                  <div className="aspect-square rounded-md bg-surface" />
                  <div className="aspect-square rounded-md bg-surface" />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" onClick={onClose}>Fechar</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
      {children}
    </label>
  );
}

function RadioRow({ name, label }: { name: string; label: string }) {
  return (
    <div className="col-span-2">
      <Label>{label}</Label>
      <div className="flex gap-4 text-sm">
        <label className="inline-flex items-center gap-2">
          <input type="radio" name={name} defaultChecked /> Sim
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="radio" name={name} /> Não
        </label>
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  full,
  type,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  full?: boolean;
  type?: string;
}) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        placeholder={placeholder}
      />
    </div>
  );
}

function FormFieldStatic({
  label,
  type,
  defaultValue,
}: {
  label: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type={type}
        defaultValue={defaultValue}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
      />
    </div>
  );
}
