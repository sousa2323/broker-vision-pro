import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bath,
  Bed,
  Car,
  CheckCircle2,
  Circle,
  Download,
  FileText,
  Handshake,
  ListPlus,
  MapPin,
  Maximize2,
  MessageSquare,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";
import { broker, formatBRL } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/app/parcerias/ativa")({
  component: ParceriaAtivaPage,
  head: () => ({
    meta: [
      { title: "Parceria ativa — Ubroker" },
      {
        name: "description",
        content:
          "Acompanhamento de uma parceria ativa entre corretores: financeiro, pipeline, atividades e contrato.",
      },
    ],
  }),
});

// ───────────────────────────────────────────────────────────────────────────
// Dados fictícios
// ───────────────────────────────────────────────────────────────────────────

const corretorA = {
  nome: broker.name,
  agencia: "Ubroker · Niterói",
  foto: broker.avatar,
};

const corretorB = {
  nome: "Marina Tavares",
  agencia: "UpHouse Imóveis",
  foto: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=256&h=256&fit=crop&q=80",
};

const imovel = {
  nome: "Casa em condomínio em Itaipu",
  endereco: "Cond. Reserva de Itaipu · Niterói / RJ",
  descricao:
    "Casa térrea em condomínio fechado, varanda integrada à piscina, jardim privativo, churrasqueira e suíte master ampliada. Reformada em 2024.",
  quartos: 4,
  suites: 2,
  vagas: 3,
  area: 280,
  foto: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&h=800&fit=crop&q=80",
  valor: 1_180_000,
};

const COMISSAO_PCT = 0.03;
const FEE_UBROKER_PCT = 0.12;

const etapas = ["Lead recebido", "Qualificado", "Visita", "Proposta", "Fechado"] as const;
type Etapa = (typeof etapas)[number];

type StatusParceria = "Ativa" | "Em negociação" | "Proposta enviada" | "Fechada";
const statusOptions: StatusParceria[] = [
  "Ativa",
  "Em negociação",
  "Proposta enviada",
  "Fechada",
];

const statusBadge: Record<StatusParceria, string> = {
  Ativa: "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Em negociação": "bg-sky-100 text-sky-700 border-sky-200",
  "Proposta enviada": "bg-orange-100 text-orange-700 border-orange-200",
  Fechada: "bg-navy text-navy-foreground border-transparent",
};

type Atividade = {
  id: string;
  quando: string;
  titulo: string;
  autor: string;
  tipo: "visita" | "proposta" | "ia" | "ligacao" | "mensagem" | "venda";
};

const atividadesIniciais: Atividade[] = [
  { id: "a1", quando: "Hoje, 10:00", titulo: "Visita realizada", autor: "Corretor A", tipo: "visita" },
  { id: "a2", quando: "Ontem, 18:00", titulo: "Proposta enviada", autor: "Corretor B", tipo: "proposta" },
  { id: "a3", quando: "2 dias atrás", titulo: "Lead qualificado", autor: "IA Assistente", tipo: "ia" },
];

type Mensagem = { id: string; autor: "A" | "B"; texto: string; quando: string };
const mensagensIniciais: Mensagem[] = [
  { id: "m1", autor: "B", texto: "Cliente gostou muito da casa, vamos avançar.", quando: "Ontem 17:42" },
  { id: "m2", autor: "A", texto: "Perfeito. Que valor faz sentido propor?", quando: "Ontem 17:55" },
  { id: "m3", autor: "B", texto: "Vou enviar a proposta hoje.", quando: "Ontem 18:01" },
];

// ───────────────────────────────────────────────────────────────────────────
// Página
// ───────────────────────────────────────────────────────────────────────────

