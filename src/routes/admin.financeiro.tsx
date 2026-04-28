import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CheckCircle2, Eye, Pencil, MoreHorizontal, AlertTriangle, ShieldCheck,
  FileSearch, Download, FileText, Filter as FilterIcon, X, Calendar as CalendarIcon,
  Clock, Receipt, AlertCircle,
} from "lucide-react";
import {
  cobrancas as cobrancasMock,
  vendasDetalhadas,
  conciliacoes,
  corretorRisco,
  type Cobranca,
  type StatusCobrancaTipo,
  type OrigemCobranca,
} from "@/data/admin-mock";
import { formatBRL } from "@/data/mock";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { DateRange } from "react-day-picker";

export const Route = createFileRoute("/admin/financeiro")({
  component: FinanceiroPage,
});

type Tab = "cobrancas" | "vendas" | "conciliacao";
type StatusFiltro = "Todos" | StatusCobrancaTipo;
type OrigemFiltro = "Todas" | OrigemCobranca;
type PeriodoQuick = "hoje" | "7d" | "30d" | "custom";

const STATUS_LIST: StatusFiltro[] = ["Todos", "Pendente", "Faturado", "Pago", "Atrasado", "Contestado"];
const ORIGEM_LIST: OrigemFiltro[] = ["Todas", "Parceria", "Lead Ubroker", "SaaS"];

