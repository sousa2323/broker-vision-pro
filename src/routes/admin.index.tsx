import { createFileRoute, Link } from "@tanstack/react-router";
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, Users, Handshake,
  Wallet, MapPin, Home, Tags, Target, Trophy, AlertCircle, Activity,
  ShieldAlert, ScaleIcon, Sparkles, Building2,
} from "lucide-react";
import {
  adminKpis, adminKpisExtra, inteligenciaMercado, performanceCorretores,
  adminParcerias, disputas, bypassAlertas,
} from "@/data/admin-mock";
import { formatBRLcompact } from "@/data/mock";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

// ============ Helpers determinísticos ============

const BASE_ATIVA_ANTERIOR = 718;

function crescimentoBaseAtiva() {
  const atual = adminKpis.corretoresAtivos;
  const delta = atual - BASE_ATIVA_ANTERIOR;
  const pct = (delta / BASE_ATIVA_ANTERIOR) * 100;
  return { atual, anterior: BASE_ATIVA_ANTERIOR, delta, pct };
}

function execucaoMediaRede() {
  const tops = performanceCorretores.top;
  const media = tops.reduce((s, c) => s + c.conversaoPct, 0) / tops.length;
  // Execução = mistura de conversão + atividade. Ponderada e arredondada.
  return Math.round(media * 2.4); // ~65% — escala "execução" coerente
}

function vgvMovimentado() {
  // Vendas × ticket médio da faixa dominante
  const f = inteligenciaMercado.faixaPrecoDominante;
  const ticket = (f.min + f.max) / 2;
  return adminKpis.vendasRegistradas * ticket;
}

function matchesRelevantes() {
  return adminParcerias.filter((p) => p.status === "Ativa").length * 6 + 12;
}

function crescimentoColaboracao() {
  // Variação MoM derivada deterministicamente
  return 18;
}

function receitaCompartilhada() {
  // % da receita por origem que vem de comissão
  const total =
    adminKpis.receitaPorOrigem.comissao +
    adminKpis.receitaPorOrigem.saas +
    adminKpis.receitaPorOrigem.indicacoes;
  return Math.round((adminKpis.receitaPorOrigem.comissao / total) * 100);
}

function motivoSuporte(motivo: string) {
  const m = motivo.toLowerCase();
  if (m.includes("bloqueado") || m.includes("login")) return "Sem login recente";
  if (m.includes("inativ")) return "Queda recente de atividade";
  if (m.includes("poucos leads")) return "Poucos leads ativos";
  if (m.includes("conversão") || m.includes("atraso")) return "Baixa utilização da plataforma";
  return "Pode precisar de suporte";
}

