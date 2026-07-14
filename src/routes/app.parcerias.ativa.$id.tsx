import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Bath,
  Bed,
  Building2,
  Car,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Handshake,
  ListPlus,
  Loader2,
  MapPin,
  Maximize2,
  MessageSquare,
  Phone,
  ShieldCheck,
  Sparkles,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
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
import { useBrokerProfile } from "@/lib/auth";
import { useDirectory, type DirectoryBroker } from "@/lib/directory";
import { formatBRL, timeAgo } from "@/lib/format";
import type { Property } from "@/lib/properties";
import {
  endPartnership,
  getPartnershipProperty,
  markPartnershipRead,
  sendPartnershipMessage,
  usePartnershipMessages,
  usePartnershipRequests,
} from "@/lib/partnerships";
import { usePropertyMediaUrls } from "@/lib/media";
import { PartnershipChat } from "@/components/partnership-chat";

export const Route = createFileRoute("/app/parcerias/ativa/$id")({
  component: PartnershipWorkspace,
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

const partnershipTypeLabels: Record<string, string> = {
  comissao: "Compartilhamento de comissão",
  captacao: "Captação conjunta",
  indicacao: "Indicação de cliente",
  covisita: "Co-visita",
  oportunidades: "Troca de oportunidades",
  networking: "Networking profissional",
};

const COMISSAO_PCT = 0.03;
const FEE_UBROKER_PCT = 0.12;

const etapas = ["Lead recebido", "Qualificado", "Visita", "Proposta", "Fechado"] as const;
type Etapa = (typeof etapas)[number];

type StatusParceria = "Ativa" | "Em negociação" | "Proposta enviada" | "Fechada";
const statusOptions: StatusParceria[] = ["Ativa", "Em negociação", "Proposta enviada", "Fechada"];

const statusBadge: Record<StatusParceria, string> = {
  Ativa: "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Em negociação": "bg-sky-100 text-sky-700 border-sky-200",
  "Proposta enviada": "bg-orange-100 text-orange-700 border-orange-200",
  Fechada: "bg-navy text-navy-foreground border-transparent",
};

type Corretor = { nome: string; foto: string | null };

type Atividade = {
  id: string;
  quando: string;
  titulo: string;
  autor: string;
  tipo: "visita" | "proposta" | "ia" | "ligacao" | "mensagem" | "venda";
};

function PartnershipWorkspace() {
  const { id } = Route.useParams();
  const profile = useBrokerProfile();
  const { brokers } = useDirectory();
  const { requests, loading: requestLoading, currentUserId } = usePartnershipRequests();
  const {
    messages,
    loading: messagesLoading,
    refresh: refreshMessages,
  } = usePartnershipMessages(id);
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [propertyLoading, setPropertyLoading] = useState(true);
  const mediaUrls = usePropertyMediaUrls([property?.foto]);

  const request = requests.find((item) => item.id === id);
  const partnerId = request
    ? request.sender_id === currentUserId
      ? request.receiver_id
      : request.sender_id
    : undefined;
  const partner: DirectoryBroker | undefined = brokers.find((broker) => broker.id === partnerId);

  const corretorA: Corretor = {
    nome: profile?.full_name ?? "Você",
    foto: profile?.avatar_url ?? null,
  };
  const corretorB: Corretor = {
    nome: partner?.full_name ?? "Corretor parceiro",
    foto: partner?.avatar_url ?? null,
  };

  const [status, setStatus] = useState<StatusParceria>("Ativa");
  const [etapaAtual, setEtapaAtual] = useState<Etapa>("Lead recebido");
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [proximaAcao, setProximaAcao] = useState<{
    titulo: string;
    responsavel: "A" | "B";
    prazo: string;
  }>({ titulo: "Alinhar oportunidade com o parceiro", responsavel: "A", prazo: "Hoje" });
  const [registrarOpen, setRegistrarOpen] = useState(false);
  const [vendidoOpen, setVendidoOpen] = useState(false);
  const [encerrarOpen, setEncerrarOpen] = useState(false);
  const [encerrando, setEncerrando] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPropertyLoading(true);
    getPartnershipProperty(id).then((row) => {
      if (!cancelled) {
        setProperty(row);
        setPropertyLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Zera as não lidas do widget flutuante enquanto o chat desta página está visível.
  const lastMessageId = messages[messages.length - 1]?.id;
  useEffect(() => {
    if (!messagesLoading && request?.status === "accepted") void markPartnershipRead(id);
  }, [id, messagesLoading, lastMessageId, request?.status]);

  const valorImovel = Number(property?.valor ?? 0);

  async function handleEncerrar() {
    setEncerrando(true);
    const error = await endPartnership(id);
    setEncerrando(false);
    setEncerrarOpen(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Parceria encerrada");
    void navigate({ to: "/app/parcerias" });
  }

  function pushAtividade(a: Omit<Atividade, "id" | "quando">) {
    setAtividades((prev) => [{ id: crypto.randomUUID(), quando: "Agora", ...a }, ...prev]);
    setUltimaAtualizacao("agora");
  }

  function handleEtapa(novo: Etapa) {
    setEtapaAtual(novo);
    pushAtividade({
      titulo: `Etapa atualizada para "${novo}"`,
      autor: corretorA.nome,
      tipo: "mensagem",
    });
    toast.success(`Etapa atualizada para ${novo}`);
  }

  function handleConcluirProxima() {
    pushAtividade({
      titulo: `Concluído: ${proximaAcao.titulo}`,
      autor: proximaAcao.responsavel === "A" ? corretorA.nome : corretorB.nome,
      tipo: "mensagem",
    });
    setProximaAcao({
      titulo: "Aguardar retorno do parceiro",
      responsavel: "B",
      prazo: "Em 2 dias",
    });
    toast.success("Próxima ação concluída");
  }

  if (requestLoading) {
    return (
      <div className="grid place-items-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!request || request.status !== "accepted") {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <h1 className="font-display text-xl">Parceria não encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta parceria não existe, ainda não foi aceita ou não pertence à sua conta.
        </p>
        <Button asChild variant="outline" className="mt-5">
          <Link to="/app/parcerias">Voltar para parcerias</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/app/parcerias"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para parcerias
      </Link>

      <HeaderBlock
        status={status}
        onStatusChange={setStatus}
        corretorA={corretorA}
        corretorB={corretorB}
        titulo={property?.nome ?? `${corretorA.nome} + ${corretorB.nome}`}
        subtitulo={
          property
            ? [property.bairro, property.cidade].filter(Boolean).join(" · ") ||
              "Localização não informada"
            : `${partnershipTypeLabels[request.partnership_type] ?? "Parceria profissional"} · criada ${timeAgo(request.created_at)}`
        }
      />

      <NextActionBanner
        proximaAcao={proximaAcao}
        ultimaAtualizacao={ultimaAtualizacao}
        criadaEm={request.created_at}
        onConcluir={handleConcluirProxima}
        corretorA={corretorA}
        corretorB={corretorB}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FinanceCard corretorA={corretorA} corretorB={corretorB} valorImovel={valorImovel} />
        </div>
        <AcoesCard
          etapaAtual={etapaAtual}
          onChangeEtapa={handleEtapa}
          onRegistrar={() => setRegistrarOpen(true)}
          onVendido={() => setVendidoOpen(true)}
          onEncerrar={() => setEncerrarOpen(true)}
        />
      </div>

      <PipelineStepper etapaAtual={etapaAtual} onChangeEtapa={handleEtapa} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ActivityTimeline
          atividades={atividades}
          corretorB={corretorB}
          onRegistrar={() => setRegistrarOpen(true)}
        />
        <div className="flex flex-col rounded-2xl border border-border bg-card p-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Comunicação entre corretores
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Conversa vinculada a esta parceria.
          </div>
          <PartnershipChat
            messages={messages}
            loading={messagesLoading}
            currentUserId={currentUserId}
            partnerName={corretorB.nome}
            onSend={async (texto) => {
              const error = await sendPartnershipMessage(id, texto);
              if (error) {
                toast.error(error);
                return false;
              }
              await refreshMessages();
              return true;
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PropertyBlock
            property={property}
            fotoUrl={property?.foto ? mediaUrls[property.foto] : undefined}
            loading={propertyLoading}
            currentUserId={currentUserId}
            corretorA={corretorA}
            corretorB={corretorB}
          />
        </div>
        <ContractBlock request={request} />
      </div>

      <RegistrarAtividadeModal
        open={registrarOpen}
        onOpenChange={setRegistrarOpen}
        onSubmit={(tipo, descricao) => {
          pushAtividade({
            titulo: descricao || tipo,
            autor: corretorA.nome,
            tipo:
              tipo === "Visita realizada"
                ? "visita"
                : tipo === "Proposta enviada"
                  ? "proposta"
                  : tipo === "Follow-up realizado"
                    ? "ligacao"
                    : "mensagem",
          });
          toast.success("Atividade registrada");
        }}
      />
      <Dialog open={encerrarOpen} onOpenChange={setEncerrarOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Encerrar parceria</DialogTitle>
            <DialogDescription>
              O workspace e o chat desta parceria deixam de ficar acessíveis para os dois
              corretores. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEncerrarOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleEncerrar()}
              disabled={encerrando}
            >
              {encerrando && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Encerrar parceria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FinalizarVendaModal
        open={vendidoOpen}
        onOpenChange={setVendidoOpen}
        valorReferencia={valorImovel}
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
// Próxima ação + urgência
// ───────────────────────────────────────────────────────────────────────────

function NextActionBanner({
  proximaAcao,
  ultimaAtualizacao,
  criadaEm,
  onConcluir,
  corretorA,
  corretorB,
}: {
  proximaAcao: { titulo: string; responsavel: "A" | "B"; prazo: string };
  ultimaAtualizacao: string | null;
  criadaEm: string;
  onConcluir: () => void;
  corretorA: Corretor;
  corretorB: Corretor;
}) {
  const isMine = proximaAcao.responsavel === "A";
  const responsavelNome = isMine ? `${corretorA.nome} (você)` : corretorB.nome;
  const urgencyLabel = ultimaAtualizacao
    ? "Atualizado agora"
    : `Parceria criada ${timeAgo(criadaEm)}`;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border p-5 lg:flex-row lg:items-center lg:justify-between",
        isMine ? "border-sky-200 bg-sky-50" : "border-border bg-card",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            isMine ? "bg-sky-500 text-white" : "bg-orange-100 text-orange-600",
          )}
        >
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Próxima ação
          </div>
          <div className="mt-0.5 font-display text-lg leading-tight">{proximaAcao.titulo}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Responsável: <span className="font-medium text-foreground">{responsavelNome}</span> ·
            Prazo sugerido: <span className="font-medium text-foreground">{proximaAcao.prazo}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 lg:flex-col lg:items-end">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          {ultimaAtualizacao ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
          {urgencyLabel}
        </div>
        <Button size="sm" variant={isMine ? "default" : "outline"} onClick={onConcluir}>
          <CheckCircle2 className="h-4 w-4" /> Marcar como concluída
        </Button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Sub-componentes
// ───────────────────────────────────────────────────────────────────────────

function HeaderBlock({
  status,
  onStatusChange,
  corretorA,
  corretorB,
  titulo,
  subtitulo,
}: {
  status: StatusParceria;
  onStatusChange: (s: StatusParceria) => void;
  corretorA: Corretor;
  corretorB: Corretor;
  titulo: string;
  subtitulo: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Parceria ativa
          </div>
          <h1 className="mt-2 font-display text-2xl">{titulo}</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> {subtitulo}
          </div>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Parceria formalizada para atuação conjunta. Toda a execução, comissões e comunicação
            ficam registradas neste ambiente.
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
            <BrokerChip corretor={corretorA} legenda="Corretor A" />
            <Handshake className="h-4 w-4 text-orange-500" />
            <BrokerChip corretor={corretorB} legenda="Corretor B" />
          </div>
        </div>
      </div>
    </div>
  );
}

function BrokerChip({ corretor, legenda }: { corretor: Corretor; legenda: string }) {
  const initials = corretor.nome
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-background py-1 pl-1 pr-3">
      {corretor.foto ? (
        <img
          src={corretor.foto}
          alt={corretor.nome}
          className="h-7 w-7 rounded-full object-cover"
        />
      ) : (
        <div className="grid h-7 w-7 place-items-center rounded-full bg-surface text-[10px] font-medium text-muted-foreground">
          {initials}
        </div>
      )}
      <div className="text-left leading-tight">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{legenda}</div>
        <div className="text-xs font-medium">{corretor.nome}</div>
      </div>
    </div>
  );
}

function FinanceCard({
  corretorA,
  corretorB,
  valorImovel,
}: {
  corretorA: Corretor;
  corretorB: Corretor;
  valorImovel: number;
}) {
  const comissao = valorImovel * COMISSAO_PCT;
  const parteCorretor = comissao / 2;
  const fee = parteCorretor * FEE_UBROKER_PCT;
  const ganhoLiquido = parteCorretor - fee;

  return (
    <div className="overflow-hidden rounded-2xl border border-navy/20 bg-navy text-navy-foreground shadow">
      <div className="flex items-center justify-between border-b border-white/10 p-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-white/60">Resumo financeiro</div>
          <div className="mt-1 font-display text-2xl">{formatBRL(valorImovel)}</div>
          <div className="text-xs text-white/60">Valor combinado dos imóveis da parceria</div>
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
        <div className="space-y-1 text-xs text-white/70">
          <div>
            Fee Ubroker · 12% sobre sua comissão · <span className="num">{formatBRL(fee)}</span>
          </div>
          <div className="text-[10px] text-white/50">
            Simulação baseada nos imóveis ativos dos participantes.
          </div>
        </div>
        <div className="rounded-xl bg-orange-500/15 px-4 py-2 text-right">
          <div className="text-[10px] uppercase tracking-widest text-orange-200">
            Seu ganho estimado
          </div>
          <div className="num font-display text-xl text-orange-300">{formatBRL(ganhoLiquido)}</div>
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
  onEncerrar,
}: {
  etapaAtual: Etapa;
  onChangeEtapa: (e: Etapa) => void;
  onRegistrar: () => void;
  onVendido: () => void;
  onEncerrar: () => void;
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

        <Button
          variant="outline"
          className="w-full justify-start text-rose-700 hover:bg-rose-50 hover:text-rose-800"
          onClick={onEncerrar}
        >
          <X className="h-4 w-4" /> Encerrar parceria
        </Button>
      </div>
      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
        Ações ficam registradas no histórico da parceria e visíveis para ambos os corretores.
      </p>
    </div>
  );
}

function PipelineStepper({
  etapaAtual,
  onChangeEtapa,
}: {
  etapaAtual: Etapa;
  onChangeEtapa: (e: Etapa) => void;
}) {
  const idx = etapas.indexOf(etapaAtual);
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Pipeline compartilhado
          </div>
          <div className="mt-1 text-sm">
            Etapa atual: <span className="font-medium text-orange-600">{etapaAtual}</span>
          </div>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline">
              <Sparkles className="h-4 w-4" /> Atualizar etapa
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-1">
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
                <div className={cn("h-0.5 flex-1", i < idx ? "bg-emerald-300" : "bg-border")} />
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-[11px] text-muted-foreground">
        A etapa define o andamento da parceria e é visível para ambos.
      </p>
    </div>
  );
}

function ActivityTimeline({
  atividades,
  corretorB,
  onRegistrar,
}: {
  atividades: Atividade[];
  corretorB: Corretor;
  onRegistrar: () => void;
}) {
  const icon = {
    visita: MapPin,
    proposta: FileText,
    ia: Sparkles,
    ligacao: Phone,
    mensagem: MessageSquare,
    venda: Trophy,
  } as const;

  function autorBadge(autor: string) {
    if (autor.includes("IA")) return "bg-violet-100 text-violet-700 border-violet-200";
    if (autor === "Sistema") return "bg-muted text-muted-foreground border-border";
    if (autor === corretorB.nome) return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-sky-100 text-sky-700 border-sky-200";
  }

  function autorLabel(autor: string) {
    if (autor.includes("IA")) return "IA";
    if (autor === "Sistema") return "Sistema";
    if (autor === corretorB.nome) return "Corretor B";
    return "Corretor A";
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          Atividades · rastro de execução
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{atividades.length}</Badge>
          <Button size="sm" variant="outline" onClick={onRegistrar}>
            <ListPlus className="h-4 w-4" /> Registrar
          </Button>
        </div>
      </div>
      {atividades.length ? (
        <ul className="mt-4 space-y-3">
          {atividades.map((a) => {
            const Icon = icon[a.tipo] ?? MessageSquare;
            return (
              <li
                key={a.id}
                className="flex gap-3 rounded-xl border border-border bg-background p-3"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-medium">{a.titulo}</div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                        autorBadge(a.autor),
                      )}
                    >
                      {autorLabel(a.autor)}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {a.quando} · {a.autor}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
          Nenhuma atividade registrada ainda. Registre visitas, propostas e follow-ups para manter o
          rastro de execução da parceria.
        </div>
      )}
    </div>
  );
}

function PropertyBlock({
  property,
  fotoUrl,
  loading,
  currentUserId,
  corretorA,
  corretorB,
}: {
  property: Property | null;
  fotoUrl?: string;
  loading: boolean;
  currentUserId?: string;
  corretorA: Corretor;
  corretorB: Corretor;
}) {
  if (loading) {
    return (
      <div className="grid place-items-center rounded-2xl border border-border bg-card py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          Imóvel da parceria
        </div>
        <div className="mt-4 grid place-items-center gap-2 rounded-xl border border-dashed border-border p-10 text-center">
          <Building2 className="h-7 w-7 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">
            Não foi possível carregar o imóvel desta parceria.
          </div>
        </div>
      </div>
    );
  }

  const isOwner = property.broker_id === currentUserId;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {fotoUrl ? (
        <img src={fotoUrl} alt={property.nome} className="aspect-[16/8] w-full object-cover" />
      ) : (
        <div className="grid aspect-[16/8] w-full place-items-center bg-surface">
          <Building2 className="h-10 w-10 text-muted-foreground" />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs text-muted-foreground">
              Imóvel de {isOwner ? corretorA.nome : corretorB.nome}
            </div>
            <div className="mt-0.5 font-display text-lg">{property.nome}</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />{" "}
              {[property.bairro, property.cidade].filter(Boolean).join(" · ") ||
                "Localização não informada"}
            </div>
          </div>
          <div className="num font-display text-lg">{formatBRL(Number(property.valor))}</div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Bed className="h-3.5 w-3.5" />
            {property.quartos} quartos
          </span>
          <span className="inline-flex items-center gap-1">
            <Bath className="h-3.5 w-3.5" />
            {property.suites} suítes
          </span>
          <span className="inline-flex items-center gap-1">
            <Car className="h-3.5 w-3.5" />
            {property.vagas} vagas
          </span>
          <span className="inline-flex items-center gap-1">
            <Maximize2 className="h-3.5 w-3.5" />
            {property.area} m²
          </span>
        </div>
        {property.descricao && (
          <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
            {property.descricao}
          </p>
        )}
        {isOwner && (
          <Button asChild variant="outline" className="mt-5">
            <Link to="/app/imoveis/$id" params={{ id: property.id }}>
              Ver imóvel completo
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function ContractBlock({
  request,
}: {
  request: {
    partnership_type: string;
    message: string;
    notes: string | null;
    responded_at: string | null;
    created_at: string;
  };
}) {
  const termos: { label: string; value: string }[] = [
    {
      label: "Modalidade",
      value: partnershipTypeLabels[request.partnership_type] ?? request.partnership_type,
    },
    { label: "Divisão", value: "50% / 50%" },
    { label: "Fee Ubroker", value: "12%" },
  ];
  const aceitaEm = request.responded_at ?? request.created_at;
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Termos ativos da parceria
      </div>

      <div className="mt-4 space-y-2">
        {termos.map((t) => (
          <div
            key={t.label}
            className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5"
          >
            <span className="text-xs text-muted-foreground">{t.label}</span>
            <span className="text-sm font-semibold text-foreground">{t.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl bg-surface p-3 text-sm">
        <div className="text-xs font-medium">Mensagem que originou a parceria</div>
        <p className="mt-1 text-xs text-muted-foreground">{request.message}</p>
        {request.notes && (
          <p className="mt-2 text-[11px] text-muted-foreground">Observação: {request.notes}</p>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 text-[11px] text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Parceria aceita {timeAgo(aceitaEm)} por ambas as partes
      </div>
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
  const [tipo, setTipo] = useState("Visita realizada");
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
                <SelectItem value="Visita realizada">Visita realizada</SelectItem>
                <SelectItem value="Proposta enviada">Proposta enviada</SelectItem>
                <SelectItem value="Follow-up realizado">Follow-up realizado</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
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
  valorReferencia,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  valorReferencia: number;
  onConfirm: (valor: number, quem: string) => void;
}) {
  const [valor, setValor] = useState("");
  const [quem, setQuem] = useState("Ambos");
  const [confirmado, setConfirmado] = useState(false);
  const [step, setStep] = useState<"form" | "resumo">("form");

  const valorNum = Number(valor.replace(/[^\d]/g, "")) || valorReferencia;
  const comissao = valorNum * COMISSAO_PCT;
  const parteCorretor = comissao / 2;
  const fee = parteCorretor * FEE_UBROKER_PCT;
  const ganhoLiquido = parteCorretor - fee;
  const feeTotal = fee * 2;

  function reset() {
    setStep("form");
    setConfirmado(false);
  }

  function handleConfirmar() {
    onConfirm(valorNum, quem);
    setStep("resumo");
  }

  function handleClose(o: boolean) {
    onOpenChange(o);
    if (!o) {
      setTimeout(reset, 150);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        {step === "form" ? (
          <>
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
                  Valor de referência: {formatBRL(valorReferencia)}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/40 p-3">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Simulação da divisão
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <SimRow label="Comissão (3%)" value={formatBRL(comissao)} />
                  <SimRow label="Fee Ubroker total" value={formatBRL(feeTotal)} />
                  <SimRow label="Corretor A · 50%" value={formatBRL(parteCorretor)} />
                  <SimRow label="Corretor B · 50%" value={formatBRL(parteCorretor)} />
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                  <span className="text-xs text-muted-foreground">Seu ganho líquido</span>
                  <span className="num text-sm font-semibold text-orange-600">
                    {formatBRL(ganhoLiquido)}
                  </span>
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
                <span>Ambas as partes confirmam que a venda seguiu os termos da parceria.</span>
              </label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancelar
              </Button>
              <Button
                disabled={!confirmado}
                className="bg-orange-500 text-white hover:bg-orange-500/90"
                onClick={handleConfirmar}
              >
                Confirmar venda
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <DialogTitle className="text-center">Venda concluída com sucesso</DialogTitle>
              <DialogDescription className="text-center">
                Parceria finalizada e registrada no histórico de ambos os corretores.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-4 text-sm">
              <SimRow label="Valor final" value={formatBRL(valorNum)} />
              <SimRow label="Ganho Corretor A" value={formatBRL(ganhoLiquido)} />
              <SimRow label="Ganho Corretor B" value={formatBRL(ganhoLiquido)} />
              <SimRow label="Fee da plataforma" value={formatBRL(feeTotal)} />
              <SimRow label="Fechado por" value={quem} />
            </div>
            <DialogFooter>
              <Button
                className="w-full bg-orange-500 text-white hover:bg-orange-500/90"
                onClick={() => handleClose(false)}
              >
                Fechar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SimRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="num text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
