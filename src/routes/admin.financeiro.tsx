import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CheckCircle2, Eye, Pencil, MoreHorizontal, AlertTriangle, ShieldCheck,
  FileSearch, Download, FileText, Filter as FilterIcon, X, Calendar as CalendarIcon,
  Clock, Receipt, AlertCircle, Phone, MessageSquare, Handshake, FileSignature,
  Activity, Users, UserPlus, RotateCcw, Lock, Upload, Mail, Smartphone, Paperclip,
  Timer, BarChart3,
} from "lucide-react";
import {
  cobrancas as cobrancasMock,
  vendasDetalhadas,
  conciliacoes as conciliacoesMock,
  corretorRisco,
  calcularStatusConciliacao,
  calcularSLA,
  calcularPrioridade,
  agruparPorCorretor,
  RESPONSAVEIS_DISPONIVEIS,
  type Conciliacao,
  type ConciliacaoInteracao,
  type ConciliacaoAuditoria,
  type StatusConciliacao,
  type StatusOperacionalCobranca,
  type StatusCobrancaTipo,
  type OrigemCobranca,
  type Cobranca,
  type ResponsavelCobranca,
  type ComprovantePagamento,
} from "@/data/admin-mock";
import { formatBRL } from "@/data/mock";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
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

  // ===== Conciliação V2 (state local — sem backend) =====
  const [conciliacoes, setConciliacoes] = useState<Conciliacao[]>(() =>
    conciliacoesMock.map((c) => ({ ...c, status: calcularStatusConciliacao(c.esperado, c.recebido) })),
  );
  const [concDetalhe, setConcDetalhe] = useState<Conciliacao | null>(null);
  const [concStatusFiltro, setConcStatusFiltro] = useState<"Todos" | StatusConciliacao>("Todos");
  const [concRiscoFiltro, setConcRiscoFiltro] = useState<"Todos" | "baixo" | "medio" | "alto">("Todos");
  const [concCorretor, setConcCorretor] = useState<string>("Todos");
  const [concValMin, setConcValMin] = useState("");
  const [concValMax, setConcValMax] = useState("");
  const [concSomenteDiv, setConcSomenteDiv] = useState(false);
  const [concAgrupar, setConcAgrupar] = useState(false);
  const [concReabrir, setConcReabrir] = useState<Conciliacao | null>(null);
  const [concReabrirJustificativa, setConcReabrirJustificativa] = useState("");

  function atualizarConciliacao(id: string, patch: Partial<Conciliacao>, audit?: ConciliacaoAuditoria) {
    setConciliacoes((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      const next = { ...c, ...patch };
      if (audit) next.auditoria = [...c.auditoria, audit];
      next.status = calcularStatusConciliacao(next.esperado, next.recebido);
      return next;
    }));
    setConcDetalhe((cur) => {
      if (!cur || cur.id !== id) return cur;
      const next = { ...cur, ...patch };
      if (audit) next.auditoria = [...cur.auditoria, audit];
      next.status = calcularStatusConciliacao(next.esperado, next.recebido);
      return next;
    });
  }

  function reabrirConciliacao(c: Conciliacao, justificativa: string) {
    // Reseta para Pendente zerando o recebido — exige nova conciliação
    atualizarConciliacao(c.id, { recebido: 0, pagoEm: undefined, statusOperacional: "Em cobrança" }, {
      data: agora(), autor: "Superadmin",
      acao: `Conciliação reaberta — Justificativa: ${justificativa}`,
      valorAnterior: c.recebido, valorNovo: 0,
    });
  }

  function adicionarInteracao(id: string, interacao: ConciliacaoInteracao) {
    setConciliacoes((prev) => prev.map((c) => c.id === id ? { ...c, interacoes: [...c.interacoes, interacao] } : c));
    setConcDetalhe((cur) => cur && cur.id === id ? { ...cur, interacoes: [...cur.interacoes, interacao] } : cur);
  }

  const concCorretores = useMemo(
    () => Array.from(new Set(conciliacoes.map((c) => c.corretor))).sort(),
    [conciliacoes],
  );

  const concFiltradas = useMemo(() => {
    const lista = conciliacoes.filter((c) => {
      if (concStatusFiltro !== "Todos" && c.status !== concStatusFiltro) return false;
      if (concCorretor !== "Todos" && c.corretor !== concCorretor) return false;
      const min = parseFloat(concValMin); const max = parseFloat(concValMax);
      if (!Number.isNaN(min) && c.esperado < min) return false;
      if (!Number.isNaN(max) && c.esperado > max) return false;
      const dif = c.esperado - c.recebido;
      if (concSomenteDiv && dif === 0) return false;
      if (concRiscoFiltro !== "Todos" && classificarRiscoConc(c) !== concRiscoFiltro) return false;
      return true;
    });
    // Ordenação default: prioridade desc (Confirmadas vão para o final)
    return lista.slice().sort((a, b) => calcularPrioridade(b) - calcularPrioridade(a));
  }, [conciliacoes, concStatusFiltro, concCorretor, concValMin, concValMax, concSomenteDiv, concRiscoFiltro]);

  const concAgrupado = useMemo(() => agruparPorCorretor(concFiltradas), [concFiltradas]);

  const concKpis = useMemo(() => {
    const conciliado = concFiltradas.filter((c) => c.status === "Confirmada").reduce((a, b) => a + b.recebido, 0);
    const divergente = concFiltradas.filter((c) => c.status === "Divergente" || c.status === "Parcial").reduce((a, b) => a + Math.abs(b.esperado - b.recebido), 0);
    const pendente = concFiltradas.filter((c) => c.status === "Pendente").reduce((a, b) => a + b.esperado, 0);
    return { conciliado, divergente, pendente, risco: divergente + pendente };
  }, [concFiltradas]);


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
        <div className="space-y-4">
          {/* Visão de controle */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MiniKPI label="Total conciliado" value={formatBRL(concKpis.conciliado)} tone="green" hint={`${concFiltradas.filter((c) => c.status === "Confirmada").length} venda(s)`} />
            <MiniKPI label="Total divergente" value={formatBRL(concKpis.divergente)} tone="red" hint={`${concFiltradas.filter((c) => c.status === "Divergente" || c.status === "Parcial").length} caso(s)`} />
            <MiniKPI label="Total pendente" value={formatBRL(concKpis.pendente)} tone="amber" hint={`${concFiltradas.filter((c) => c.status === "Pendente").length} aberto(s)`} />
            <MiniKPI label="Valor em risco" value={formatBRL(concKpis.risco)} tone="red" hint="Divergências + pendentes" />
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
            <FilterIcon className="h-4 w-4 text-muted-foreground" />
            <Select value={concStatusFiltro} onValueChange={(v) => setConcStatusFiltro(v as typeof concStatusFiltro)}>
              <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                {(["Todos", "Confirmada", "Parcial", "Divergente", "Pendente"] as const).map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={concRiscoFiltro} onValueChange={(v) => setConcRiscoFiltro(v as typeof concRiscoFiltro)}>
              <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Risco" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos" className="text-xs">Todos os riscos</SelectItem>
                <SelectItem value="baixo" className="text-xs">Baixo</SelectItem>
                <SelectItem value="medio" className="text-xs">Médio</SelectItem>
                <SelectItem value="alto" className="text-xs">Alto</SelectItem>
              </SelectContent>
            </Select>
            <Select value={concCorretor} onValueChange={setConcCorretor}>
              <SelectTrigger className="h-8 w-[180px] text-xs"><SelectValue placeholder="Corretor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos" className="text-xs">Todos os corretores</SelectItem>
                {concCorretores.map((n) => <SelectItem key={n} value={n} className="text-xs">{n}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input className="h-8 w-[110px] text-xs" placeholder="Valor mín" value={concValMin} onChange={(e) => setConcValMin(e.target.value)} />
            <Input className="h-8 w-[110px] text-xs" placeholder="Valor máx" value={concValMax} onChange={(e) => setConcValMax(e.target.value)} />
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Switch checked={concSomenteDiv} onCheckedChange={setConcSomenteDiv} />
              Só com divergência
            </label>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Switch checked={concAgrupar} onCheckedChange={setConcAgrupar} />
              <Users className="h-3.5 w-3.5" /> Agrupar por corretor
            </label>
            <div className="ml-auto">
              <ExportarConciliacaoMenu conciliacoes={concFiltradas} />
            </div>
          </div>

          {/* Tabela agregada por corretor */}
          {concAgrupar ? (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-surface">
                  <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                    <th className="px-4 py-3">Corretor</th>
                    <th className="px-4 py-3 text-right">Casos</th>
                    <th className="px-4 py-3 text-right">Total devido</th>
                    <th className="px-4 py-3 text-right">Total recebido</th>
                    <th className="px-4 py-3 text-right">Em atraso</th>
                    <th className="px-4 py-3 text-right">Inadimplência</th>
                    <th className="px-4 py-3 w-32"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {concAgrupado.map((g) => (
                    <tr key={g.corretor} className="hover:bg-surface/40">
                      <td className="px-4 py-3 font-medium">{g.corretor}</td>
                      <td className="px-4 py-3 text-right num text-muted-foreground">{g.casos}</td>
                      <td className="px-4 py-3 text-right num">{formatBRL(g.totalDevido)}</td>
                      <td className="px-4 py-3 text-right num text-emerald-700">{formatBRL(g.totalRecebido)}</td>
                      <td className="px-4 py-3 text-right num text-amber-700">{formatBRL(g.totalAtraso)}</td>
                      <td className={cn("px-4 py-3 text-right num font-medium", g.inadimplenciaPct > 25 ? "text-red-700" : g.inadimplenciaPct > 10 ? "text-amber-700" : "text-emerald-700")}>
                        {g.inadimplenciaPct.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setConcCorretor(g.corretor); setConcAgrupar(false); }}>
                          Ver itens
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {concAgrupado.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">Nenhum dado para agrupar.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
          /* Tabela detalhada */
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-surface">
                <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Venda</th>
                  <th className="px-4 py-3">Corretor</th>
                  <th className="px-4 py-3 text-right">Esperado</th>
                  <th className="px-4 py-3 text-right">Recebido</th>
                  <th className="px-4 py-3 text-right">Diferença</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Risco</th>
                  <th className="px-4 py-3">Operacional</th>
                  <th className="px-4 py-3">Responsável</th>
                  <th className="px-4 py-3">SLA</th>
                  <th className="px-4 py-3">Previsão</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {concFiltradas.map((c) => {
                  const dif = c.esperado - c.recebido;
                  const risco = classificarRiscoConc(c);
                  const alertas = alertasConc(c);
                  const sla = calcularSLA(c);
                  const bloqueada = c.status === "Confirmada";
                  return (
                    <tr key={c.id} className={cn("cursor-pointer hover:bg-surface/40", (c.status === "Divergente" || c.status === "Parcial") && "bg-red-50/40")} onClick={() => setConcDetalhe(c)}>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          {alertas.map((a, i) => (
                            <TooltipProvider key={i}><Tooltip><TooltipTrigger asChild><span className="cursor-help">{a.icon}</span></TooltipTrigger><TooltipContent><p className="text-xs">{a.msg}</p></TooltipContent></Tooltip></TooltipProvider>
                          ))}
                          {bloqueada && (
                            <TooltipProvider><Tooltip><TooltipTrigger asChild><span className="cursor-help"><Lock className="h-3 w-3 text-emerald-600" /></span></TooltipTrigger><TooltipContent><p className="text-xs">Conciliação confirmada — bloqueada</p></TooltipContent></Tooltip></TooltipProvider>
                          )}
                          {c.id}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{c.venda}</td>
                      <td className="px-4 py-3">{c.corretor}</td>
                      <td className="px-4 py-3 text-right num">{formatBRL(c.esperado)}</td>
                      <td className="px-4 py-3 text-right num">{formatBRL(c.recebido)}</td>
                      <td className={cn("px-4 py-3 text-right num font-medium", dif > 0 && "text-amber-700", dif < 0 && "text-blue-700")}>
                        {dif === 0 ? "—" : formatBRL(Math.abs(dif))}
                      </td>
                      <td className="px-4 py-3"><ConcStatusBadge status={c.status} /></td>
                      <td className="px-4 py-3">
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <span className={cn("inline-flex h-2 w-2 rounded-full",
                              risco === "baixo" && "bg-emerald-500",
                              risco === "medio" && "bg-amber-500",
                              risco === "alto" && "bg-red-500",
                            )} />
                          </HoverCardTrigger>
                          <HoverCardContent className="w-72 text-xs">
                            <div className="font-semibold mb-1.5 capitalize">Risco {risco}</div>
                            <ul className="space-y-1 text-muted-foreground">
                              <li>Dias desde fatura: <span className="text-foreground">{c.diasDesdeFatura}</span></li>
                              <li>Divergência: <span className="text-foreground">{c.esperado === 0 ? "0%" : `${(((c.esperado - c.recebido) / c.esperado) * 100).toFixed(1)}%`}</span></li>
                              <li>Histórico do corretor: <span className="text-foreground">{corretorRisco[c.corretor]?.nivel ?? "n/d"} · {corretorRisco[c.corretor]?.pctAtraso ?? 0}% atraso</span></li>
                            </ul>
                          </HoverCardContent>
                        </HoverCard>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {c.statusOperacional !== "—" ? (
                          <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-muted-foreground">{c.statusOperacional}</span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs" onClick={(e) => e.stopPropagation()}>
                        <ResponsavelChip
                          c={c}
                          onAtribuir={(r) => atualizarConciliacao(c.id, { responsavel: r }, { data: agora(), autor: "Superadmin", acao: c.responsavel ? `Responsável reatribuído para ${r.nome}` : `Responsável atribuído: ${r.nome}` })}
                        />
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {bloqueada ? <span className="text-muted-foreground">—</span> : (
                          <span className={cn("rounded-full px-2 py-0.5 text-[11px]", sla.atrasado ? "bg-red-50 text-red-700" : "bg-surface text-muted-foreground")}>
                            {sla.atrasado ? `Atrasado +${Math.abs(sla.restanteDias)}d` : `Resolver em ${sla.restanteDias}d`}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs" onClick={(e) => e.stopPropagation()}>
                        <PrevisaoChip
                          c={c}
                          onSet={(d) => atualizarConciliacao(c.id, { previsaoPagamento: d }, { data: agora(), autor: "Superadmin", acao: `Previsão de pagamento definida: ${d}`, valorAnterior: undefined, valorNovo: undefined })}
                        />
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            {bloqueada ? (
                              <>
                                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">Conciliação confirmada</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => setConcDetalhe(c)}>
                                  <Eye className="mr-2 h-4 w-4" /> Ver detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setConcReabrir(c); setConcReabrirJustificativa(""); }}>
                                  <RotateCcw className="mr-2 h-4 w-4 text-amber-600" /> Reabrir conciliação
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <>
                                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">Ação direta</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => { atualizarConciliacao(c.id, { recebido: c.esperado, pagoEm: hojeStr() }, { data: agora(), autor: "Superadmin", acao: "Pagamento confirmado", valorAnterior: c.recebido, valorNovo: c.esperado }); toast.success(`Pagamento de ${c.id} confirmado`); }}>
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" /> Confirmar pagamento
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setConcDetalhe(c)}>
                                  <Pencil className="mr-2 h-4 w-4" /> Ajustar valor recebido
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { atualizarConciliacao(c.id, {}, { data: agora(), autor: "Superadmin", acao: "Marcado como divergente manualmente" }); toast.warning(`${c.id} marcado para revisão`); }}>
                                  <AlertTriangle className="mr-2 h-4 w-4 text-amber-600" /> Marcar como divergente
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setConcDetalhe(c)}>
                                  <Phone className="mr-2 h-4 w-4" /> Registrar contato
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setConcDetalhe(c)}>
                                  <FileSearch className="mr-2 h-4 w-4" /> Ver cobrança completa
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toast.info(`Contrato da parceria ${c.venda}`, { description: "Documento abriria em nova aba (mock)." })}>
                                  <FileSignature className="mr-2 h-4 w-4" /> Ver contrato da parceria
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
                {concFiltradas.length === 0 && (
                  <tr><td colSpan={13} className="px-4 py-12 text-center text-sm text-muted-foreground">Nenhuma conciliação para os filtros aplicados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          )}

          {/* Modal de reabertura */}
          <AlertDialog open={!!concReabrir} onOpenChange={(o) => { if (!o) setConcReabrir(null); }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reabrir conciliação {concReabrir?.id}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação reabre a conciliação para edição. A justificativa será registrada no log de auditoria.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Textarea
                value={concReabrirJustificativa}
                onChange={(e) => setConcReabrirJustificativa(e.target.value)}
                placeholder="Justificativa obrigatória (mín. 10 caracteres)…"
                className="min-h-[80px] text-sm"
              />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (concReabrirJustificativa.trim().length < 10) { toast.error("Justificativa obrigatória (mín. 10 caracteres)"); return; }
                    if (concReabrir) reabrirConciliacao(concReabrir, concReabrirJustificativa.trim());
                    setConcReabrir(null); setConcReabrirJustificativa("");
                  }}
                >
                  Confirmar reabertura
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      <CobrancaDetalheModal cobranca={cobrancaDetalhe} onClose={() => setCobrancaDetalhe(null)} />
      <ConciliacaoDetalheModal
        conciliacao={concDetalhe}
        onClose={() => setConcDetalhe(null)}
        onUpdate={atualizarConciliacao}
        onInteracao={adicionarInteracao}
      />

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

// ============== Conciliação V2 — helpers, badges, modal, export ==============

function hojeStr() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function agora() {
  const d = new Date();
  return `${hojeStr()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function classificarRiscoConc(c: Conciliacao): "baixo" | "medio" | "alto" {
  const dif = c.esperado - c.recebido;
  const pctDif = c.esperado > 0 ? Math.abs(dif) / c.esperado : 0;
  const histRisco = corretorRisco[c.corretor]?.nivel ?? "baixo";
  let score = 0;
  if (c.diasDesdeFatura > 20) score += 2;
  else if (c.diasDesdeFatura > 10) score += 1;
  if (pctDif >= 0.3) score += 2;
  else if (pctDif >= 0.1) score += 1;
  if (histRisco === "alto") score += 2;
  else if (histRisco === "medio") score += 1;
  if (score >= 4) return "alto";
  if (score >= 2) return "medio";
  return "baixo";
}

function alertasConc(c: Conciliacao): { icon: React.ReactNode; msg: string }[] {
  const out: { icon: React.ReactNode; msg: string }[] = [];
  const dif = c.esperado - c.recebido;
  if (c.recebido > 0 && c.esperado > 0 && c.recebido / c.esperado < 0.7) {
    out.push({ icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />, msg: "Valor muito abaixo do esperado (<70%)" });
  }
  if (Math.abs(dif) >= 10_000) {
    out.push({ icon: <AlertCircle className="h-3.5 w-3.5 text-red-600" />, msg: "Alto impacto financeiro (Δ ≥ R$ 10.000)" });
  }
  if (c.recebido === 0 && c.diasDesdeFatura > 15) {
    out.push({ icon: <Clock className="h-3.5 w-3.5 text-red-600" />, msg: "Atraso crítico (> 15 dias sem pagamento)" });
  }
  return out;
}

function ConcStatusBadge({ status }: { status: StatusConciliacao }) {
  const map: Record<StatusConciliacao, string> = {
    Confirmada: "bg-emerald-50 text-emerald-700",
    Parcial: "bg-amber-50 text-amber-800",
    Divergente: "bg-red-50 text-red-700",
    Pendente: "bg-amber-50 text-amber-700",
  };
  return <span className={cn("rounded-full px-2 py-0.5 text-xs", map[status])}>{status}</span>;
}

function ExportarConciliacaoMenu({ conciliacoes }: { conciliacoes: Conciliacao[] }) {
  const exportar = (tipo: "divergencias" | "inadimplencia" | "corretor" | "auditoria") => {
    let rows: Record<string, string | number>[] = [];
    let nome = "conciliacao";
    if (tipo === "divergencias") {
      rows = conciliacoes.filter((c) => c.status === "Divergente" || c.status === "Parcial")
        .map((c) => ({ ID: c.id, Venda: c.venda, Corretor: c.corretor, Esperado: c.esperado, Recebido: c.recebido, Diferenca: c.esperado - c.recebido, Status: c.status }));
      nome = "relatorio-divergencias";
    } else if (tipo === "inadimplencia") {
      rows = conciliacoes.filter((c) => c.status === "Pendente" || (c.recebido === 0 && c.diasDesdeFatura > 15))
        .map((c) => ({ ID: c.id, Corretor: c.corretor, Esperado: c.esperado, DiasDesdeFatura: c.diasDesdeFatura, StatusOperacional: c.statusOperacional }));
      nome = "relatorio-inadimplencia-conciliacao";
    } else if (tipo === "corretor") {
      const grupos: Record<string, { qtd: number; esperado: number; recebido: number; diferenca: number }> = {};
      conciliacoes.forEach((c) => {
        const g = (grupos[c.corretor] ||= { qtd: 0, esperado: 0, recebido: 0, diferenca: 0 });
        g.qtd += 1; g.esperado += c.esperado; g.recebido += c.recebido; g.diferenca += c.esperado - c.recebido;
      });
      rows = Object.entries(grupos).map(([k, v]) => ({ Corretor: k, Casos: v.qtd, Esperado: v.esperado, Recebido: v.recebido, Diferenca: v.diferenca }));
      nome = "relatorio-corretor-conciliacao";
    } else {
      conciliacoes.forEach((c) => {
        c.auditoria.forEach((a) => rows.push({ ID: c.id, Corretor: c.corretor, Data: a.data, Autor: a.autor, Acao: a.acao, ValorAnterior: a.valorAnterior ?? "", ValorNovo: a.valorNovo ?? "" }));
      });
      nome = "auditoria-conciliacao";
    }
    baixarCSV(nome, rows);
    toast.success("Relatório exportado", { description: `${rows.length} linha(s) · ${nome}.csv` });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" /> Exportar</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">Relatórios de conciliação</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => exportar("divergencias")}><FileText className="mr-2 h-4 w-4" /> Divergências</DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportar("inadimplencia")}><FileText className="mr-2 h-4 w-4" /> Inadimplência</DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportar("corretor")}><FileText className="mr-2 h-4 w-4" /> Por corretor</DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportar("auditoria")}><FileText className="mr-2 h-4 w-4" /> Auditoria completa</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ConciliacaoDetalheModal({
  conciliacao, onClose, onUpdate, onInteracao,
}: {
  conciliacao: Conciliacao | null;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<Conciliacao>, audit?: ConciliacaoAuditoria) => void;
  onInteracao: (id: string, i: ConciliacaoInteracao) => void;
}) {
  const [ajustarOpen, setAjustarOpen] = useState(false);
  const [confirmarOpen, setConfirmarOpen] = useState(false);
  const [novoValor, setNovoValor] = useState("");
  const [intTipo, setIntTipo] = useState<ConciliacaoInteracao["tipo"]>("Ligação");
  const [intObs, setIntObs] = useState("");
  const [opSel, setOpSel] = useState<StatusOperacionalCobranca>("—");

  if (!conciliacao) return null;
  const c = conciliacao;
  const dif = c.esperado - c.recebido;
  const bloqueada = c.status === "Confirmada";
  const sla = calcularSLA(c);

  const handleConfirmarPagamento = () => {
    onUpdate(c.id, { recebido: c.esperado, pagoEm: hojeStr() }, {
      data: agora(), autor: "Superadmin", acao: "Pagamento confirmado",
      valorAnterior: c.recebido, valorNovo: c.esperado,
    });
    setConfirmarOpen(false);
    toast.success("Pagamento confirmado", { description: `${c.id} · ${formatBRL(c.esperado)}` });
  };

  const handleAjustar = () => {
    const v = parseFloat(novoValor.replace(",", "."));
    if (Number.isNaN(v) || v < 0) { toast.error("Valor inválido"); return; }
    onUpdate(c.id, { recebido: v }, {
      data: agora(), autor: "Superadmin", acao: "Valor recebido ajustado",
      valorAnterior: c.recebido, valorNovo: v,
    });
    setAjustarOpen(false); setNovoValor("");
    toast.success("Valor ajustado", { description: `${c.id} · ${formatBRL(v)}` });
  };

  const handleRegistrarDivergencia = () => {
    onUpdate(c.id, {}, { data: agora(), autor: "Superadmin", acao: "Divergência registrada manualmente" });
    toast.warning(`${c.id} marcado como divergente`);
  };

  const handleRegistrarCobranca = () => {
    onUpdate(c.id, {}, { data: agora(), autor: "Superadmin", acao: "Cobrança realizada registrada" });
    toast.success("Tentativa de cobrança registrada");
  };

  const handleInteracao = () => {
    if (!intObs.trim()) { toast.error("Descreva a interação"); return; }
    onInteracao(c.id, { tipo: intTipo, obs: intObs.trim(), data: agora(), autor: "Superadmin" });
    setIntObs("");
    toast.success("Interação registrada");
  };

  return (
    <>
      <Dialog open={!!conciliacao} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              <ShieldCheck className="h-5 w-5" /> Conciliação {c.id}
              <ConcStatusBadge status={c.status} />
            </DialogTitle>
            <DialogDescription>{c.corretor} · {c.tipo} · {c.venda}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Section title="1 · Resumo da venda">
              <div className="grid gap-2 text-sm sm:grid-cols-3">
                <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Imóvel</div><div>{c.imovel}</div></div>
                <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">VGV</div><div className="num">{formatBRL(c.vgv)}</div></div>
                <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Tipo</div><div>{c.tipo}</div></div>
              </div>
            </Section>

            <Section title="2 · Comissão detalhada">
              <div className="mb-3 grid gap-2 text-sm sm:grid-cols-3">
                <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">% total</div><div className="num">{c.comissaoPct.toFixed(2)}%</div></div>
                <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Comissão total</div><div className="num">{formatBRL(c.comissaoTotal)}</div></div>
                <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Fee Ubroker</div><div className="num">{formatBRL(c.esperado)}</div></div>
              </div>
              <div className="space-y-1.5">
                {c.splits.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span>{s.nome} <span className="text-muted-foreground">· {s.tipo}</span></span>
                    <span className="num">{formatBRL(s.valor)}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="3 · Conciliação">
              <div className="grid gap-2 text-sm sm:grid-cols-4">
                <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Esperado</div><div className="num">{formatBRL(c.esperado)}</div></div>
                <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Recebido</div><div className="num">{formatBRL(c.recebido)}</div></div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Diferença</div>
                  <div className={cn("num font-medium", dif > 0 && "text-amber-700", dif < 0 && "text-blue-700")}>{dif === 0 ? "—" : formatBRL(Math.abs(dif))}</div>
                </div>
                <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Status</div><div><ConcStatusBadge status={c.status} /></div></div>
              </div>
              {alertasConc(c).length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {alertasConc(c).map((a, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs text-amber-800">{a.icon} {a.msg}</div>
                  ))}
                </div>
              )}
            </Section>

            <Section title="4 · Ações diretas">
              {bloqueada && (
                <div className="mb-3 flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                  <Lock className="h-3.5 w-3.5" /> Conciliação confirmada — edição bloqueada. Use "Reabrir conciliação" no menu da linha para alterar valores.
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className="gap-2" disabled={bloqueada} onClick={() => setConfirmarOpen(true)}><CheckCircle2 className="h-4 w-4" /> Confirmar pagamento</Button>
                <Button size="sm" variant="outline" className="gap-2" disabled={bloqueada} onClick={() => { setNovoValor(String(c.recebido)); setAjustarOpen(true); }}><Pencil className="h-4 w-4" /> Ajustar valor</Button>
                <Button size="sm" variant="outline" className="gap-2" disabled={bloqueada} onClick={handleRegistrarDivergencia}><AlertTriangle className="h-4 w-4 text-amber-600" /> Registrar divergência</Button>
                <Button size="sm" variant="outline" className="gap-2" disabled={bloqueada} onClick={handleRegistrarCobranca}><Phone className="h-4 w-4" /> Registrar cobrança realizada</Button>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Status operacional:</span>
                <Select value={opSel === "—" ? c.statusOperacional : opSel} onValueChange={(v) => { const s = v as StatusOperacionalCobranca; setOpSel(s); onUpdate(c.id, { statusOperacional: s }, { data: agora(), autor: "Superadmin", acao: `Status operacional → ${s}` }); }} disabled={bloqueada}>
                  <SelectTrigger className="h-7 w-[200px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["—", "Em cobrança", "Em negociação", "Promessa de pagamento", "Sem retorno"] as const).map((s) => (
                      <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </Section>

            <Section title="5 · Histórico / Auditoria">
              <ol className="space-y-2.5">
                {c.auditoria.map((a, i) => (
                  <li key={i} className="flex items-start gap-3 text-xs">
                    <span className="mt-0.5 grid h-6 w-6 place-items-center rounded-full border border-border bg-card text-muted-foreground"><Activity className="h-3 w-3" /></span>
                    <div className="flex-1">
                      <div className="font-medium">{a.acao}</div>
                      <div className="text-muted-foreground">{a.data} · {a.autor}{a.valorAnterior !== undefined && a.valorNovo !== undefined && ` · ${formatBRL(a.valorAnterior)} → ${formatBRL(a.valorNovo)}`}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </Section>

            <Section title="6 · Responsável & SLA">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Responsável</div>
                  <div className="mt-1.5"><ResponsavelChip c={c} onAtribuir={(r) => onUpdate(c.id, { responsavel: r }, { data: agora(), autor: "Superadmin", acao: c.responsavel ? `Responsável reatribuído para ${r.nome}` : `Responsável atribuído: ${r.nome}` })} /></div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">SLA ({c.slaDias}d)</div>
                  <div className="mt-1.5">
                    {bloqueada ? <span className="text-xs text-muted-foreground">Concluída</span> : (
                      <div className="space-y-1">
                        <div className={cn("text-xs font-medium", sla.atrasado ? "text-red-700" : "text-foreground")}>
                          {sla.atrasado ? `Atrasado +${Math.abs(sla.restanteDias)}d` : `Resolver em ${sla.restanteDias}d`}
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
                          <div className={cn("h-full", sla.atrasado ? "bg-red-500" : "bg-emerald-500")} style={{ width: `${sla.atrasado ? 100 : Math.max(10, ((c.slaDias - Math.max(sla.restanteDias, 0)) / c.slaDias) * 100)}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Previsão de pagamento</div>
                  <div className="mt-1.5"><PrevisaoChip c={c} onSet={(d) => onUpdate(c.id, { previsaoPagamento: d }, { data: agora(), autor: "Superadmin", acao: `Previsão de pagamento definida: ${d}` })} /></div>
                </div>
              </div>
            </Section>

            <Section title="7 · Performance do corretor">
              <div className="grid gap-3 sm:grid-cols-4 text-sm">
                <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Pagamentos em atraso</div><div className={cn("num font-medium", c.historicoCorretor.pagamentosAtrasoPct > 25 ? "text-red-700" : c.historicoCorretor.pagamentosAtrasoPct > 10 ? "text-amber-700" : "text-emerald-700")}>{c.historicoCorretor.pagamentosAtrasoPct}%</div></div>
                <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Tempo médio</div><div className="num">{c.historicoCorretor.tempoMedioPagamentoDias}d</div></div>
                <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Total já pago ao hub</div><div className="num text-emerald-700">{formatBRL(c.historicoCorretor.totalPagoHub)}</div></div>
                <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Total em aberto</div><div className={cn("num", c.historicoCorretor.totalAberto > 0 ? "text-amber-700" : "text-muted-foreground")}>{formatBRL(c.historicoCorretor.totalAberto)}</div></div>
              </div>
            </Section>

            <Section title="8 · Contrato aplicado">
              <div className="grid gap-2 text-sm sm:grid-cols-3">
                <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Versão</div><div className="font-medium">{c.contrato.versao}</div></div>
                <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Vigência</div><div>{c.contrato.data}</div></div>
                <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Regras de comissão</div><div className="text-xs text-muted-foreground">{c.contrato.regras}</div></div>
              </div>
              <Button size="sm" variant="ghost" className="mt-2 h-7 gap-1 text-xs" onClick={() => toast.info(`Abrir contrato ${c.contrato.versao}`, { description: "Documento abriria em nova aba (mock)." })}>
                <FileSignature className="h-3.5 w-3.5" /> Ver contrato completo
              </Button>
            </Section>

            <Section title="9 · Comprovante de pagamento">
              <ComprovanteBlock c={c} bloqueada={bloqueada} onUpdate={onUpdate} />
            </Section>

            <Section title="CRM de cobrança · Interações">
              {c.interacoes.length > 0 ? (
                <ul className="mb-3 space-y-2">
                  {c.interacoes.map((it, i) => (
                    <li key={i} className="flex items-start gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs">
                      <span className="mt-0.5">
                        {iconForInteracao(it.tipo)}
                      </span>
                      <div className="flex-1">
                        <div className="font-medium">{it.tipo} <span className="text-muted-foreground font-normal">· {it.data} · {it.autor}</span></div>
                        <div className="text-muted-foreground">{it.obs}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mb-3 text-xs text-muted-foreground">Nenhuma interação registrada.</div>
              )}
              <div className="flex flex-wrap items-end gap-2">
                <div className="flex-1 min-w-[140px]">
                  <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Tipo</div>
                  <Select value={intTipo} onValueChange={(v) => setIntTipo(v as ConciliacaoInteracao["tipo"])}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ligação" className="text-xs">Ligação</SelectItem>
                      <SelectItem value="WhatsApp" className="text-xs">WhatsApp</SelectItem>
                      <SelectItem value="E-mail" className="text-xs">E-mail</SelectItem>
                      <SelectItem value="Mensagem" className="text-xs">Mensagem</SelectItem>
                      <SelectItem value="Negociação" className="text-xs">Negociação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-[2] min-w-[240px]">
                  <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Observação</div>
                  <Textarea className="min-h-[36px] text-xs" rows={1} value={intObs} onChange={(e) => setIntObs(e.target.value)} placeholder="Resumo da conversa, próximos passos…" />
                </div>
                <Button size="sm" onClick={handleInteracao}>Registrar</Button>
              </div>
            </Section>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmarOpen} onOpenChange={setConfirmarOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar pagamento integral?</AlertDialogTitle>
            <AlertDialogDescription>
              {c.id} · {c.corretor} — registrar recebimento de {formatBRL(c.esperado)}. Esta ação ficará registrada na auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmarPagamento}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={ajustarOpen} onOpenChange={setAjustarOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ajustar valor recebido</AlertDialogTitle>
            <AlertDialogDescription>
              {c.id} · {c.corretor}. Valor anterior: {formatBRL(c.recebido)}. Esperado: {formatBRL(c.esperado)}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input type="number" value={novoValor} onChange={(e) => setNovoValor(e.target.value)} placeholder="Novo valor recebido (R$)" />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleAjustar}>Salvar ajuste</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ResponsavelChip({ c, onAtribuir }: { c: Conciliacao; onAtribuir: (r: ResponsavelCobranca) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {c.responsavel ? (
          <button className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2 py-0.5 text-[11px] hover:bg-surface/70">
            <span className="grid h-4 w-4 place-items-center rounded-full bg-navy text-[8px] font-semibold text-white">{c.responsavel.nome.split(" ").map((p) => p[0]).slice(0, 2).join("")}</span>
            {c.responsavel.nome}
          </button>
        ) : (
          <button className="inline-flex items-center gap-1 rounded-full border border-dashed border-amber-400 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-800 hover:bg-amber-100">
            <UserPlus className="h-3 w-3" /> Atribuir
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-2 text-xs">
        <div className="mb-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">{c.responsavel ? "Reatribuir" : "Atribuir responsável"}</div>
        <div className="space-y-1">
          {RESPONSAVEIS_DISPONIVEIS.map((r) => (
            <button
              key={r.nome}
              onClick={() => { onAtribuir(r); toast.success(`Responsável: ${r.nome}`); }}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-surface",
                c.responsavel?.nome === r.nome && "bg-surface font-medium",
              )}
            >
              <span>{r.nome}</span>
              <span className="text-[10px] text-muted-foreground capitalize">{r.tipo}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function PrevisaoChip({ c, onSet }: { c: Conciliacao; onSet: (data: string) => void }) {
  const [valor, setValor] = useState(c.previsaoPagamento ?? "");
  return (
    <Popover>
      <PopoverTrigger asChild>
        {c.previsaoPagamento ? (
          <button className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700 hover:bg-blue-100">
            {c.previsaoPagamento}
          </button>
        ) : (
          <button className="text-[11px] text-muted-foreground hover:text-foreground">— definir</button>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-3">
        <div className="mb-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">Previsão de pagamento</div>
        <Input value={valor} onChange={(e) => setValor(e.target.value)} placeholder="DD/MM" className="h-8 text-xs" />
        <Button
          size="sm" className="mt-2 w-full"
          onClick={() => { if (!valor.trim()) { toast.error("Informe a data"); return; } onSet(valor.trim()); toast.success("Previsão registrada"); }}
        >Salvar</Button>
      </PopoverContent>
    </Popover>
  );
}


function iconForInteracao(tipo: ConciliacaoInteracao["tipo"]) {
  switch (tipo) {
    case "Ligação": return <Phone className="h-3.5 w-3.5" />;
    case "WhatsApp": return <Smartphone className="h-3.5 w-3.5 text-emerald-600" />;
    case "E-mail": return <Mail className="h-3.5 w-3.5 text-blue-600" />;
    case "Mensagem": return <MessageSquare className="h-3.5 w-3.5" />;
    case "Negociação": return <Handshake className="h-3.5 w-3.5" />;
  }
}

function ComprovanteBlock({
  c, bloqueada, onUpdate,
}: {
  c: Conciliacao;
  bloqueada: boolean;
  onUpdate: (id: string, patch: Partial<Conciliacao>, audit?: ConciliacaoAuditoria) => void;
}) {
  const [referencia, setReferencia] = useState(c.comprovante?.referencia ?? "");
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const tipo: ComprovantePagamento["tipo"] = f.type.includes("pdf") ? "PDF" : "Imagem";
    const comp: ComprovantePagamento = { nome: f.name, tipo, referencia: referencia || undefined, enviadoEm: agora() };
    onUpdate(c.id, { comprovante: comp }, { data: agora(), autor: "Superadmin", acao: `Comprovante anexado: ${f.name}` });
    toast.success("Comprovante anexado", { description: f.name });
  };
  const handleRemover = () => {
    onUpdate(c.id, { comprovante: undefined }, { data: agora(), autor: "Superadmin", acao: `Comprovante removido` });
    toast.warning("Comprovante removido");
  };
  return (
    <div className="space-y-3">
      {c.comprovante ? (
        <div className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
            <div>
              <div className="font-medium">{c.comprovante.nome}</div>
              <div className="text-muted-foreground">{c.comprovante.tipo} · {c.comprovante.referencia ?? "—"} · {c.comprovante.enviadoEm}</div>
            </div>
          </div>
          {!bloqueada && (
            <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600" onClick={handleRemover}>Remover</Button>
          )}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">Nenhum comprovante anexado.</div>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[180px]">
          <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Referência (PIX/TED/banco)</div>
          <Input value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Ex: PIX BB · E2E…" className="h-8 text-xs" disabled={bloqueada} />
        </div>
        <label className={cn("inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs", bloqueada ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-surface")}>
          <Upload className="h-3.5 w-3.5" />
          {c.comprovante ? "Substituir" : "Anexar"}
          <input type="file" accept=".pdf,image/*" className="hidden" onChange={handleFile} disabled={bloqueada} />
        </label>
      </div>
    </div>
  );
}
