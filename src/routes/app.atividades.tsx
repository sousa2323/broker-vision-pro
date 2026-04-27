import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Phone,
  Calendar as CalendarIcon,
  MessageCircle,
  Mail,
  Users,
  AlertTriangle,
  Sparkles,
  Handshake,
  Check,
  Clock,
  BarChart3,
  LayoutList,
  CalendarDays,
  Plus,
} from "lucide-react";
import { atividades, type ActivityItem } from "@/data/mock";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/atividades")({
  component: ActivitiesPage,
});

const icon = {
  Ligação: Phone,
  Visita: CalendarIcon,
  "Follow-up": MessageCircle,
  "E-mail": Mail,
  Reunião: Users,
} as const;

type Impacto = "Alto" | "Médio" | "Baixo";
type Etapa = "Lead" | "Qualificado" | "Visita" | "Proposta" | "Fechamento";

type Meta = {
  etapa: Etapa;
  impacto: Impacto;
  imovel?: string;
  parceria?: string;
};

const meta: Record<string, Meta> = {
  "A-01": {
    etapa: "Visita",
    impacto: "Alto",
    imovel: "Cobertura em Icaraí — R$ 1.580.000",
    parceria: "Marina Tavares",
  },
  "A-02": {
    etapa: "Visita",
    impacto: "Alto",
    imovel: "Casa contemporânea em Piratininga — R$ 2.450.000",
  },
  "A-03": {
    etapa: "Proposta",
    impacto: "Médio",
    imovel: "Casa em Camboinhas — R$ 3.100.000",
    parceria: "Aldemar Costa",
  },
  "A-04": {
    etapa: "Qualificado",
    impacto: "Médio",
    imovel: "3 opções em São Francisco",
  },
  "A-05": {
    etapa: "Visita",
    impacto: "Médio",
    imovel: "Sala 1208 — Centro Empresarial — R$ 780.000",
  },
  "A-06": {
    etapa: "Qualificado",
    impacto: "Baixo",
  },
  "A-07": {
    etapa: "Fechamento",
    impacto: "Alto",
    imovel: "Casa de praia em Camboinhas — R$ 4.200.000",
  },
  "A-08": {
    etapa: "Proposta",
    impacto: "Alto",
    imovel: "Apartamento Boa Viagem — R$ 1.890.000",
    parceria: "Marina Tavares",
  },
};

const impactoStyles: Record<Impacto, string> = {
  Alto: "bg-orange-100 text-orange-700",
  Médio: "bg-amber-100 text-amber-800",
  Baixo: "bg-muted text-muted-foreground",
};

function parseHora(h: string) {
  const [hh, mm] = h.split(":").map(Number);
  return hh * 60 + (mm || 0);
}

function nowMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

const sugestoes = [
  {
    icon: MessageCircle,
    texto: "Follow-up com João Mendes — 3 dias sem resposta",
  },
  {
    icon: CalendarIcon,
    texto: "Confirmar visita de Camila Andrade para sábado 10h",
  },
  {
    icon: Mail,
    texto: "Enviar proposta revisada para Roberto e Lúcia",
  },
];

