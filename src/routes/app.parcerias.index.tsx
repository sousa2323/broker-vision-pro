import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { brokers } from "@/data/mock";
import { ArrowRight, MapPin, Search, Handshake, MessageSquare, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
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

export const Route = createFileRoute("/app/parcerias/")({
  component: PartnersPage,
});

const compatColors: Record<string, string> = {
  Alta: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Média: "bg-amber-50 text-amber-700 border-amber-200",
  Baixa: "bg-slate-50 text-slate-600 border-slate-200",
};

const relColors: Record<string, string> = {
  ativo: "bg-emerald-100 text-emerald-700 border-emerald-200",
  recente: "bg-sky-100 text-sky-700 border-sky-200",
  inativo: "bg-slate-200 text-slate-600 border-slate-300",
};

const myNetworkIds = ["B-01", "B-02", "B-04", "B-05", "B-07"];
const relStatus: Record<string, "ativo" | "recente" | "inativo"> = {
  "B-01": "ativo",
  "B-02": "ativo",
  "B-04": "recente",
  "B-05": "ativo",
  "B-07": "inativo",
};

type Broker = (typeof brokers)[number];

function PartnersPage() {
  const [tab, setTab] = useState<"explorar" | "rede">("explorar");

  // filters
  const [q, setQ] = useState("");
  const [regiao, setRegiao] = useState("todas");
  const [tipo, setTipo] = useState("todos");
  const [faixa, setFaixa] = useState("todas");
  const [perfil, setPerfil] = useState("todos");

  // modal
  const [connectFor, setConnectFor] = useState<Broker | null>(null);

  const regioes = useMemo(
    () => Array.from(new Set(brokers.map((b) => b.regiao))).sort(),
    [],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return brokers.filter((b) => {
      if (term) {
        const hay = `${b.nome} ${b.regiao} ${b.especialidade} ${b.agencia}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      if (regiao !== "todas" && b.regiao !== regiao) return false;
      return true;
    });
  }, [q, regiao]);

  const myNetwork = brokers.filter((b) => myNetworkIds.includes(b.id));
  const carteiraTotal = myNetwork.reduce((a, b) => a + b.imoveis, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Parcerias</h1>
        <p className="text-sm text-muted-foreground">
          Conecte-se com corretores, explore oportunidades e feche negócios em conjunto.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "explorar" | "rede")}>
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
                <SelectTrigger><SelectValue placeholder="Região" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as regiões</SelectItem>
                  {regioes.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue placeholder="Tipo de imóvel" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="apto">Apartamento</SelectItem>
                  <SelectItem value="cob">Cobertura</SelectItem>
                  <SelectItem value="casa">Casa</SelectItem>
                  <SelectItem value="com">Comercial</SelectItem>
                  <SelectItem value="ter">Terreno</SelectItem>
                </SelectContent>
              </Select>
              <Select value={faixa} onValueChange={setFaixa}>
                <SelectTrigger><SelectValue placeholder="Faixa de valor" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as faixas</SelectItem>
                  <SelectItem value="800">Até R$ 800k</SelectItem>
                  <SelectItem value="1500">R$ 800k – 1,5M</SelectItem>
                  <SelectItem value="3000">R$ 1,5M – 3M</SelectItem>
                  <SelectItem value="acima">Acima de R$ 3M</SelectItem>
                </SelectContent>
              </Select>
              <Select value={perfil} onValueChange={setPerfil}>
                <SelectTrigger><SelectValue placeholder="Perfil de cliente" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os perfis</SelectItem>
                  <SelectItem value="familia">Família</SelectItem>
                  <SelectItem value="invest">Investidor</SelectItem>
                  <SelectItem value="alto">Alto padrão</SelectItem>
                  <SelectItem value="primeira">Primeira moradia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            {filtered.length} corretores encontrados · oportunidades de colaboração ativas
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((b) => (
              <BrokerCard key={b.id} broker={b} onConnect={() => setConnectFor(b)} />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                Nenhum corretor encontrado com esses critérios.
              </div>
            )}
          </div>
        </TabsContent>

        {/* MINHA REDE */}
        <TabsContent value="rede" className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-4 text-sm">
            <span className="font-medium">{myNetwork.length} parceiros na sua rede</span>
            <span className="text-muted-foreground"> · Carteira combinada de </span>
            <span className="num font-medium">{carteiraTotal} imóveis</span>
          </div>
          <Link
            to="/app/parcerias/ativa"
            className="flex items-center justify-between rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm transition hover:bg-orange-100"
          >
            <div>
              <div className="font-medium text-orange-900">
                Você tem 1 parceria ativa em andamento
              </div>
              <div className="text-xs text-orange-800/80">
                Casa em condomínio em Itaipu · Proposta enviada
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-orange-700" />
          </Link>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {myNetwork.map((b) => (
              <BrokerCard
                key={b.id}
                broker={b}
                relacionamento={relStatus[b.id]}
                onConnect={() => setConnectFor(b)}
                connectLabel="Mensagem"
                connectIcon={<MessageSquare className="h-3.5 w-3.5" />}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <ConnectModal broker={connectFor} onOpenChange={(o) => !o && setConnectFor(null)} />
    </div>
  );
}

function BrokerCard({
  broker: b,
  relacionamento,
  onConnect,
  connectLabel = "Conectar",
  connectIcon = <Handshake className="h-3.5 w-3.5" />,
}: {
  broker: Broker;
  relacionamento?: "ativo" | "recente" | "inativo";
  onConnect: () => void;
  connectLabel?: string;
  connectIcon?: React.ReactNode;
}) {
  return (
    <article className="flex flex-col rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <img src={b.foto} alt={b.nome} className="h-14 w-14 rounded-full object-cover" />
          <div className="min-w-0">
            <div className="font-medium truncate">{b.nome}</div>
            <div className="truncate text-xs text-muted-foreground">{b.agencia}</div>
          </div>
        </div>
        {relacionamento && (
          <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide", relColors[relacionamento])}>
            {relacionamento}
          </span>
        )}
      </div>

      <div className="mt-4 space-y-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" /> {b.regiao}
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-md bg-brand/5 px-2 py-1 text-brand">
          <Briefcase className="h-3.5 w-3.5" /> {b.especialidade}
        </div>
        <div className="num">Carteira combinada: {b.imoveis} imóveis</div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px]", compatColors[b.compatibilidade])}>
          Compat. {b.compatibilidade}
        </span>
      </div>

      <div className="mt-4 flex gap-2 border-t border-border pt-4">
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link to="/app/parcerias/$id" params={{ id: b.id }}>
            Ver perfil <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
        <Button size="sm" className="flex-1 bg-navy text-navy-foreground hover:bg-navy/90" onClick={onConnect}>
          {connectIcon} {connectLabel}
        </Button>
      </div>
    </article>
  );
}

function ConnectModal({
  broker,
  onOpenChange,
}: {
  broker: Broker | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [mensagem, setMensagem] = useState("");
  const [objetivo, setObjetivo] = useState("parcerias");

  function submit() {
    toast.success(`Solicitação de conexão enviada para ${broker?.nome}`);
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
            {broker ? `Inicie uma colaboração com ${broker.nome} (${broker.agencia}).` : ""}
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={!mensagem.trim()}>Enviar conexão</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
