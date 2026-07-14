import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Handshake,
  MapPin,
  MessageSquare,
  Briefcase,
  Loader2,
  Building2,
  Check,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getDirectoryBroker, type DirectoryBroker } from "@/lib/directory";
import { createPartnershipRequest, usePartnershipRequests } from "@/lib/partnerships";
import { createConnectionRequest, useConnections } from "@/lib/connections";
import { useSharedInventory, type SharedProperty } from "@/lib/properties";
import { usePropertyMediaUrls } from "@/lib/media";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/app/parcerias/$id")({
  component: BrokerDetail,
});

function BrokerDetail() {
  const { id } = Route.useParams();
  const [broker, setBroker] = useState<DirectoryBroker | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectOpen, setConnectOpen] = useState(false);
  const [partnershipProperty, setPartnershipProperty] = useState<SharedProperty | null>(null);
  const { requests, currentUserId, refresh: refreshRequests } = usePartnershipRequests();
  const {
    connections,
    loading: connectionLoading,
    refresh: refreshConnections,
  } = useConnections();
  const { shared, loading: sharedLoading } = useSharedInventory(id);
  const covers = usePropertyMediaUrls(shared.map((p) => p.foto));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getDirectoryBroker(id).then((b) => {
      if (!cancelled) {
        setBroker(b);
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

  if (!broker) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <h2 className="font-display text-xl">Corretor não encontrado</h2>
        <Link to="/app/parcerias" className="mt-4 inline-block text-brand">
          Voltar à lista
        </Link>
      </div>
    );
  }

  const initials = broker.full_name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
  const regiao = (broker.regions ?? []).join(" · ") || "—";
  const connection = connections.find(
    (c) =>
      (c.requester_id === broker.id || c.target_id === broker.id) && c.status !== "declined",
  );

  /** Parceria (não recusada/encerrada) já existente para um imóvel deste corretor. */
  const partnershipFor = (propertyId: string) =>
    requests.find(
      (request) =>
        request.property_id === propertyId &&
        (request.status === "pending" || request.status === "accepted"),
    );

  return (
    <div className="space-y-8">
      <Link
        to="/app/parcerias"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para parcerias
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-1">
          {broker.avatar_url ? (
            <img
              src={broker.avatar_url}
              alt={broker.full_name}
              className="aspect-square w-full rounded-2xl object-cover"
            />
          ) : (
            <div className="grid aspect-square w-full place-items-center rounded-2xl bg-surface text-3xl font-medium text-muted-foreground">
              {initials}
            </div>
          )}
          <h1 className="mt-5 font-display text-2xl">{broker.full_name}</h1>
          <div className="text-sm text-muted-foreground">Plano {broker.plan}</div>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> {regiao}
          </div>
          {(broker.specialties ?? []).length > 0 && (
            <div className="mt-4 border-t border-border pt-4">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                Especialidades
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {broker.specialties.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 rounded-full bg-brand/5 px-2 py-0.5 text-xs text-brand"
                  >
                    <Briefcase className="h-3 w-3" /> {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="mt-6 space-y-2">
            {connectionLoading ? (
              <Button className="w-full" variant="outline" disabled>
                Carregando relação…
              </Button>
            ) : !connection ? (
              <Button variant="outline" className="w-full" onClick={() => setConnectOpen(true)}>
                <MessageSquare className="h-4 w-4" /> Conectar
              </Button>
            ) : connection.status === "accepted" ? (
              <div className="rounded-md bg-emerald-50 px-3 py-2 text-center text-sm font-medium text-emerald-700">
                <Check className="mr-1 inline h-4 w-4" /> Vocês estão conectados
              </div>
            ) : (
              <div className="rounded-md bg-surface px-3 py-2 text-center text-sm text-muted-foreground">
                {connection.requester_id === currentUserId
                  ? "Solicitação de conexão enviada"
                  : "Solicitação aguardando sua resposta"}
              </div>
            )}
            <p className="text-center text-[11px] text-muted-foreground">
              A conexão apenas adiciona o corretor à sua rede — parcerias são feitas por imóvel.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Sobre</div>
            <p className="mt-2 leading-relaxed">
              {broker.bio || "Este corretor ainda não adicionou uma bio."}
            </p>
            {(broker.property_types ?? []).length > 0 && (
              <div className="mt-4 border-t border-border pt-4">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  Tipos de imóvel
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {broker.property_types.map((t) => (
                    <span key={t} className="rounded-full bg-surface px-2 py-0.5 text-xs">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Imóveis disponíveis para parceria
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Somente os imóveis que {broker.full_name.split(" ")[0]} disponibilizou. A parceria é
              solicitada por imóvel.
            </p>

            {sharedLoading ? (
              <div className="grid place-items-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : shared.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-surface text-muted-foreground">
                  <Building2 className="h-6 w-6" />
                </div>
                <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
                  Este corretor ainda não disponibilizou imóveis para parceria.
                </p>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {shared.map((property) => {
                  const existing = partnershipFor(property.id);
                  return (
                    <article
                      key={property.id}
                      className="overflow-hidden rounded-xl border border-border bg-background"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-surface">
                        {property.foto && covers[property.foto] ? (
                          <img
                            src={covers[property.foto]}
                            alt={property.nome}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-muted-foreground">
                            <ImageIcon className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="num font-display text-lg">{formatBRL(property.valor)}</div>
                        <h3 className="mt-0.5 line-clamp-1 text-sm font-medium">{property.nome}</h3>
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {[property.bairro, property.cidade].filter(Boolean).join(", ") || "—"}
                        </div>
                        {property.descricao && (
                          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                            {property.descricao}
                          </p>
                        )}
                        <div className="mt-3 border-t border-border pt-3">
                          {!existing ? (
                            <Button
                              size="sm"
                              className="w-full bg-navy text-navy-foreground hover:bg-navy/90"
                              onClick={() => setPartnershipProperty(property)}
                            >
                              <Handshake className="h-4 w-4" /> Solicitar parceria
                            </Button>
                          ) : existing.status === "accepted" ? (
                            <Button asChild size="sm" variant="outline" className="w-full">
                              <Link to="/app/parcerias/ativa/$id" params={{ id: existing.id }}>
                                <Handshake className="h-4 w-4" /> Abrir workspace
                              </Link>
                            </Button>
                          ) : (
                            <div className="rounded-md bg-surface px-3 py-1.5 text-center text-xs text-muted-foreground">
                              {existing.sender_id === currentUserId
                                ? "Solicitação enviada"
                                : "Solicitação aguardando sua resposta"}
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConnectModal
        open={connectOpen}
        onOpenChange={setConnectOpen}
        broker={broker}
        onSent={() => void refreshConnections()}
      />
      <PartnershipModal
        property={partnershipProperty}
        onOpenChange={(open) => !open && setPartnershipProperty(null)}
        broker={broker}
        onSent={() => void refreshRequests()}
      />
    </div>
  );
}

function ConnectModal({
  open,
  onOpenChange,
  broker,
  onSent,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  broker: DirectoryBroker;
  onSent: () => void;
}) {
  const [mensagem, setMensagem] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    setSending(true);
    const { error } = await createConnectionRequest({
      targetId: broker.id,
      message: mensagem,
    });
    setSending(false);
    if (error) return toast.error(error);
    toast.success(`Solicitação de conexão enviada para ${broker.full_name}`);
    setMensagem("");
    onOpenChange(false);
    onSent();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conectar com corretor</DialogTitle>
          <DialogDescription>
            Adicione {broker.full_name} à sua rede. A conexão não compartilha imóveis nem leads.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Mensagem inicial</Label>
          <Textarea
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            placeholder="Olá, vi seu perfil e gostaria de me conectar…"
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!mensagem.trim() || sending}>
            {sending ? "Enviando…" : "Enviar conexão"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PartnershipModal({
  property,
  onOpenChange,
  broker,
  onSent,
}: {
  property: SharedProperty | null;
  onOpenChange: (o: boolean) => void;
  broker: DirectoryBroker;
  onSent: () => void;
}) {
  const [mensagem, setMensagem] = useState("");
  const [tipo, setTipo] = useState("comissao");
  const [obs, setObs] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!property) return;
    setSending(true);
    const { error } = await createPartnershipRequest({
      receiverId: broker.id,
      propertyId: property.id,
      message: mensagem,
      partnershipType: tipo,
      notes: obs,
    });
    setSending(false);
    if (error) return toast.error(error);
    toast.success(`Solicitação de parceria enviada para ${broker.full_name}`);
    setMensagem("");
    setObs("");
    setTipo("comissao");
    onOpenChange(false);
    onSent();
  }

  return (
    <Dialog open={property !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solicitar parceria</DialogTitle>
          <DialogDescription>
            Parceria no imóvel {property?.nome} com {broker.full_name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Mensagem</Label>
            <Textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Tenho cliente com perfil compatível…"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Tipo de parceria</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comissao">Compartilhar comissão</SelectItem>
                <SelectItem value="captacao">Captação conjunta</SelectItem>
                <SelectItem value="indicacao">Indicação de cliente</SelectItem>
                <SelectItem value="covisita">Co-visita</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Observação</Label>
            <Textarea
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Detalhes adicionais sobre a oportunidade (opcional)"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!mensagem.trim() || sending}>
            {sending ? "Enviando…" : "Enviar solicitação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
