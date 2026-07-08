import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
} from "recharts";
import {
  TrendingUp,
  ArrowUpRight,
  Wallet,
  Users,
  Building2,
  Target,
  Clock,
  ChevronRight,
  Flame,
} from "lucide-react";
import { formatBRL, formatBRLcompact } from "@/lib/format";
import { useBrokerProfile } from "@/lib/auth";
import { useLeads } from "@/lib/leads";
import { useProperties, type Property } from "@/lib/properties";
import { useActivities } from "@/lib/activities";
import { useReferrals } from "@/lib/referrals";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

const COMISSAO_RATE = 0.03;
const META_VENDAS_MES = 3;

function truncate(s: string, n = 72) {
  return s.length > n ? s.slice(0, n).trimEnd() + "…" : s;
}

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/** VGV/faturamento dos últimos 6 meses a partir de imóveis vendidos. */
function buildSalesEvolution(properties: Property[]) {
  const now = new Date();
  const out: { mes: string; vgv: number; faturamento: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const ref = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const sold = properties.filter((p) => {
      if (p.status !== "Vendido") return false;
      const d = new Date(p.updated_at);
      return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
    });
    const total = sold.reduce((a, b) => a + b.valor, 0);
    out.push({
      mes: MESES[ref.getMonth()],
      vgv: Number((total / 1_000_000).toFixed(2)),
      faturamento: Number(((total * COMISSAO_RATE) / 1_000).toFixed(1)),
    });
  }
  return out;
}