function FinanceiroPage() {
  const [tab, setTab] = useState<Tab>("cobrancas");

  // Filtros
  const [status, setStatus] = useState<StatusFiltro>("Todos");
  const [origem, setOrigem] = useState<OrigemFiltro>("Todas");
  const [corretorSel, setCorretorSel] = useState<string>("Todos");
  const [valorMin, setValorMin] = useState<string>("");
  const [valorMax, setValorMax] = useState<string>("");
  const [atrasoMin, setAtrasoMin] = useState<string>("");
  const [apenasAlto, setApenasAlto] = useState(false);
  const [avancadosAbertos, setAvancadosAbertos] = useState(false);
  const [periodo, setPeriodo] = useState<PeriodoQuick>("30d");
  const [range, setRange] = useState<DateRange | undefined>();

  const [cobrancaDetalhe, setCobrancaDetalhe] = useState<Cobranca | null>(null);

  const corretores = useMemo(
    () => Array.from(new Set(cobrancasMock.map((c) => c.corretor))).sort(),
    [],
  );

  const cobrancasFiltradas = useMemo(() => {
    return cobrancasMock.filter((c) => {
      if (status !== "Todos" && c.status !== status) return false;
      if (origem !== "Todas" && c.origem !== origem) return false;
      if (corretorSel !== "Todos" && c.corretor !== corretorSel) return false;
      const min = parseFloat(valorMin);
      const max = parseFloat(valorMax);
      if (!Number.isNaN(min) && c.valor < min) return false;
      if (!Number.isNaN(max) && c.valor > max) return false;
      const atraso = parseInt(atrasoMin);
      if (!Number.isNaN(atraso) && (c.diasAtraso ?? 0) < atraso) return false;
      if (apenasAlto && c.valor < 5_000) return false;
      return true;
    });
  }, [status, origem, corretorSel, valorMin, valorMax, atrasoMin, apenasAlto]);

  const totalAtraso = cobrancasFiltradas.filter((c) => c.status === "Atrasado").reduce((a, b) => a + b.valor, 0);
  const totalRecebido = cobrancasFiltradas.filter((c) => c.status === "Pago").reduce((a, b) => a + b.valor, 0);
  const totalPendente = cobrancasFiltradas.filter((c) => c.status === "Pendente" || c.status === "Faturado").reduce((a, b) => a + b.valor, 0);

  // Saúde financeira
  const totalCount = cobrancasFiltradas.length || 1;
  const inadimplentes = cobrancasFiltradas.filter((c) => c.status === "Atrasado" || c.status === "Contestado").length;
  const taxaInad = (inadimplentes / totalCount) * 100;
  const ticketMedio = cobrancasFiltradas.reduce((a, b) => a + b.valor, 0) / totalCount;
  const pagas = cobrancasFiltradas.filter((c) => c.status === "Pago" && c.criadoEm && c.pagoEm);
  const tempoMedio = pagas.length
    ? Math.round(pagas.reduce((a, c) => a + diasEntre(c.criadoEm, c.pagoEm!), 0) / pagas.length)
    : 0;
  const receitaPorOrigem = ORIGEM_LIST.slice(1).map((o) => ({
    origem: o as OrigemCobranca,
    total: cobrancasFiltradas.filter((c) => c.origem === o).reduce((a, b) => a + b.valor, 0),
  }));
  const receitaTotalOrigem = receitaPorOrigem.reduce((a, b) => a + b.total, 0) || 1;

  const limparFiltros = () => {
    setStatus("Todos"); setOrigem("Todas"); setCorretorSel("Todos");
    setValorMin(""); setValorMax(""); setAtrasoMin(""); setApenasAlto(false);
  };
  const filtrosAtivos = status !== "Todos" || origem !== "Todas" || corretorSel !== "Todos"
    || !!valorMin || !!valorMax || !!atrasoMin || apenasAlto;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl">Financeiro</h1>
          <p className="mt-1 text-sm text-muted-foreground">Cobranças, detalhamento de vendas e conciliação.</p>
        </div>
        <ExportarMenu cobrancas={cobrancasFiltradas} />
      </div>

      {/* Camada 7 — período */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Período</span>
        {([
          ["hoje", "Hoje"], ["7d", "Últimos 7 dias"], ["30d", "Últimos 30 dias"], ["custom", "Personalizado"],
        ] as const).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setPeriodo(k)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition",
              periodo === k ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >{l}</button>
        ))}
        {periodo === "custom" && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 gap-2 text-xs">
                <CalendarIcon className="h-3.5 w-3.5" />
                {range?.from ? `${range.from.toLocaleDateString("pt-BR")} – ${range.to?.toLocaleDateString("pt-BR") ?? "..."}` : "Escolher datas"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="range" selected={range} onSelect={setRange} numberOfMonths={2} className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* KPIs principais (mantidos) */}
      <section className="grid gap-4 sm:grid-cols-3">
        <KPI label="Recebido no mês" value={formatBRL(totalRecebido)} tone="green" />
        <KPI label="A receber" value={formatBRL(totalPendente)} tone="default" />
        <KPI label="Em atraso" value={formatBRL(totalAtraso)} tone="red" />
      </section>

      {/* Camada 8 — saúde financeira */}
      <section className="grid gap-3 md:grid-cols-4">
        <MiniKPI label="Inadimplência" value={`${taxaInad.toFixed(1)}%`} hint={`${inadimplentes} de ${totalCount} cobranças`} tone={taxaInad > 25 ? "red" : taxaInad > 10 ? "amber" : "green"} />
        <MiniKPI label="Ticket médio" value={formatBRL(ticketMedio)} hint="Por cobrança no período" />
        <MiniKPI label="Tempo médio de pagamento" value={`${tempoMedio} dias`} hint="Da emissão até o pagamento" />
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Receita por origem</div>
          <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-surface">
            {receitaPorOrigem.map((r, i) => (
              <div
                key={r.origem}
                className={cn(
                  i === 0 && "bg-navy",
                  i === 1 && "bg-blue-500",
                  i === 2 && "bg-warm",
                )}
                style={{ width: `${(r.total / receitaTotalOrigem) * 100}%` }}
              />
            ))}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] text-muted-foreground">
            {receitaPorOrigem.map((r, i) => (
              <div key={r.origem} className="flex items-center gap-1">
                <span className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  i === 0 && "bg-navy",
                  i === 1 && "bg-blue-500",
                  i === 2 && "bg-warm",
                )} />
                <span>{r.origem.split(" ")[0]} {Math.round((r.total / receitaTotalOrigem) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Abas (mantidas) */}
      <div className="flex items-center gap-1 border-b border-border">
        <TabBtn active={tab === "cobrancas"} onClick={() => setTab("cobrancas")}>Cobranças</TabBtn>
        <TabBtn active={tab === "vendas"} onClick={() => setTab("vendas")}>Detalhamento de vendas</TabBtn>
        <TabBtn active={tab === "conciliacao"} onClick={() => setTab("conciliacao")}>Conciliação</TabBtn>
      </div>

      {tab === "cobrancas" && (
        <div className="space-y-4">
          {/* Camada 1 — filtros */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                <FilterIcon className="h-3.5 w-3.5" /> Filtros
              </div>

              {/* Status */}
              <div className="flex flex-wrap gap-1.5">
                {STATUS_LIST.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition",
                      status === s ? "border-foreground bg-foreground text-background" : "border-border bg-background text-muted-foreground hover:text-foreground",
                    )}
                  >{s}</button>
                ))}
              </div>

              <div className="h-5 w-px bg-border" />

              {/* Origem */}
              <select
                value={origem}
                onChange={(e) => setOrigem(e.target.value as OrigemFiltro)}
                className="h-8 rounded-md border border-border bg-background px-2 text-xs"
              >
                {ORIGEM_LIST.map((o) => <option key={o} value={o}>{o === "Todas" ? "Todas as origens" : o}</option>)}
              </select>

              {/* Corretor */}
              <select
                value={corretorSel}
                onChange={(e) => setCorretorSel(e.target.value)}
                className="h-8 rounded-md border border-border bg-background px-2 text-xs"
              >
                <option value="Todos">Todos os corretores</option>
                {corretores.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>

              <button
                onClick={() => setAvancadosAbertos((v) => !v)}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground"
              >
                {avancadosAbertos ? "Esconder avançados" : "Filtros avançados"}
              </button>
              {filtrosAtivos && (
                <button onClick={limparFiltros} className="flex items-center gap-1 text-xs text-red-700 hover:underline">
                  <X className="h-3 w-3" /> Limpar
                </button>
              )}
            </div>

            {avancadosAbertos && (
              <div className="mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Valor mínimo</label>
                  <Input type="number" placeholder="R$ 0" value={valorMin} onChange={(e) => setValorMin(e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Valor máximo</label>
                  <Input type="number" placeholder="R$ ∞" value={valorMax} onChange={(e) => setValorMax(e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Atraso maior que (dias)</label>
                  <Input type="number" placeholder="0" value={atrasoMin} onChange={(e) => setAtrasoMin(e.target.value)} className="h-8 text-xs" />
                </div>
                <label className="flex items-end gap-2 text-xs">
                  <input type="checkbox" checked={apenasAlto} onChange={(e) => setApenasAlto(e.target.checked)} className="h-4 w-4 accent-foreground" />
                  Apenas alto valor (&gt; R$ 5.000)
                </label>
              </div>
            )}

            <div className="mt-3 text-[11px] text-muted-foreground">
              Mostrando <span className="font-medium text-foreground">{cobrancasFiltradas.length}</span> de {cobrancasMock.length} cobranças
            </div>
          </div>

          {/* Tabela */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <TooltipProvider delayDuration={150}>
              <table className="w-full text-sm">
                <thead className="bg-surface">
                  <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Corretor</th>
                    <th className="px-4 py-3">Origem</th>
                    <th className="px-4 py-3 text-right">Valor</th>
                    <th className="px-4 py-3">Vencimento</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Risco</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {cobrancasFiltradas.map((c) => {
                    const risco = corretorRisco[c.corretor];
                    return (
                      <tr key={c.id} className="hover:bg-surface/60">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.id}</td>
                        <td className="px-4 py-3">{c.corretor}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.origem}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {c.divergencia ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  Esperado {formatBRL(c.divergencia.esperado)} · Cobrado {formatBRL(c.divergencia.cobrado)} · Δ {formatBRL(c.divergencia.cobrado - c.divergencia.esperado)}
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                                </TooltipTrigger>
                                <TooltipContent>Validado · origem confere com o valor</TooltipContent>
                              </Tooltip>
                            )}
                            <span className="num">{formatBRL(c.valor)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {c.vencimento}
                          {c.diasAtraso ? <span className="ml-1 text-[10px] text-red-700">+{c.diasAtraso}d</span> : null}
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                        <td className="px-4 py-3">
                          {risco ? (
                            <HoverCard openDelay={150}>
                              <HoverCardTrigger asChild>
                                <button className="flex items-center gap-1.5 text-xs">
                                  <span className={cn(
                                    "h-2 w-2 rounded-full",
                                    risco.nivel === "baixo" && "bg-emerald-500",
                                    risco.nivel === "medio" && "bg-amber-500",
                                    risco.nivel === "alto" && "bg-red-500",
                                  )} />
                                  <span className="capitalize text-muted-foreground">{risco.nivel}</span>
                                </button>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-64 text-xs">
                                <div className="font-medium text-foreground">{c.corretor}</div>
                                <div className="mt-2 space-y-1 text-muted-foreground">
                                  <div>% pagamentos em atraso: <span className="font-medium text-foreground">{risco.pctAtraso}%</span></div>
                                  <div>Total em aberto: <span className="font-medium text-foreground">{formatBRL(risco.totalAberto)}</span></div>
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-surface hover:text-foreground"
                              title="Marcar como pago"
                              onClick={() => toast.success(`${c.id} marcada como paga`)}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button
                              className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-surface hover:text-foreground"
                              title="Ver origem"
                              onClick={() => setCobrancaDetalhe(c)}
                            >
                              <FileSearch className="h-4 w-4" />
                            </button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-surface hover:text-foreground" title="Mais ações">
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">{c.id}</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => toast.success(`${c.id} marcada como paga`)}>
                                  <CheckCircle2 className="mr-2 h-4 w-4" /> Marcar como pago
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toast.info(`Cobrança ${c.id} gerada`)}>
                                  <Receipt className="mr-2 h-4 w-4" /> Gerar cobrança
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toast.warning(`${c.id} marcada como contestada`)}>
                                  <AlertCircle className="mr-2 h-4 w-4" /> Marcar como contestado
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setCobrancaDetalhe(c)}>
                                  <Eye className="mr-2 h-4 w-4" /> Ver origem
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toast.info("Editor de cobrança em breve")}>
                                  <Pencil className="mr-2 h-4 w-4" /> Editar cobrança
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {cobrancasFiltradas.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhuma cobrança bate com os filtros.</td></tr>
                  )}
                </tbody>
              </table>
            </TooltipProvider>
          </div>
        </div>
      )}

      {tab === "vendas" && (
        <div className="space-y-4">
          {vendasDetalhadas.map((v) => (
            <div key={v.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">{v.id}</div>
                  <div className="mt-1 font-display text-lg">{v.imovel}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Valor da venda</div>
                  <div className="num font-display text-xl">{formatBRL(v.valor)}</div>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Comissão total</div>
                  <div className="num font-display text-lg text-emerald-700">{formatBRL(v.comissaoTotal)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">% da venda</div>
                  <div className="num font-display text-lg">{((v.comissaoTotal / v.valor) * 100).toFixed(1)}%</div>
                </div>
              </div>
              <div className="mt-5">
                <div className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Divisão</div>
                <div className="space-y-2">
                  {v.splits.map((s, i) => {
                    const pct = (s.valor / v.comissaoTotal) * 100;
                    const cor = s.tipo === "Fee Ubroker" ? "bg-warm" : s.tipo === "Captador" ? "bg-navy" : "bg-blue-500";
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between text-xs">
                          <span>{s.nome} <span className="text-muted-foreground">· {s.tipo}</span></span>
                          <span className="num font-medium">{formatBRL(s.valor)} <span className="text-muted-foreground">({pct.toFixed(0)}%)</span></span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface">
                          <div className={`h-full ${cor}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "conciliacao" && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-surface">
              <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Venda</th>
                <th className="px-4 py-3">Corretor</th>
                <th className="px-4 py-3 text-right">Esperado</th>
                <th className="px-4 py-3 text-right">Recebido</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {conciliacoes.map((c) => (
                <tr key={c.id} className={cn(c.status === "Divergente" && "bg-red-50/50")}>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.id}</td>
                  <td className="px-4 py-3 font-mono text-xs">{c.venda}</td>
                  <td className="px-4 py-3">{c.corretor}</td>
                  <td className="px-4 py-3 text-right num">{formatBRL(c.esperado)}</td>
                  <td className={cn("px-4 py-3 text-right num", c.status === "Divergente" && "text-red-700 font-medium")}>{formatBRL(c.recebido)}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-xs",
                      c.status === "Confirmada" && "bg-emerald-50 text-emerald-700",
                      c.status === "Pendente" && "bg-amber-50 text-amber-700",
                      c.status === "Divergente" && "bg-red-50 text-red-700",
                    )}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CobrancaDetalheModal cobranca={cobrancaDetalhe} onClose={() => setCobrancaDetalhe(null)} />
    </div>
  );
}

// ============== Subcomponentes ==============

function ExportarMenu({ cobrancas }: { cobrancas: Cobranca[] }) {
  const exportar = (tipo: "filtrados" | "corretor" | "contabil" | "inadimplencia") => {
    let rows: Record<string, string | number>[] = [];
    let nome = "cobrancas";
    if (tipo === "filtrados") {
      rows = cobrancas.map((c) => ({ ID: c.id, Corretor: c.corretor, Origem: c.origem, Valor: c.valor, Vencimento: c.vencimento, Status: c.status, CriadoEm: c.criadoEm, PagoEm: c.pagoEm ?? "" }));
      nome = "cobrancas-filtradas";
    } else if (tipo === "corretor") {
      const grupos: Record<string, { qtd: number; total: number; aberto: number }> = {};
      cobrancas.forEach((c) => {
        const g = (grupos[c.corretor] ||= { qtd: 0, total: 0, aberto: 0 });
        g.qtd += 1; g.total += c.valor;
        if (c.status !== "Pago") g.aberto += c.valor;
      });
      rows = Object.entries(grupos).map(([k, v]) => ({ Corretor: k, Cobranças: v.qtd, Total: v.total, EmAberto: v.aberto }));
      nome = "relatorio-por-corretor";
    } else if (tipo === "contabil") {
      const saas = cobrancas.filter((c) => c.origem === "SaaS").reduce((a, b) => a + b.valor, 0);
      const com = cobrancas.filter((c) => c.origem !== "SaaS").reduce((a, b) => a + b.valor, 0);
      rows = [{ Categoria: "SaaS (recorrente)", Valor: saas }, { Categoria: "Comissão (parceria/lead)", Valor: com }, { Categoria: "Total", Valor: saas + com }];
      nome = "relatorio-contabil";
    } else {
      rows = cobrancas.filter((c) => c.status === "Atrasado" || c.status === "Contestado")
        .map((c) => ({ ID: c.id, Corretor: c.corretor, Valor: c.valor, Vencimento: c.vencimento, DiasAtraso: c.diasAtraso ?? 0, Status: c.status }));
      nome = "relatorio-inadimplencia";
    }
    baixarCSV(nome, rows);
    toast.success("Relatório exportado", { description: `${rows.length} linha(s) · ${nome}.csv` });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" /> Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">Exportação inteligente</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => exportar("filtrados")}>
          <FileText className="mr-2 h-4 w-4" /> Dados filtrados (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportar("corretor")}>
          <FileText className="mr-2 h-4 w-4" /> Relatório por corretor
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportar("contabil")}>
          <FileText className="mr-2 h-4 w-4" /> Relatório contábil (SaaS vs comissão)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportar("inadimplencia")}>
          <FileText className="mr-2 h-4 w-4" /> Relatório de inadimplência
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CobrancaDetalheModal({ cobranca, onClose }: { cobranca: Cobranca | null; onClose: () => void }) {
  const venda = cobranca?.vendaId ? vendasDetalhadas.find((v) => v.id === cobranca.vendaId) : undefined;
  return (
    <Dialog open={!!cobranca} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        {cobranca && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-display">
                <FileSearch className="h-5 w-5" /> Origem da cobrança {cobranca.id}
              </DialogTitle>
              <DialogDescription>{cobranca.corretor} · {cobranca.origem} · {formatBRL(cobranca.valor)}</DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              {/* Venda vinculada */}
              <Section title="Venda vinculada">
                {venda ? (
                  <div className="grid gap-2 text-sm sm:grid-cols-3">
                    <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Imóvel</div><div>{venda.imovel}</div></div>
                    <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">VGV</div><div className="num">{formatBRL(venda.valor)}</div></div>
                    <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Tipo</div><div>{cobranca.origem}</div></div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Cobrança {cobranca.origem === "SaaS" ? "SaaS recorrente — sem venda associada" : "sem venda associada"}.</div>
                )}
              </Section>

              {/* Comissão */}
              {venda && (
                <Section title="Comissão">
                  <div className="mb-3 grid gap-2 text-sm sm:grid-cols-3">
                    <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">% total</div><div className="num">{((venda.comissaoTotal / venda.valor) * 100).toFixed(2)}%</div></div>
                    <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Valor calculado</div><div className="num">{formatBRL(venda.comissaoTotal)}</div></div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Valor cobrado</div>
                      <div className={cn("num", cobranca.divergencia && "text-amber-700 font-medium")}>{formatBRL(cobranca.valor)}</div>
                    </div>
                  </div>
                  {cobranca.divergencia && (
                    <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      ⚠ Divergência detectada — Δ {formatBRL(cobranca.divergencia.cobrado - cobranca.divergencia.esperado)}
                    </div>
                  )}
                  <div className="mt-3 space-y-1.5">
                    {venda.splits.map((s, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span>{s.nome} <span className="text-muted-foreground">· {s.tipo}</span></span>
                        <span className="num">{formatBRL(s.valor)}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Envolvidos */}
              <Section title="Envolvidos">
                <div className="flex flex-wrap gap-2">
                  {(venda ? venda.splits.filter((s) => s.tipo !== "Fee Ubroker").map((s) => s.nome) : [cobranca.corretor]).map((n) => (
                    <span key={n} className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-2.5 py-1 text-xs">
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-navy text-[9px] font-semibold text-white">{n.split(" ").map((p) => p[0]).slice(0, 2).join("")}</span>
                      {n}
                    </span>
                  ))}
                </div>
              </Section>

              {/* Timeline */}
              <Section title="Timeline financeira">
                <ol className="space-y-3">
                  <Step icon={<Clock className="h-3.5 w-3.5" />} label="Criada em" date={cobranca.criadoEm} />
                  <Step icon={<Receipt className="h-3.5 w-3.5" />} label="Faturada em" date={cobranca.faturadoEm ?? "—"} />
                  <Step
                    icon={<CalendarIcon className="h-3.5 w-3.5" />}
                    label="Vencimento"
                    date={cobranca.vencimento}
                    extra={cobranca.diasAtraso ? <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">{cobranca.diasAtraso} dias em atraso</span> : null}
                  />
                  <Step icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Pago em" date={cobranca.pagoEm ?? "—"} done={!!cobranca.pagoEm} />
                </ol>
              </Section>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface/40 p-4">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}

function Step({ icon, label, date, extra, done }: { icon: React.ReactNode; label: string; date: string; extra?: React.ReactNode; done?: boolean }) {
  return (
    <li className="flex items-center gap-3 text-sm">
      <span className={cn("grid h-7 w-7 place-items-center rounded-full border", done ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-border bg-card text-muted-foreground")}>{icon}</span>
      <div className="flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium">{date}</div>
      </div>
      {extra}
    </li>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "border-b-2 px-4 py-2.5 text-sm transition",
        active ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function KPI({ label, value, tone }: { label: string; value: string; tone: "green" | "red" | "default" }) {
  const cls = tone === "green" ? "text-emerald-700" : tone === "red" ? "text-red-700" : "";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={cn("mt-2 num font-display text-2xl", cls)}>{value}</div>
    </div>
  );
}

function MiniKPI({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "green" | "amber" | "red" }) {
  const cls = tone === "green" ? "text-emerald-700" : tone === "amber" ? "text-amber-700" : tone === "red" ? "text-red-700" : "";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={cn("mt-1.5 num font-display text-xl", cls)}>{value}</div>
      {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: StatusCobrancaTipo }) {
  const map: Record<StatusCobrancaTipo, string> = {
    Pendente: "bg-amber-50 text-amber-700",
    Faturado: "bg-blue-50 text-blue-700",
    Pago: "bg-emerald-50 text-emerald-700",
    Atrasado: "bg-red-50 text-red-700",
    Contestado: "bg-purple-50 text-purple-700",
  };
  return <span className={cn("rounded-full px-2 py-0.5 text-xs", map[status])}>{status}</span>;
}

// ============== Utils ==============

function diasEntre(a: string, b: string) {
  // dd/mm — assume mesmo ano
  const [da, ma] = a.split("/").map(Number);
  const [db, mb] = b.split("/").map(Number);
  const ano = new Date().getFullYear();
  const dt1 = new Date(ano, (ma ?? 1) - 1, da ?? 1);
  const dt2 = new Date(ano, (mb ?? 1) - 1, db ?? 1);
  return Math.max(0, Math.round((dt2.getTime() - dt1.getTime()) / 86_400_000));
}

function baixarCSV(nome: string, rows: Record<string, string | number>[]) {
  if (rows.length === 0) {
    toast.warning("Nada para exportar");
    return;
  }
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(";"), ...rows.map((r) => headers.map((h) => escape(r[h])).join(";"))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${nome}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
