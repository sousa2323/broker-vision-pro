import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Send, Bot, User } from "lucide-react";
import { aiConversations } from "@/data/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/ia")({
  component: AIPage,
});

function AIPage() {
  const [active, setActive] = useState(aiConversations[0].id);
  const conv = aiConversations.find((c) => c.id === active)!;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr_320px]">
      {/* Conversation list */}
      <aside className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-brand" /> IA Assistente
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{aiConversations.length} conversas em andamento</p>
        </div>
        <ul>
          {aiConversations.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setActive(c.id)}
                className={cn(
                  "w-full border-b border-border px-4 py-3 text-left transition hover:bg-surface",
                  active === c.id && "bg-surface"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{c.leadName}</div>
                  <span className="text-[10px] text-muted-foreground">{c.canal}</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10px]",
                    c.status.includes("✓") ? "bg-emerald-100 text-emerald-700" : "bg-blue-50 text-blue-700"
                  )}>{c.status}</span>
                  <span className="num text-[10px] text-muted-foreground">Score {c.score}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Transcript */}
      <section className="flex min-h-[600px] flex-col rounded-2xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <div className="font-medium">{conv.leadName}</div>
          <div className="text-xs text-muted-foreground">{conv.canal} · IA atendendo automaticamente</div>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {conv.mensagens.map((m, i) => (
            <div key={i} className={cn("flex gap-3", m.from === "ai" ? "justify-end" : "justify-start")}>
              {m.from === "lead" && (
                <div className="grid h-8 w-8 place-items-center rounded-full bg-surface"><User className="h-4 w-4" /></div>
              )}
              <div
                className={cn(
                  "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  m.from === "ai" ? "bg-navy text-navy-foreground" : "bg-surface"
                )}
              >
                {m.from === "ai" && (
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-warm">
                    <Bot className="h-3 w-3" /> Assistente Ubroker
                  </div>
                )}
                {m.text}
              </div>
              {m.from === "ai" && (
                <div className="grid h-8 w-8 place-items-center rounded-full bg-brand text-brand-foreground"><Bot className="h-4 w-4" /></div>
              )}
            </div>
          ))}
        </div>
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5">
            <input className="flex-1 bg-transparent text-sm outline-none" placeholder="Escreva uma mensagem (a IA continuará daqui)…" />
            <button className="grid h-8 w-8 place-items-center rounded-full bg-navy text-navy-foreground">
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">A IA responde automaticamente leads novos em até 30s · 24/7</p>
        </div>
      </section>

      {/* Extracted */}
      <aside className="rounded-2xl border border-border bg-card p-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Dados extraídos</div>
        <div className="mt-2 font-display text-lg">Perfil do lead</div>
        <dl className="mt-4 space-y-3 text-sm">
          {Object.entries(conv.extracted).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 border-b border-border pb-2">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
          <div className="font-medium">Status: {conv.status}</div>
          <div className="mt-1 text-xs">Score de qualificação {conv.score}/100</div>
        </div>
        <button className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-navy px-3 py-2 text-sm text-navy-foreground">
          Assumir conversa
        </button>
      </aside>
    </div>
  );
}
