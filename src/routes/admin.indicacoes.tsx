import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Download,
  Search,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import {
  referralTree,
  type ReferralNode,
  redeIndicacoes,
  redeIndicacoesPeriodoAnterior,
  redeAlertas,
  redeInsights,
  redeRepassesMock,
  type RedeIndicacaoItem,
} from "@/data/admin-mock";
import { formatBRL } from "@/data/mock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/admin/indicacoes")({
  component: IndicacoesAdmin,
});

function flatten(node: ReferralNode, level = 0): { node: ReferralNode; level: number }[] {
  const out: { node: ReferralNode; level: number }[] = [{ node, level }];
  for (const f of node.filhos ?? []) out.push(...flatten(f, level + 1));
  return out;
}

function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function pctBadge(pct: number) {
  const positive = pct > 0;
  const neutral = pct === 0;
  const cls = neutral
    ? "text-muted-foreground bg-muted"
    : positive
      ? "text-emerald-700 bg-emerald-50"
      : "text-red-700 bg-red-50";
  const Icon = neutral ? null : positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${cls}`}>
      {Icon && <Icon className="h-3 w-3" />}
      {pct > 0 ? "+" : ""}
      {pct}%
    </span>
  );
}

function statusBadge(s: RedeIndicacaoItem["status"]) {
  const map: Record<RedeIndicacaoItem["status"], string> = {
    Ativo: "bg-emerald-100 text-emerald-800",
    Teste: "bg-blue-100 text-blue-800",
    Inativo: "bg-red-100 text-red-800",
  };
  return <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${map[s]}`}>{s}</span>;
}

