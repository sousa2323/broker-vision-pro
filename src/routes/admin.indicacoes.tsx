import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, Users } from "lucide-react";
import { referralTree, type ReferralNode } from "@/data/admin-mock";
import { formatBRL } from "@/data/mock";

export const Route = createFileRoute("/admin/indicacoes")({
  component: IndicacoesAdmin,
});

function flatten(node: ReferralNode, level = 0): { node: ReferralNode; level: number }[] {
  const out: { node: ReferralNode; level: number }[] = [{ node, level }];
  for (const f of node.filhos ?? []) out.push(...flatten(f, level + 1));
  return out;
}

function IndicacoesAdmin() {
  const flat = flatten(referralTree);
  const n1 = referralTree.filhos ?? [];
  const n2 = n1.flatMap((f) => f.filhos ?? []);
  const n3 = n2.flatMap((f) => f.filhos ?? []);

  const mrrN1 = n1.reduce((a, b) => a + b.mrr, 0);
  const mrrN2 = n2.reduce((a, b) => a + b.mrr, 0);
  const mrrN3 = n3.reduce((a, b) => a + b.mrr, 0);
  const mrrTotal = mrrN1 + mrrN2 + mrrN3;
  const totalIndicados = n1.length + n2.length + n3.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Indicações</h1>
        <p className="mt-1 text-sm text-muted-foreground">Árvore trinível e receita recorrente da rede.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI label="Total de indicados" value={totalIndicados.toString()} icon={Users} />
        <KPI label="MRR Nível 1" value={formatBRL(mrrN1)} />
        <KPI label="MRR Nível 2" value={formatBRL(mrrN2)} />
        <KPI label="MRR Nível 3" value={formatBRL(mrrN3)} highlight />
      </section>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Receita recorrente total</div>
          <div className="num font-display text-2xl text-emerald-700">{formatBRL(mrrTotal)}/mês</div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Árvore de indicação · Ramon Capone</div>
        <div className="space-y-1.5">
          {flat.map((f, i) => (
            <div key={i} className="flex items-center gap-3 rounded-md py-2" style={{ paddingLeft: `${f.level * 28}px` }}>
              {f.level > 0 && <span className="text-muted-foreground">└─</span>}
              <div className={`grid h-8 w-8 place-items-center rounded-full text-xs font-semibold ${
                f.level === 0 ? "bg-navy text-white" : f.level === 1 ? "bg-blue-100 text-blue-800" : f.level === 2 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
              }`}>
                N{f.level}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{f.node.nome}</div>
                <div className="text-xs text-muted-foreground">Nível {f.level} {f.node.filhos ? `· indicou ${f.node.filhos.length}` : ""}</div>
              </div>
              <div className="num text-sm text-emerald-700">{formatBRL(f.node.mrr)}/mês</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          <TrendingUp className="h-3.5 w-3.5" /> Top indicadores da rede
        </div>
        <ul className="divide-y divide-border">
          {[
            { nome: "Denise Molinaro", indicados: 18, receita: 2_160 },
            { nome: "Alessandra Freixo", indicados: 14, receita: 1_680 },
            { nome: "Aldemar Souza", indicados: 11, receita: 1_320 },
            { nome: "Ramon Capone", indicados: 4, receita: 480 },
            { nome: "Beatriz Lemos", indicados: 3, receita: 360 },
          ].map((t, i) => (
            <li key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-warm/15 text-xs font-semibold text-warm">{i + 1}</span>
                <div>
                  <div className="text-sm font-medium">{t.nome}</div>
                  <div className="text-xs text-muted-foreground">{t.indicados} indicados</div>
                </div>
              </div>
              <div className="num text-sm text-emerald-700">{formatBRL(t.receita)}/mês</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function KPI({ label, value, icon: Icon, highlight }: { label: string; value: string; icon?: React.ComponentType<{ className?: string }>; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border border-border p-4 ${highlight ? "bg-warm/5" : "bg-card"}`}>
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className="mt-2 num font-display text-2xl">{value}</div>
    </div>
  );
}
