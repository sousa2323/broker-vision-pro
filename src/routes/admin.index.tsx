import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, AlertTriangle, Users, Building2, Handshake, BadgeDollarSign } from "lucide-react";
import { adminKpis } from "@/data/admin-mock";
import { formatBRLcompact, formatBRL } from "@/data/mock";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const k = adminKpis;
  const totalOrigem = k.receitaPorOrigem.comissao + k.receitaPorOrigem.saas + k.receitaPorOrigem.indicacoes;
  const pct = (n: number) => Math.round((n / totalOrigem) * 100);

  const slices = [
    { label: "Comissão de imóveis", value: k.receitaPorOrigem.comissao, color: "oklch(0.55 0.22 262)" },
    { label: "SaaS", value: k.receitaPorOrigem.saas, color: "oklch(0.72 0.18 50)" },
    { label: "Indicações", value: k.receitaPorOrigem.indicacoes, color: "oklch(0.65 0.18 145)" },
  ];

  // Donut math
  const r = 60, c = 2 * Math.PI * r;
  let acc = 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Painel estratégico</h1>
        <p className="mt-1 text-sm text-muted-foreground">Visão consolidada da operação Ubroker.</p>
      </div>

      {/* RECEITA */}
      <section className="grid gap-4 md:grid-cols-3">
        <BigKPI label="Receita total da plataforma" value={formatBRLcompact(k.receitaTotal)} sub="Acumulado" icon={BadgeDollarSign} />
        <BigKPI label="Receita do mês" value={formatBRLcompact(k.receitaMes)} sub="Outubro/2025" icon={TrendingUp} />
        <BigKPI label="MRR SaaS" value={formatBRLcompact(k.mrrSaas)} sub="Receita recorrente" icon={Users} />
      </section>

      {/* RECEITA POR ORIGEM + EVOLUÇÃO */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card title="Receita por origem">
          <div className="flex items-center gap-8">
            <svg viewBox="0 0 160 160" className="h-40 w-40 -rotate-90">
              <circle cx="80" cy="80" r={r} fill="none" stroke="oklch(0.92 0.01 260)" strokeWidth="20" />
              {slices.map((s, i) => {
                const len = (s.value / totalOrigem) * c;
                const dasharray = `${len} ${c - len}`;
                const offset = -acc;
                acc += len;
                return (
                  <circle key={i} cx="80" cy="80" r={r} fill="none" stroke={s.color} strokeWidth="20" strokeDasharray={dasharray} strokeDashoffset={offset} />
                );
              })}
            </svg>
            <ul className="flex-1 space-y-3 text-sm">
              {slices.map((s, i) => (
                <li key={i} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                    {s.label}
                  </span>
                  <span className="num font-medium">
                    {formatBRLcompact(s.value)} <span className="text-muted-foreground">· {pct(s.value)}%</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card title="Evolução de receita (R$ mil)">
          <svg viewBox="0 0 400 140" className="h-40 w-full">
            <polyline
              fill="none"
              stroke="oklch(0.55 0.22 262)"
              strokeWidth="2.5"
              points={k.receitaEvolucao.map((p, i) => `${(i / (k.receitaEvolucao.length - 1)) * 380 + 10},${130 - (p.v / 700) * 110}`).join(" ")}
            />
            <polyline
              fill="oklch(0.55 0.22 262 / 12%)"
              stroke="none"
              points={`${k.receitaEvolucao.map((p, i) => `${(i / (k.receitaEvolucao.length - 1)) * 380 + 10},${130 - (p.v / 700) * 110}`).join(" ")} 390,140 10,140`}
            />
          </svg>
          <div className="mt-2 flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
            {k.receitaEvolucao.map((p) => <span key={p.mes}>{p.mes}</span>)}
          </div>
        </Card>
      </section>

      {/* INDICADORES OPERACIONAIS */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniKPI label="Corretores ativos" value={k.corretoresAtivos} icon={Users} />
        <MiniKPI label="Leads gerados" value={k.leadsGerados.toLocaleString("pt-BR")} icon={Filter} />
        <MiniKPI label="Parcerias ativas" value={k.parceriasAtivas} icon={Handshake} />
        <MiniKPI label="Vendas registradas" value={k.vendasRegistradas} icon={Building2} />
      </section>

      {/* ALERTAS */}
      <Card title="Alertas estratégicos">
        <ul className="divide-y divide-border">
          <Alerta cor="red" titulo="3 cobranças em atraso totalizando R$ 17.420" sub="CB-2041, CB-2037, CB-2032 — vencidas há mais de 5 dias." />
          <Alerta cor="amber" titulo="8 parcerias ativas sem atualização há 14+ dias" sub="Pipeline parado. Risco de perder a janela comercial." />
          <Alerta cor="red" titulo="3 possíveis bypass detectados pelo sistema" sub="Vendas externas em leads recebidos pela Ubroker. Investigar em Suporte / Disputas." />
          <Alerta cor="amber" titulo="2 conciliações divergentes" sub="VD-117 com R$ 1.800 a menos do que o esperado." />
        </ul>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}

function BigKPI({ label, value, sub, icon: Icon }: { label: string; value: string; sub: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-3 num font-display text-3xl">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function MiniKPI({ label, value, icon: Icon }: { label: string; value: number | string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-2 num font-display text-2xl">{value}</div>
    </div>
  );
}

function Alerta({ cor, titulo, sub }: { cor: "red" | "amber"; titulo: string; sub: string }) {
  const bg = cor === "red" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700";
  return (
    <li className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <span className={`mt-0.5 grid h-7 w-7 place-items-center rounded-full ${bg}`}>
        <AlertTriangle className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{titulo}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
    </li>
  );
}

// Filter icon import shim (avoid extra import line)
import { Filter } from "lucide-react";
// Suppress unused warning
void formatBRL;
