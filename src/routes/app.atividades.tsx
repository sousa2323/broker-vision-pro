import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Phone,
  Calendar as CalendarIcon,
  MessageCircle,
  Mail,
  Users,
  AlertTriangle,
  Check,
  Clock,
  LayoutList,
  CalendarDays,
  Plus,
  Loader2,
} from "lucide-react";
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
import { useSession } from "@/lib/auth";
import {
  useActivities,
  createActivity,
  setActivityDone,
  ACTIVITY_TYPES,
  type Activity,
  type ActivityType,
} from "@/lib/activities";

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

function parseHora(h: string) {
  const [hh, mm] = h.split(":").map(Number);
  return hh * 60 + (mm || 0);
}
function nowMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function ActivitiesPage() {
  const { session } = useSession();
  const { activities, loading, refetch } = useActivities();
  const [view, setView] = useState<"lista" | "calendario">("lista");
  const [openNova, setOpenNova] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    lead: "",
    tipo: "Ligação" as ActivityType,
    data: "",
    hora: "",
    imovel: "",
    obs: "",
  });

  const grouped = useMemo(
    () =>
      activities.reduce<Record<string, Activity[]>>((acc, a) => {
        (acc[a.data] ??= []).push(a);
        return acc;
      }, {}),
    [activities],
  );

  const hoje = grouped["Hoje"] ?? [];
  const pendentesHoje = hoje.filter((a) => !a.done).length;
  const atrasadasHoje = hoje.filter((a) => parseHora(a.hora) < nowMinutes() && !a.done).length;

  const concluir = async (a: Activity) => {
    const ok = await setActivityDone(a.id, !a.done);
    if (ok) {
      await refetch();
      toast.success(a.done ? "Atividade reaberta" : "Atividade concluída");
    }
  };

  const salvarNova = async () => {
    if (!session) return;
    if (!form.lead) {
      toast.error("Informe o nome do lead/cliente");
      return;
    }
    const dia = form.data || new Date().toISOString().slice(0, 10);
    const hora = form.hora || "09:00";
    const scheduledAt = new Date(`${dia}T${hora}`).toISOString();
    setSaving(true);
    const created = await createActivity(session.user.id, {
      tipo: form.tipo,
      cliente: form.lead,
      imovel: form.imovel || undefined,
      nota: form.obs || undefined,
      scheduledAt,
    });
    setSaving(false);
    if (created) {
      toast.success("Atividade criada");
      setOpenNova(false);
      setForm({ lead: "", tipo: "Ligação", data: "", hora: "", imovel: "", obs: "" });
      await refetch();
    } else {
      toast.error("Não foi possível criar a atividade.");
    }
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
          <div className="text-xs text-muted-foreground">Pendentes hoje</div>
          <div className="num mt-1 text-2xl font-semibold">{pendentesHoje}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5 text-orange-600" />
            Atrasadas
          </div>
          <div className="num mt-1 text-2xl font-semibold text-orange-600">{atrasadasHoje}</div>
        </div>
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

      {loading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : activities.length === 0 ? (
        <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-border bg-card py-20 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-surface text-muted-foreground">
            <CalendarDays className="h-7 w-7" />
          </div>
          <div className="font-display text-lg">Nenhuma atividade agendada</div>
          <p className="max-w-sm text-sm text-muted-foreground">
            Crie ligações, visitas e follow-ups para organizar sua rotina comercial.
          </p>
          <button
            onClick={() => setOpenNova(true)}
            className="mt-1 inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm text-navy-foreground"
          >
            <Plus className="h-4 w-4" /> Nova atividade
          </button>
        </div>
      ) : view === "lista" ? (
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
                  const atrasada = a.data === "Hoje" && !a.done && parseHora(a.hora) < nowMinutes();
                  return (
                    <li
                      key={a.id}
                      className={cn(
                        "rounded-2xl border border-border bg-card p-5 transition-opacity",
                        a.done && "opacity-60",
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className={cn("font-medium", a.done && "line-through")}>
                              {a.cliente}
                            </div>
                            <div className="flex items-center gap-2">
                              {atrasada && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
                                  <AlertTriangle className="h-3 w-3" />
                                  Atrasado
                                </span>
                              )}
                              <span className="num text-sm text-muted-foreground">{a.hora}</span>
                            </div>
                          </div>

                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {a.tipo}
                            {a.imovel ? ` · ${a.imovel}` : ""}
                          </div>

                          {a.nota && <p className="mt-2 text-sm">{a.nota}</p>}

                          <div className="mt-3 flex flex-wrap items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs"
                              onClick={() => concluir(a)}
                            >
                              <Check className="h-3.5 w-3.5" />
                              {a.done ? "Reabrir" : "Concluir"}
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
        <CalendarioSemanal activities={activities} />
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
                Nome do lead/cliente
              </label>
              <Input
                value={form.lead}
                onChange={(e) => setForm({ ...form, lead: e.target.value })}
                placeholder="Ex: João Mendes"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Tipo</label>
                <Select
                  value={form.tipo}
                  onValueChange={(v) => setForm({ ...form, tipo: v as ActivityType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Data</label>
                <Input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Hora</label>
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
              <label className="mb-1 block text-xs text-muted-foreground">Observação</label>
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
              disabled={saving}
            >
              {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
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

// Segunda = 0 ... Domingo = 6
function weekdayIndex(iso: string) {
  const day = new Date(iso).getDay(); // 0=Dom
  return (day + 6) % 7;
}

function CalendarioSemanal({ activities }: { activities: Activity[] }) {
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
            <div className="num border-r border-border p-3 text-xs text-muted-foreground">{h}</div>
            {dias.map((_, di) => {
              const item = activities.find((a) => {
                if (weekdayIndex(a.scheduledAt) !== di) return false;
                const ah = parseHora(a.hora);
                const slot = parseHora(h);
                return ah >= slot && ah < slot + 120;
              });
              return (
                <div key={di} className="min-h-[60px] border-r border-border p-1 last:border-r-0">
                  {item && (
                    <div className="h-full rounded-md bg-navy/10 p-2 text-[11px] leading-tight text-navy">
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
