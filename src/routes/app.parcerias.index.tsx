import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  MapPin,
  Search,
  Handshake,
  Briefcase,
  Users,
  Loader2,
  Check,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "sonner";
import { formatBRL } from "@/lib/format";
import { useDirectory, type DirectoryBroker } from "@/lib/directory";
import {
  respondToPartnershipRequest,
  usePartnershipConversations,
  usePartnershipRequests,
  type PartnershipRequest,
} from "@/lib/partnerships";
import {
  createConnectionRequest,
  respondToConnectionRequest,
  useConnections,
  type BrokerConnection,
} from "@/lib/connections";
import { useProperties, useSharedInventory, type SharedProperty } from "@/lib/properties";
import { usePropertyMediaUrls } from "@/lib/media";

export const Route = createFileRoute("/app/parcerias/")({
  component: PartnersPage,
});

const planColors: Record<string, string> = {
  Pro: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Free: "bg-slate-50 text-slate-600 border-slate-200",
};

function PartnersPage() {
  const { brokers, loading } = useDirectory();
  const {
    connections,
    loading: connectionsLoading,
    refresh: refreshConnections,
    currentUserId,
  } = useConnections();
  const { requests, refresh: refreshRequests } = usePartnershipRequests();
  const { conversations } = usePartnershipConversations();
  const { shared, loading: sharedLoading } = useSharedInventory();
  const { properties: ownProperties } = useProperties();
  const [q, setQ] = useState("");
  const [regiao, setRegiao] = useState("todas");
  const [connectFor, setConnectFor] = useState<DirectoryBroker | null>(null);

  const incomingConnections = connections.filter(
    (c) => c.target_id === currentUserId && c.status === "pending",
  );
  const acceptedConnections = connections.filter((c) => c.status === "accepted");
  const incomingPartnerships = requests.filter(
    (r) => r.receiver_id === currentUserId && r.status === "pending",
  );
  const brokersById = useMemo(() => new Map(brokers.map((b) => [b.id, b])), [brokers]);
  const ownPropertyName = (propertyId: string) =>
    ownProperties.find((p) => p.id === propertyId)?.nome ?? "um imóvel seu";

  const regioes = useMemo(
    () => Array.from(new Set(brokers.flatMap((b) => b.regions ?? []))).sort(),
    [brokers],
  );

  const filteredBrokers = useMemo(() => {
    const term = q.trim().toLowerCase();
    return brokers.filter((b) => {
      if (term) {
        const hay =
          `${b.full_name} ${(b.regions ?? []).join(" ")} ${(b.specialties ?? []).join(" ")}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      if (regiao !== "todas" && !(b.regions ?? []).includes(regiao)) return false;
      return true;
    });
  }, [q, regiao, brokers]);

  // Busca de imóveis: nome, bairro/cidade e valor (dígitos do termo).
  const filteredProperties = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return shared;
    const digits = term.replace(/\D/g, "");
    return shared.filter((p) => {
      const hay = `${p.nome} ${p.bairro ?? ""} ${p.cidade ?? ""}`.toLowerCase();
      if (hay.includes(term)) return true;
      if (digits.length >= 3 && String(Math.trunc(p.valor)).includes(digits)) return true;
      return false;
    });
  }, [q, shared]);

  const covers = usePropertyMediaUrls(filteredProperties.map((p) => p.foto));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Parcerias</h1>
        <p className="text-sm text-muted-foreground">
          Encontre imóveis abertos a parceria, conecte-se com corretores e feche negócios em
          conjunto.
        </p>
      </div>

      <Tabs defaultValue="explorar">
        <TabsList>
          <TabsTrigger value="explorar">Explorar</TabsTrigger>
          <TabsTrigger value="rede">Minha rede</TabsTrigger>
        </TabsList>

        {/* EXPLORAR */}
        <TabsContent value="explorar" className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar corretor (nome, região, especialidade) ou imóvel (nome, bairro, cidade, valor)…"
                className="pl-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <Select value={regiao} onValueChange={setRegiao}>
                <SelectTrigger>
                  <SelectValue placeholder="Região" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as regiões</SelectItem>
                  {regioes.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Imóveis disponíveis para parceria */}
          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-lg">Imóveis disponíveis para parceria</h2>
              <span className="text-xs text-muted-foreground">
                {filteredProperties.length}{" "}
                {filteredProperties.length === 1 ? "imóvel" : "imóveis"}
              </span>
            </div>
            {sharedLoading ? (
              <div className="grid place-items-center py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                Nenhum imóvel disponível para parceria{q.trim() ? " com esse filtro" : " ainda"}.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProperties.map((p) => (
                  <SharedPropertyCard
                    key={p.id}
                    property={p}
                    owner={brokersById.get(p.broker_id)}
                    coverUrl={p.foto ? covers[p.foto] : undefined}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Corretores */}
          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-lg">Corretores</h2>
              <span className="text-xs text-muted-foreground">
                {filteredBrokers.length}{" "}
                {filteredBrokers.length === 1 ? "corretor" : "corretores"}
              </span>
            </div>
            {loading ? (
              <div className="grid place-items-center py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredBrokers.map((b) => {
                  const connection = connections.find(
                    (c) =>
                      (c.requester_id === b.id || c.target_id === b.id) &&
                      c.status !== "declined",
                  );
                  return (
                    <BrokerCard
                      key={b.id}
                      broker={b}
                      connection={connection}
                      connectionLoading={connectionsLoading}
                      currentUserId={currentUserId}
                      onConnect={() => setConnectFor(b)}
                    />
                  );
                })}
                {filteredBrokers.length === 0 && (
                  <div className="col-span-full rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
                    Nenhum corretor no diretório ainda. Conforme mais corretores entram na Ubroker,
                    eles aparecerão aqui para você formar parcerias.
                  </div>
                )}
              </div>
            )}
          </section>
        </TabsContent>

        {/* MINHA REDE */}
        <TabsContent value="rede" className="space-y-5">
          {connectionsLoading ? (
            <div className="grid place-items-center py-16 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : incomingConnections.length ||
            incomingPartnerships.length ||
            acceptedConnections.length ||
            conversations.length ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-border bg-card p-4 text-sm">
                <span className="font-medium">
                  {acceptedConnections.length}{" "}
                  {acceptedConnections.length === 1 ? "conexão" : "conexões"} ·{" "}
                  {conversations.length}{" "}
                  {conversations.length === 1 ? "parceria ativa" : "parcerias ativas"}
                </span>
                {incomingConnections.length + incomingPartnerships.length > 0 && (
                  <>
                    <span className="text-muted-foreground"> · </span>
                    <span className="num font-medium">
                      {incomingConnections.length + incomingPartnerships.length}
                    </span>
                    <span className="text-muted-foreground">
                      {" "}
                      {incomingConnections.length + incomingPartnerships.length === 1
                        ? "solicitação pendente"
                        : "solicitações pendentes"}
                    </span>
                  </>
                )}
              </div>

              {incomingPartnerships.length > 0 && (
                <section className="space-y-3">
                  <h2 className="font-display text-lg">Solicitações de parceria</h2>
                  <div className="grid gap-3 md:grid-cols-2">
                    {incomingPartnerships.map((request) => (
                      <PartnershipRequestCard
                        key={request.id}
                        request={request}
                        broker={brokersById.get(request.sender_id)}
                        propertyName={ownPropertyName(request.property_id)}
                        onRespond={refreshRequests}
                      />
                    ))}
                  </div>
                </section>
              )}

              {incomingConnections.length > 0 && (
                <section className="space-y-3">
                  <h2 className="font-display text-lg">Solicitações de conexão</h2>
                  <div className="grid gap-3 md:grid-cols-2">
                    {incomingConnections.map((connection) => (
                      <ConnectionRequestCard
                        key={connection.id}
                        connection={connection}
                        broker={brokersById.get(connection.requester_id)}
                        onRespond={refreshConnections}
                      />
                    ))}
                  </div>
                </section>
              )}

              {conversations.length > 0 && (
                <section className="space-y-3">
                  <h2 className="font-display text-lg">Parcerias de imóvel</h2>
                  {conversations.map((conversation) => {
                    const partner = brokersById.get(conversation.partner_id);
                    return (
                      <Link
                        key={conversation.partnership_id}
                        to="/app/parcerias/ativa/$id"
                        params={{ id: conversation.partnership_id }}
                        className="flex items-center justify-between rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm transition hover:bg-orange-100"
                      >
                        <div>
                          <div className="font-medium text-orange-900">
                            Parceria com {partner?.full_name ?? "corretor parceiro"} ·{" "}
                            {conversation.property_nome}
                          </div>
                          <div className="text-xs text-orange-800/80">
                            Abrir workspace da parceria
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-orange-700" />
                      </Link>
                    );
                  })}
                </section>
              )}

              {acceptedConnections.length > 0 && (
                <section className="space-y-3">
                  <h2 className="font-display text-lg">Conexões</h2>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {acceptedConnections.map((connection) => {
                      const partnerId =
                        connection.requester_id === currentUserId
                          ? connection.target_id
                          : connection.requester_id;
                      const partner = brokersById.get(partnerId);
                      if (!partner) return null;
                      return (
                        <BrokerCard
                          key={connection.id}
                          broker={partner}
                          connection={connection}
                          connectionLoading={false}
                          currentUserId={currentUserId}
                          onConnect={() => {}}
                        />
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-surface text-muted-foreground">
                <Users className="h-7 w-7" />
              </div>
              <div className="font-display text-lg">Você ainda não tem rede de parcerias</div>
              <p className="max-w-sm text-sm text-muted-foreground">
                Conecte-se com corretores e solicite parcerias nos imóveis disponíveis na aba
                “Explorar”.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ConnectModal
        broker={connectFor}
        onOpenChange={(o) => !o && setConnectFor(null)}
        onSent={() => void refreshConnections()}
      />
    </div>
  );
}

function SharedPropertyCard({
  property,
  owner,
  coverUrl,
}: {
  property: SharedProperty;
  owner?: DirectoryBroker;
  coverUrl?: string;
}) {
  return (
    <Link
      to="/app/parcerias/$id"
      params={{ id: property.broker_id }}
      className="overflow-hidden rounded-2xl border border-border bg-card transition hover:border-brand/40"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface">
        {coverUrl ? (
          <img src={coverUrl} alt={property.nome} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-navy/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest text-navy-foreground">
          Parceria
        </span>
      </div>
      <div className="p-4">
        <div className="num font-display text-lg">{formatBRL(property.valor)}</div>
        <h3 className="mt-0.5 line-clamp-1 text-sm font-medium">{property.nome}</h3>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {[property.bairro, property.cidade].filter(Boolean).join(", ") || "—"}
        </div>
        <div className="mt-3 border-t border-border pt-2 text-xs text-muted-foreground">
          {owner?.full_name ?? "Corretor parceiro"}
        </div>
      </div>
    </Link>
  );
}

function BrokerCard({
  broker: b,
  connection,
  connectionLoading,
  currentUserId,
  onConnect,
}: {
  broker: DirectoryBroker;
  connection?: BrokerConnection;
  connectionLoading: boolean;
  currentUserId?: string;
  onConnect: () => void;
}) {
  const initials = b.full_name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
  const regiao = (b.regions ?? []).slice(0, 2).join(" · ") || "—";
  const especialidade = (b.specialties ?? [])[0];
  return (
    <article className="flex flex-col rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          {b.avatar_url ? (
            <img
              src={b.avatar_url}
              alt={b.full_name}
              className="h-14 w-14 rounded-full object-cover"
            />
          ) : (
            <div className="grid h-14 w-14 place-items-center rounded-full bg-surface text-sm font-medium text-muted-foreground">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <div className="font-medium truncate">{b.full_name}</div>
            <div className="truncate text-xs text-muted-foreground">
              {b.ticket_range ?? "Corretor"}
            </div>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${planColors[b.plan] ?? planColors.Free}`}
        >
          {b.plan}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" /> {regiao}
        </div>
        {especialidade && (
          <div className="inline-flex items-center gap-1.5 rounded-md bg-brand/5 px-2 py-1 text-brand">
            <Briefcase className="h-3.5 w-3.5" /> {especialidade}
          </div>
        )}
        {b.bio && <p className="line-clamp-2">{b.bio}</p>}
      </div>

      <div className="mt-4 flex gap-2 border-t border-border pt-4">
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link to="/app/parcerias/$id" params={{ id: b.id }}>
            Ver perfil <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
        {connectionLoading ? (
          <Button size="sm" variant="outline" className="flex-1" disabled>
            Carregando…
          </Button>
        ) : !connection ? (
          <Button
            size="sm"
            className="flex-1 bg-navy text-navy-foreground hover:bg-navy/90"
            onClick={onConnect}
          >
            <Handshake className="h-3.5 w-3.5" /> Conectar
          </Button>
        ) : connection.status === "pending" ? (
          <Button size="sm" variant="outline" className="flex-1" disabled>
            {connection.requester_id === currentUserId
              ? "Solicitação enviada"
              : "Solicitação recebida"}
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="flex-1" disabled>
            <Check className="h-3.5 w-3.5" /> Conectado
          </Button>
        )}
      </div>
    </article>
  );
}

function ConnectModal({
  broker,
  onOpenChange,
  onSent,
}: {
  broker: DirectoryBroker | null;
  onOpenChange: (open: boolean) => void;
  onSent: () => void;
}) {
  const [mensagem, setMensagem] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!broker) return;
    setSending(true);
    const { error } = await createConnectionRequest({
      targetId: broker.id,
      message: mensagem,
    });
    setSending(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(`Solicitação de conexão enviada para ${broker.full_name}`);
    setMensagem("");
    onOpenChange(false);
    onSent();
  }

  return (
    <Dialog open={!!broker} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conectar com corretor</DialogTitle>
          <DialogDescription>
            {broker
              ? `Adicione ${broker.full_name} à sua rede. A conexão não compartilha imóveis nem leads.`
              : ""}
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

function ConnectionRequestCard({
  connection,
  broker,
  onRespond,
}: {
  connection: BrokerConnection;
  broker?: DirectoryBroker;
  onRespond: () => Promise<void>;
}) {
  const [responding, setResponding] = useState(false);

  async function respond(response: "accepted" | "declined") {
    setResponding(true);
    const error = await respondToConnectionRequest(connection.id, response);
    if (error) toast.error(error);
    else {
      toast.success(response === "accepted" ? "Conexão aceita" : "Solicitação recusada");
      await onRespond();
    }
    setResponding(false);
  }

  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <div className="font-medium">{broker?.full_name ?? "Corretor"}</div>
      <div className="text-xs text-muted-foreground">quer se conectar com você</div>
      <p className="mt-2 text-sm text-muted-foreground">{connection.message}</p>
      <div className="mt-4 flex gap-2">
        <Button size="sm" onClick={() => void respond("accepted")} disabled={responding}>
          <Check className="h-4 w-4" /> Aceitar
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void respond("declined")}
          disabled={responding}
        >
          <X className="h-4 w-4" /> Recusar
        </Button>
      </div>
    </article>
  );
}

function PartnershipRequestCard({
  request,
  broker,
  propertyName,
  onRespond,
}: {
  request: PartnershipRequest;
  broker?: DirectoryBroker;
  propertyName: string;
  onRespond: () => Promise<void>;
}) {
  const [responding, setResponding] = useState(false);

  async function respond(response: "accepted" | "declined") {
    setResponding(true);
    const error = await respondToPartnershipRequest(request.id, response);
    if (error) toast.error(error);
    else {
      toast.success(response === "accepted" ? "Parceria aceita" : "Solicitação recusada");
      await onRespond();
    }
    setResponding(false);
  }

  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <div className="font-medium">{broker?.full_name ?? "Corretor"}</div>
      <div className="text-xs text-muted-foreground">
        quer parceria no imóvel <span className="font-medium">{propertyName}</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{request.message}</p>
      <div className="mt-4 flex gap-2">
        <Button size="sm" onClick={() => void respond("accepted")} disabled={responding}>
          <Check className="h-4 w-4" /> Aceitar
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void respond("declined")}
          disabled={responding}
        >
          <X className="h-4 w-4" /> Recusar
        </Button>
      </div>
    </article>
  );
}
