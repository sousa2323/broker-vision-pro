import { createFileRoute } from "@tanstack/react-router";
import { Copy, Share2, Sparkles } from "lucide-react";
import { referrals, formatBRL } from "@/data/mock";

export const Route = createFileRoute("/app/indicacoes")({
  component: ReferralsPage,
});

function ReferralsPage() {
  const mrrTotal = referrals.ativos.reduce((a, b) => a + b.mrr, 0);
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-navy p-8 text-navy-foreground">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/60">
          <Sparkles className="h-3.5 w-3.5 text-warm" /> Programa de indicações
        </div>
        <h1 className="mt-4 font-display text-4xl leading-tight">
          Indique corretores e ganhe sobre as<br />assinaturas das ferramentas.
        </h1>
        <p className="mt-3 max-w-xl text-white/70">
          Você recebe <span className="text-warm">30% recorrentes</span> sobre cada assinatura ativa
          de quem você indicar. Atinja R$ 600 e isente sua mensalidade no Plano Free.
        </p>

        <div className="mt-8 flex flex-col gap-3 rounded-xl bg-white/10 p-4 backdrop-blur sm:flex-row sm:items-center">
          <div className="flex-1 truncate font-mono text-sm">{referrals.link}</div>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm text-ink">
              <Copy className="h-4 w-4" /> Copiar link
            </button>
            <button className="inline-flex items-center gap-2 rounded-md bg-warm px-4 py-2 text-sm text-warm-foreground">
              <Share2 className="h-4 w-4" /> Compartilhar
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat label="Indicados ativos" value={`${referrals.ativos.length}`} />
        <Stat label="MRR gerado" value={formatBRL(mrrTotal)} />
        <Stat label="Faltam para isenção" value={formatBRL(600 - mrrTotal)} />
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border p-5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Indicados</div>
          <div className="font-display text-lg">Sua rede ativa</div>
        </div>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-5 py-3">Corretor</th>
              <th className="px-5 py-3">Plano</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">MRR</th>
            </tr>
          </thead>
          <tbody>
            {referrals.ativos.map((r, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="px-5 py-3">
                  <div className="font-medium">{r.nome}</div>
                  <div className="text-xs text-muted-foreground">{r.agencia}</div>
                </td>
                <td className="px-5 py-3">{r.plano}</td>
                <td className="px-5 py-3">
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">{r.status}</span>
                </td>
                <td className="num px-5 py-3 text-right font-medium">{formatBRL(r.mrr)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 num font-display text-2xl">{value}</div>
    </div>
  );
}
