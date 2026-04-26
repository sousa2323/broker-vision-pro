import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Bed, Bath, Car, Handshake, Maximize2, MapPin, MessageSquare } from "lucide-react";
import { brokers, properties, formatBRL } from "@/data/mock";
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

export const Route = createFileRoute("/app/parcerias/$id")({
  component: BrokerDetail,
  notFoundComponent: () => (
    <div className="rounded-2xl border border-border bg-card p-8 text-center">
      <h2 className="font-display text-xl">Corretor não encontrado</h2>
      <Link to="/app/parcerias" className="mt-4 inline-block text-brand">Voltar à lista</Link>
    </div>
  ),
});

type PropertyLike = (typeof properties)[number];

function BrokerDetail() {
  const { id } = Route.useParams();
  const broker = brokers.find((b) => b.id === id);
  if (!broker) throw notFound();

  const inv = properties.filter((p) => broker.inventoryIds.includes(p.id));

  const [connectOpen, setConnectOpen] = useState(false);
  const [partnership, setPartnership] = useState<{ open: boolean; property: PropertyLike | null }>({
    open: false,
    property: null,
  });

  return (
    <div className="space-y-8">
      <Link to="/app/parcerias" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar para parcerias
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
          <div className="mt-6 space-y-2">
            <Button
              className="w-full bg-navy text-navy-foreground hover:bg-navy/90"
              onClick={() => setPartnership({ open: true, property: null })}
            >
              <Handshake className="h-4 w-4" /> Solicitar parceria
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setConnectOpen(true)}>
              <MessageSquare className="h-4 w-4" /> Conectar
            </Button>
            <Button asChild variant="ghost" className="w-full text-orange-600 hover:text-orange-700">
              <Link to="/app/parcerias/ativa">Ver parceria ativa</Link>
            </Button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Sobre</div>
            <p className="mt-2 leading-relaxed">{broker.bio}</p>
          </div>
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-xl">Inventário do parceiro</h2>
              <div className="text-xs text-muted-foreground">{inv.length} oportunidades</div>
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
                    <Button
                      variant="outline"
                      className="mt-4 w-full"
                      onClick={() => setPartnership({ open: true, property: p })}
                    >
                      <Handshake className="h-4 w-4" /> Solicitar parceria neste imóvel
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ConnectModal
        open={connectOpen}
        onOpenChange={setConnectOpen}
        brokerName={broker.nome}
      />
      <PartnershipModal
        open={partnership.open}
        onOpenChange={(o) => setPartnership((s) => ({ ...s, open: o }))}
        brokerName={broker.nome}
        property={partnership.property}
      />
    </div>
  );
}

function ConnectModal({
  open,
  onOpenChange,
  brokerName,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  brokerName: string;
}) {
  const [mensagem, setMensagem] = useState("");
  const [objetivo, setObjetivo] = useState("parcerias");

  function submit() {
    toast.success(`Solicitação de conexão enviada para ${brokerName}`);
    setMensagem("");
    setObjetivo("parcerias");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conectar com corretor</DialogTitle>
          <DialogDescription>Inicie uma colaboração com {brokerName}.</DialogDescription>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={!mensagem.trim()}>Enviar conexão</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PartnershipModal({
  open,
  onOpenChange,
  brokerName,
  property,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  brokerName: string;
  property: PropertyLike | null;
}) {
  const [mensagem, setMensagem] = useState("");
  const [tipo, setTipo] = useState("comissao");
  const [obs, setObs] = useState("");

  function submit() {
    toast.success(
      property
        ? `Solicitação de parceria enviada · ${property.nome}`
        : `Solicitação de parceria enviada para ${brokerName}`,
    );
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
          <DialogDescription>
            {property
              ? `Imóvel: ${property.nome} · ${formatBRL(property.valor)}`
              : `Parceria geral com ${brokerName}`}
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
              <SelectTrigger><SelectValue /></SelectTrigger>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={!mensagem.trim()}>Enviar solicitação</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
