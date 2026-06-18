import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Plus,
  MapPin,
  Bed,
  Bath,
  Car,
  Maximize2,
  X,
  Users,
  DoorOpen,
  FileText,
  Eye,
  Pencil,
  Share2,
  Image as ImageIcon,
  ChevronDown,
  AlertTriangle,
  Upload,
  Video,
  Flame,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { properties, formatBRL, type Property } from "@/data/mock";
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
import {
  STATUSES,
  STATUS_STYLES,
  INITIAL_STATUS,
  getInteressados,
  getVisitas,
  getPropostas,
  getComissao,
  isAltaDemanda,
  type Status,
} from "@/lib/imoveis";

export const Route = createFileRoute("/app/imoveis/")({
  component: InventoryPage,
});

type ModalState =
  | { kind: "none" }
  | { kind: "venda"; property: Property }
  | { kind: "exclusao"; property: Property }
  | { kind: "midia"; property: Property };

function InventoryPage() {
  const [open, setOpen] = useState(false);
  const [statusMap, setStatusMap] = useState<Record<string, Status>>(INITIAL_STATUS);
  const [modal, setModal] = useState<ModalState>({ kind: "none" });

  const getStatus = (id: string): Status => statusMap[id] ?? "Ativo";

  const setStatus = (id: string, s: Status) => {
    setStatusMap((m) => ({ ...m, [id]: s }));
  };

  const handleStatusPick = (p: Property, s: Status) => {
    if (s === "Vendido") {
      setModal({ kind: "venda", property: p });
      return;
    }
    if (s === "Excluído") {
      setModal({ kind: "exclusao", property: p });
      return;
    }
    setStatus(p.id, s);
    toast.success(`Status atualizado · ${p.id}`, { description: `Agora "${s}".` });
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl">Meu inventário</h1>
          <p className="text-sm text-muted-foreground">
            {properties.length} imóveis ·{" "}
            {properties.filter((p) => p.marketplace).length} disponíveis no marketplace B2C
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
        {properties.map((p) => {
          const status = getStatus(p.id);
          const interessados = getInteressados(p.id);
          const visitas = getVisitas(p.id);
          const propostas = getPropostas(p.id);
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
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={p.foto} alt={p.nome} className="h-full w-full object-cover" />
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
                  <MapPin className="h-3 w-3" /> {p.bairro}, {p.cidade}
                </div>

                {/* Performance */}
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" /> {interessados} interessados
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <DoorOpen className="h-3 w-3" /> {visitas} visitas
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FileText className="h-3 w-3" /> {propostas} propostas
                  </span>
                </div>

                {/* Comissão */}
                <div className="mt-2 text-xs font-medium text-emerald-700">
                  Comissão estimada {formatBRL(comissao)}
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
                    onClick={() => toast("Editar imóvel", { description: p.id })}
                  />
                  <CardAction
                    icon={<Share2 className="h-3.5 w-3.5" />}
                    label="Compartilhar"
                    onClick={() => toast.success("Link copiado", { description: p.nome })}
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

      {/* Modal de cadastro */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-card p-8 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl">Adicionar imóvel</h2>
                <p className="text-sm text-muted-foreground">Será disponibilizado também no marketplace B2C.</p>
              </div>
              <button onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-full bg-surface">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-5 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">
              Este imóvel será exibido no marketplace B2C e poderá receber leads de compradores interessados.
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setOpen(false);
                toast.success("Imóvel publicado");
              }}
              className="grid grid-cols-2 gap-4"
            >
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
                <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
                  Tipo de cliente ideal <span className="text-muted-foreground/60">(opcional)</span>
                </label>
                <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option value="">Selecione...</option>
                  <option>Família</option>
                  <option>Investidor</option>
                  <option>Jovem casal</option>
                  <option>Comprador de primeira moradia</option>
                  <option>Alto padrão</option>
                </select>
              </div>
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

      {/* Modal Venda */}
      <VendaModal
        state={modal}
        onClose={() => setModal({ kind: "none" })}
        onConfirm={(p) => {
          setStatus(p.id, "Vendido");
          setModal({ kind: "none" });
          toast.success(`Venda registrada · ${p.id}`);
        }}
      />

      {/* Modal Exclusão */}
      <ExclusaoModal
        state={modal}
        onClose={() => setModal({ kind: "none" })}
        onConfirm={(p) => {
          setStatus(p.id, "Excluído");
          setModal({ kind: "none" });
          toast.success(`Imóvel removido do inventário · ${p.id}`);
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
            <Field label="Data da venda" type="date" />
            <Field label="Valor final (R$)" type="number" defaultValue={valorPadrao} />
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
          <DialogTitle>Registrar exclusão do imóvel</DialogTitle>
          <DialogDescription>
            Antes de remover este imóvel do inventário, informe o motivo da exclusão para manter o histórico da operação.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Esta ação ficará registrada no histórico do inventário e não poderá ser desfeita silenciosamente.</p>
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
            <RadioRow name="ubroker-exc" label="Houve negociação iniciada pela Ubroker?" />
            <div className="col-span-2">
              <Label>
                Observações <span className="text-rose-600">*</span>
              </Label>
              <textarea
                required
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

function Field({
  label,
  placeholder,
  full,
  type,
  defaultValue,
}: {
  label: string;
  placeholder?: string;
  full?: boolean;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        placeholder={placeholder}
      />
    </div>
  );
}
