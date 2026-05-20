import { createFileRoute, Link } from "@tanstack/react-router";
import {
  TrendingUp, TrendingDown, AlertTriangle, Users, Building2, Handshake, BadgeDollarSign,
  Filter, Wallet, Percent, Trophy, Sparkles, Activity, Timer, Clock, ShieldAlert,
  ArrowUpRight, ArrowDownRight, Flame, MapPin, Tags, Target, Zap, LineChart, Gauge,
} from "lucide-react";
import {
  adminKpis, adminKpisExtra, despesasMock, inteligenciaMercado, performanceCorretores,
} from "@/data/admin-mock";
import { formatBRLcompact, formatBRL } from "@/data/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const k = adminKpis;
  const ex = adminKpisExtra;

  // ===== Derivações executivas (mock determinístico) =====
  const despesasMes = despesasMock.reduce((s, d) => s + d.valor, 0);
  const resultadoMes = k.receitaMes - despesasMes;
  const margemPct = k.receitaMes > 0 ? (resultadoMes / k.receitaMes) * 100 : 0;
  const variacaoMes = ((k.receitaMes - ex.receitaMesAnterior) / ex.receitaMesAnterior) * 100;
  const execucaoMedia = 72;        // execução média da rede (0-100)
  const tempoRespostaMin = 14;     // min
  const crescimentoSemanal = 6.4;  // %
  const vgvAtivo = 184_500_000;
  const receitaPrevista = k.receitaMes * 1.18;
  const receitaCompartilhada = k.receitaPorOrigem.comissao * 0.42;
  const comissaoEstimada = k.receitaMes * 0.34;

  // Pipeline consolidado (5 etapas)
  const pipeline = [
    { etapa: "Novo",         qtd: 1284, vgv:  92_000_000, trend:  +8 },
    { etapa: "Qualificado",  qtd:  742, vgv:  78_000_000, trend:  +5 },
    { etapa: "Visita",       qtd:  318, vgv:  54_000_000, trend:  -2 },
    { etapa: "Proposta",     qtd:  124, vgv:  31_000_000, trend:  +3 },
    { etapa: "Fechado",      qtd:   38, vgv:   9_400_000, trend: +11 },
  ];

  return (
    <div className="space-y-8">
      {/* Cabeçalho executivo */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Central executiva · Outubro/2025</div>
          <h1 className="mt-1 font-display text-2xl">Visão da rede</h1>
          <p className="mt-1 text-sm text-muted-foreground">Supervisão estratégica da operação Ubroker em tempo real.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Rede operando — {k.corretoresAtivos} corretores online
        </div>
      </header>

      {/* BLOCO 1 — RESUMO EXECUTIVO */}
      <section>
        <SectionTitle eyebrow="Bloco 01" title="Resumo executivo" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ExecKPI label="Corretores ativos" value={k.corretoresAtivos.toString()} hint={`${performanceCorretores.baixaPerformance.length} em risco operacional`} trend={+3.2} />
          <ExecKPI label="Leads ativos" value={k.leadsGerados.toLocaleString("pt-BR")} hint="Distribuídos na rede" trend={+5.8} />
          <ExecKPI label="Execução média" value={`${execucaoMedia}%`} hint="Índice de cadência da rede" trend={+1.4} />
          <ExecKPI label="Conversão média" value={`${ex.conversaoMesPct}%`} hint={`vs ${ex.conversaoMesAnteriorPct}% mês anterior`} trend={ex.conversaoMesPct - ex.conversaoMesAnteriorPct} />
          <ExecKPI label="Tempo médio de resposta" value={`${tempoRespostaMin} min`} hint="SLA da rede" trend={-2.1} />
          <ExecKPI label="Receita prevista" value={formatBRLcompact(receitaPrevista)} hint="Projeção fim do mês" trend={+variacaoMes} icon={BadgeDollarSign} />
          <ExecKPI label="VGV ativo" value={formatBRLcompact(vgvAtivo)} hint="Em negociação na rede" trend={+4.2} icon={Building2} />
          <ExecKPI label="Crescimento semanal" value={`${crescimentoSemanal}%`} hint="vs semana anterior" trend={+crescimentoSemanal} icon={Activity} />
        </div>
      </section>

      {/* BLOCO 2 — ALERTAS OPERACIONAIS (torre de controle) */}
      <section>
        <SectionTitle eyebrow="Bloco 02" title="Torre de controle" hint="Sinais operacionais da rede" />
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-wrap gap-2">
            <SignalPill tone="red"   label="12 propostas sem follow-up" />
            <SignalPill tone="amber" label="8 visitas sem confirmação" />
            <SignalPill tone="red"   label="5 leads premium sem interação" />
            <SignalPill tone="red"   label="3 parcerias críticas" />
            <SignalPill tone="amber" label="7 imóveis sem atualização" />
            <SignalPill tone="amber" label="4 corretores sem login recente" />
            <SignalPill tone="neutral" label="2 conciliações divergentes" />
            <SignalPill tone="neutral" label="3 cobranças em atraso" />
          </div>
        </div>
      </section>

      {/* BLOCO 3 — SAÚDE DA REDE */}
      <section>
        <SectionTitle eyebrow="Bloco 03" title="Saúde da rede" hint="Diagnóstico operacional" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <HealthCard icon={Filter}      label="Leads negligenciados"   value="42" tone="red"     sub="Sem interação 72h+" />
          <HealthCard icon={Timer}       label="SLA quebrados"          value="18" tone="red"     sub="Resposta acima de 30min" />
          <HealthCard icon={Clock}       label="Cadências atrasadas"    value="27" tone="amber"   sub="Passo programado vencido" />
          <HealthCard icon{...{}}        label="Tempo médio parado"     value="3.4d" tone="amber" sub="Leads sem evolução" />
          <HealthCard icon={Gauge}       label="Execução por plano"     value="Pro 81% · Free 49%" tone="ok" sub="Cadência média" />
          <HealthCard icon={ShieldAlert} label="Corretores em risco"    value={performanceCorretores.baixaPerformance.length.toString()} tone="red" sub="Inatividade + baixa conversão" />
        </div>
      </section>

      {/* BLOCO 4 — LEITURA IA DA REDE */}
      <section>
        <div className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-surface p-6">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-foreground text-background">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Bloco 04 · IA executiva</div>
              <div className="font-display text-lg leading-tight">Leitura IA da rede</div>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <IAInsight tag="Conversão" text="Leads de indicação convertem 12% acima da média da rede nas últimas 4 semanas." />
            <IAInsight tag="Região"    text="A região oceânica (Camboinhas · Itaipu) apresentou crescimento operacional consistente." />
            <IAInsight tag="Ticket"    text="Imóveis acima de R$ 2M operam com baixa velocidade — ciclo médio 38 dias." />
            <IAInsight tag="Parcerias" text="Parcerias premium converteram 1.7x acima da média e devem ser priorizadas." />
            <IAInsight tag="Plano"     text="Corretores Free concentram 68% dos leads negligenciados da rede." tone="warn" />
            <IAInsight tag="Mercado"   text="Apartamentos de 2 quartos lideram demanda — alinhar inventário e captação." />
          </div>
        </div>
      </section>

      {/* BLOCO 5 — PIPELINE CONSOLIDADO */}
      <section>
        <SectionTitle eyebrow="Bloco 05" title="Pipeline consolidado" hint="Visão executiva por etapa" />
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid grid-cols-2 divide-y divide-border md:grid-cols-5 md:divide-x md:divide-y-0">
            {pipeline.map((p, i) => {
              const next = pipeline[i + 1];
              const conv = next ? Math.round((next.qtd / p.qtd) * 100) : null;
              return (
                <div key={p.etapa} className="relative p-5">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{p.etapa}</div>
                  <div className="mt-2 num font-display text-3xl">{p.qtd.toLocaleString("pt-BR")}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="num">{formatBRLcompact(p.vgv)}</span>
                    <TrendChip value={p.trend} compact />
                  </div>
                  {conv !== null && (
                    <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      <ArrowUpRight className="h-3 w-3" /> {conv}% → {next!.etapa}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* BLOCO 6 — PERFORMANCE DA REDE */}
      <section>
        <SectionTitle eyebrow="Bloco 06" title="Performance da rede" hint="Destaques estratégicos da semana" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <HighlightCard
            icon={Trophy}
            eyebrow="Melhor corretor"
            title={performanceCorretores.top[0].nome}
            metric={`${performanceCorretores.top[0].conversaoPct}% conversão`}
            sub={formatBRLcompact(performanceCorretores.top[0].receita)}
          />
          <HighlightCard
            icon={Handshake}
            eyebrow="Melhor dupla"
            title="Denise · Aldemar"
            metric="R$ 207k em comissão"
            sub="Camboinhas · 3 fechamentos"
          />
          <HighlightCard
            icon={MapPin}
            eyebrow="Região mais quente"
            title={inteligenciaMercado.regioesDemanda[0].regiao}
            metric={`${inteligenciaMercado.regioesDemanda[0].leads} leads`}
            sub={`${inteligenciaMercado.regioesDemanda[0].visitas} visitas agendadas`}
          />
          <HighlightCard
            icon={Target}
            eyebrow="Origem que mais converte"
            title={inteligenciaMercado.conversaoPorOrigem[0].origem}
            metric={`${inteligenciaMercado.conversaoPorOrigem[0].pct}%`}
            sub="Acima da média da rede"
          />
          <HighlightCard
            icon={Tags}
            eyebrow="Tipo mais eficiente"
            title={inteligenciaMercado.tiposImovel[0].label}
            metric={`${inteligenciaMercado.tiposImovel[0].buscas.toLocaleString("pt-BR")} buscas`}
            sub="Ciclo curto · alta liquidez"
          />
          <HighlightCard
            icon={Flame}
            eyebrow="Operação em destaque"
            title="Cobertura Linear · Jardim Icaraí"
            metric="VGV R$ 2.35M"
            sub="Proposta em negociação"
          />
        </div>
      </section>

      {/* BLOCO 7 — ECONOMIA DA REDE */}
      <section>
        <SectionTitle eyebrow="Bloco 07" title="Economia da rede" hint="Fluxo financeiro consolidado" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <MoneyCard icon={Wallet}        label="Receita prevista"      value={formatBRLcompact(receitaPrevista)} sub={`${variacaoMes >= 0 ? "+" : ""}${variacaoMes.toFixed(1)}% vs mês anterior`} trend={variacaoMes} />
          <MoneyCard icon={Handshake}     label="Receita compartilhada" value={formatBRLcompact(receitaCompartilhada)} sub="Splits entre corretores parceiros" trend={+8.2} />
          <MoneyCard icon={BadgeDollarSign} label="Comissão estimada"   value={formatBRLcompact(comissaoEstimada)} sub="Fee Ubroker do mês" trend={+4.1} />
          <MoneyCard icon={LineChart}     label="Crescimento mensal"    value={`${variacaoMes.toFixed(1)}%`} sub="Receita do mês vs anterior" trend={variacaoMes} />
          <MoneyCard icon={Zap}           label="Marketplace performance" value="CTR 4.8% · CR 2.1%" sub="Anúncios da rede" trend={+1.6} />
          <MoneyCard icon={Building2}     label="VGV em negociação"     value={formatBRLcompact(vgvAtivo)} sub="Pipeline ativo" trend={+4.2} />
        </div>
        <div className="mt-2 flex items-center justify-between rounded-2xl border border-border bg-surface/60 px-4 py-3 text-xs text-muted-foreground">
          <span>Resultado do mês <span className={cn("num font-medium", resultadoMes >= 0 ? "text-emerald-600" : "text-red-600")}>{formatBRLcompact(resultadoMes)}</span> · margem <span className="num">{margemPct.toFixed(1)}%</span></span>
          <Link to="/admin/financeiro" className="font-medium text-foreground hover:underline">Abrir financeiro →</Link>
        </div>
      </section>
    </div>
  );
}

/* =============== COMPONENTES =============== */

function SectionTitle({ eyebrow, title, hint }: { eyebrow: string; title: string; hint?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</div>
        <div className="font-display text-base">{title}</div>
      </div>
      {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function ExecKPI({
  label, value, hint, trend, icon: Icon,
}: { label: string; value: string; hint: string; trend: number; icon?: React.ComponentType<{ className?: string }> }) {
  const up = trend >= 0;
  return (
    <div className="group rounded-2xl border border-border bg-card p-4 transition hover:border-foreground/20">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
        {Icon ? <Icon className="h-3.5 w-3.5 text-muted-foreground" /> : null}
      </div>
      <div className="mt-2 num font-display text-2xl tracking-tight">{value}</div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <div className="truncate text-[11px] text-muted-foreground">{hint}</div>
        <TrendChip value={trend} compact />
      </div>
    </div>
  );
}

function TrendChip({ value, compact }: { value: number; compact?: boolean }) {
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-medium num",
      up ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700",
      compact && "leading-none",
    )}>
      <Icon className="h-2.5 w-2.5" />
      {up ? "+" : ""}{value.toFixed(1)}%
    </span>
  );
}

function SignalPill({ tone, label }: { tone: "red" | "amber" | "neutral"; label: string }) {
  const cls =
    tone === "red"   ? "border-red-200 bg-red-50 text-red-700"
    : tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-700"
    : "border-border bg-surface text-muted-foreground";
  return (
    <button className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition hover:translate-y-[-1px]",
      cls,
    )}>
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </button>
  );
}

function HealthCard({
  icon: Icon, label, value, sub, tone,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string; value: string; sub: string; tone: "ok" | "amber" | "red";
}) {
  const dot =
    tone === "red" ? "bg-red-500"
    : tone === "amber" ? "bg-amber-500"
    : "bg-emerald-500";
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        <span className={cn("inline-block h-1.5 w-1.5 rounded-full", dot)} />
        {label}
      </div>
      <div className="mt-2 num font-display text-xl tracking-tight">{value}</div>
      <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="truncate">{sub}</span>
        {Icon ? <Icon className="h-3.5 w-3.5 opacity-60" /> : null}
      </div>
    </div>
  );
}

function IAInsight({ tag, text, tone }: { tag: string; text: string; tone?: "warn" }) {
  return (
    <div className="flex gap-3 rounded-xl border border-border/70 bg-card/60 p-3 backdrop-blur">
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-foreground/5 text-foreground">
        <Sparkles className="h-3 w-3" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{tag}</div>
        <div className={cn("mt-0.5 text-sm leading-snug", tone === "warn" && "text-amber-800")}>{text}</div>
      </div>
    </div>
  );
}

function HighlightCard({
  icon: Icon, eyebrow, title, metric, sub,
}: { icon: React.ComponentType<{ className?: string }>; eyebrow: string; title: string; metric: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {eyebrow}
      </div>
      <div className="mt-2 truncate font-display text-base">{title}</div>
      <div className="mt-1 num text-sm font-medium">{metric}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}

function MoneyCard({
  icon: Icon, label, value, sub, trend,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub: string; trend: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </div>
        <TrendChip value={trend} compact />
      </div>
      <div className="mt-2 num font-display text-2xl tracking-tight">{value}</div>
      <div className="mt-1 truncate text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}

void formatBRL;
void TrendingUp; void TrendingDown; void AlertTriangle; void Users; void Percent;
