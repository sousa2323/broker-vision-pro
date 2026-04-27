import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  MessageSquare,
  Instagram,
  Globe,
  Send,
  UserCheck,
  Sparkles,
  Calendar,
  FileText,
  CheckSquare,
  ArrowRightCircle,
  Home,
  Flame,
  Clock,
  AlertTriangle,
  X,
  Bot,
} from "lucide-react";
import { inboxConversations, leads, pipelineStages } from "@/data/mock";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/app/inbox")({
  component: InboxPage,
});

const channelIcon = {
  WhatsApp: MessageSquare,
  Instagram,
  Marketplace: Globe,
} as const;

const channelColor: Record<string, string> = {
  WhatsApp: "text-emerald-600",
  Instagram: "text-pink-600",
  Marketplace: "text-blue-600",
};

type Etapa = "Novo" | "Qualificado" | "Visita" | "Proposta" | "Fechado";
type Prioridade = "quente" | "espera" | "risco" | null;
type SugestaoAcao = "visita" | "opcoes" | "info";

type Meta = {
  iaAtiva: boolean;
  etapa: Etapa;
  prioridade: Prioridade;
  esperaTexto?: string;
  score: number;
  classificacao: "Frio" | "Morno" | "Quente";
  sugestaoIA?: { texto: string; acoes: SugestaoAcao[] };
  proximaAcao: string;
};

const META: Record<string, Meta> = {
  "C-1": {
    iaAtiva: false,
    etapa: "Visita",
    prioridade: "quente",
    score: 88,
    classificacao: "Quente",
    sugestaoIA: {
      texto: "Lead pronto para visita — confirmar sábado às 10h",
      acoes: ["visita", "info"],
    },
    proximaAcao: "Confirmar visita sábado 10h",
  },
  "C-2": {
    iaAtiva: true,
    etapa: "Qualificado",
    prioridade: "espera",
    esperaTexto: "sem resposta há 2h",
    score: 72,
    classificacao: "Morno",
    sugestaoIA: {
      texto: "Cliente pediu fotos — enviar galeria da varanda",
      acoes: ["opcoes", "info"],
    },
    proximaAcao: "Enviar 3 opções até 14h",
  },
  "C-3": {
    iaAtiva: true,
    etapa: "Novo",
    prioridade: null,
    score: 54,
    classificacao: "Morno",
    proximaAcao: "Qualificar interesse no loft do Centro",
  },
  "C-4": {
    iaAtiva: true,
    etapa: "Qualificado",
    prioridade: "quente",
    score: 81,
    classificacao: "Quente",
    sugestaoIA: {
      texto: "Lead com perfil compatível — enviar 3 opções em Icaraí",
      acoes: ["opcoes", "visita"],
    },
    proximaAcao: "Enviar opções de 2 suítes em Icaraí",
  },
  "C-5": {
    iaAtiva: false,
    etapa: "Proposta",
    prioridade: "risco",
    esperaTexto: "sem retorno há 24h",
    score: 76,
    classificacao: "Quente",
    sugestaoIA: {
      texto: "Proposta sem retorno há 24h — fazer follow-up consultivo",
      acoes: ["info", "opcoes"],
    },
    proximaAcao: "Follow-up até o fim do dia",
  },
};

const ETAPA_COLOR: Record<Etapa, string> = {
  Novo: "bg-slate-200 text-slate-800",
  Qualificado: "bg-blue-100 text-blue-800",
  Visita: "bg-amber-100 text-amber-800",
  Proposta: "bg-violet-100 text-violet-800",
  Fechado: "bg-emerald-100 text-emerald-800",
};

const CLASSIF_COLOR: Record<Meta["classificacao"], string> = {
  Frio: "bg-slate-100 text-slate-700",
  Morno: "bg-amber-100 text-amber-800",
  Quente: "bg-warm/15 text-warm",
};

const QUICK_REPLIES = [
  "Confirmar visita",
  "Enviar proposta",
  "Aguardar retorno",
] as const;

