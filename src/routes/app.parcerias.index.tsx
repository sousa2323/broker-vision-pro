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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useDirectory, type DirectoryBroker } from "@/lib/directory";
import {
  createPartnershipRequest,
  respondToPartnershipRequest,
  usePartnershipRequests,
  type PartnershipRequest,
} from "@/lib/partnerships";

export const Route = createFileRoute("/app/parcerias/")({
  component: PartnersPage,
});

const planColors: Record<string, string> = {
  Pro: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Free: "bg-slate-50 text-slate-600 border-slate-200",
};

function PartnersPage() {
  const { brokers, loading } = useDirectory();
  const { requests, loading: requestsLoading, refresh, currentUserId } = usePartnershipRequests();
  const [q, setQ] = useState("");
  const [regiao, setRegiao] = useState("todas");
  const [connectFor, setConnectFor] = useState<DirectoryBroker | null>(null);
  const incoming = requests.filter(
    (r) => r.receiver_id === currentUserId && r.status === "pending",
  );
  const accepted = requests.filter((r) => r.status === "accepted");
  const brokersById = useMemo(() => new Map(brokers.map((b) => [b.id, b])), [brokers]);

  const regioes = useMemo(
    () => Array.from(new Set(brokers.flatMap((b) => b.regions ?? []))).sort(),
    [brokers],
  );

  const filtered = useMemo(() => {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Parcerias</h1>
        <p className="text-sm text-muted-foreground">
          Conecte-se com corretores, explore oportunidades e feche negócios em conjunto.
        </p>
      </div>

      <Tabs defaultValue="explorar">
        <TabsList>
          <TabsTrigger value="explorar">Explorar corretores</TabsTrigger>
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
                placeholder="Buscar por nome, região ou especialidade…"
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

          {loading ? (
            <div className="grid place-items-center py-16 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="text-xs text-muted-foreground">
                {filtered.length}{" "}
                {filtered.length === 1 ? "corretor encontrado" : "corretores encontrados"}
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((b) => {
                  const relationship = requests.find(
                    (request) =>
                      (request.sender_id === b.id || request.receiver_id === b.id) &&
                      request.status !== "declined",
                  );
                  return (
                    <BrokerCard
                      key={b.id}
                      broker={b}
                      relationship={relationship}
                      relationshipLoading={requestsLoading}
                      currentUserId={currentUserId}
                      onConnect={() => setConnectFor(b)}
                      workspaceId={
                        relationship?.status === "accepted" ? relationship.id : undefined
                      }
                    />
                  );
                })}
                {filtered.length === 0 && (
                  <div className="col-span-full rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
                    Nenhum corretor no diretório ainda. Conforme mais corretores entram na Ubroker,
                    eles aparecerão aqui para você formar parcerias.
                  </div>
                )}
              </div>
            </>
          )}
        </TabsContent>

        {/* MINHA REDE */}
        <TabsContent value="rede" className="space-y-5">
          {requestsLoading ? (
            <div className="grid place-items-center py-16 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : incoming.length || accepted.length ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-border bg-card p-4 text-sm">
                <span className="font-medium">
                  {accepted.length} {accepted.length === 1 ? "parceiro" : "parceiros"} na sua rede
                </span>
                {incoming.length > 0 && (
                  <>
                    <span className="text-muted-foreground"> · </span>
                    <span className="num font-medium">{incoming.length}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      {incoming.length === 1 ? "solicitação pendente" : "solicitações pendentes"}
                    </span>
                  </>
                )}
              </div>

              {incoming.length > 0 && (
                <section className="space-y-3">
                  <h2 className="font-display text-lg">Solicitações recebidas</h2>
                  <div className="grid gap-3 md:grid-cols-2">
                    {incoming.map((request) => (
                      <RequestCard
                        key={request.id}
                        request={request}
                        broker={brokersById.get(request.sender_id)}
                        onRespond={refresh}
                      />
                    ))}
                  </div>
                </section>
              )}

              {accepted.map((request) => {
                const partnerId =
                  request.sender_id === currentUserId ? request.receiver_id : request.sender_id;
                const partner = brokersById.get(partnerId);
                return (
                  <Link
                    key={request.id}
                    to="/app/parcerias/ativa/$id"
                    params={{ id: request.id }}
                    className="flex items-center justify-between rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm transition hover:bg-orange-100"
                  >
                    <div>
                      <div className="font-medium text-orange-900">
                        Parceria ativa com {partner?.full_name ?? "corretor parceiro"}
                      </div>
                      <div className="text-xs text-orange-800/80">
                        Aceita {request.responded_at ? "· acompanhe a operação no workspace" : ""} ·
                        abrir workspace da parceria
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-orange-700" />
                  </Link>
                );
              })}

              {accepted.length > 0 && (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {accepted.map((request) => {
                    const partnerId =
                      request.sender_id === currentUserId ? request.receiver_id : request.sender_id;
                    const partner = brokersById.get(partnerId);
                    if (!partner) return null;
                    return (
                      <BrokerCard
                        key={request.id}
                        broker={partner}
                        relationship={request}
                        relationshipLoading={false}
                        currentUserId={currentUserId}
                        onConnect={() => {}}
                        workspaceId={request.id}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-surface text-muted-foreground">
                <Users className="h-7 w-7" />
              </div>
              <div className="font-display text-lg">Você ainda não tem parceiros conectados</div>
              <p className="max-w-sm text-sm text-muted-foreground">
                Envie solicitações de conexão na aba “Explorar corretores” para montar sua rede de
                parcerias.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ConnectModal broker={connectFor} onOpenChange={(o) => !o && setConnectFor(null)} />
    </div>
  );
}

function BrokerCard({
  broker: b,
  relationship,
  relationshipLoading,
  currentUserId,
  onConnect,
  workspaceId,
}: {
  broker: DirectoryBroker;
  relationship?: PartnershipRequest;
  relationshipLoading: boolean;
  currentUserId?: string;
  onConnect: () => void;
  workspaceId?: string;
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
        {relationshipLoading ? (
          <Button size="sm" variant="outline" className="flex-1" disabled>
            Carregando…
          </Button>
        ) : !relationship ? (
          <Button
            size="sm"
            className="flex-1 bg-navy text-navy-foreground hover:bg-navy/90"
            onClick={onConnect}
          >
            <Handshake className="h-3.5 w-3.5" /> Conectar
          </Button>
        ) : relationship.status === "pending" ? (
          <Button size="sm" variant="outline" className="flex-1" disabled>
            {relationship.sender_id === currentUserId
              ? "Solicitação enviada"
              : "Solicitação recebida"}
          </Button>
        ) : relationship.status === "accepted" && workspaceId ? (
          <Button
            asChild
            size="sm"
            className="flex-1 bg-navy text-navy-foreground hover:bg-navy/90"
          >
            <Link to="/app/parcerias/ativa/$id" params={{ id: workspaceId }}>
              <Handshake className="h-3.5 w-3.5" /> Workspace
            </Link>
          </Button>
        ) : null}
      </div>
    </article>
  );
}

function ConnectModal({
  broker,
  onOpenChange,
}: {
  broker: DirectoryBroker | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [mensagem, setMensagem] = useState("");
  const [objetivo, setObjetivo] = useState("parcerias");
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!broker) return;
    setSending(true);
    const { error } = await createPartnershipRequest({
      receiverId: broker.id,
      message: mensagem,
      partnershipType: objetivo === "parcerias" ? "comissao" : objetivo,
    });
    setSending(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(`Solicitação de conexão enviada para ${broker.full_name}`);
    setMensagem("");
    setObjetivo("parcerias");
    onOpenChange(false);
  }

  return (
    <Dialog open={!!broker} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conectar com corretor</DialogTitle>
          <DialogDescription>
            {broker ? `Inicie uma colaboração com ${broker.full_name}.` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Mensagem inicial</Label>
            <Textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Olá, vi seu perfil e gostaria de explorar oportunidades de parceria…"
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>Objetivo da conexão</Label>
            <RadioGroup value={objetivo} onValueChange={setObjetivo}>
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-2.5 text-sm">
                <RadioGroupItem value="parcerias" /> Parcerias em imóveis
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-2.5 text-sm">
                <RadioGroupItem value="oportunidades" /> Troca de oportunidades
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-2.5 text-sm">
                <RadioGroupItem value="networking" /> Networking profissional
              </label>
            </RadioGroup>
          </div>
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

function RequestCard({
  request,
  broker,
  onRespond,
}: {
  request: PartnershipRequest;
  broker?: DirectoryBroker;
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
