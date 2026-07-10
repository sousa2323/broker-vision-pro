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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { getDirectoryBroker, type DirectoryBroker } from "@/lib/directory";
import { createPartnershipRequest, usePartnershipRequests } from "@/lib/partnerships";

export const Route = createFileRoute("/app/parcerias/$id")({
  component: BrokerDetail,
});

function BrokerDetail() {
  const { id } = Route.useParams();
  const [broker, setBroker] = useState<DirectoryBroker | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectOpen, setConnectOpen] = useState(false);
  const [partnershipOpen, setPartnershipOpen] = useState(false);
  const { requests, loading: relationshipLoading, currentUserId } = usePartnershipRequests();

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
  const relationship = requests.find(
    (request) =>
      (request.sender_id === broker.id || request.receiver_id === broker.id) &&
      request.status !== "declined",
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
            {relationshipLoading ? (
              <Button className="w-full" variant="outline" disabled>
                Carregando relação…
              </Button>
            ) : !relationship ? (
              <>
                <Button
                  className="w-full bg-navy text-navy-foreground hover:bg-navy/90"
                  onClick={() => setPartnershipOpen(true)}
                >
                  <Handshake className="h-4 w-4" /> Solicitar parceria
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setConnectOpen(true)}>
                  <MessageSquare className="h-4 w-4" /> Conectar
                </Button>
              </>
            ) : relationship.status === "accepted" ? (
              <div className="rounded-md bg-emerald-50 px-3 py-2 text-center text-sm font-medium text-emerald-700">
                <Check className="mr-1 inline h-4 w-4" /> Vocês estão conectados
              </div>
            ) : (
              <div className="rounded-md bg-surface px-3 py-2 text-center text-sm text-muted-foreground">
                {relationship.sender_id === currentUserId
                  ? "Solicitação enviada"
                  : "Solicitação aguardando sua resposta"}
              </div>
            )}
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

          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-surface text-muted-foreground">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="mt-3 font-medium">Inventário compartilhado após a conexão</div>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Os imóveis deste corretor ficam visíveis quando vocês estabelecem uma parceria.
            </p>
          </div>
        </div>
      </div>

      <ConnectModal open={connectOpen} onOpenChange={setConnectOpen} broker={broker} />
      <PartnershipModal open={partnershipOpen} onOpenChange={setPartnershipOpen} broker={broker} />
    </div>
  );
}

function ConnectModal({
  open,
  onOpenChange,
  broker,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  broker: DirectoryBroker;
}) {
  const [mensagem, setMensagem] = useState("");
  const [objetivo, setObjetivo] = useState("parcerias");
  const [sending, setSending] = useState(false);

  async function submit() {
    setSending(true);
    const { error } = await createPartnershipRequest({
      receiverId: broker.id,
      message: mensagem,
      partnershipType: objetivo === "parcerias" ? "comissao" : objetivo,
    });
    setSending(false);
    if (error) return toast.error(error);
    toast.success(`Solicitação de conexão enviada para ${broker.full_name}`);
    setMensagem("");
    setObjetivo("parcerias");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conectar com corretor</DialogTitle>
          <DialogDescription>Inicie uma colaboração com {broker.full_name}.</DialogDescription>
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

function PartnershipModal({
  open,
  onOpenChange,
  broker,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  broker: DirectoryBroker;
}) {
  const [mensagem, setMensagem] = useState("");
  const [tipo, setTipo] = useState("comissao");
  const [obs, setObs] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    setSending(true);
    const { error } = await createPartnershipRequest({
      receiverId: broker.id,
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
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solicitar parceria</DialogTitle>
          <DialogDescription>Parceria com {broker.full_name}</DialogDescription>
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