function nivelBadge(n: 1 | 2 | 3) {
  const map = {
    1: "bg-blue-100 text-blue-800",
    2: "bg-amber-100 text-amber-800",
    3: "bg-emerald-100 text-emerald-800",
  } as const;
  return <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${map[n]}`}>N{n}</span>;
}

function diff(curr: number, prev: number): number {
  if (prev === 0) return 0;
  return Math.round(((curr - prev) / prev) * 100);
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

  const prev = redeIndicacoesPeriodoAnterior;
  const dN1 = diff(mrrN1, prev.mrrN1);
  const dN2 = diff(mrrN2, prev.mrrN2);
  const dN3 = diff(mrrN3, prev.mrrN3);
  const dTotal = diff(totalIndicados, prev.totalIndicados);

  const pctContribN1 = mrrTotal ? Math.round((mrrN1 / mrrTotal) * 100) : 0;
  const pctContribN2 = mrrTotal ? Math.round((mrrN2 / mrrTotal) * 100) : 0;
  const pctContribN3 = 100 - pctContribN1 - pctContribN2;

  // Filtros tabela
  const [busca, setBusca] = useState("");
  const [periodo, setPeriodo] = useState("Tudo");
  const [filtroNivel, setFiltroNivel] = useState("Todos");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [filtroFaixa, setFiltroFaixa] = useState("Todos");
  const [pagina, setPagina] = useState(1);
  const [ordem, setOrdem] = useState<{ campo: "mrr" | "indicados" | "data"; dir: "asc" | "desc" }>({ campo: "mrr", dir: "desc" });

  // Detalhes
  const [detalhe, setDetalhe] = useState<RedeIndicacaoItem | null>(null);

  // Árvore
  const [expanded, setExpanded] = useState<Set<string>>(new Set([referralTree.nome]));
  const treeRef = useRef<HTMLDivElement>(null);

  function toggleNode(nome: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(nome)) next.delete(nome);
      else next.add(nome);
      return next;
    });
  }

  function expandAll() {
    setExpanded(new Set(flat.map((f) => f.node.nome)));
  }
  function collapseAll() {
    setExpanded(new Set([referralTree.nome]));
  }

  function expandPathTo(target: string) {
    // Encontra o caminho até o nó alvo e expande todos os ancestrais
    const path: string[] = [];
    function dfs(n: ReferralNode, trail: string[]): boolean {
      const t = [...trail, n.nome];
      if (n.nome === target) {
        path.push(...t);
        return true;
      }
      for (const f of n.filhos ?? []) {
        if (dfs(f, t)) return true;
      }
      return false;
    }
    dfs(referralTree, []);
    setExpanded((prev) => new Set([...prev, ...path]));
    setTimeout(() => treeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  // Aplica filtros
  const filtrados = useMemo(() => {
    let lista = redeIndicacoes;
    if (busca.trim()) {
      const q = busca.toLowerCase();
      lista = lista.filter((r) => r.nome.toLowerCase().includes(q) || r.indicador.toLowerCase().includes(q));
    }
    if (filtroNivel !== "Todos") {
      lista = lista.filter((r) => `N${r.nivel}` === filtroNivel);
    }
    if (filtroStatus !== "Todos") {
      lista = lista.filter((r) => r.status === filtroStatus);
    }
    if (filtroFaixa !== "Todos") {
      lista = lista.filter((r) => {
        if (filtroFaixa === "Até R$200") return r.mrr <= 200;
        if (filtroFaixa === "R$200–500") return r.mrr > 200 && r.mrr <= 500;
        if (filtroFaixa === "R$500+") return r.mrr > 500;
        return true;
      });
    }
    // Ordena
    const sorted = [...lista].sort((a, b) => {
      const dir = ordem.dir === "asc" ? 1 : -1;
      if (ordem.campo === "mrr") return (a.mrr - b.mrr) * dir;
      if (ordem.campo === "indicados") return (a.indicados - b.indicados) * dir;
      return a.dataEntrada.localeCompare(b.dataEntrada) * dir;
    });
    return sorted;
  }, [busca, filtroNivel, filtroStatus, filtroFaixa, ordem, periodo]);

  const PAGE_SIZE = 10;
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const paginados = filtrados.slice((paginaAtual - 1) * PAGE_SIZE, paginaAtual * PAGE_SIZE);

  function limparFiltros() {
    setBusca("");
    setPeriodo("Tudo");
    setFiltroNivel("Todos");
    setFiltroStatus("Todos");
    setFiltroFaixa("Todos");
    setPagina(1);
  }

  function toggleOrdem(campo: "mrr" | "indicados" | "data") {
    setOrdem((o) => (o.campo === campo ? { campo, dir: o.dir === "asc" ? "desc" : "asc" } : { campo, dir: "desc" }));
  }

  // Performance dinâmica
  const topReceita = useMemo(() => [...redeIndicacoes].sort((a, b) => b.mrr - a.mrr).slice(0, 5), []);
  const topCrescimento = useMemo(() => [...redeIndicacoes].filter((r) => r.crescimentoPct > 0).sort((a, b) => b.crescimentoPct - a.crescimentoPct).slice(0, 5), []);
  const inativos = useMemo(() => redeIndicacoes.filter((r) => r.status === "Inativo"), []);

  // Exportações
  function exportarRedeCompleta() {
    const rows: (string | number)[][] = [
      ["ID", "Nome", "Nível", "Indicador", "Indicados", "Status", "MRR", "Receita Acumulada", "Receita Paga", "Receita Pendente", "Data Entrada", "Crescimento %"],
      ...redeIndicacoes.map((r) => [r.id, r.nome, `N${r.nivel}`, r.indicador, r.indicados, r.status, r.mrr, r.receitaAcumulada, r.receitaPaga, r.receitaPendente, r.dataEntrada, r.crescimentoPct]),
    ];
    downloadCSV("rede-indicacoes-completa.csv", rows);
  }
  function exportarPorPeriodo() {
    const rows: (string | number)[][] = [
      ["Mês", "Indicados", "MRR"],
      ...redeInsights.evolucaoRede.map((e) => [e.mes, e.indicados, e.mrr]),
    ];
    downloadCSV("rede-receita-por-periodo.csv", rows);
  }
  function exportarPorNivel() {
    const rows: (string | number)[][] = [
      ["Nível", "Indicados", "MRR Total", "Receita Acumulada"],
      [1, redeIndicacoes.filter((r) => r.nivel === 1).length, redeIndicacoes.filter((r) => r.nivel === 1).reduce((a, b) => a + b.mrr, 0), redeIndicacoes.filter((r) => r.nivel === 1).reduce((a, b) => a + b.receitaAcumulada, 0)],
      [2, redeIndicacoes.filter((r) => r.nivel === 2).length, redeIndicacoes.filter((r) => r.nivel === 2).reduce((a, b) => a + b.mrr, 0), redeIndicacoes.filter((r) => r.nivel === 2).reduce((a, b) => a + b.receitaAcumulada, 0)],
      [3, redeIndicacoes.filter((r) => r.nivel === 3).length, redeIndicacoes.filter((r) => r.nivel === 3).reduce((a, b) => a + b.mrr, 0), redeIndicacoes.filter((r) => r.nivel === 3).reduce((a, b) => a + b.receitaAcumulada, 0)],
    ];
    downloadCSV("rede-receita-por-nivel.csv", rows);
  }
  function exportarRepasses() {
    const rows: (string | number)[][] = [
      ["Data", "Valor", "Status"],
      ...redeRepassesMock.map((r) => [r.data, r.valor, r.status]),
    ];
    downloadCSV("rede-historico-repasses.csv", rows);
  }
  function exportarCorretor(item: RedeIndicacaoItem) {
    const rows: (string | number)[][] = [
      ["Campo", "Valor"],
      ["Nome", item.nome],
      ["Nível", `N${item.nivel}`],
      ["Indicador", item.indicador],
      ["Indicados diretos", item.indicados],
      ["Status", item.status],
      ["MRR", item.mrr],
      ["Receita acumulada", item.receitaAcumulada],
      ["Receita paga", item.receitaPaga],
      ["Receita pendente", item.receitaPendente],
      ["Data de entrada", item.dataEntrada],
      ["Crescimento (%)", item.crescimentoPct],
    ];
    downloadCSV(`rede-corretor-${item.nome.replace(/\s+/g, "-")}.csv`, rows);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Indicações</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gestão escalável da rede trinível.</p>
      </div>

      {/* KPIs topo */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI label="Total de indicados" value={totalIndicados.toString()} icon={Users} delta={dTotal} />
        <KPI label="MRR Nível 1" value={formatBRL(mrrN1)} delta={dN1} />
        <KPI label="MRR Nível 2" value={formatBRL(mrrN2)} delta={dN2} />
        <KPI label="MRR Nível 3" value={formatBRL(mrrN3)} delta={dN3} highlight />
      </section>

      {/* Receita recorrente total + contribuição */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Receita recorrente total</div>
          <div className="num font-display text-2xl text-emerald-700">{formatBRL(mrrTotal)}/mês</div>
        </div>
        <div className="space-y-2">
          <ContribBar label="N1" pct={pctContribN1} valor={mrrN1} color="bg-blue-500" />
          <ContribBar label="N2" pct={pctContribN2} valor={mrrN2} color="bg-amber-500" />
          <ContribBar label="N3" pct={pctContribN3} valor={mrrN3} color="bg-emerald-500" />
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-6">
          <div className="md:col-span-2 relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
              placeholder="Buscar por nome ou indicador..."
              className="pl-8"
            />
          </div>
          <SelectMini value={periodo} onChange={setPeriodo} options={["Este mês", "Últimos 3 meses", "Últimos 6 meses", "Tudo"]} />
          <SelectMini value={filtroNivel} onChange={(v) => { setFiltroNivel(v); setPagina(1); }} options={["Todos", "N1", "N2", "N3"]} />
          <SelectMini value={filtroStatus} onChange={(v) => { setFiltroStatus(v); setPagina(1); }} options={["Todos", "Ativo", "Teste", "Inativo"]} />
          <div className="flex gap-2">
            <SelectMini value={filtroFaixa} onChange={(v) => { setFiltroFaixa(v); setPagina(1); }} options={["Todos", "Até R$200", "R$200–500", "R$500+"]} />
            <Button variant="ghost" size="icon" onClick={limparFiltros} title="Limpar filtros">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabela da rede */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <div className="font-display text-lg">Rede de indicações</div>
            <div className="text-xs text-muted-foreground">{filtrados.length} corretor(es) na rede</div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" /> Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Exportações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportarRedeCompleta}>Rede completa</DropdownMenuItem>
              <DropdownMenuItem onClick={exportarPorPeriodo}>Receita por período</DropdownMenuItem>
              <DropdownMenuItem onClick={exportarPorNivel}>Receita por nível</DropdownMenuItem>
              <DropdownMenuItem onClick={exportarRepasses}>Histórico de repasses</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] font-normal text-muted-foreground">
                Por corretor: clique no ícone na linha
              </DropdownMenuLabel>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Corretor</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Indicador</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleOrdem("indicados")}>Indicados</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleOrdem("mrr")}>MRR</TableHead>
                <TableHead>Acumulada</TableHead>
                <TableHead>Paga</TableHead>
                <TableHead>Pendente</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleOrdem("data")}>Entrada</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginados.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.nome}</TableCell>
                  <TableCell>{nivelBadge(r.nivel)}</TableCell>
                  <TableCell className="text-muted-foreground">{r.indicador}</TableCell>
                  <TableCell className="num">{r.indicados}</TableCell>
                  <TableCell>{statusBadge(r.status)}</TableCell>
                  <TableCell className="num text-emerald-700">{formatBRL(r.mrr)}</TableCell>
                  <TableCell className="num">{formatBRL(r.receitaAcumulada)}</TableCell>
                  <TableCell className="num text-emerald-700">{formatBRL(r.receitaPaga)}</TableCell>
                  <TableCell className="num text-amber-700">{formatBRL(r.receitaPendente)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.dataEntrada}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setDetalhe(r)}>Detalhes</Button>
                      <Button variant="ghost" size="sm" onClick={() => expandPathTo(r.nome)}>Árvore</Button>
                      <Button variant="ghost" size="icon" onClick={() => exportarCorretor(r)} title="Exportar">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {paginados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="py-8 text-center text-sm text-muted-foreground">
                    Nenhum resultado para os filtros aplicados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPaginas > 1 && (
          <div className="flex items-center justify-between border-t border-border p-3 text-xs text-muted-foreground">
            <div>
              Página {paginaAtual} de {totalPaginas}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={paginaAtual === 1} onClick={() => setPagina(paginaAtual - 1)}>Anterior</Button>
              <Button variant="outline" size="sm" disabled={paginaAtual === totalPaginas} onClick={() => setPagina(paginaAtual + 1)}>Próxima</Button>
            </div>
          </div>
        )}
      </div>

      {/* Árvore — colapsável */}
      <div ref={treeRef} className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Árvore de indicação · {referralTree.nome}</div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={expandAll}>Expandir tudo</Button>
            <Button variant="ghost" size="sm" onClick={collapseAll}>Recolher tudo</Button>
          </div>
        </div>
        <TreeNode node={referralTree} level={0} expanded={expanded} onToggle={toggleNode} />
      </div>

      {/* Alertas da rede */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Alertas da rede</div>
        <ul className="divide-y divide-border">
          {redeAlertas.map((a) => {
            const Icon = a.severidade === "critico" ? AlertCircle : AlertTriangle;
            const cor = a.severidade === "critico" ? "text-red-600" : "text-amber-600";
            return (
              <li key={a.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <Icon className={`mt-0.5 h-4 w-4 ${cor}`} />
                  <div>
                    <div className="text-sm font-medium">{a.titulo}</div>
                    <div className="text-xs text-muted-foreground">{a.descricao}</div>
                  </div>
                </div>
                {a.corretor && (
                  <Button variant="ghost" size="sm" onClick={() => expandPathTo(a.corretor!)}>Ver corretor</Button>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Performance da rede */}
      <section className="grid gap-4 lg:grid-cols-3">
        <PerfCard title="Top por receita" icon={TrendingUp}>
          <ul className="divide-y divide-border">
            {topReceita.map((t, i) => (
              <li key={t.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-warm/15 text-[11px] font-semibold text-warm">{i + 1}</span>
                  <div>
                    <div className="text-sm font-medium">{t.nome}</div>
                    <div className="text-[11px] text-muted-foreground">{t.indicados} indicados · N{t.nivel}</div>
                  </div>
                </div>
                <div className="num text-sm text-emerald-700">{formatBRL(t.mrr)}</div>
              </li>
            ))}
          </ul>
        </PerfCard>
        <PerfCard title="Top por crescimento" icon={ArrowUpRight}>
          <ul className="divide-y divide-border">
            {topCrescimento.map((t, i) => (
              <li key={t.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-100 text-[11px] font-semibold text-emerald-700">{i + 1}</span>
                  <div>
                    <div className="text-sm font-medium">{t.nome}</div>
                    <div className="text-[11px] text-muted-foreground">N{t.nivel} · {formatBRL(t.mrr)}/mês</div>
                  </div>
                </div>
                {pctBadge(t.crescimentoPct)}
              </li>
            ))}
          </ul>
        </PerfCard>
        <PerfCard title="Indicadores inativos" icon={AlertTriangle}>
          <ul className="divide-y divide-border">
            {inativos.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <div>
                  <div className="text-sm font-medium">{t.nome}</div>
                  <div className="text-[11px] text-muted-foreground">N{t.nivel} · sem receita há {Math.abs(t.crescimentoPct) * 2}d</div>
                </div>
                <Button variant="outline" size="sm">Notificar</Button>
              </li>
            ))}
            {inativos.length === 0 && (
              <li className="py-2.5 text-sm text-muted-foreground">Nenhum inativo no momento.</li>
            )}
          </ul>
        </PerfCard>
      </section>

      {/* Insights estratégicos */}
      <section className="grid gap-4 lg:grid-cols-2">
        <InsightCard title="Concentração de receita">
          <div className="num font-display text-3xl">{redeInsights.concentracaoTop}%</div>
          <p className="mt-1 text-xs text-muted-foreground">Top 3 indicadores geram {redeInsights.concentracaoTop}% da receita da rede.</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-warm" style={{ width: `${redeInsights.concentracaoTop}%` }} />
          </div>
        </InsightCard>

        <InsightCard title="Profundidade da rede">
          <div className="num font-display text-3xl">{redeInsights.profundidadeMedia}</div>
          <p className="mt-1 text-xs text-muted-foreground">Média de níveis por ramo</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-blue-50 p-2">
              <div className="text-[10px] uppercase text-blue-700">N1</div>
              <div className="num text-sm font-semibold text-blue-800">{n1.length}</div>
            </div>
            <div className="rounded-md bg-amber-50 p-2">
              <div className="text-[10px] uppercase text-amber-700">N2</div>
              <div className="num text-sm font-semibold text-amber-800">{n2.length}</div>
            </div>
            <div className="rounded-md bg-emerald-50 p-2">
              <div className="text-[10px] uppercase text-emerald-700">N3</div>
              <div className="num text-sm font-semibold text-emerald-800">{n3.length}</div>
            </div>
          </div>
        </InsightCard>

        <InsightCard title="Conversão por nível">
          <div className="space-y-3">
            {redeInsights.conversaoPorNivel.map((c) => (
              <div key={c.nivel}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-muted-foreground">Nível {c.nivel}</span>
                  <span className="num font-semibold">{c.pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full ${c.nivel === 1 ? "bg-blue-500" : c.nivel === 2 ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${c.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </InsightCard>

        <InsightCard title="Evolução da rede (MRR)">
          <EvolucaoChart data={redeInsights.evolucaoRede} />
        </InsightCard>
      </section>

      {/* Dialog detalhes */}
      <Dialog open={!!detalhe} onOpenChange={(v) => !v && setDetalhe(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detalhe?.nome}</DialogTitle>
            <DialogDescription>
              {detalhe && `Nível N${detalhe.nivel} · indicado por ${detalhe.indicador} · ${detalhe.indicados} indicados diretos`}
            </DialogDescription>
          </DialogHeader>
          {detalhe && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <MiniStat label="Gerada" value={formatBRL(detalhe.receitaAcumulada)} tone="default" />
                <MiniStat label="Paga" value={formatBRL(detalhe.receitaPaga)} tone="ok" />
                <MiniStat label="Pendente" value={formatBRL(detalhe.receitaPendente)} tone="warn" />
              </div>
              <div>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Últimos repasses</div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {redeRepassesMock.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.data}</TableCell>
                        <TableCell className="num">{formatBRL(r.valor)}</TableCell>
                        <TableCell><Badge variant="secondary">{r.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ====== Sub-componentes ======

function KPI({ label, value, icon: Icon, highlight, delta }: { label: string; value: string; icon?: React.ComponentType<{ className?: string }>; highlight?: boolean; delta?: number }) {
  return (
    <div className={`rounded-xl border border-border p-4 ${highlight ? "bg-warm/5" : "bg-card"}`}>
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className="mt-2 num font-display text-2xl">{value}</div>
      {delta !== undefined && (
        <div className="mt-1.5">{pctBadge(delta)} <span className="text-[10px] text-muted-foreground">vs mês anterior</span></div>
      )}
    </div>
  );
}

function ContribBar({ label, pct, valor, color }: { label: string; pct: number; valor: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 text-xs font-semibold text-muted-foreground">{label}</div>
      <div className="flex-1 h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="w-12 text-right text-xs num font-semibold">{pct}%</div>
      <div className="w-24 text-right text-xs num text-muted-foreground">{formatBRL(valor)}</div>
    </div>
  );
}

function SelectMini({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

function TreeNode({ node, level, expanded, onToggle }: { node: ReferralNode; level: number; expanded: Set<string>; onToggle: (n: string) => void }) {
  const hasChildren = (node.filhos?.length ?? 0) > 0;
  const isOpen = expanded.has(node.nome);
  return (
    <div>
      <div className="flex items-center gap-3 rounded-md py-2" style={{ paddingLeft: `${level * 28}px` }}>
        {hasChildren ? (
          <button onClick={() => onToggle(node.nome)} className="text-muted-foreground hover:text-foreground">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <span className="inline-block w-4" />
        )}
        <div
          className={`grid h-8 w-8 place-items-center rounded-full text-xs font-semibold ${
            level === 0 ? "bg-navy text-white" : level === 1 ? "bg-blue-100 text-blue-800" : level === 2 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
          }`}
        >
          N{level}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium">{node.nome}</div>
          <div className="text-xs text-muted-foreground">Nível {level}{node.filhos ? ` · indicou ${node.filhos.length}` : ""}</div>
        </div>
        <div className="num text-sm text-emerald-700">{formatBRL(node.mrr)}/mês</div>
      </div>
      {hasChildren && isOpen && (
        <div>
          {node.filhos!.map((f, i) => (
            <TreeNode key={i} node={f} level={level + 1} expanded={expanded} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  );
}

function PerfCard({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {title}
      </div>
      {children}
    </div>
  );
}

function InsightCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: "default" | "ok" | "warn" }) {
  const cls = tone === "ok" ? "text-emerald-700 bg-emerald-50" : tone === "warn" ? "text-amber-700 bg-amber-50" : "text-foreground bg-muted";
  return (
    <div className={`rounded-md p-3 ${cls}`}>
      <div className="text-[10px] uppercase tracking-widest opacity-70">{label}</div>
      <div className="num text-lg font-semibold">{value}</div>
    </div>
  );
}

function EvolucaoChart({ data }: { data: { mes: string; indicados: number; mrr: number }[] }) {
  const w = 320;
  const h = 100;
  const pad = 12;
  const max = Math.max(...data.map((d) => d.mrr));
  const min = Math.min(...data.map((d) => d.mrr));
  const points = data.map((d, i) => {
    const x = pad + (i * (w - pad * 2)) / (data.length - 1);
    const y = h - pad - ((d.mrr - min) / (max - min || 1)) * (h - pad * 2);
    return `${x},${y}`;
  });
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24">
        <polyline fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-600" points={points.join(" ")} />
        {points.map((p, i) => {
          const [x, y] = p.split(",");
          return <circle key={i} cx={x} cy={y} r="2.5" className="fill-emerald-600" />;
        })}
      </svg>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        {data.map((d) => (
          <div key={d.mes} className="text-center">
            <div>{d.mes}</div>
            <div className="num">{formatBRL(d.mrr)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
