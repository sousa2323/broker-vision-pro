import { createFileRoute, Link } from "@tanstack/react-router";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Users,
  Building2,
  Handshake,
  BadgeDollarSign,
  Filter,
  Wallet,
  Receipt,
  PiggyBank,
  Percent,
  MapPin,
  Home,
  Tags,
  Target,
  Trophy,
  AlertCircle,
} from "lucide-react";
import {
  adminKpis,
  adminKpisExtra,
  despesasMock,
  inteligenciaMercado,
  performanceCorretores,
} from "@/data/admin-mock";
import { formatBRLcompact, formatBRL } from "@/data/mock";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const k = adminKpis;
  const totalOrigem =
    k.receitaPorOrigem.comissao + k.receitaPorOrigem.saas + k.receitaPorOrigem.indicacoes;
  const pct = (n: number) => Math.round((n / totalOrigem) * 100);

  const slices = [
    {
      label: "Comissão de imóveis",
      value: k.receitaPorOrigem.comissao,
      color: "oklch(0.55 0.22 262)",
    },
    { label: "SaaS", value: k.receitaPorOrigem.saas, color: "oklch(0.72 0.18 50)" },
    { label: "Indicações", value: k.receitaPorOrigem.indicacoes, color: "oklch(0.65 0.18 145)" },
  ];
  const maxSlice = slices.reduce((a, b) => (b.value > a.value ? b : a), slices[0]);

  // Resultado do mês
  const despesasMes = despesasMock.reduce((s, d) => s + d.valor, 0);
  const resultadoMes = k.receitaMes - despesasMes;
  const margemPct = k.receitaMes > 0 ? (resultadoMes / k.receitaMes) * 100 : 0;
  const resultadoCor = resultadoMes >= 0 ? "text-emerald-600" : "text-red-600";
  const margemBadge =
    margemPct < 0
      ? "bg-red-50 text-red-700 border-red-200"
      : margemPct > 20
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : "bg-amber-50 text-amber-700 border-amber-200";

  // Tendência da receita
  const variacaoMes =
    ((k.receitaMes - adminKpisExtra.receitaMesAnterior) / adminKpisExtra.receitaMesAnterior) * 100;
  const tendencia =
    variacaoMes > 3
      ? {
          Icon: TrendingUp,
          label: "Crescimento",
          classe: "text-emerald-600 bg-emerald-50 border-emerald-200",
        }
      : variacaoMes < -3
        ? { Icon: TrendingDown, label: "Queda", classe: "text-red-600 bg-red-50 border-red-200" }
        : {
            Icon: Minus,
            label: "Estabilidade",
            classe: "text-muted-foreground bg-muted border-border",
          };

  // Donut
  const r = 60,
    c = 2 * Math.PI * r;
  let acc = 0;

  // Alertas dinâmicos (estratégicos)
  type AlertaItem = { cor: "red" | "amber"; titulo: string; sub: string };
  const alertasDinamicos: AlertaItem[] = [];
  if (resultadoMes < 0) {
    alertasDinamicos.push({
      cor: "red",
      titulo: "Resultado negativo no mês",
      sub: `Despesas (${formatBRLcompact(despesasMes)}) superaram a receita (${formatBRLcompact(k.receitaMes)}).`,
    });
  }
  if (adminKpisExtra.margemMesAnteriorPct - margemPct > 5) {
    alertasDinamicos.push({
      cor: "amber",
      titulo: "Margem em queda vs mês anterior",
      sub: `${margemPct.toFixed(1)}% agora · ${adminKpisExtra.margemMesAnteriorPct.toFixed(1)}% no mês anterior.`,
    });
  }
  if (adminKpisExtra.inadimplenciaAtualPct > adminKpisExtra.inadimplenciaMesAnteriorPct + 1) {
    alertasDinamicos.push({
      cor: "amber",
      titulo: "Inadimplência crescente",
      sub: `${adminKpisExtra.inadimplenciaAtualPct}% agora · ${adminKpisExtra.inadimplenciaMesAnteriorPct}% no mês anterior.`,
    });
  }
  if (adminKpisExtra.conversaoMesPct < adminKpisExtra.conversaoMesAnteriorPct - 1) {
    alertasDinamicos.push({
      cor: "amber",
      titulo: "Queda de conversão",
      sub: `${adminKpisExtra.conversaoMesPct}% agora · ${adminKpisExtra.conversaoMesAnteriorPct}% no mês anterior.`,
    });
  }
  if (despesasMes > k.receitaMes * 0.7) {
    alertasDinamicos.push({
      cor: "amber",
      titulo: "Aumento de despesas vs receita",
      sub: `Despesas representam ${((despesasMes / k.receitaMes) * 100).toFixed(0)}% da receita do mês.`,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Painel estratégico</h1>
        <p className="mt-1 text-sm text-muted-foreground">Visão consolidada da operação Ubroker.</p>
      </div>

      {/* RESULTADO REAL — Linha 1 (curto prazo) */}
      <section>
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Visão operacional · Outubro/2025
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <BigKPI
            label="Receita do mês"
            value={formatBRLcompact(k.receitaMes)}
            sub="Faturamento bruto"
            icon={BadgeDollarSign}
            valueClass="text-emerald-600"
          />
          <BigKPI
            label="Despesas do mês"
            value={formatBRLcompact(despesasMes)}
            sub={`${despesasMock.length} lançamentos`}
            icon={Receipt}
          />
          <BigKPI
            label="Resultado líquido"
            value={`${resultadoMes < 0 ? "-" : ""}${formatBRLcompact(Math.abs(resultadoMes))}`}
            sub={resultadoMes >= 0 ? "Receita − Despesas" : "Operação no vermelho"}
            icon={PiggyBank}
            valueClass={resultadoCor}
          />
          <BigKPI
            label="Margem"
            value={`${margemPct.toFixed(1)}%`}
            sub="Resultado / Receita"
            icon={Percent}
            badge={
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${margemBadge}`}
              >
                {margemPct < 0 ? "Crítica" : margemPct > 20 ? "Saudável" : "Atenção"}
              </span>
            }
          />
        </div>
      </section>

      {/* Linha 2 (longo prazo) */}
      <section>
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Visão de escala · Acumulado
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <BigKPI
            label="Receita total da plataforma"
            value={formatBRLcompact(k.receitaTotal)}
            sub="Acumulado histórico"
            icon={Wallet}
          />
          <BigKPI
            label="MRR SaaS"
            value={formatBRLcompact(k.mrrSaas)}
            sub="Receita recorrente mensal"
            icon={Users}
          />
        </div>
      </section>

      {/* RECEITA POR ORIGEM + EVOLUÇÃO */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card title="Receita por origem">
          <div className="flex items-center gap-8">
            <svg viewBox="0 0 160 160" className="h-40 w-40 -rotate-90">
              <circle
                cx="80"
                cy="80"
                r={r}
                fill="none"
                stroke="oklch(0.92 0.01 260)"
                strokeWidth="20"
              />
              {slices.map((s, i) => {
                const len = (s.value / totalOrigem) * c;
                const dasharray = `${len} ${c - len}`;
                const offset = -acc;
                acc += len;
                const isMax = s.label === maxSlice.label;
                return (
                  <circle
                    key={i}
                    cx="80"
                    cy="80"
                    r={r}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={isMax ? 24 : 20}
                    strokeDasharray={dasharray}
                    strokeDashoffset={offset}
                  />
                );
              })}
            </svg>
            <ul className="flex-1 space-y-3 text-sm">
              {slices.map((s, i) => {
                const isMax = s.label === maxSlice.label;
                return (
                  <li key={i} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <span
                        className={`rounded-full ${isMax ? "h-3 w-3" : "h-2.5 w-2.5"}`}
                        style={{ background: s.color }}
                      />
                      <span className={isMax ? "font-medium" : ""}>{s.label}</span>
                      {isMax && (
                        <span className="rounded-full border border-border bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Principal
                        </span>
                      )}
                    </span>
                    <span className="num font-medium">
                      {formatBRLcompact(s.value)}{" "}
                      <span className="text-muted-foreground">· {pct(s.value)}%</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </Card>

        <Card title="Evolução de receita (R$ mil)">
          <div className="mb-3 flex items-center justify-between">
            <div
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${tendencia.classe}`}
            >
              <tendencia.Icon className="h-3.5 w-3.5" />
              {tendencia.label}
              <span className="num">
                {variacaoMes >= 0 ? "+" : ""}
                {variacaoMes.toFixed(1)}%
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              vs mês anterior{" "}
              <span className="num">({formatBRLcompact(adminKpisExtra.receitaMesAnterior)})</span>
            </div>
          </div>
          <svg viewBox="0 0 400 140" className="h-40 w-full">
            <polyline
              fill="none"
              stroke="oklch(0.55 0.22 262)"
              strokeWidth="2.5"
              points={k.receitaEvolucao
                .map(
                  (p, i) =>
                    `${(i / (k.receitaEvolucao.length - 1)) * 380 + 10},${130 - (p.v / 700) * 110}`,
                )
                .join(" ")}
            />
            <polyline
              fill="oklch(0.55 0.22 262 / 12%)"
              stroke="none"
              points={`${k.receitaEvolucao.map((p, i) => `${(i / (k.receitaEvolucao.length - 1)) * 380 + 10},${130 - (p.v / 700) * 110}`).join(" ")} 390,140 10,140`}
            />
          </svg>
          <div className="mt-2 flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
            {k.receitaEvolucao.map((p) => (
              <span key={p.mes}>{p.mes}</span>
            ))}
          </div>
        </Card>
      </section>

      {/* INTELIGÊNCIA DE MERCADO */}
      <Card title="Inteligência de mercado">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Regiões */}
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> Regiões com maior demanda
            </div>
            <ul className="space-y-2">
              {inteligenciaMercado.regioesDemanda.map((r0, i) => {
                const max = inteligenciaMercado.regioesDemanda[0].leads;
                const w = Math.round((r0.leads / max) * 100);
                return (
                  <li key={i} className="text-sm">
                    <div className="flex items-center justify-between">
                      <span>{r0.regiao}</span>
                      <span className="num text-xs text-muted-foreground">
                        {r0.leads} leads · {r0.visitas} visitas
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-[oklch(0.55_0.22_262)]"
                        style={{ width: `${w}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Tipos de imóvel */}
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Home className="h-3.5 w-3.5" /> Tipos de imóvel mais buscados
            </div>
            <ul className="space-y-2">
              {inteligenciaMercado.tiposImovel.map((t, i) => {
                const max = inteligenciaMercado.tiposImovel[0].buscas;
                const w = Math.round((t.buscas / max) * 100);
                return (
                  <li key={i} className="text-sm">
                    <div className="flex items-center justify-between">
                      <span>{t.label}</span>
                      <span className="num text-xs text-muted-foreground">
                        {t.buscas.toLocaleString("pt-BR")} buscas
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-[oklch(0.72_0.18_50)]"
                        style={{ width: `${w}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Faixa de preço */}
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Tags className="h-3.5 w-3.5" /> Faixa de preço dominante
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="num font-display text-2xl">
                {formatBRLcompact(inteligenciaMercado.faixaPrecoDominante.min)} –{" "}
                {formatBRLcompact(inteligenciaMercado.faixaPrecoDominante.max)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                <span className="font-medium text-emerald-600">
                  {inteligenciaMercado.faixaPrecoDominante.share}%
                </span>{" "}
                das buscas
              </div>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm">
              {inteligenciaMercado.faixasPrecoSecundarias.map((f, i) => (
                <li key={i} className="flex items-center justify-between text-muted-foreground">
                  <span>
                    {formatBRLcompact(f.min)} – {formatBRLcompact(f.max)}
                  </span>
                  <span className="num">{f.share}%</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Conversão por origem */}
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Target className="h-3.5 w-3.5" /> Conversão por origem
            </div>
            <ul className="space-y-3">
              {inteligenciaMercado.conversaoPorOrigem.map((o, i) => (
                <li key={i} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span>{o.origem}</span>
                    <span className="num font-medium">{o.pct}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-[oklch(0.65_0.18_145)]"
                      style={{ width: `${o.pct * 2}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* PERFORMANCE DE CORRETORES */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card title="Top corretores">
          <ul className="divide-y divide-border">
            {performanceCorretores.top.map((c, i) => (
              <li key={c.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                  {i + 1}
                </span>
                <img src={c.avatar} alt={c.nome} className="h-8 w-8 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{c.nome}</div>
                  <div className="text-xs text-muted-foreground">
                    Conversão <span className="num">{c.conversaoPct}%</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="num text-sm font-medium">{formatBRLcompact(c.receita)}</div>
                  {i === 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-700">
                      <Trophy className="h-2.5 w-2.5" /> Top
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Corretores em baixa performance">
          <ul className="divide-y divide-border">
            {performanceCorretores.baixaPerformance.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <img src={c.avatar} alt={c.nome} className="h-8 w-8 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{c.nome}</div>
                  <div className="text-xs text-muted-foreground">{c.motivo}</div>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                    c.severidade === "red"
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {c.severidade === "red" ? "Crítico" : "Atenção"}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-border pt-3">
            <Link
              to="/admin/usuarios"
              className="text-xs font-medium text-[oklch(0.55_0.22_262)] hover:underline"
            >
              Ver no admin de usuários →
            </Link>
          </div>
        </Card>
      </section>

      {/* INDICADORES OPERACIONAIS */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniKPI label="Corretores ativos" value={k.corretoresAtivos} icon={Users} />
        <MiniKPI
          label="Leads gerados"
          value={k.leadsGerados.toLocaleString("pt-BR")}
          icon={Filter}
        />
        <MiniKPI label="Parcerias ativas" value={k.parceriasAtivas} icon={Handshake} />
        <MiniKPI label="Vendas registradas" value={k.vendasRegistradas} icon={Building2} />
      </section>

      {/* ALERTAS */}
      <Card title="Alertas estratégicos">
        <ul className="divide-y divide-border">
          {alertasDinamicos.map((a, i) => (
            <Alerta key={`din-${i}`} cor={a.cor} titulo={a.titulo} sub={a.sub} icon={AlertCircle} />
          ))}
          <Alerta
            cor="red"
            titulo="3 cobranças em atraso totalizando R$ 17.420"
            sub="CB-2041, CB-2037, CB-2032 — vencidas há mais de 5 dias."
          />
          <Alerta
            cor="amber"
            titulo="8 parcerias ativas sem atualização há 14+ dias"
            sub="Pipeline parado. Risco de perder a janela comercial."
          />
          <Alerta
            cor="red"
            titulo="3 possíveis bypass detectados pelo sistema"
            sub="Vendas externas em leads recebidos pela Ubroker. Investigar em Suporte / Disputas."
          />
          <Alerta
            cor="amber"
            titulo="2 conciliações divergentes"
            sub="VD-117 com R$ 1.800 a menos do que o esperado."
          />
        </ul>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  );
}

function BigKPI({
  label,
  value,
  sub,
  icon: Icon,
  valueClass,
  badge,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  valueClass?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </div>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className={`mt-3 num font-display text-3xl ${valueClass ?? ""}`}>{value}</div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">{sub}</div>
        {badge}
      </div>
    </div>
  );
}

function MiniKPI({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </div>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-2 num font-display text-2xl">{value}</div>
    </div>
  );
}

function Alerta({
  cor,
  titulo,
  sub,
  icon: Icon = AlertTriangle,
}: {
  cor: "red" | "amber";
  titulo: string;
  sub: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const bg = cor === "red" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700";
  return (
    <li className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <span className={`mt-0.5 grid h-7 w-7 place-items-center rounded-full ${bg}`}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{titulo}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
    </li>
  );
}
void formatBRL;
