import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MessageSquare, Instagram, Globe, Send } from "lucide-react";
import { inboxConversations, leads } from "@/data/mock";
import { cn } from "@/lib/utils";

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

function InboxPage() {
  const [filter, setFilter] = useState<"Todos" | keyof typeof channelIcon>("Todos");
  const [activeId, setActiveId] = useState(inboxConversations[0].id);
  const list = inboxConversations.filter((c) => filter === "Todos" || c.canal === filter);
  const active = inboxConversations.find((c) => c.id === activeId)!;
  const lead = leads.find((l) => l.id === active.leadId);

  return (
    <div className="grid h-[calc(100vh-9rem)] grid-cols-1 gap-4 lg:grid-cols-[300px_1fr_320px]">
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
                  filter === f ? "bg-navy text-navy-foreground" : "bg-surface text-muted-foreground"
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
            return (
              <li key={c.id}>
                <button
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    "flex w-full items-start gap-3 border-b border-border p-4 text-left hover:bg-surface",
                    activeId === c.id && "bg-surface"
                  )}
                >
                  <div className="relative">
                    <img src={c.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                    <Icon className={cn("absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-card p-0.5", channelColor[c.canal])} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate font-medium">{c.nome}</span>
                      <span className="text-[10px] text-muted-foreground">{c.hora}</span>
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{c.ultimaMsg}</div>
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

      <section className="flex flex-col rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-3">
            <img src={active.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
            <div>
              <div className="font-medium">{active.nome}</div>
              <div className="text-xs text-muted-foreground">{active.canal} · {active.online ? "online" : "offline"}</div>
            </div>
          </div>
          <button className="text-xs text-brand">Ver lead</button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-6">
          {active.mensagens.map((m, i) => (
            <div key={i} className={cn("flex", m.from === "you" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[70%] rounded-2xl px-4 py-2 text-sm",
                  m.from === "you" ? "bg-navy text-navy-foreground" : "bg-surface"
                )}
              >
                {m.text}
                <div className={cn("mt-1 text-[10px]", m.from === "you" ? "text-white/60" : "text-muted-foreground")}>{m.hora}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5">
            <input className="flex-1 bg-transparent text-sm outline-none" placeholder="Mensagem para " />
            <button className="grid h-8 w-8 place-items-center rounded-full bg-navy text-navy-foreground">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {lead && (
        <aside className="overflow-y-auto rounded-2xl border border-border bg-card p-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Lead identificado</div>
          <div className="mt-1 font-display text-xl">{lead.nome}</div>
          <div className="mt-1 text-xs text-muted-foreground">{lead.id} · {lead.status}</div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="text-muted-foreground">{lead.email}</div>
            <div className="text-muted-foreground">{lead.telefone}</div>
          </div>
          <div className="mt-4 rounded-xl bg-surface p-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Interesse</div>
            <p className="mt-1 text-sm">{lead.interesse}</p>
          </div>
          <button className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-navy px-3 py-2 text-sm text-navy-foreground">
            Abrir ficha completa
          </button>
        </aside>
      )}
    </div>
  );
}
