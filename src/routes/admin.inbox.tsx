import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Instagram, ShoppingBag, Mail } from "lucide-react";
import { inboxCanais } from "@/data/admin-mock";

export const Route = createFileRoute("/admin/inbox")({
  component: InboxAdmin,
});

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  WhatsApp: MessageCircle,
  Instagram: Instagram,
  Marketplace: ShoppingBag,
  "E-mail": Mail,
};

function InboxAdmin() {
  const totalConversas = inboxCanais.reduce((a, b) => a + b.conversas, 0);
  const totalSemResposta = inboxCanais.reduce((a, b) => a + b.semResposta, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Inbox</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Canais conectados e volume de conversas da rede.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <KPI label="Conversas totais" value={totalConversas.toLocaleString("pt-BR")} />
        <KPI label="Sem resposta" value={totalSemResposta.toLocaleString("pt-BR")} tone="amber" />
        <KPI label="Tempo médio resposta" value="3m 12s" />
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {inboxCanais.map((c) => {
          const Icon = iconMap[c.canal] ?? MessageCircle;
          return (
            <div key={c.canal} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-navy text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="font-display text-lg">{c.canal}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.conectados} corretores conectados
                  </div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Conversas
                  </div>
                  <div className="num font-display text-xl">
                    {c.conversas.toLocaleString("pt-BR")}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Sem resposta
                  </div>
                  <div className="num font-display text-xl text-amber-700">{c.semResposta}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KPI({ label, value, tone }: { label: string; value: string; tone?: "amber" }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className={`mt-2 num font-display text-2xl ${tone === "amber" ? "text-amber-700" : ""}`}>
        {value}
      </div>
    </div>
  );
}