function ParceriaAtivaPage() {
  const [status, setStatus] = useState<StatusParceria>("Proposta enviada");
  const [etapaAtual, setEtapaAtual] = useState<Etapa>("Proposta");
  const [atividades, setAtividades] = useState<Atividade[]>(atividadesIniciais);
  const [mensagens, setMensagens] = useState<Mensagem[]>(mensagensIniciais);

  const [registrarOpen, setRegistrarOpen] = useState(false);
  const [vendidoOpen, setVendidoOpen] = useState(false);

  function pushAtividade(a: Omit<Atividade, "id" | "quando">) {
    setAtividades((prev) => [
      { id: crypto.randomUUID(), quando: "Agora", ...a },
      ...prev,
    ]);
  }

  function handleEtapa(novo: Etapa) {
    setEtapaAtual(novo);
    pushAtividade({ titulo: `Etapa atualizada para "${novo}"`, autor: "Corretor A", tipo: "mensagem" });
    toast.success(`Etapa atualizada para ${novo}`);
  }

  return (
    <div className="space-y-6">
      <Link
        to="/app/parcerias"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para parcerias
      </Link>

      {/* HEADER */}
      <HeaderBlock
        status={status}
        onStatusChange={setStatus}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* FINANCEIRO */}
        <div className="lg:col-span-2">
          <FinanceCard />
        </div>
        {/* AÇÕES */}
        <AcoesCard
          etapaAtual={etapaAtual}
          onChangeEtapa={handleEtapa}
          onRegistrar={() => setRegistrarOpen(true)}
          onVendido={() => setVendidoOpen(true)}
        />
      </div>

      {/* PIPELINE */}
      <PipelineStepper etapaAtual={etapaAtual} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ActivityTimeline atividades={atividades} />
        <ChatBlock
          mensagens={mensagens}
          onSend={(t) =>
            setMensagens((prev) => [
              ...prev,
              { id: crypto.randomUUID(), autor: "A", texto: t, quando: "Agora" },
            ])
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PropertyBlock />
        </div>
        <ContractBlock />
      </div>

      {/* MODAIS */}
      <RegistrarAtividadeModal
        open={registrarOpen}
        onOpenChange={setRegistrarOpen}
        onSubmit={(tipo, descricao) => {
          pushAtividade({
            titulo: descricao || tipo,
            autor: "Corretor A",
            tipo:
              tipo === "Visita"
                ? "visita"
                : tipo === "Proposta"
                  ? "proposta"
                  : tipo === "Ligação"
                    ? "ligacao"
                    : "mensagem",
          });
          toast.success("Atividade registrada");
        }}
      />
      <FinalizarVendaModal
        open={vendidoOpen}
        onOpenChange={setVendidoOpen}
        onConfirm={(valor, quem) => {
          setStatus("Fechada");
          setEtapaAtual("Fechado");
          pushAtividade({
            titulo: `Venda confirmada por ${quem} · ${formatBRL(valor)}`,
            autor: "Sistema",
            tipo: "venda",
          });
          toast.success("Venda registrada · parceria finalizada");
        }}
      />
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Sub-componentes
// ───────────────────────────────────────────────────────────────────────────

function HeaderBlock({
  status,
  onStatusChange,
}: {
  status: StatusParceria;
  onStatusChange: (s: StatusParceria) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Parceria ativa
          </div>
          <h1 className="mt-2 font-display text-2xl">{imovel.nome}</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> {imovel.endereco}
          </div>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Parceria formalizada para atuação conjunta neste imóvel. Toda a execução, comissões e
            comunicação ficam registradas neste ambiente.
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 lg:items-end">
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "rounded-md border px-3 py-1 text-xs font-semibold transition hover:opacity-90",
                  statusBadge[status],
                )}
              >
                {status}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-1">
              {statusOptions.map((s) => (
                <button
                  key={s}
                  onClick={() => onStatusChange(s)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-accent",
                    s === status && "bg-accent",
                  )}
                >
                  {s}
                  {s === status && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-3">
            <BrokerChip nome={corretorA.nome} foto={corretorA.foto} legenda="Corretor A" />
            <Handshake className="h-4 w-4 text-orange-500" />
            <BrokerChip nome={corretorB.nome} foto={corretorB.foto} legenda="Corretor B" />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.message("Abrindo contrato de parceria…")}
          >
            <FileText className="h-4 w-4" /> Ver contrato
          </Button>
        </div>
      </div>
    </div>
  );
}

function BrokerChip({ nome, foto, legenda }: { nome: string; foto: string; legenda: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-background py-1 pl-1 pr-3">
      <img src={foto} alt={nome} className="h-7 w-7 rounded-full object-cover" />
      <div className="text-left leading-tight">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{legenda}</div>
        <div className="text-xs font-medium">{nome}</div>
      </div>
    </div>
  );
}

function FinanceCard() {
  const comissao = imovel.valor * COMISSAO_PCT;
  const parteCorretor = comissao / 2;
  const fee = parteCorretor * FEE_UBROKER_PCT;
  const ganhoLiquido = parteCorretor - fee;

  return (
    <div className="overflow-hidden rounded-2xl border border-navy/20 bg-navy text-navy-foreground shadow">
      <div className="flex items-center justify-between border-b border-white/10 p-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-white/60">Resumo financeiro</div>
          <div className="mt-1 font-display text-2xl">{formatBRL(imovel.valor)}</div>
          <div className="text-xs text-white/60">Valor de venda do imóvel</div>
        </div>
        <Trophy className="h-8 w-8 text-orange-400" />
      </div>

      <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
        <FinanceCell
          label="Comissão estimada"
          value={formatBRL(comissao)}
          hint="3% sobre o valor"
        />
        <FinanceCell
          label="Corretor A · 50%"
          value={formatBRL(parteCorretor)}
          hint={corretorA.nome.split(" ")[0]}
        />
        <FinanceCell
          label="Corretor B · 50%"
          value={formatBRL(parteCorretor)}
          hint={corretorB.nome.split(" ")[0]}
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-white/10 bg-white/5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-white/70">
          Fee Ubroker · 12% sobre sua comissão · <span className="num">{formatBRL(fee)}</span>
        </div>
        <div className="rounded-xl bg-orange-500/15 px-4 py-2 text-right">
          <div className="text-[10px] uppercase tracking-widest text-orange-200">
            Seu ganho estimado
          </div>
          <div className="num font-display text-xl text-orange-300">
            {formatBRL(ganhoLiquido)}
          </div>
        </div>
      </div>
    </div>
  );
}

function FinanceCell({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="text-[10px] uppercase tracking-widest text-white/60">{label}</div>
      <div className="num mt-1 font-display text-lg">{value}</div>
      <div className="text-[11px] text-white/60">{hint}</div>
    </div>
  );
}

function AcoesCard({
  etapaAtual,
  onChangeEtapa,
  onRegistrar,
  onVendido,
}: {
  etapaAtual: Etapa;
  onChangeEtapa: (e: Etapa) => void;
  onRegistrar: () => void;
  onVendido: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">
        Ações principais
      </div>
      <div className="mt-4 space-y-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              <Sparkles className="h-4 w-4" /> Atualizar etapa
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 p-1">
            {etapas.map((e) => (
              <button
                key={e}
                onClick={() => onChangeEtapa(e)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-accent",
                  e === etapaAtual && "bg-accent",
                )}
              >
                {e}
                {e === etapaAtual && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        <Button variant="outline" className="w-full justify-start" onClick={onRegistrar}>
          <ListPlus className="h-4 w-4" /> Registrar atividade
        </Button>

        <Button
          className="w-full justify-start bg-orange-500 text-white hover:bg-orange-500/90"
          onClick={onVendido}
        >
          <Trophy className="h-4 w-4" /> Marcar como vendido
        </Button>
      </div>
      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
        Ações ficam registradas no histórico da parceria e visíveis para ambos os corretores.
      </p>
    </div>
  );
}

function PipelineStepper({ etapaAtual }: { etapaAtual: Etapa }) {
  const idx = etapas.indexOf(etapaAtual);
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Pipeline compartilhado
          </div>
          <div className="mt-1 text-sm">
            Etapa atual: <span className="font-medium text-orange-600">{etapaAtual}</span>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Última atualização: Proposta enviada por Corretor B
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2">
        {etapas.map((e, i) => {
          const done = i < idx;
          const current = i === idx;
          return (
            <div key={e} className="flex flex-1 items-center gap-2">
              <div className="flex flex-1 flex-col items-center text-center">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border text-xs",
                    done && "border-emerald-200 bg-emerald-100 text-emerald-700",
                    current && "border-orange-300 bg-orange-100 text-orange-700",
                    !done && !current && "border-border bg-muted text-muted-foreground",
                  )}
                >
                  {done ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
                </div>
                <div
                  className={cn(
                    "mt-2 text-[11px]",
                    current ? "font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  {e}
                </div>
              </div>
              {i < etapas.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1",
                    i < idx ? "bg-emerald-300" : "bg-border",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActivityTimeline({ atividades }: { atividades: Atividade[] }) {
  const icon = {
    visita: MapPin,
    proposta: FileText,
    ia: Sparkles,
    ligacao: Phone,
    mensagem: MessageSquare,
    venda: Trophy,
  } as const;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          Atividades · rastro de execução
        </div>
        <Badge variant="outline">{atividades.length}</Badge>
      </div>
      <ul className="mt-4 space-y-3">
        {atividades.map((a) => {
          const Icon = icon[a.tipo] ?? MessageSquare;
          return (
            <li key={a.id} className="flex gap-3 rounded-xl border border-border bg-background p-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{a.titulo}</div>
                <div className="text-xs text-muted-foreground">
                  {a.quando} · {a.autor}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ChatBlock({
  mensagens,
  onSend,
}: {
  mensagens: Mensagem[];
  onSend: (texto: string) => void;
}) {
  const [valor, setValor] = useState("");
  function send() {
    const t = valor.trim();
    if (!t) return;
    onSend(t);
    setValor("");
  }
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-6">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">
        Comunicação entre corretores
      </div>
      <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1" style={{ maxHeight: 280 }}>
        {mensagens.map((m) => {
          const mine = m.autor === "A";
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                  mine
                    ? "bg-navy text-navy-foreground"
                    : "border border-border bg-background",
                )}
              >
                <div>{m.texto}</div>
                <div
                  className={cn(
                    "mt-1 text-[10px]",
                    mine ? "text-white/60" : "text-muted-foreground",
                  )}
                >
                  {mine ? "Você" : "Corretor B"} · {m.quando}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
        <Input
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="Escrever mensagem..."
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
        />
        <Button onClick={send} disabled={!valor.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function PropertyBlock() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <img src={imovel.foto} alt={imovel.nome} className="aspect-[16/8] w-full object-cover" />
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-display text-lg">{imovel.nome}</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {imovel.endereco}
            </div>
          </div>
          <div className="num font-display text-lg">{formatBRL(imovel.valor)}</div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{imovel.descricao}</p>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Bed className="h-3.5 w-3.5" />
            {imovel.quartos} quartos
          </span>
          <span className="inline-flex items-center gap-1">
            <Bath className="h-3.5 w-3.5" />
            {imovel.suites} suítes
          </span>
          <span className="inline-flex items-center gap-1">
            <Car className="h-3.5 w-3.5" />
            {imovel.vagas} vagas
          </span>
          <span className="inline-flex items-center gap-1">
            <Maximize2 className="h-3.5 w-3.5" />
            {imovel.area} m²
          </span>
        </div>
        <Button
          variant="outline"
          className="mt-5"
          onClick={() => toast.message("Abrindo ficha completa do imóvel…")}
        >
          Ver imóvel completo
        </Button>
      </div>
    </div>
  );
}

function ContractBlock() {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Contrato
      </div>
      <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-800">
          <CheckCircle2 className="h-4 w-4" /> Contrato de parceria assinado
        </div>
        <div className="mt-1 text-xs text-emerald-700">
          Assinado em 12/04/2026 por ambas as partes.
        </div>
      </div>
      <div className="mt-4 space-y-2 text-xs text-muted-foreground">
        <div>· Divisão de comissão 50% / 50%</div>
        <div>· Cláusula de exclusividade por 90 dias</div>
        <div>· Foro: Niterói / RJ</div>
      </div>
      <Button
        className="mt-auto w-full"
        variant="outline"
        onClick={() => toast.success("Download do contrato iniciado")}
      >
        <Download className="h-4 w-4" /> Baixar contrato
      </Button>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Modais
// ───────────────────────────────────────────────────────────────────────────

function RegistrarAtividadeModal({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (tipo: string, descricao: string) => void;
}) {
  const [tipo, setTipo] = useState("Visita");
  const [descricao, setDescricao] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar atividade</DialogTitle>
          <DialogDescription>
            A atividade aparecerá no histórico compartilhado da parceria.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ligação">Ligação</SelectItem>
                <SelectItem value="Visita">Visita</SelectItem>
                <SelectItem value="Proposta">Proposta</SelectItem>
                <SelectItem value="Mensagem">Mensagem</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              placeholder="Detalhes da atividade…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onSubmit(tipo, descricao);
              setDescricao("");
              onOpenChange(false);
            }}
          >
            Registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FinalizarVendaModal({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: (valor: number, quem: string) => void;
}) {
  const [valor, setValor] = useState<string>(String(imovel.valor));
  const [quem, setQuem] = useState("Ambos");
  const [confirmado, setConfirmado] = useState(false);

  function submit() {
    const n = Number(valor.replace(/[^\d]/g, "")) || imovel.valor;
    onConfirm(n, quem);
    onOpenChange(false);
    setConfirmado(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Finalizar venda</DialogTitle>
          <DialogDescription>
            Esta ação encerra a parceria e registra a venda no histórico de ambos os corretores.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Valor final da venda</Label>
            <Input
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="R$ 0"
              inputMode="numeric"
            />
            <div className="text-xs text-muted-foreground">
              Valor de referência: {formatBRL(imovel.valor)}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Quem fechou a venda</Label>
            <RadioGroup value={quem} onValueChange={setQuem}>
              {["Corretor A", "Corretor B", "Ambos"].map((opt) => (
                <label
                  key={opt}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-2.5 text-sm"
                >
                  <RadioGroupItem value={opt} /> {opt}
                </label>
              ))}
            </RadioGroup>
          </div>
          <label className="flex items-start gap-2 rounded-md border border-border bg-muted/50 p-3 text-sm">
            <Checkbox
              checked={confirmado}
              onCheckedChange={(v) => setConfirmado(Boolean(v))}
              className="mt-0.5"
            />
            <span>Confirmo que os termos da parceria foram respeitados.</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!confirmado}
            className="bg-orange-500 text-white hover:bg-orange-500/90"
            onClick={submit}
          >
            Confirmar venda
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