const QUICK_REPLY_TEXT: Record<(typeof QUICK_REPLIES)[number], string> = {
  "Confirmar visita":
    "Posso confirmar nossa visita? Tenho disponibilidade no horário combinado.",
  "Enviar proposta":
    "Vou te enviar agora a proposta com os valores e condições. Qualquer ajuste, me avisa.",
  "Aguardar retorno":
    "Sem problema, fico no aguardo do seu retorno para seguirmos.",
};

const IMOVEIS_MOCK = [
  "Cobertura Linear · Icaraí · R$ 1.890.000",
  "2 Suítes Marine · Icaraí · R$ 1.250.000",
  "Studio São Francisco · R$ 690.000",
  "Loft do Centro · R$ 540.000",
];

type ModalKind = null | "imovel" | "visita" | "proposta" | "tarefa" | "pipeline";

function InboxPage() {
  const [filter, setFilter] = useState<"Todos" | keyof typeof channelIcon>("Todos");
  const [activeId, setActiveId] = useState(inboxConversations[0].id);
  const [draft, setDraft] = useState("");
  const [iaOverrides, setIaOverrides] = useState<Record<string, boolean>>({});
  const [etapaOverrides, setEtapaOverrides] = useState<Record<string, Etapa>>({});
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(
    new Set(),
  );
  const [openModal, setOpenModal] = useState<ModalKind>(null);

  // modal fields
  const [imoveisSel, setImoveisSel] = useState<Set<string>>(new Set());
  const [visitaData, setVisitaData] = useState("");
  const [visitaHora, setVisitaHora] = useState("");
  const [propValor, setPropValor] = useState("");
  const [propCond, setPropCond] = useState("");
  const [tarefaTitulo, setTarefaTitulo] = useState("");
  const [tarefaData, setTarefaData] = useState("");
  const [novaEtapa, setNovaEtapa] = useState<Etapa>("Qualificado");

  const list = inboxConversations.filter(
    (c) => filter === "Todos" || c.canal === filter,
  );
  const active = inboxConversations.find((c) => c.id === activeId)!;
  const lead = leads.find((l) => l.id === active.leadId);
  const baseMeta = META[active.id];
  const iaAtiva =
    iaOverrides[active.id] !== undefined ? iaOverrides[active.id] : baseMeta.iaAtiva;
  const etapa = etapaOverrides[active.id] ?? baseMeta.etapa;
  const showSuggestion =
    !!baseMeta.sugestaoIA && !dismissedSuggestions.has(active.id);

  const scoreColor = useMemo(() => {
    if (baseMeta.score >= 80) return "text-warm";
    if (baseMeta.score >= 60) return "text-amber-600";
    return "text-slate-600";
  }, [baseMeta.score]);

  function assumirConversa() {
    setIaOverrides((p) => ({ ...p, [active.id]: false }));
    toast.success("Você assumiu a conversa", {
      description: "IA pausada para esta conversa",
    });
  }

  function applyQuickReply(label: (typeof QUICK_REPLIES)[number]) {
    setDraft(QUICK_REPLY_TEXT[label]);
  }

  function handleSuggestionAction(a: SugestaoAcao) {
    const map: Record<SugestaoAcao, string> = {
      visita: "Visita agendada · atividade criada",
      opcoes: "Opções enviadas · pipeline atualizado",
      info: "Pergunta enviada ao cliente",
    };
    toast.success(map[a]);
    setDismissedSuggestions((p) => new Set(p).add(active.id));
  }

  function submitModal() {
    const k = openModal;
    setOpenModal(null);
    if (k === "imovel") {
      toast.success(`${imoveisSel.size} imóvel(is) enviado(s)`, {
        description: "Atividade registrada no histórico do lead",
      });
      setImoveisSel(new Set());
    } else if (k === "visita") {
      toast.success("Visita agendada", {
        description: "Criada na agenda · pipeline movido para Visita",
      });
      setEtapaOverrides((p) => ({ ...p, [active.id]: "Visita" }));
      setVisitaData("");
      setVisitaHora("");
    } else if (k === "proposta") {
      toast.success("Proposta enviada", {
        description: "Pipeline atualizado para Proposta",
      });
      setEtapaOverrides((p) => ({ ...p, [active.id]: "Proposta" }));
      setPropValor("");
      setPropCond("");
    } else if (k === "tarefa") {
      toast.success("Tarefa criada", {
        description: "Disponível na sua agenda",
      });
      setTarefaTitulo("");
      setTarefaData("");
    } else if (k === "pipeline") {
      setEtapaOverrides((p) => ({ ...p, [active.id]: novaEtapa }));
      toast.success(`Pipeline atualizado para ${novaEtapa}`);
    }
  }

  return (
    <div className="grid h-[calc(100vh-9rem)] grid-cols-1 gap-4 lg:grid-cols-[300px_1fr_320px]">
      {/* SIDEBAR */}
      <aside className="flex flex-col rounded-2xl border border-border bg-card">
        <div className="space-y-3 border-b border-border p-4">
          <div className="font-display text-lg">Inbox</div>
          <div className="flex flex-wrap gap-1.5">
            {(["Todos", "WhatsApp", "Instagram", "Marketplace"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs",
                  filter === f
                    ? "bg-navy text-navy-foreground"
                    : "bg-surface text-muted-foreground",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <ul className="flex-1 overflow-y-auto">
          {list.map((c) => {
            const Icon = channelIcon[c.canal];
            const m = META[c.id];
            const isIa =
              iaOverrides[c.id] !== undefined ? iaOverrides[c.id] : m.iaAtiva;
            return (
              <li key={c.id}>
                <button
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    "flex w-full items-start gap-3 border-b border-border p-4 text-left hover:bg-surface",
                    activeId === c.id && "bg-surface",
                  )}
                >
                  <div className="relative">
                    <img
                      src={c.avatar}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <Icon
                      className={cn(
                        "absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-card p-0.5",
                        channelColor[c.canal],
                      )}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate font-medium">{c.nome}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {c.hora}
                      </span>
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {c.ultimaMsg}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      {m.prioridade === "quente" && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-warm/15 px-1.5 py-0.5 text-[10px] font-medium text-warm">
                          <Flame className="h-2.5 w-2.5" /> Quente
                        </span>
                      )}
                      {m.prioridade === "espera" && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                          <Clock className="h-2.5 w-2.5" /> {m.esperaTexto}
                        </span>
                      )}
                      {m.prioridade === "risco" && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                          <AlertTriangle className="h-2.5 w-2.5" /> Risco
                        </span>
                      )}
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px]",
                          isIa
                            ? "border-emerald-200 text-emerald-700"
                            : "border-border text-muted-foreground",
                        )}
                      >
                        {isIa ? <Bot className="h-2.5 w-2.5" /> : <UserCheck className="h-2.5 w-2.5" />}
                        {isIa ? "IA" : "Humano"}
                      </span>
                    </div>
                  </div>
                  {c.naoLidas > 0 && (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-warm px-1 text-[10px] text-warm-foreground">
                      {c.naoLidas}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* CHAT */}
      <section className="flex flex-col rounded-2xl border border-border bg-card">
        <div className="flex items-start justify-between border-b border-border p-4">
          <div className="flex items-center gap-3">
            <img
              src={active.avatar}
              alt=""
              className="h-10 w-10 rounded-full object-cover"
            />
            <div>
              <div className="font-medium">{active.nome}</div>
              <div className="text-xs text-muted-foreground">
                {active.canal} · {active.online ? "online" : "offline"}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                    iaAtiva
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-navy text-navy-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      iaAtiva ? "animate-pulse bg-emerald-500" : "bg-white",
                    )}
                  />
                  {iaAtiva ? "IA atendendo" : "Em conversa"}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
                    ETAPA_COLOR[etapa],
                  )}
                >
                  {etapa}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {iaAtiva && (
              <Button
                size="sm"
                variant="outline"
                onClick={assumirConversa}
                className="h-8"
              >
                <UserCheck className="h-3.5 w-3.5" />
                Assumir conversa
              </Button>
            )}
            <button className="text-xs text-brand">Ver lead</button>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-6">
          {active.mensagens.map((m, i) => {
            const isYou = m.from === "you";
            const showIaTag = isYou && iaAtiva;
            return (
              <div
                key={i}
                className={cn("flex", isYou ? "justify-end" : "justify-start")}
              >
                <div className="flex max-w-[70%] flex-col items-end gap-1">
                  {showIaTag && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-medium text-emerald-800">
                      <Bot className="h-2.5 w-2.5" /> IA
                    </span>
                  )}
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2 text-sm",
                      isYou ? "bg-navy text-navy-foreground" : "bg-surface",
                    )}
                  >
                    {m.text}
                    <div
                      className={cn(
                        "mt-1 text-[10px]",
                        isYou ? "text-white/60" : "text-muted-foreground",
                      )}
                    >
                      {m.hora}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sugestão IA */}
        {showSuggestion && baseMeta.sugestaoIA && (
          <div className="mx-4 mb-2 rounded-md border-l-4 border-l-orange-400 bg-orange-50 px-3 py-2">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
              <div className="flex-1 text-xs text-orange-900">
                <div className="font-medium">Sugestão da IA</div>
                <div className="mt-0.5">{baseMeta.sugestaoIA.texto}</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {baseMeta.sugestaoIA.acoes.includes("visita") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 bg-white text-xs"
                      onClick={() => handleSuggestionAction("visita")}
                    >
                      Confirmar visita
                    </Button>
                  )}
                  {baseMeta.sugestaoIA.acoes.includes("opcoes") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 bg-white text-xs"
                      onClick={() => handleSuggestionAction("opcoes")}
                    >
                      Enviar opções
                    </Button>
                  )}
                  {baseMeta.sugestaoIA.acoes.includes("info") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 bg-white text-xs"
                      onClick={() => handleSuggestionAction("info")}
                    >
                      Pedir mais informações
                    </Button>
                  )}
                </div>
              </div>
              <button
                onClick={() =>
                  setDismissedSuggestions((p) => new Set(p).add(active.id))
                }
                className="text-orange-400 hover:text-orange-600"
                aria-label="Dispensar sugestão"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Ações rápidas */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-t border-border px-4 py-2">
          {[
            { k: "imovel" as const, icon: Home, label: "Enviar imóvel" },
            { k: "visita" as const, icon: Calendar, label: "Agendar visita" },
            { k: "proposta" as const, icon: FileText, label: "Enviar proposta" },
            { k: "tarefa" as const, icon: CheckSquare, label: "Criar tarefa" },
            { k: "pipeline" as const, icon: ArrowRightCircle, label: "Mover no pipeline" },
          ].map(({ k, icon: I, label }) => (
            <button
              key={k}
              onClick={() => setOpenModal(k)}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-[11px] font-medium text-foreground hover:bg-surface"
            >
              <I className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Quick replies */}
        <div className="flex flex-wrap gap-1.5 px-4 pb-2">
          {QUICK_REPLIES.map((q) => (
            <button
              key={q}
              onClick={() => applyQuickReply(q)}
              className="rounded-full bg-surface px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-border/60"
            >
              {q}
            </button>
          ))}
        </div>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
              placeholder={`Mensagem para ${active.nome.split(" ")[0]}`}
            />
            <button
              onClick={() => {
                if (!draft.trim()) return;
                toast.success("Mensagem enviada");
                setDraft("");
              }}
              className="grid h-8 w-8 place-items-center rounded-full bg-navy text-navy-foreground"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* PAINEL DIREITO */}
      {lead && (
        <aside className="overflow-y-auto rounded-2xl border border-border bg-card p-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Lead identificado
          </div>
          <div className="mt-1 font-display text-xl">{lead.nome}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {lead.id} · {lead.status}
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="text-muted-foreground">{lead.email}</div>
            <div className="text-muted-foreground">{lead.telefone}</div>
          </div>

          {/* Score */}
          <div className="mt-4 rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                Score do lead
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium",
                  CLASSIF_COLOR[baseMeta.classificacao],
                )}
              >
                {baseMeta.classificacao}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className={cn("font-display text-3xl", scoreColor)}>
                {baseMeta.score}
              </span>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
            <Progress value={baseMeta.score} className="mt-2 h-1.5" />
          </div>

          {/* Próxima ação */}
          <div className="mt-3 rounded-md border-l-4 border-l-orange-400 bg-orange-50 p-3">
            <div className="text-[10px] font-medium uppercase tracking-widest text-orange-600">
              Próxima ação sugerida
            </div>
            <p className="mt-1 text-sm text-orange-900">{baseMeta.proximaAcao}</p>
            <button
              onClick={() => toast.success("Ação marcada como concluída")}
              className="mt-2 text-[11px] font-medium text-orange-700 hover:underline"
            >
              Marcar como feita
            </button>
          </div>

          <div className="mt-4 rounded-xl bg-surface p-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Interesse
            </div>
            <p className="mt-1 text-sm">{lead.interesse}</p>
          </div>
          <button className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-navy px-3 py-2 text-sm text-navy-foreground">
            Abrir ficha completa
          </button>
        </aside>
      )}

      {/* MODAIS */}
      <Dialog open={openModal === "imovel"} onOpenChange={(o) => !o && setOpenModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar imóvel</DialogTitle>
            <DialogDescription>Selecione até 3 opções para enviar a {active.nome.split(" ")[0]}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {IMOVEIS_MOCK.map((t) => {
              const sel = imoveisSel.has(t);
              return (
                <button
                  key={t}
                  onClick={() => {
                    setImoveisSel((p) => {
                      const next = new Set(p);
                      if (next.has(t)) next.delete(t);
                      else if (next.size < 3) next.add(t);
                      return next;
                    });
                  }}
                  className={cn(
                    "w-full rounded-md border px-3 py-2 text-left text-sm",
                    sel ? "border-navy bg-navy/5" : "border-border bg-background hover:bg-surface",
                  )}
                >
                  {t}
                </button>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenModal(null)}>Cancelar</Button>
            <Button disabled={imoveisSel.size === 0} onClick={submitModal}>Enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openModal === "visita"} onOpenChange={(o) => !o && setOpenModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendar visita</DialogTitle>
            <DialogDescription>A visita será adicionada à sua agenda e o pipeline movido para Visita.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Data</label>
              <Input type="date" value={visitaData} onChange={(e) => setVisitaData(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Hora</label>
              <Input type="time" value={visitaHora} onChange={(e) => setVisitaHora(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenModal(null)}>Cancelar</Button>
            <Button disabled={!visitaData || !visitaHora} onClick={submitModal}>Agendar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openModal === "proposta"} onOpenChange={(o) => !o && setOpenModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar proposta</DialogTitle>
            <DialogDescription>Pipeline será atualizado para Proposta.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Valor (R$)</label>
              <Input value={propValor} onChange={(e) => setPropValor(e.target.value)} placeholder="1.150.000" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Condições</label>
              <Textarea value={propCond} onChange={(e) => setPropCond(e.target.value)} placeholder="Entrada, financiamento, prazos..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenModal(null)}>Cancelar</Button>
            <Button disabled={!propValor} onClick={submitModal}>Enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openModal === "tarefa"} onOpenChange={(o) => !o && setOpenModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar tarefa</DialogTitle>
            <DialogDescription>Aparecerá na sua agenda comercial.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Título</label>
              <Input value={tarefaTitulo} onChange={(e) => setTarefaTitulo(e.target.value)} placeholder="Follow-up com..." />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Quando</label>
              <Input type="datetime-local" value={tarefaData} onChange={(e) => setTarefaData(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenModal(null)}>Cancelar</Button>
            <Button disabled={!tarefaTitulo} onClick={submitModal}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openModal === "pipeline"} onOpenChange={(o) => !o && setOpenModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mover no pipeline</DialogTitle>
            <DialogDescription>Etapa atual: {etapa}.</DialogDescription>
          </DialogHeader>
          <Select value={novaEtapa} onValueChange={(v) => setNovaEtapa(v as Etapa)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pipelineStages.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenModal(null)}>Cancelar</Button>
            <Button onClick={submitModal}>Mover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