const DESTAQUES = [
  { label: "Maior conversão", Icon: Trophy, classe: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  { label: "Crescimento do mês", Icon: TrendingUp, classe: "border-sky-200 bg-sky-50 text-sky-700" },
  { label: "Maior colaboração", Icon: Handshake, classe: "border-violet-200 bg-violet-50 text-violet-700" },
  { label: "Melhor execução", Icon: Activity, classe: "border-amber-200 bg-amber-50 text-amber-700" },
  { label: "Destaque da rede", Icon: Sparkles, classe: "border-border bg-muted text-muted-foreground" },
];

function AdminDashboard() {
  const k = adminKpis;

  // Saúde da Rede
  const cresc = crescimentoBaseAtiva();
  const execucao = execucaoMediaRede();
  const convDelta = adminKpisExtra.conversaoMesPct - adminKpisExtra.conversaoMesAnteriorPct;
  const crescBadge =
    cresc.pct > 1
      ? { label: "Crescimento", classe: "border-emerald-200 bg-emerald-50 text-emerald-700", Icon: TrendingUp }
      : cresc.pct < -1
        ? { label: "Queda", classe: "border-amber-200 bg-amber-50 text-amber-700", Icon: TrendingDown }
        : { label: "Estável", classe: "border-border bg-muted text-muted-foreground", Icon: Minus };

  // Tendência da receita (mantida para o gráfico)
  const variacaoMes = ((k.receitaMes - adminKpisExtra.receitaMesAnterior) / adminKpisExtra.receitaMesAnterior) * 100;
  const tendencia =
    variacaoMes > 3
      ? { Icon: TrendingUp, label: "Crescimento", classe: "text-emerald-600 bg-emerald-50 border-emerald-200" }
      : variacaoMes < -3
        ? { Icon: TrendingDown, label: "Queda", classe: "text-red-600 bg-red-50 border-red-200" }
        : { Icon: Minus, label: "Estabilidade", classe: "text-muted-foreground bg-muted border-border" };

  // Risco sistêmico
  const bypassAltos = bypassAlertas.filter((b) => b.risco === "Alto").length;
  const disputasAbertas = disputas.filter((d) => d.status === "Aberta").length;
  const inadimplenciaSubindo =
    adminKpisExtra.inadimplenciaAtualPct > adminKpisExtra.inadimplenciaMesAnteriorPct + 1;
  const quedaConversao =
    adminKpisExtra.conversaoMesPct < adminKpisExtra.conversaoMesAnteriorPct - 1;

  type AlertaItem = { cor: "red" | "amber"; titulo: string; sub: string; Icon: React.ComponentType<{ className?: string }> };
  const alertas: AlertaItem[] = [];
  if (bypassAlertas.length > 0) {
    alertas.push({
      cor: bypassAltos > 0 ? "red" : "amber",
      titulo: `${bypassAlertas.length} possíveis bypass detectados`,
      sub: `${bypassAltos} de risco alto. Investigar em Suporte / Disputas.`,
      Icon: ShieldAlert,
    });
  }
  if (disputasAbertas > 0) {
    alertas.push({
      cor: "amber",
      titulo: `${disputasAbertas} disputas em aberto entre corretores`,
      sub: "Acompanhar em Suporte / Disputas para preservar a saúde da rede.",
      Icon: ScaleIcon,
    });
  }
  if (inadimplenciaSubindo) {
    alertas.push({
      cor: "red",
      titulo: "Inadimplência crescente",
      sub: `${adminKpisExtra.inadimplenciaAtualPct}% agora · ${adminKpisExtra.inadimplenciaMesAnteriorPct}% no mês anterior.`,
      Icon: AlertCircle,
    });
  }
  if (quedaConversao) {
    alertas.push({
      cor: "amber",
      titulo: "Queda coletiva de conversão",
      sub: `${adminKpisExtra.conversaoMesPct}% agora · ${adminKpisExtra.conversaoMesAnteriorPct}% no mês anterior.`,
      Icon: TrendingDown,
    });
  }
  alertas.push({
    cor: "amber",
    titulo: "2 conciliações divergentes",
    sub: "VD-117 com R$ 1.800 a menos do que o esperado.",
    Icon: AlertTriangle,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Saúde do ecossistema</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Supervisão da rede de corretores independentes da Ubroker.
        </p>
      </div>

      {/* 1. SAÚDE DA REDE */}
      <section>
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Rede · Outubro/2025
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <BigKPI
            label="Corretores ativos"
            value={cresc.atual.toLocaleString("pt-BR")}
            sub={`vs ${cresc.anterior} no mês anterior`}
            icon={Users}
            badge={
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${crescBadge.classe}`}>
                <crescBadge.Icon className="h-3 w-3" />
                {cresc.pct >= 0 ? "+" : ""}{cresc.pct.toFixed(1)}%
              </span>
            }
          />
          <BigKPI
            label="Execução média da rede"
            value={`${execucao}%`}
            sub="Atividade e cadência médias"
            icon={Activity}
          />
          <BigKPI
            label="Conversão média"
            value={`${adminKpisExtra.conversaoMesPct}%`}
            sub={`vs ${adminKpisExtra.conversaoMesAnteriorPct}% no mês anterior`}
            icon={Target}
            badge={
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                  convDelta >= 0
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                {convDelta >= 0 ? "+" : ""}{convDelta.toFixed(1)} p.p.
              </span>
            }
          />
          <BigKPI
            label="Crescimento mensal"
            value={`${cresc.pct >= 0 ? "+" : ""}${cresc.pct.toFixed(1)}%`}
            sub="Variação da base ativa"
            icon={TrendingUp}
            badge={
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${crescBadge.classe}`}>
                {crescBadge.label}
              </span>
            }
          />
        </div>
      </section>

      {/* 2. VISÃO INSTITUCIONAL */}
      <section>
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Visão institucional
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <BigKPI label="Receita total da plataforma" value={formatBRLcompact(k.receitaTotal)} sub="Acumulado histórico" icon={Wallet} />
          <BigKPI label="MRR SaaS" value={formatBRLcompact(k.mrrSaas)} sub="Receita recorrente mensal" icon={Users} />
        </div>
      </section>

      {/* 3. MARKETPLACE FUNCIONANDO? */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card title="Atividade do marketplace">
          <ul className="space-y-3 text-sm">
            <MarketRow label="Leads gerados pela plataforma" value={k.leadsGerados.toLocaleString("pt-BR")} />
            <MarketRow label="VGV movimentado" value={formatBRLcompact(vgvMovimentado())} highlight />
            <MarketRow label="Vendas registradas" value={k.vendasRegistradas.toString()} />
            <MarketRow label="Origem mais eficiente" value={`${inteligenciaMercado.conversaoPorOrigem[0].origem} · ${inteligenciaMercado.conversaoPorOrigem[0].pct}%`} />
          </ul>
          <div className="mt-4 border-t border-border pt-3 text-[11px] text-muted-foreground">
            Tipo mais buscado: <span className="text-foreground">{inteligenciaMercado.tiposImovel[0].label}</span> ·{" "}
            Região quente: <span className="text-foreground">{inteligenciaMercado.regioesDemanda[0].regiao}</span>
          </div>
        </Card>

        <Card title="Evolução de receita (R$ mil)">
          <div className="mb-3 flex items-center justify-between">
            <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${tendencia.classe}`}>
              <tendencia.Icon className="h-3.5 w-3.5" />
              {tendencia.label}
              <span className="num">{variacaoMes >= 0 ? "+" : ""}{variacaoMes.toFixed(1)}%</span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              vs mês anterior <span className="num">({formatBRLcompact(adminKpisExtra.receitaMesAnterior)})</span>
            </div>
          </div>
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

      {/* 4. INTELIGÊNCIA DE MERCADO (preservada) */}
      <Card title="Inteligência de mercado">
        <div className="grid gap-6 md:grid-cols-2">
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
                      <span className="num text-xs text-muted-foreground">{r0.leads} leads · {r0.visitas} visitas</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-[oklch(0.55_0.22_262)]" style={{ width: `${w}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

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
                      <span className="num text-xs text-muted-foreground">{t.buscas.toLocaleString("pt-BR")} buscas</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-[oklch(0.72_0.18_50)]" style={{ width: `${w}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Tags className="h-3.5 w-3.5" /> Faixa de preço dominante
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="num font-display text-2xl">
                {formatBRLcompact(inteligenciaMercado.faixaPrecoDominante.min)} – {formatBRLcompact(inteligenciaMercado.faixaPrecoDominante.max)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                <span className="font-medium text-emerald-600">{inteligenciaMercado.faixaPrecoDominante.share}%</span> das buscas
              </div>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm">
              {inteligenciaMercado.faixasPrecoSecundarias.map((f, i) => (
                <li key={i} className="flex items-center justify-between text-muted-foreground">
                  <span>{formatBRLcompact(f.min)} – {formatBRLcompact(f.max)}</span>
                  <span className="num">{f.share}%</span>
                </li>
              ))}
            </ul>
          </div>

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
                    <div className="h-full rounded-full bg-[oklch(0.65_0.18_145)]" style={{ width: `${o.pct * 2}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* 5. COLABORAÇÃO ACONTECENDO? */}
      <section>
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Colaboração da rede
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MiniKPI label="Parcerias ativas" value={k.parceriasAtivas} icon={Handshake} />
          <MiniKPI label="Receita compartilhada" value={`${receitaCompartilhada()}%`} icon={Wallet} />
          <MiniKPI label="Matches relevantes do mês" value={matchesRelevantes()} icon={Sparkles} />
          <MiniKPI label="Crescimento da colaboração" value={`+${crescimentoColaboracao()}%`} icon={TrendingUp} />
        </div>
      </section>

      {/* 6. DESTAQUES + SUPORTE */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card title="Destaques da Rede">
          <ul className="divide-y divide-border">
            {performanceCorretores.top.slice(0, 4).map((c, i) => {
              const d = DESTAQUES[i] ?? DESTAQUES[4];
              return (
                <li key={c.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span className={`grid h-7 w-7 place-items-center rounded-full border ${d.classe}`}>
                    <d.Icon className="h-3.5 w-3.5" />
                  </span>
                  <img src={c.avatar} alt={c.nome} className="h-9 w-9 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{c.nome}</div>
                    <div className="text-xs text-muted-foreground">Conversão <span className="num">{c.conversaoPct}%</span></div>
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                    {d.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card title="Corretores que podem precisar de suporte">
          <ul className="divide-y divide-border">
            {performanceCorretores.baixaPerformance.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <img src={c.avatar} alt={c.nome} className="h-9 w-9 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{c.nome}</div>
                  <div className="text-xs text-muted-foreground">{motivoSuporte(c.motivo)}</div>
                </div>
                <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Atenção
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-border pt-3">
            <Link to="/admin/usuarios" className="text-xs font-medium text-[oklch(0.55_0.22_262)] hover:underline">
              Acompanhar no admin de usuários →
            </Link>
          </div>
        </Card>
      </section>

      {/* 7. RISCO SISTÊMICO */}
      <Card title="Alertas estratégicos">
        <ul className="divide-y divide-border">
          {alertas.map((a, i) => (
            <Alerta key={i} cor={a.cor} titulo={a.titulo} sub={a.sub} icon={a.Icon} />
          ))}
        </ul>
      </Card>
    </div>
  );
}

function MarketRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Building2 className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className={`num ${highlight ? "font-display text-lg" : "text-sm font-medium"}`}>{value}</span>
    </li>
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

function BigKPI({
  label, value, sub, icon: Icon, valueClass, badge,
}: {
  label: string; value: string; sub: string;
  icon: React.ComponentType<{ className?: string }>;
  valueClass?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
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

function Alerta({
  cor, titulo, sub, icon: Icon = AlertTriangle,
}: {
  cor: "red" | "amber"; titulo: string; sub: string;
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