function ActivitiesPage() {
  const [view, setView] = useState<"lista" | "calendario">("lista");
  const [concluidas, setConcluidas] = useState<Set<string>>(new Set());
  const [openNova, setOpenNova] = useState(false);
  const [form, setForm] = useState({
    lead: "",
    tipo: "Ligação",
    data: "",
    hora: "",
    imovel: "",
    parceria: "",
    obs: "",
  });

  const grouped = useMemo(
    () =>
      atividades.reduce<Record<string, ActivityItem[]>>((acc, a) => {
        (acc[a.data] ??= []).push(a);
        return acc;
      }, {}),
    [],
  );

  const hoje = grouped["Hoje"] ?? [];
  const altoImpactoHoje = hoje.filter((a) => meta[a.id]?.impacto === "Alto").length;
  const atrasadasHoje = hoje.filter(
    (a) => parseHora(a.hora) < nowMinutes() && !concluidas.has(a.id),
  ).length;

  const concluir = (id: string) => {
    setConcluidas((prev) => {
      const n = new Set(prev);
      n.add(id);
      return n;
    });
    toast.success("Atividade concluída");
  };

  const salvarNova = () => {
    if (!form.lead || !form.tipo) {
      toast.error("Informe lead e tipo");
      return;
    }
    toast.success("Atividade criada");
    setOpenNova(false);
    setForm({
      lead: "",
      tipo: "Ligação",
      data: "",
      hora: "",
      imovel: "",
      parceria: "",
      obs: "",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl">Atividades</h1>
          <p className="text-sm text-muted-foreground">
            Sua agenda comercial conectada às oportunidades de fechamento
          </p>
        </div>
        <button
          onClick={() => setOpenNova(true)}
          className="inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm text-navy-foreground hover:bg-navy/90"
        >
          <Plus className="h-4 w-4" />
          Nova atividade
        </button>
      </div>

      {/* Resumo do dia */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Atividades hoje</div>
          <div className="num mt-1 text-2xl font-semibold">{hoje.length}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Alto impacto</div>
          <div className="num mt-1 text-2xl font-semibold">{altoImpactoHoje}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5 text-orange-600" />
            Atrasadas
          </div>
          <div className="num mt-1 text-2xl font-semibold text-orange-600">
            {atrasadasHoje}
          </div>
        </div>
      </div>

      {/* Prioridades do dia (sugestões IA) */}
      <div className="rounded-2xl border border-l-4 border-border border-l-orange-400 bg-orange-50/40 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-orange-600" />
          <div className="font-medium">Prioridades do dia</div>
          <span className="text-xs text-muted-foreground">sugeridas pela IA</span>
        </div>
        <ul className="space-y-2">
          {sugestoes.map((s, i) => {
            const Icon = s.icon;
            return (
              <li
                key={i}
                className="flex items-center justify-between gap-3 rounded-xl bg-card p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-orange-100 text-orange-700">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm">{s.texto}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-orange-700 hover:bg-orange-100"
                  onClick={() => toast.success("Sugestão adicionada à agenda")}
                >
                  Adicionar à agenda
                </Button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Toggle Lista / Calendário */}
      <div className="inline-flex rounded-lg border border-border bg-card p-1">
        <button
          onClick={() => setView("lista")}
          className={cn(
            "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
            view === "lista"
              ? "bg-navy text-navy-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <LayoutList className="h-4 w-4" />
          Lista
        </button>
        <button
          onClick={() => setView("calendario")}
          className={cn(
            "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
            view === "calendario"
              ? "bg-navy text-navy-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <CalendarDays className="h-4 w-4" />
          Calendário
        </button>
      </div>

      {view === "lista" ? (
        <div className="space-y-8">
          {Object.entries(grouped).map(([dia, items]) => (
            <section key={dia}>
              <div className="mb-3 flex items-center gap-3">
                <div className="font-display text-lg">
                  {dia}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({items.length} {items.length === 1 ? "atividade" : "atividades"})
                  </span>
                </div>
                <div className="h-px flex-1 bg-border" />
              </div>
              <ul className="space-y-2">
                {items.map((a) => {
                  const Icon = icon[a.tipo];
                  const m = meta[a.id];
                  const concluida = concluidas.has(a.id);
                  const atrasada =
                    a.data === "Hoje" &&
                    !concluida &&
                    parseHora(a.hora) < nowMinutes();
                  const imovel = a.imovel ?? m?.imovel;
                  return (
                    <li
                      key={a.id}
                      className={cn(
                        "rounded-2xl border border-border bg-card p-5 transition-opacity",
                        concluida && "opacity-60",
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div
                              className={cn(
                                "font-medium",
                                concluida && "line-through",
                              )}
                            >
                              {a.cliente}
                            </div>
                            <div className="flex items-center gap-2">
                              {atrasada && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
                                  <AlertTriangle className="h-3 w-3" />
                                  Atrasado
                                </span>
                              )}
                              <span className="num text-sm text-muted-foreground">
                                {a.hora}
                              </span>
                            </div>
                          </div>

                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {a.tipo}
                            {imovel ? ` · ${imovel}` : ""}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {m?.etapa && (
                              <span className="inline-flex items-center rounded-full bg-navy/5 px-2 py-0.5 text-[11px] font-medium text-navy">
                                Etapa: {m.etapa}
                              </span>
                            )}
                            {m?.impacto && (
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                                  impactoStyles[m.impacto],
                                )}
                              >
                                {m.impacto} impacto
                              </span>
                            )}
                            {m?.parceria && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                                <Handshake className="h-3 w-3" />
                                Parceria com {m.parceria}
                              </span>
                            )}
                          </div>

                          <p className="mt-2 text-sm">{a.nota}</p>

                          <div className="mt-3 flex flex-wrap items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs"
                              disabled={concluida}
                              onClick={() => concluir(a.id)}
                            >
                              <Check className="h-3.5 w-3.5" />
                              Concluir
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs"
                              onClick={() => toast.success("Reagendamento aberto")}
                            >
                              <Clock className="h-3.5 w-3.5" />
                              Reagendar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs"
                              onClick={() => toast("Abrindo no pipeline")}
                            >
                              <BarChart3 className="h-3.5 w-3.5" />
                              Pipeline
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs"
                              onClick={() => toast("Abrindo conversa")}
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              Conversa
                            </Button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <CalendarioSemanal />
      )}

      {/* Modal Nova atividade */}
      <Dialog open={openNova} onOpenChange={setOpenNova}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova atividade</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Nome do lead
              </label>
              <Input
                value={form.lead}
                onChange={(e) => setForm({ ...form, lead: e.target.value })}
                placeholder="Ex: João Mendes"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Tipo
                </label>
                <Select
                  value={form.tipo}
                  onValueChange={(v) => setForm({ ...form, tipo: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ligação">Ligação</SelectItem>
                    <SelectItem value="Visita">Visita</SelectItem>
                    <SelectItem value="Reunião">Reunião</SelectItem>
                    <SelectItem value="Follow-up">Follow-up</SelectItem>
                    <SelectItem value="E-mail">E-mail</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Data
                </label>
                <Input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Hora
                </label>
                <Input
                  type="time"
                  value={form.hora}
                  onChange={(e) => setForm({ ...form, hora: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Imóvel vinculado (opcional)
              </label>
              <Input
                value={form.imovel}
                onChange={(e) => setForm({ ...form, imovel: e.target.value })}
                placeholder="Ex: Casa em Itaipu — R$ 1.180.000"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Parceria vinculada (opcional)
              </label>
              <Input
                value={form.parceria}
                onChange={(e) => setForm({ ...form, parceria: e.target.value })}
                placeholder="Ex: Marina Tavares"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Observação
              </label>
              <Textarea
                value={form.obs}
                onChange={(e) => setForm({ ...form, obs: e.target.value })}
                rows={3}
                placeholder="Detalhes da atividade..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNova(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-navy text-navy-foreground hover:bg-navy/90"
              onClick={salvarNova}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const dias = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const horas = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"];

// Mapeamento simples de "Hoje"/"Amanhã" para colunas (apenas visual)
const colunaPorData: Record<string, number> = {
  Hoje: 2, // Qua
  Amanhã: 3, // Qui
  "Sex 28": 4, // Sex
};

function CalendarioSemanal() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid grid-cols-8 border-b border-border bg-muted/30 text-xs text-muted-foreground">
        <div className="p-3" />
        {dias.map((d) => (
          <div key={d} className="p-3 text-center font-medium">
            {d}
          </div>
        ))}
      </div>
      <div className="divide-y divide-border">
        {horas.map((h) => (
          <div key={h} className="grid grid-cols-8">
            <div className="num border-r border-border p-3 text-xs text-muted-foreground">
              {h}
            </div>
            {dias.map((_, di) => {
              const item = atividades.find((a) => {
                const col = colunaPorData[a.data];
                if (col !== di) return false;
                const ah = parseHora(a.hora);
                const slot = parseHora(h);
                return ah >= slot && ah < slot + 120;
              });
              return (
                <div
                  key={di}
                  className="min-h-[60px] border-r border-border p-1 last:border-r-0"
                >
                  {item && (
                    <div
                      className={cn(
                        "h-full rounded-md p-2 text-[11px] leading-tight",
                        meta[item.id]?.impacto === "Alto"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-navy/10 text-navy",
                      )}
                    >
                      <div className="num font-medium">{item.hora}</div>
                      <div className="truncate">{item.cliente}</div>
                      <div className="truncate opacity-70">{item.tipo}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
