import { createFileRoute, Link } from "@tanstack/react-router";
import { Inbox as InboxIcon, MessageCircle, Instagram, Store } from "lucide-react";

export const Route = createFileRoute("/app/inbox")({
  component: InboxPage,
});

const canais = [
  {
    icon: MessageCircle,
    nome: "WhatsApp Business",
    desc: "Centralize as conversas do seu WhatsApp.",
  },
  { icon: Instagram, nome: "Instagram Direct", desc: "Receba e responda DMs de interessados." },
  { icon: Store, nome: "Marketplace B2C", desc: "Mensagens de compradores dos seus anúncios." },
];

function InboxPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Inbox</h1>
        <p className="text-sm text-muted-foreground">
          Todas as suas conversas de leads em um só lugar.
        </p>
      </div>

      <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-surface text-muted-foreground">
          <InboxIcon className="h-7 w-7" />
        </div>
        <div className="font-display text-lg">Nenhuma conversa ainda</div>
        <p className="max-w-md text-sm text-muted-foreground">
          Conecte seus canais de atendimento para receber e responder mensagens dos seus leads
          diretamente por aqui.
        </p>
        <Link
          to="/app/configuracoes"
          className="mt-1 inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm text-navy-foreground"
        >
          Conectar canais
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {canais.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.nome} className="rounded-2xl border border-border bg-card p-5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand">
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-3 font-medium">{c.nome}</div>
              <p className="mt-1 text-xs text-muted-foreground">{c.desc}</p>
              <div className="mt-3 inline-flex rounded-full bg-surface px-2 py-0.5 text-[11px] text-muted-foreground">
                Não conectado
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
