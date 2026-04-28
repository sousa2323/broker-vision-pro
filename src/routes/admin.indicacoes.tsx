import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Crown,
  Download,
  Eye,
  GitBranch,
  Search,
  TrendingUp,
  UserCircle2,
  Users,
  X,
} from "lucide-react";
import {
  redeIndicacoes,
  redeIndicacoesPeriodoAnterior,
  redeRepassesMock,
  getIndicadosDiretos,
  getRedeRelativa,
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

const ROOT_ID = "RI-000";

// ============== Helpers ==============

function downloadCSV(filename: string, header: string[], rows: (string | number)[][], context?: string) {
  const lines: string[] = [];
  if (context) lines.push(`# ${context}`);
  lines.push(header.map(escapeCsv).join(","));
  for (const r of rows) lines.push(r.map(escapeCsv).join(","));
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
function escapeCsv(v: string | number) {
  return `"${String(v).replace(/"/g, '""')}"`;
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

function nivelBadge(n: number) {
  const palette =
    n === 1 ? "bg-blue-100 text-blue-800"
    : n === 2 ? "bg-amber-100 text-amber-800"
    : n === 3 ? "bg-emerald-100 text-emerald-800"
    : "bg-purple-100 text-purple-800";
  return <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${palette}`}>N{n}</span>;
}

function avatar(nome: string, size: "sm" | "md" | "lg" = "md") {
  const initials = nome.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const dim = size === "sm" ? "h-7 w-7 text-[10px]" : size === "lg" ? "h-12 w-12 text-sm" : "h-9 w-9 text-xs";
  return (
    <span className={`grid ${dim} flex-none place-items-center rounded-full bg-navy font-semibold text-white`}>
      {initials}
    </span>
  );
}

function diff(curr: number, prev: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

// ============== Componente principal ==============

function IndicacoesAdmin() {
  // ---- Contexto: usuário base ----
  const [baseId, setBaseId] = useState<string>(ROOT_ID);
  const baseUser = useMemo(() => redeIndicacoes.find((r) => r.id === baseId)!, [baseId]);

  // Rede relativa ao base (descendentes apenas, com nível RELATIVO)
  const redeRelativa = useMemo(() => getRedeRelativa(baseId), [baseId]);
  const itensRede = useMemo(() => Array.from(redeRelativa.values()), [redeRelativa]);

  // Pai do base (para subtítulo)
  const indicadorDireto = useMemo(
    () => (baseUser.indicadorId ? redeIndicacoes.find((r) => r.id === baseUser.indicadorId) : null),
    [baseUser],
  );

  // Reset filtros e árvore ao trocar de base
  const [busca, setBusca] = useState("");
  const [periodo, setPeriodo] = useState("Tudo");
  const [filtroNivel, setFiltroNivel] = useState("Todos");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [filtroFaixa, setFiltroFaixa] = useState("Todos");
  const [filtroProduto, setFiltroProduto] = useState("Todos");
  const [pagina, setPagina] = useState(1);
  const [ordem, setOrdem] = useState<{ campo: "mrr" | "indicados" | "data"; dir: "asc" | "desc" }>({ campo: "mrr", dir: "desc" });
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    setBusca("");
    setFiltroNivel("Todos");
    setFiltroStatus("Todos");
    setFiltroFaixa("Todos");
    setFiltroProduto("Todos");
    setPagina(1);
    setExpanded(new Set());
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [baseId]);

  // ---- KPIs RELATIVOS ----
  const totalIndicados = itensRede.length;
  const mrrPorNivel = useMemo(() => {
    const acc: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
    for (const e of itensRede) {
      const n = e.nivelRelativo;
      const slot = n >= 3 ? 3 : n; // N3+ agrupado
      acc[slot] = (acc[slot] ?? 0) + e.item.mrr;
    }
    return acc;
  }, [itensRede]);
  const mrrN1 = mrrPorNivel[1] ?? 0;
  const mrrN2 = mrrPorNivel[2] ?? 0;
  const mrrN3 = mrrPorNivel[3] ?? 0;
  const mrrTotal = mrrN1 + mrrN2 + mrrN3;

  // Variação vs período anterior (escala pelo share quando não-raiz)
  const prev = redeIndicacoesPeriodoAnterior;
  const isRoot = baseId === ROOT_ID;
  const scale = isRoot ? 1 : Math.max(0.1, totalIndicados / Math.max(1, prev.totalIndicados));
  const dN1 = diff(mrrN1, prev.mrrN1 * scale);
  const dN2 = diff(mrrN2, prev.mrrN2 * scale);
  const dN3 = diff(mrrN3, prev.mrrN3 * scale);
  const dTotal = diff(totalIndicados, prev.totalIndicados * scale);

  const pctN1 = mrrTotal ? Math.round((mrrN1 / mrrTotal) * 100) : 0;
  const pctN2 = mrrTotal ? Math.round((mrrN2 / mrrTotal) * 100) : 0;
  const pctN3 = mrrTotal ? 100 - pctN1 - pctN2 : 0;

  // ---- Filtros sobre tabela ----
  const filtrados = useMemo(() => {
    let lista = itensRede.map((e) => ({ ...e.item, _nivelRel: e.nivelRelativo }));
    if (busca.trim()) {
      const q = busca.toLowerCase();
      lista = lista.filter((r) => r.nome.toLowerCase().includes(q) || r.indicador.toLowerCase().includes(q));
    }
    if (filtroNivel !== "Todos") {
      const n = Number(filtroNivel.replace("N", ""));
      lista = lista.filter((r) => (r._nivelRel >= 3 ? 3 : r._nivelRel) === n);
    }
    if (filtroStatus !== "Todos") lista = lista.filter((r) => r.status === filtroStatus);
    if (filtroProduto !== "Todos") lista = lista.filter((r) => r.produto === filtroProduto);
    if (filtroFaixa !== "Todos") {
      lista = lista.filter((r) => {
        if (filtroFaixa === "Até R$200") return r.mrr <= 200;
        if (filtroFaixa === "R$200–500") return r.mrr > 200 && r.mrr <= 500;
        if (filtroFaixa === "R$500+") return r.mrr > 500;
        return true;
      });
    }
    return [...lista].sort((a, b) => {
      const dir = ordem.dir === "asc" ? 1 : -1;
      if (ordem.campo === "mrr") return (a.mrr - b.mrr) * dir;
      if (ordem.campo === "indicados") return (a.indicados - b.indicados) * dir;
      return a.dataEntrada.localeCompare(b.dataEntrada) * dir;
    });
  }, [itensRede, busca, filtroNivel, filtroStatus, filtroFaixa, filtroProduto, ordem]);

  const PAGE_SIZE = 10;
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const paginados = filtrados.slice((paginaAtual - 1) * PAGE_SIZE, paginaAtual * PAGE_SIZE);

  function limparFiltros() {
    setBusca(""); setPeriodo("Tudo"); setFiltroNivel("Todos");
    setFiltroStatus("Todos"); setFiltroFaixa("Todos"); setFiltroProduto("Todos");
    setPagina(1);
  }
  function toggleOrdem(campo: "mrr" | "indicados" | "data") {
    setOrdem((o) => (o.campo === campo ? { campo, dir: o.dir === "asc" ? "desc" : "asc" } : { campo, dir: "desc" }));
  }

  // ---- Trocar usuário (dialog) ----
  const [trocaOpen, setTrocaOpen] = useState(false);
  const [trocaBusca, setTrocaBusca] = useState("");
  const candidatos = useMemo(() => {
    const q = trocaBusca.toLowerCase().trim();
    const lista = q ? redeIndicacoes.filter((r) => r.nome.toLowerCase().includes(q)) : redeIndicacoes;
    return lista.slice(0, 50);
  }, [trocaBusca]);

  // ---- Detalhes ----
  const [detalhe, setDetalhe] = useState<RedeIndicacaoItem | null>(null);
  const detalheSubrede = useMemo(() => (detalhe ? getRedeRelativa(detalhe.id) : null), [detalhe]);

  // ---- Insights / alertas dinâmicos ----
  const inativos = useMemo(() => itensRede.filter((e) => e.item.status === "Inativo"), [itensRede]);
  const topReceita = useMemo(
    () => [...itensRede].sort((a, b) => b.item.mrr - a.item.mrr).slice(0, 5),
    [itensRede],
  );
  const topCrescimento = useMemo(
    () => [...itensRede].filter((e) => e.item.crescimentoPct > 0).sort((a, b) => b.item.crescimentoPct - a.item.crescimentoPct).slice(0, 5),
    [itensRede],
  );
  const concentracaoTop3 = useMemo(() => {
    if (mrrTotal === 0) return 0;
    const top3 = topReceita.slice(0, 3).reduce((s, e) => s + e.item.mrr, 0);
    return Math.round((top3 / mrrTotal) * 100);
  }, [topReceita, mrrTotal]);

  const insights = useMemo(() => {
    const out: { tipo: "ok" | "warn" | "info"; texto: string }[] = [];
    if (dN1 <= -10) out.push({ tipo: "warn", texto: `Seu nível 1 caiu ${Math.abs(dN1)}% este mês.` });
    if (dN2 >= 15) out.push({ tipo: "ok", texto: `Nível 2 está crescendo acima da média (+${dN2}%).` });
    if (dN3 >= 15) out.push({ tipo: "ok", texto: `Nível 3 acelerou (+${dN3}%) — bom indicador de viralização.` });
    if (inativos.length > 0) out.push({ tipo: "warn", texto: `${inativos.length} usuário(s) inativo(s) impactando a receita.` });
    if (concentracaoTop3 >= 60) out.push({ tipo: "warn", texto: `Risco de concentração: top 3 = ${concentracaoTop3}% da receita.` });
    if (out.length === 0) out.push({ tipo: "info", texto: "Rede estável: sem variações relevantes no período." });
    return out;
  }, [dN1, dN2, dN3, inativos.length, concentracaoTop3]);

  const alertas = useMemo(() => {
    const out: { id: string; severidade: "atencao" | "critico"; titulo: string; descricao: string; corretorId?: string }[] = [];
    inativos.forEach((e) => {
      if (e.item.receitaAcumulada > 500) {
        out.push({
          id: `inat-${e.item.id}`,
          severidade: "critico",
          titulo: `${e.item.nome} parou de gerar receita`,
          descricao: `MRR caiu ${e.item.crescimentoPct}% · receita acumulada ${formatBRL(e.item.receitaAcumulada)}.`,
          corretorId: e.item.id,
        });
      }
    });
    itensRede
      .filter((e) => e.item.crescimentoPct < -15 && e.item.status !== "Inativo")
      .forEach((e) => out.push({
        id: `queda-${e.item.id}`,
        severidade: "atencao",
        titulo: `Queda de performance: ${e.item.nome}`,
        descricao: `Crescimento ${e.item.crescimentoPct}% no período.`,
        corretorId: e.item.id,
      }));
    if (concentracaoTop3 >= 60) {
      out.push({
        id: "conc",
        severidade: "atencao",
        titulo: "Concentração de receita elevada",
        descricao: `Top 3 indicadores = ${concentracaoTop3}% da receita da rede.`,
      });
    }
    return out.slice(0, 6);
  }, [inativos, itensRede, concentracaoTop3]);

  // ---- Árvore lazy ----
  function toggleNode(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ---- Exportações (respeitam contexto base + filtros) ----
  const ctxLine = `Usuário base: ${baseUser.nome} · Período: ${periodo} · Gerado em ${new Date().toLocaleString("pt-BR")}`;

  function exportarRedeFiltrada() {
    downloadCSV(
      `rede-${baseUser.nome.replace(/\s+/g, "-")}.csv`,
      ["ID", "Nome", "Nível Relativo", "Indicador direto", "Indicados", "Status", "Produto", "MRR", "Receita Acumulada", "Paga", "Pendente", "Data entrada", "Crescimento %"],
      filtrados.map((r) => [r.id, r.nome, `N${r._nivelRel >= 3 ? 3 : r._nivelRel}`, r.indicador, r.indicados, r.status, r.produto, r.mrr, r.receitaAcumulada, r.receitaPaga, r.receitaPendente, r.dataEntrada, r.crescimentoPct]),
      ctxLine,
    );
  }
  function exportarPorNivel() {
    const linhas = [1, 2, 3].map((n) => {
      const itens = itensRede.filter((e) => (e.nivelRelativo >= 3 ? 3 : e.nivelRelativo) === n);
      const mrr = itens.reduce((s, e) => s + e.item.mrr, 0);
      const acum = itens.reduce((s, e) => s + e.item.receitaAcumulada, 0);
      return [n, itens.length, mrr, acum];
    });
    downloadCSV(`rede-${baseUser.nome.replace(/\s+/g, "-")}-por-nivel.csv`, ["Nível", "Indicados", "MRR Total", "Receita Acumulada"], linhas, ctxLine);
  }
  function exportarFinanceiro() {
    downloadCSV(
      `rede-${baseUser.nome.replace(/\s+/g, "-")}-financeiro.csv`,
      ["Nome", "Nível Relativo", "MRR", "Acumulada", "Paga", "Pendente"],
      itensRede.map((e) => [e.item.nome, `N${e.nivelRelativo >= 3 ? 3 : e.nivelRelativo}`, e.item.mrr, e.item.receitaAcumulada, e.item.receitaPaga, e.item.receitaPendente]),
      ctxLine,
    );
  }
  function exportarRepasses() {
    downloadCSV("historico-repasses.csv", ["Data", "Valor", "Status"], redeRepassesMock.map((r) => [r.data, r.valor, r.status]), ctxLine);
  }
  function exportarCorretor(item: RedeIndicacaoItem) {
    const subrede = getRedeRelativa(item.id);
    downloadCSV(
      `corretor-${item.nome.replace(/\s+/g, "-")}.csv`,
      ["Campo", "Valor"],
      [
        ["Nome", item.nome], ["Indicador", item.indicador], ["Status", item.status],
        ["Produto", item.produto], ["Indicados diretos", item.indicados],
        ["Sub-rede total", subrede.size],
        ["MRR", item.mrr], ["Acumulada", item.receitaAcumulada],
        ["Paga", item.receitaPaga], ["Pendente", item.receitaPendente],
        ["Entrada", item.dataEntrada], ["Crescimento %", item.crescimentoPct],
      ],
      `Contexto: corretor ${item.nome} · Gerado em ${new Date().toLocaleString("pt-BR")}`,
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl">Indicações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Rede dinâmica navegável · níveis calculados a partir do usuário base.
        </p>
      </div>

      {/* Contexto: usuário base */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            {avatar(baseUser.nome, "lg")}
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Visualizando rede de
              </div>
              <div className="font-display text-xl">{baseUser.nome}</div>
              <div className="text-xs text-muted-foreground">
                {indicadorDireto
                  ? <>Indicador direto: <span className="font-medium text-foreground">{indicadorDireto.nome}</span> · Entrada {baseUser.dataEntrada}</>
                  : <>Raiz da rede · Entrada {baseUser.dataEntrada}</>}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {!isRoot && (
              <Button variant="outline" size="sm" onClick={() => setBaseId(ROOT_ID)}>
                <ArrowLeft className="h-4 w-4" /> Voltar para raiz
              </Button>
            )}
            <Button size="sm" onClick={() => { setTrocaBusca(""); setTrocaOpen(true); }}>
              <UserCircle2 className="h-4 w-4" /> Trocar usuário
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs RELATIVOS */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI label="Total de indicados" value={totalIndicados.toString()} icon={Users} delta={dTotal} />
        <KPI label="MRR Nível 1" value={formatBRL(mrrN1)} delta={dN1} share={pctN1} />
        <KPI label="MRR Nível 2" value={formatBRL(mrrN2)} delta={dN2} share={pctN2} />
        <KPI label="MRR Nível 3+" value={formatBRL(mrrN3)} delta={dN3} share={pctN3} highlight />
      </section>

      {/* Distribuição dinâmica de receita */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Distribuição de receita por nível
          </div>
          <div className="num font-display text-2xl text-emerald-700">{formatBRL(mrrTotal)}/mês</div>
        </div>
        <div className="space-y-2">
          <ContribBar label="N1" pct={pctN1} valor={mrrN1} color="bg-blue-500" />
          <ContribBar label="N2" pct={pctN2} valor={mrrN2} color="bg-amber-500" />
          <ContribBar label="N3+" pct={pctN3} valor={mrrN3} color="bg-emerald-500" />
        </div>
        {mrrTotal === 0 && (
          <div className="mt-3 text-xs text-muted-foreground">
            {baseUser.nome} ainda não possui rede de indicação ativa.
          </div>
        )}
      </div>

      {/* Filtros avançados */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-7">
          <div className="md:col-span-2 relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
              placeholder="Buscar nome ou indicador..."
              className="pl-8"
            />
          </div>
          <SelectMini value={periodo} onChange={setPeriodo} options={["7 dias", "30 dias", "90 dias", "Personalizado", "Tudo"]} />
          <SelectMini value={filtroNivel} onChange={(v) => { setFiltroNivel(v); setPagina(1); }} options={["Todos", "N1", "N2", "N3"]} />
          <SelectMini value={filtroStatus} onChange={(v) => { setFiltroStatus(v); setPagina(1); }} options={["Todos", "Ativo", "Teste", "Inativo"]} />
          <SelectMini value={filtroProduto} onChange={(v) => { setFiltroProduto(v); setPagina(1); }} options={["Todos", "IA", "Inbox", "Combo"]} />
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
            <div className="font-display text-lg">Rede de indicações de {baseUser.nome}</div>
            <div className="text-xs text-muted-foreground">{filtrados.length} corretor(es) · níveis relativos a {baseUser.nome}</div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" /> Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Contexto: {baseUser.nome}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportarRedeFiltrada}>CSV (dados filtrados)</DropdownMenuItem>
              <DropdownMenuItem onClick={exportarPorNivel}>Relatório por nível</DropdownMenuItem>
              <DropdownMenuItem onClick={exportarFinanceiro}>Financeiro de indicações</DropdownMenuItem>
              <DropdownMenuItem onClick={exportarRepasses}>Histórico de repasses</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Corretor</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Indicador direto</TableHead>
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
              {paginados.map((r) => {
                const nrel = r._nivelRel >= 3 ? 3 : r._nivelRel;
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {avatar(r.nome, "sm")}
                        <span className="font-medium">{r.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell>{nivelBadge(nrel)}</TableCell>
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
                        <Button variant="ghost" size="sm" onClick={() => setBaseId(r.id)} title="Ver rede deste corretor">
                          <GitBranch className="h-3.5 w-3.5" /> Ver rede
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDetalhe(r)} title="Ver detalhes">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => exportarCorretor(r)} title="Exportar individual">
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {paginados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="py-8 text-center text-sm text-muted-foreground">
                    {itensRede.length === 0
                      ? `${baseUser.nome} ainda não possui indicados.`
                      : "Nenhum resultado para os filtros aplicados."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPaginas > 1 && (
          <div className="flex items-center justify-between border-t border-border p-3 text-xs text-muted-foreground">
            <div>Página {paginaAtual} de {totalPaginas}</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={paginaAtual === 1} onClick={() => setPagina(paginaAtual - 1)}>Anterior</Button>
              <Button variant="outline" size="sm" disabled={paginaAtual === totalPaginas} onClick={() => setPagina(paginaAtual + 1)}>Próxima</Button>
            </div>
          </div>
        )}
      </div>

      {/* Árvore lazy — 1 nível por vez */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Grafo navegável · {baseUser.nome}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">Clique no chevron para carregar 1 nível de cada vez.</div>
          </div>
        </div>
        <LazyNode
          baseId={baseId}
          nodeId={baseId}
          nivelRelativo={0}
          expanded={expanded}
          onToggle={toggleNode}
          onSetBase={setBaseId}
        />
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Alertas da rede</div>
          <ul className="divide-y divide-border">
            {alertas.map((a) => {
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
                  {a.corretorId && (
                    <Button variant="ghost" size="sm" onClick={() => setBaseId(a.corretorId!)}>Ver corretor</Button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Performance */}
      <section className="grid gap-4 lg:grid-cols-3">
        <PerfCard title="Top por receita" icon={Crown}>
          <ul className="divide-y divide-border">
            {topReceita.map((e, i) => (
              <li key={e.item.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-warm/15 text-[11px] font-semibold text-warm">{i + 1}</span>
                  <div>
                    <div className="text-sm font-medium">{e.item.nome}</div>
                    <div className="text-[11px] text-muted-foreground">N{e.nivelRelativo >= 3 ? 3 : e.nivelRelativo} · {e.item.indicados} indicados</div>
                  </div>
                </div>
                <div className="num text-sm text-emerald-700">{formatBRL(e.item.mrr)}</div>
              </li>
            ))}
            {topReceita.length === 0 && <li className="py-2.5 text-sm text-muted-foreground">—</li>}
          </ul>
        </PerfCard>
        <PerfCard title="Top por crescimento" icon={TrendingUp}>
          <ul className="divide-y divide-border">
            {topCrescimento.map((e, i) => (
              <li key={e.item.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-100 text-[11px] font-semibold text-emerald-700">{i + 1}</span>
                  <div>
                    <div className="text-sm font-medium">{e.item.nome}</div>
                    <div className="text-[11px] text-muted-foreground">N{e.nivelRelativo >= 3 ? 3 : e.nivelRelativo} · {formatBRL(e.item.mrr)}/mês</div>
                  </div>
                </div>
                {pctBadge(e.item.crescimentoPct)}
              </li>
            ))}
            {topCrescimento.length === 0 && <li className="py-2.5 text-sm text-muted-foreground">—</li>}
          </ul>
        </PerfCard>
        <PerfCard title="Indicadores inativos" icon={AlertTriangle}>
          <ul className="divide-y divide-border">
            {inativos.map((e) => (
              <li key={e.item.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <div>
                  <div className="text-sm font-medium">{e.item.nome}</div>
                  <div className="text-[11px] text-muted-foreground">N{e.nivelRelativo >= 3 ? 3 : e.nivelRelativo} · queda {e.item.crescimentoPct}%</div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setBaseId(e.item.id)}>Ver rede</Button>
              </li>
            ))}
            {inativos.length === 0 && <li className="py-2.5 text-sm text-muted-foreground">Nenhum inativo na rede.</li>}
          </ul>
        </PerfCard>
      </section>

      {/* Insights automáticos */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Insights automáticos</div>
        <ul className="space-y-2">
          {insights.map((ins, i) => {
            const cor = ins.tipo === "warn" ? "border-amber-300 bg-amber-50 text-amber-900"
              : ins.tipo === "ok" ? "border-emerald-300 bg-emerald-50 text-emerald-900"
              : "border-border bg-muted text-foreground";
            return (
              <li key={i} className={`rounded-md border px-3 py-2 text-sm ${cor}`}>
                {ins.texto}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Dialog: trocar usuário */}
      <Dialog open={trocaOpen} onOpenChange={setTrocaOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Trocar usuário base</DialogTitle>
            <DialogDescription>Busque qualquer corretor para visualizar a rede a partir dele.</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input autoFocus value={trocaBusca} onChange={(e) => setTrocaBusca(e.target.value)} placeholder="Buscar corretor..." className="pl-8" />
          </div>
          <div className="max-h-80 overflow-y-auto">
            <ul className="divide-y divide-border">
              {candidatos.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => { setBaseId(c.id); setTrocaOpen(false); }}
                    className="flex w-full items-center gap-3 px-2 py-2 text-left hover:bg-muted/60"
                  >
                    {avatar(c.nome, "sm")}
                    <div className="flex-1">
                      <div className="text-sm font-medium">{c.nome}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {c.indicadorId ? `Indicado por ${c.indicador}` : "Raiz da rede"} · {c.indicados} indicados
                      </div>
                    </div>
                    {c.id === baseId && <Badge variant="secondary">Atual</Badge>}
                  </button>
                </li>
              ))}
              {candidatos.length === 0 && (
                <li className="py-6 text-center text-sm text-muted-foreground">Nenhum corretor encontrado.</li>
              )}
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: detalhes do corretor */}
      <Dialog open={!!detalhe} onOpenChange={(v) => !v && setDetalhe(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detalhe?.nome}</DialogTitle>
            <DialogDescription>
              {detalhe && (
                <>Indicado por {detalhe.indicador} · {detalhe.indicados} indicados diretos · sub-rede de {detalheSubrede?.size ?? 0}</>
              )}
            </DialogDescription>
          </DialogHeader>
          {detalhe && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <MiniStat label="Gerada" value={formatBRL(detalhe.receitaAcumulada)} tone="default" />
                <MiniStat label="Paga" value={formatBRL(detalhe.receitaPaga)} tone="ok" />
                <MiniStat label="Pendente" value={formatBRL(detalhe.receitaPendente)} tone="warn" />
              </div>
              {detalheSubrede && detalheSubrede.size > 0 && (
                <div>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Composição da sub-rede</div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[1, 2, 3].map((n) => {
                      const count = Array.from(detalheSubrede.values()).filter((e) => (e.nivelRelativo >= 3 ? 3 : e.nivelRelativo) === n).length;
                      return (
                        <div key={n} className={`rounded-md p-2 ${n === 1 ? "bg-blue-50" : n === 2 ? "bg-amber-50" : "bg-emerald-50"}`}>
                          <div className="text-[10px] uppercase opacity-70">N{n}</div>
                          <div className="num text-sm font-semibold">{count}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Últimos repasses</div>
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Data</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead></TableRow>
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
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => exportarCorretor(detalhe)}>
                  <Download className="h-4 w-4" /> Exportar
                </Button>
                <Button size="sm" onClick={() => { setBaseId(detalhe.id); setDetalhe(null); }}>
                  <GitBranch className="h-4 w-4" /> Ver rede deste corretor
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============== Sub-componentes ==============

function KPI({ label, value, icon: Icon, highlight, delta, share }: { label: string; value: string; icon?: React.ComponentType<{ className?: string }>; highlight?: boolean; delta?: number; share?: number }) {
  return (
    <div className={`rounded-xl border border-border p-4 ${highlight ? "bg-warm/5" : "bg-card"}`}>
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className="mt-2 num font-display text-2xl">{value}</div>
      <div className="mt-1.5 flex items-center gap-2">
        {delta !== undefined && <>{pctBadge(delta)}<span className="text-[10px] text-muted-foreground">vs mês ant.</span></>}
        {share !== undefined && <span className="ml-auto text-[10px] text-muted-foreground">{share}% do MRR</span>}
      </div>
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
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

/** Nó da árvore que carrega filhos sob demanda (lazy, 1 nível por clique). */
function LazyNode({
  baseId, nodeId, nivelRelativo, expanded, onToggle, onSetBase,
}: {
  baseId: string;
  nodeId: string;
  nivelRelativo: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onSetBase: (id: string) => void;
}) {
  const node = redeIndicacoes.find((r) => r.id === nodeId);
  if (!node) return null;
  const isOpen = expanded.has(nodeId);
  const isBase = nodeId === baseId;
  // só consulta filhos quando aberto (lazy)
  const filhos = isOpen ? getIndicadosDiretos(nodeId) : [];
  const totalFilhos = node.indicados;
  const hasChildren = totalFilhos > 0;

  return (
    <div>
      <div className="flex items-center gap-3 rounded-md py-2" style={{ paddingLeft: `${nivelRelativo * 28}px` }}>
        {hasChildren ? (
          <button onClick={() => onToggle(nodeId)} className="text-muted-foreground hover:text-foreground">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <span className="inline-block w-4" />
        )}
        <div
          className={`grid h-8 w-8 place-items-center rounded-full text-xs font-semibold ${
            isBase ? "bg-navy text-white"
              : nivelRelativo === 1 ? "bg-blue-100 text-blue-800"
              : nivelRelativo === 2 ? "bg-amber-100 text-amber-800"
              : "bg-emerald-100 text-emerald-800"
          }`}
        >
          {isBase ? "★" : `N${nivelRelativo}`}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium">{node.nome}{isBase && <span className="ml-2 text-[10px] uppercase text-muted-foreground">base</span>}</div>
          <div className="text-xs text-muted-foreground">
            {hasChildren ? `${totalFilhos} indicado(s) direto(s)` : "Sem indicados"}
            {!isOpen && hasChildren && " · clique para expandir"}
          </div>
        </div>
        <div className="num text-sm text-emerald-700">{formatBRL(node.mrr)}/mês</div>
        {!isBase && (
          <Button variant="ghost" size="sm" onClick={() => onSetBase(nodeId)} title="Tornar base">
            <GitBranch className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      {isOpen && filhos.map((f) => (
        <LazyNode
          key={f.id}
          baseId={baseId}
          nodeId={f.id}
          nivelRelativo={nivelRelativo + 1}
          expanded={expanded}
          onToggle={onToggle}
          onSetBase={onSetBase}
        />
      ))}
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

function MiniStat({ label, value, tone }: { label: string; value: string; tone: "default" | "ok" | "warn" }) {
  const cls = tone === "ok" ? "text-emerald-700 bg-emerald-50" : tone === "warn" ? "text-amber-700 bg-amber-50" : "text-foreground bg-muted";
  return (
    <div className={`rounded-md p-3 ${cls}`}>
      <div className="text-[10px] uppercase tracking-widest opacity-70">{label}</div>
      <div className="num text-lg font-semibold">{value}</div>
    </div>
  );
}