function Dashboard() {
  const profile = useBrokerProfile();
  const { leads } = useLeads();
  const { properties } = useProperties();
  const { activities } = useActivities();
  const { mrrTotal } = useReferrals();

  const firstName = (profile?.full_name ?? "Corretor").split(" ")[0];

  const kpis = useMemo(() => {
    const now = new Date();
    const soldAll = properties.filter((p) => p.status === "Vendido");
    const soldMonth = soldAll.filter((p) => {
      const d = new Date(p.updated_at);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    const vgvMes = soldMonth.reduce((a, b) => a + b.valor, 0);
    const ativos = leads.filter((l) => ["Qualificado", "Visita", "Proposta"].includes(l.status));
    return {
      vgv: vgvMes,
      faturamento: vgvMes * COMISSAO_RATE,
      comissaoMedia: COMISSAO_RATE,
      vendidosMes: soldMonth.length,
      ticketMedio: soldAll.length ? soldAll.reduce((a, b) => a + b.valor, 0) / soldAll.length : 0,
      leadsNovos: leads.filter((l) => l.status === "Novo").length,
      emAtendimento: ativos.length,
      propostas: leads.filter((l) => l.status === "Proposta").length,
      ganhosIndicacao: mrrTotal,
    };
  }, [properties, leads, mrrTotal]);

  const salesEvolution = useMemo(() => buildSalesEvolution(properties), [properties]);

  // Mensalidade que as indicações ajudam a cobrir
  const metaIsencao = (profile?.plan ?? "Free") === "Pro" ? 149 : 149;
  const progressPct = metaIsencao > 0 ? Math.min(100, (kpis.ganhosIndicacao / metaIsencao) * 100) : 0;
  const vendaProgress = Math.min(100, (kpis.vendidosMes / META_VENDAS_MES) * 100);

  const quentes = leads.filter((l) => l.status === "Visita" || l.status === "Proposta").length;
  const ultimosLeads = leads.slice(0, 5);
  const proximas = activities.filter((a) => !a.done).slice(0, 4);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl">Olá, {firstName} 👋</h1>
          <p className="text-sm text-muted-foreground">
            Aqui está como sua operação está performando este mês.
          </p>
          {quentes > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-warm/30 bg-warm/10 px-3 py-1.5 text-xs text-warm">
              <Flame className="h-3.5 w-3.5" />
              Hoje você tem{" "}
              <span className="font-semibold">
                {quentes} {quentes === 1 ? "oportunidade quente" : "oportunidades quentes"}
              </span>{" "}
              para avançar.
            </div>
          )}
        </div>
        <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
          <Clock className="h-3.5 w-3.5" /> Atualizado agora
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <Kpi label="VGV do mês" value={formatBRLcompact(kpis.vgv)} delta="Vendas do mês atual" icon={TrendingUp} accent />
        <Kpi label="Faturamento" value={formatBRL(kpis.faturamento)} delta="Comissão estimada (3%)" icon={Wallet} accent />
        <Kpi label="Comissão média" value={`${(kpis.comissaoMedia * 100).toFixed(1)}%`} delta="padrão" icon={Target} muted />
        <KpiMeta vendidos={kpis.vendidosMes} pct={vendaProgress} />
        <Kpi label="Ticket médio" value={formatBRLcompact(kpis.ticketMedio)} delta="por venda" icon={ArrowUpRight} muted />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
          <div className="mb-2 flex items-end justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                Evolução de vendas
              </div>
              <div className="font-display text-xl">VGV últimos 6 meses</div>
            </div>
            <div className="text-xs text-muted-foreground">em milhões de R$</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={salesEvolution} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="vgvGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.55 0.22 262)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="oklch(0.55 0.22 262)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 255)" vertical={false} />
                <XAxis dataKey="mes" stroke="oklch(0.5 0.02 255)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.5 0.02 255)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "white",
                    border: "1px solid oklch(0.91 0.01 255)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="vgv" stroke="oklch(0.55 0.22 262)" strokeWidth={2.5} fill="url(#vgvGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monetization */}
        <div className="rounded-2xl bg-navy p-6 text-navy-foreground">
          <div className="text-xs uppercase tracking-widest text-white/50">Monetização SaaS</div>
          <div className="mt-3 num font-display text-4xl">{formatBRL(kpis.ganhosIndicacao)}</div>
          <div className="mt-1 text-sm text-white/70">Ganhos recorrentes com indicação</div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-white/70">Progresso para isenção</span>
              <span className="num text-white/90">{Math.round(progressPct)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
              <div className="h-full bg-warm transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="mt-3 text-xs text-white/60">
              {kpis.ganhosIndicacao >= metaIsencao ? (
                <>Suas indicações já cobrem sua mensalidade 🎉</>
              ) : (
                <>
                  Faltam{" "}
                  <span className="num text-white">{formatBRL(metaIsencao - kpis.ganhosIndicacao)}</span>{" "}
                  para isentar sua mensalidade
                </>
              )}
            </div>
          </div>

          <Link
            to="/app/indicacoes"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-warm px-4 py-2.5 text-sm font-semibold text-navy transition hover:brightness-110"
          >
            Convidar mais corretores <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Operação + Últimos leads */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Operação</div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { n: kpis.leadsNovos, l: "Leads novos", c: "Aguardando contato" },
              { n: kpis.emAtendimento, l: "Em atendimento", c: "Ativos agora" },
              { n: kpis.propostas, l: "Propostas", c: "Em andamento" },
            ].map((o) => (
              <div key={o.l} className="rounded-xl bg-surface p-4 text-center">
                <div className="num font-display text-3xl">{o.n}</div>
                <div className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">{o.l}</div>
                <div className="mt-1 text-[10px] text-muted-foreground/80">{o.c}</div>
              </div>
            ))}
          </div>
          <Link to="/app/pipeline" className="mt-5 inline-flex items-center gap-1 text-sm text-brand">
            Abrir pipeline <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Últimos leads</div>
              <div className="font-display text-lg">Atividade recente</div>
            </div>
            <Link to="/app/leads" className="text-xs text-brand">Ver todos</Link>
          </div>
          {ultimosLeads.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum lead ainda. Cadastre seu primeiro lead na aba Leads.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {ultimosLeads.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface text-xs font-medium">
                      {l.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium">{l.nome}</div>
                      <div className="truncate text-xs text-foreground/70">{truncate(l.interesse)}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {l.origem} · {l.ultimaInteracao}
                      </div>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full border border-border px-2.5 py-0.5 text-xs">{l.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Atividades */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Agenda</div>
            <div className="font-display text-lg">Próximas atividades</div>
          </div>
          <Link to="/app/atividades" className="text-xs text-brand">Ver agenda completa</Link>
        </div>
        {proximas.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma atividade agendada. Crie uma na aba Atividades.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {proximas.map((a) => {
              const isHoje = a.data?.toLowerCase().startsWith("hoje");
              return (
                <li
                  key={a.id}
                  className={`flex items-start gap-3 rounded-xl bg-surface p-4 ${isHoje ? "border-l-2 border-brand" : ""}`}
                >
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${isHoje ? "bg-brand/15 text-brand" : "bg-brand/10 text-brand"}`}>
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{a.cliente}</div>
                        {isHoje && (
                          <span className="rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand">
                            Hoje
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{a.data} · {a.hora}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{a.tipo} {a.imovel ? `· ${a.imovel}` : ""}</div>
                    <div className="mt-1 text-sm">{a.nota}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  delta,
  icon: Icon,
  accent,
  muted,
}: {
  label: string;
  value: string;
  delta: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
  muted?: boolean;
}) {
  const tone = accent
    ? "border-navy bg-navy text-navy-foreground"
    : muted
      ? "border-border bg-card/60"
      : "border-border bg-card";
  return (
    <div className={`rounded-2xl border p-5 ${tone}`}>
      <div className="flex items-start justify-between">
        <div className={`text-xs uppercase tracking-widest ${accent ? "text-white/60" : "text-muted-foreground"}`}>
          {label}
        </div>
        <Icon className={`h-4 w-4 ${accent ? "text-warm" : "text-muted-foreground"}`} />
      </div>
      <div className={`mt-3 num font-display ${accent ? "text-3xl" : "text-2xl"}`}>{value}</div>
      <div className={`mt-1 text-xs ${accent ? "text-white/70" : "text-muted-foreground"}`}>{delta}</div>
    </div>
  );
}

function KpiMeta({ vendidos, pct }: { vendidos: number; pct: number }) {
  const restam = Math.max(0, META_VENDAS_MES - vendidos);
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5">
      <div className="flex items-start justify-between">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Vendidos no mês</div>
        <Building2 className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-3 num font-display text-2xl">
        {vendidos} <span className="text-muted-foreground">/ {META_VENDAS_MES}</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface">
        <div className="h-full bg-brand transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        {restam === 0 ? "Meta do mês atingida 🎉" : `Faltam ${restam} para atingir sua meta`}
      </div>
    </div>
  );
}
