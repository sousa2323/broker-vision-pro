import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Bot, MessagesSquare, Filter } from "lucide-react";

export const Route = createFileRoute("/app/ia")({
  component: AIPage,
});

const recursos = [
  {
    icon: MessagesSquare,
    nome: "Atendimento automático",
    desc: "A IA responde e qualifica leads 24/7 nos seus canais.",
  },
  {
    icon: Filter,
    nome: "Qualificação inteligente",
    desc: "Extrai orçamento, região e urgência de cada conversa.",
  },
  {
    icon: Bot,
    nome: "Sugestões de ação",
    desc: "Recomenda o próximo passo para cada oportunidade.",
  },
];

function AIPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">IA Assistente</h1>
        <p className="text-sm text-muted-foreground">
          Sua assistente virtual que atende e qualifica leads automaticamente.
        </p>
      </div>

      <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-surface text-brand">
          <Sparkles className="h-7 w-7" />
        </div>
        <div className="font-display text-lg">Nenhuma conversa da IA ainda</div>
        <p className="max-w-md text-sm text-muted-foreground">
          Conecte seus canais de atendimento para a IA começar a qualificar seus leads
          automaticamente. As conversas qualificadas aparecerão aqui.
        </p>
        <Link
          to="/app/configuracoes"
          className="mt-1 inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm text-navy-foreground"
        >
          Conectar canais
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {recursos.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.nome} className="rounded-2xl border border-border bg-card p-5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand">
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-3 font-medium">{r.nome}</div>
              <p className="mt-1 text-xs text-muted-foreground">{r.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
