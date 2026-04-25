import { createFileRoute } from "@tanstack/react-router";
import { Phone, Calendar, MessageCircle, Mail, Users } from "lucide-react";
import { atividades } from "@/data/mock";

export const Route = createFileRoute("/app/atividades")({
  component: ActivitiesPage,
});

const icon = {
  Ligação: Phone,
  Visita: Calendar,
  "Follow-up": MessageCircle,
  "E-mail": Mail,
  Reunião: Users,
} as const;

function ActivitiesPage() {
  const grouped = atividades.reduce<Record<string, typeof atividades>>((acc, a) => {
    (acc[a.data] ??= []).push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl">Atividades</h1>
          <p className="text-sm text-muted-foreground">{atividades.length} compromissos nos próximos dias</p>
        </div>
        <button className="rounded-md bg-navy px-4 py-2 text-sm text-navy-foreground">Nova atividade</button>
      </div>

      <div className="space-y-8">
        {Object.entries(grouped).map(([dia, items]) => (
          <section key={dia}>
            <div className="mb-3 flex items-center gap-3">
              <div className="font-display text-lg">{dia}</div>
              <div className="h-px flex-1 bg-border" />
              <div className="text-xs text-muted-foreground">{items.length} atividades</div>
            </div>
            <ul className="space-y-2">
              {items.map((a) => {
                const Icon = icon[a.tipo];
                return (
                  <li key={a.id} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium">{a.cliente}</div>
                        <div className="num text-sm text-muted-foreground">{a.hora}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {a.tipo}{a.imovel ? ` · ${a.imovel}` : ""}
                      </div>
                      <p className="mt-2 text-sm">{a.nota}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
