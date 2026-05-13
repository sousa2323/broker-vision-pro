import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Search,
  Ban,
  ArrowUpRight,
  AlertTriangle,
  Brain,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  Bell,
  CalendarClock,
  Shuffle,
  Inbox,
  Sparkles,
  PauseCircle,
  Send,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { adminBrokers, corretorRisco, type AdminBroker } from "@/data/admin-mock";
import { formatBRL, formatBRLcompact } from "@/data/mock";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/usuarios")({
  component: UsuariosAdmin,
});

// ─── Helpers operacionais (puros, derivados do mock) ──────────────────────────

function seedFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}
function rng(id: string, salt: number, min: number, max: number): number {
  const s = seedFromId(id) ^ (salt * 2654435761);
  const x = Math.sin(s) * 10000;
  const f = x - Math.floor(x);
  return Math.floor(min + f * (max - min + 1));
}

function getRegiao(u: AdminBroker): string {
  return u.cidade.split("/")[1]?.trim() ?? u.cidade;
}

function getLeadsAtivos(u: AdminBroker): number {
  if (u.status === "Bloqueado") return 0;
  if (u.status === "Inativo") return rng(u.id, 1, 0, 4);
  return rng(u.id, 1, 8, 64);
}

function getExecucao(u: AdminBroker): number {
  if (u.status !== "Ativo") return rng(u.id, 2, 5, 35);
  const base = u.plano === "Pro" ? rng(u.id, 2, 55, 96) : rng(u.id, 2, 35, 80);
  return base;
}

function getConversao(u: AdminBroker): number {
  if (u.status !== "Ativo") return 0;
  const base = u.plano === "Pro" ? rng(u.id, 3, 12, 34) : rng(u.id, 3, 4, 18);
  return base;
}

function getNegligencia(u: AdminBroker): number {
  if (u.status !== "Ativo") return rng(u.id, 4, 0, 3);
  const exec = getExecucao(u);
  if (exec >= 80) return rng(u.id, 4, 0, 2);
  if (exec >= 50) return rng(u.id, 4, 2, 8);
  return rng(u.id, 4, 6, 18);
}

function getDiasSemLogin(u: AdminBroker): number {
  if (u.status === "Bloqueado") return rng(u.id, 5, 14, 60);
  if (u.status === "Inativo") return rng(u.id, 5, 8, 30);
  const exec = getExecucao(u);
  if (exec >= 70) return rng(u.id, 5, 0, 2);
  return rng(u.id, 5, 0, 9);
}

type Risco = "saudavel" | "atencao" | "critico";
function getRiscoOperacional(u: AdminBroker): Risco {
  if (u.status === "Bloqueado") return "critico";
  const exec = getExecucao(u);
  const neg = getNegligencia(u);
  const dias = getDiasSemLogin(u);
  let score = 0;
  if (exec < 50) score += 2;
  else if (exec < 75) score += 1;
  if (neg > 10) score += 2;
  else if (neg > 5) score += 1;
  if (dias > 7) score += 2;
  else if (dias > 3) score += 1;
  if (u.status === "Inativo") score += 2;
  if (score >= 4) return "critico";
  if (score >= 2) return "atencao";
  return "saudavel";
}

function getScoreIA(u: AdminBroker): number {
  const exec = getExecucao(u);
  const conv = getConversao(u);
  const neg = getNegligencia(u);
  const raw = exec * 0.5 + conv * 2 - neg * 1.2 + (u.plano === "Pro" ? 6 : 0);
  return Math.max(8, Math.min(99, Math.round(raw)));
}

// ─── Inteligência operacional (derivados) ─────────────────────────────────────

function getOrigemLeads(u: AdminBroker): { plataforma: number; propria: number } {
  const total = getLeadsAtivos(u);
  const pctPlataforma = 30 + rng(u.id, 71, 0, 40); // 30–70%
  const plataforma = Math.round((total * pctPlataforma) / 100);
  return { plataforma, propria: Math.max(0, total - plataforma) };
}

function getNegligenciaPlataforma(u: AdminBroker): number {
  const neg = getNegligencia(u);
  const { plataforma } = getOrigemLeads(u);
  const total = getLeadsAtivos(u) || 1;
  return Math.min(plataforma, Math.round((neg * plataforma) / total));
}

function getPipelineComposicao(u: AdminBroker): {
  novos: number; qualificados: number; visitas: number; propostas: number; criticos: number;
} {
  const total = getLeadsAtivos(u);
  if (total === 0) return { novos: 0, qualificados: 0, visitas: 0, propostas: 0, criticos: 0 };
  // pesos determinísticos
  const novos = Math.max(1, Math.round(total * 0.18));
  const qualificados = Math.max(1, Math.round(total * 0.32));
  const visitas = Math.max(0, Math.round(total * 0.18));
  const propostas = Math.max(0, Math.round(total * 0.20));
  const criticos = Math.max(0, total - novos - qualificados - visitas - propostas);
  return { novos, qualificados, visitas, propostas, criticos };
}

type Direcao = "up" | "down" | "flat";
type MetricaTendencia = "execucao" | "conversao" | "negligencia" | "tempoResposta";

function getTendencia(u: AdminBroker, m: MetricaTendencia): { atual: string; delta: number; direcao: Direcao } {
  const seed = m === "execucao" ? 81 : m === "conversao" ? 82 : m === "negligencia" ? 83 : 84;
  const delta = rng(u.id, seed, -18, 18);
  const direcao: Direcao = delta > 1 ? "up" : delta < -1 ? "down" : "flat";
  let atual = "";
  if (m === "execucao") atual = `${getExecucao(u)}%`;
  else if (m === "conversao") atual = `${getConversao(u)}%`;
  else if (m === "negligencia") atual = `${getNegligencia(u)} leads`;
  else atual = `${rng(u.id, 85, 1, 9)}h`;
  return { atual, delta, direcao };
}

// Em "negligencia" e "tempoResposta", subir é ruim
function tonDelta(direcao: Direcao, m: MetricaTendencia): string {
  if (direcao === "flat") return "text-muted-foreground";
  const piorAoSubir = m === "negligencia" || m === "tempoResposta";
  const ruim = (direcao === "up" && piorAoSubir) || (direcao === "down" && !piorAoSubir);
  return ruim ? "text-red-700" : "text-emerald-700";
}

type AlertaInteligente = { tom: "red" | "amber" | "yellow" | "emerald"; texto: string };

function getAlertasInteligentes(u: AdminBroker): AlertaInteligente[] {
  const out: AlertaInteligente[] = [];
  const negPlat = getNegligenciaPlataforma(u);
  const exec = getExecucao(u);
  const dias = getDiasSemLogin(u);
  const conv = getConversao(u);
  const tendExec = getTendencia(u, "execucao");

  if (negPlat >= 3) out.push({ tom: "red", texto: `${negPlat} leads da plataforma sem follow-up há mais de 5 dias` });
  if (tendExec.direcao === "down" && Math.abs(tendExec.delta) >= 8)
    out.push({ tom: "amber", texto: `Execução caiu ${Math.abs(tendExec.delta)}% nesta semana` });
  if (dias >= 7) out.push({ tom: "yellow", texto: `Sem login há ${dias} dias — vale um contato de acompanhamento` });
  if (conv >= 25) out.push({ tom: "emerald", texto: `Conversão acima da média da rede (${conv}%)` });
  if (exec < 50 && out.length < 4) out.push({ tom: "amber", texto: `Execução abaixo do ideal (${exec}%) — priorizar suporte` });
  return out.slice(0, 4);
}

function getAcaoRecomendada(u: AdminBroker): { titulo: string; motivos: string[] } {
  const exec = getExecucao(u);
  const neg = getNegligencia(u);
  const dias = getDiasSemLogin(u);
  const negPlat = getNegligenciaPlataforma(u);
  const motivos: string[] = [];
  if (neg > 0) motivos.push(`${neg} leads negligenciados (${negPlat} da plataforma)`);
  if (dias >= 4) motivos.push(`${dias} dias sem login`);
  if (exec < 60) motivos.push(`execução em ${exec}%`);
  const tendConv = getTendencia(u, "conversao");
  if (tendConv.direcao === "down") motivos.push(`conversão caindo ${Math.abs(tendConv.delta)}%`);

  let titulo = `Acompanhar ${u.nome.split(" ")[0]}`;
  if (negPlat >= 3) titulo = `Priorizar contato com ${u.nome.split(" ")[0]} — leads da plataforma em risco`;
  else if (dias >= 7) titulo = `Reativar ${u.nome.split(" ")[0]} — operação parada`;
  else if (exec < 50) titulo = `Apoiar ${u.nome.split(" ")[0]} a retomar execução`;
  else if (tendConv.direcao === "up" && tendConv.delta > 5) titulo = `Reconhecer ${u.nome.split(" ")[0]} pela melhora de conversão`;

  return { titulo, motivos: motivos.slice(0, 4) };
}

function getSaudeMicrocopy(r: Risco): string {
  if (r === "saudavel") return "Execução alta · baixa negligência · resposta rápida";
  if (r === "atencao") return "Queda operacional · follow-ups atrasados · atenção recomendada";
  return "Sem login recente · leads negligenciados · suporte imediato";
}

// ─── Tons visuais ─────────────────────────────────────────────────────────────

function tonExecucao(n: number): string {
  if (n >= 75) return "bg-emerald-50 text-emerald-700";
  if (n >= 50) return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
}
function tonExecBar(n: number): string {
  if (n >= 75) return "bg-emerald-500";
  if (n >= 50) return "bg-amber-500";
  return "bg-red-500";
}
function tonConversao(n: number): string {
  if (n >= 20) return "text-emerald-700";
  if (n >= 10) return "text-foreground";
  return "text-red-700";
}
function tonRisco(r: Risco): string {
  if (r === "saudavel") return "bg-emerald-50 text-emerald-700";
  if (r === "atencao") return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
}
function labelRisco(r: Risco): string {
  if (r === "saudavel") return "Saudável";
  if (r === "atencao") return "Atenção";
  return "Crítico";
}

// ─── Filtros ──────────────────────────────────────────────────────────────────

type FExec = "todas" | "alta" | "media" | "baixa";
type FRisco = "todos" | Risco;
type FConv = "todas" | "alta" | "baixa";
type FStatus = "todos" | "sem-login" | "negligenciando" | "cadencia" | "parado";
type FPlano = "todos" | "Free" | "Pro";

function UsuariosAdmin() {
  const [busca, setBusca] = useState("");
  const [exec, setExec] = useState<FExec>("todas");
  const [risco, setRisco] = useState<FRisco>("todos");
  const [conv, setConv] = useState<FConv>("todas");
  const [statusOp, setStatusOp] = useState<FStatus>("todos");
  const [plano, setPlano] = useState<FPlano>("todos");
  const [regiao, setRegiao] = useState<string>("todas");
  const [selected, setSelected] = useState<AdminBroker | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function clearSelection() { setSelectedIds(new Set()); }
  function bulkAction(label: string) {
    toast.success(`${label}`, {
      description: `${selectedIds.size} corretor(es) selecionado(s).`,
    });
    clearSelection();
  }

  const regioes = useMemo(
    () => Array.from(new Set(adminBrokers.map(getRegiao))).sort(),
    [],
  );

  // Linhas enriquecidas
  const enriched = useMemo(
    () =>
      adminBrokers.map((u) => {
        const e = getExecucao(u);
        const c = getConversao(u);
        const n = getNegligencia(u);
        const d = getDiasSemLogin(u);
        const r = getRiscoOperacional(u);
        return {
          u,
          regiao: getRegiao(u),
          leads: getLeadsAtivos(u),
          exec: e,
          conv: c,
          neg: n,
          diasSemLogin: d,
          risco: r,
          score: getScoreIA(u),
        };
      }),
    [],
  );

  // KPIs da rede
  const kpiAtivos = enriched.filter((x) => x.u.status === "Ativo").length * 63; // escala visual → ~752
  const kpiExec = Math.round(
    enriched.reduce((s, x) => s + x.exec, 0) / enriched.length,
  );
  const kpiNeg = enriched.reduce((s, x) => s + x.neg, 0) * 6;
  const kpiCriticos = enriched.filter((x) => x.risco === "critico").length * 4;
  const kpiReceita = enriched.reduce((s, x) => s + x.u.receita, 0);
  const kpiConv = Math.round(
    enriched.reduce((s, x) => s + x.conv, 0) / enriched.length,
  );

  // Alertas
  const alertNeg = enriched.filter((x) => x.neg > 10).length;
  const alertSemLogin = enriched.filter((x) => x.diasSemLogin > 7).length + 3;
  const alertFollowup = Math.round(kpiNeg / 6);
  const alertTop = enriched.filter((x) => x.conv > 25).length;

  const filtered = enriched.filter((x) => {
    if (busca && !x.u.nome.toLowerCase().includes(busca.toLowerCase()))
      return false;
    if (exec === "alta" && x.exec < 75) return false;
    if (exec === "media" && (x.exec < 50 || x.exec >= 75)) return false;
    if (exec === "baixa" && x.exec >= 50) return false;
    if (risco !== "todos" && x.risco !== risco) return false;
    if (conv === "alta" && x.conv < 20) return false;
    if (conv === "baixa" && x.conv >= 20) return false;
    if (statusOp === "sem-login" && x.diasSemLogin <= 7) return false;
    if (statusOp === "negligenciando" && x.neg <= 10) return false;
    if (statusOp === "cadencia" && x.exec >= 50) return false;
    if (statusOp === "parado" && x.leads > 5) return false;
    if (plano !== "todos" && x.u.plano !== plano) return false;
    if (regiao !== "todas" && x.regiao !== regiao) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Usuários</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Central operacional da rede — supervisione execução, performance e risco.
        </p>
      </div>

      {/* KPIs executivos */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Corretores ativos" value={kpiAtivos.toString()} sub="Operando este mês" />
        <KpiCard label="Execução média" value={`${kpiExec}%`} sub="Tarefas e cadências concluídas" />
        <KpiCard label="Leads negligenciados" value={kpiNeg.toString()} sub="Sem interação acima do SLA" tone={kpiNeg > 30 ? "danger" : "muted"} />
        <KpiCard label="Corretores em risco" value={kpiCriticos.toString()} sub="Execução baixa, sem login ou bloqueados" tone={kpiCriticos > 8 ? "danger" : "muted"} />
        <KpiCard label="Receita da plataforma" value={formatBRLcompact(kpiReceita)} sub="Receita do mês" />
        <KpiCard label="Conversão média" value={`${kpiConv}%`} sub="Leads convertidos em venda" />
      </div>

      {/* Faixa de alertas operacionais */}
      <div className="rounded-xl border border-border bg-card p-3">
        <div className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          Alertas operacionais da rede
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(() => {
            const total = enriched.length;
            const saudaveis = enriched.filter((x) => x.risco === "saudavel").length;
            const pct = Math.round((saudaveis / total) * 100);
            const tom: "emerald" | "amber" | "red" = pct >= 70 ? "emerald" : pct >= 45 ? "amber" : "red";
            const label = pct >= 70 ? "Saudável" : pct >= 45 ? "Atenção" : "Crítica";
            const dot = tom === "emerald" ? "bg-emerald-500" : tom === "amber" ? "bg-amber-500" : "bg-red-500";
            return (
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs">
                <span className={cn("h-2 w-2 rounded-full", dot)} />
                <span className="text-muted-foreground">Saúde da rede:</span>
                <span className="font-medium">{label} ({pct}%)</span>
              </span>
            );
          })()}
          <AlertChip
            color="red"
            label={`${alertNeg} corretores com mais de 10 leads negligenciados`}
            onClick={() => setStatusOp("negligenciando")}
          />
          <AlertChip
            color="amber"
            label={`${alertSemLogin} corretores sem login há mais de 7 dias`}
            onClick={() => setStatusOp("sem-login")}
          />
          <AlertChip
            color="yellow"
            label={`${alertFollowup} propostas sem follow-up`}
            onClick={() => setExec("baixa")}
          />
          <AlertChip
            color="emerald"
            label={`${alertTop} corretores com conversão acima de 25%`}
            onClick={() => setConv("alta")}
          />
        </div>
      </div>

      {/* Filtros + busca */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <FilterSelect label="Execução" value={exec} onChange={(v) => setExec(v as FExec)} options={[
            { v: "todas", l: "Execução: todas" },
            { v: "alta", l: "Execução: alta" },
            { v: "media", l: "Execução: média" },
            { v: "baixa", l: "Execução: baixa" },
          ]} />
          <FilterSelect label="Risco" value={risco} onChange={(v) => setRisco(v as FRisco)} options={[
            { v: "todos", l: "Risco: todos" },
            { v: "saudavel", l: "Risco: saudável" },
            { v: "atencao", l: "Risco: atenção" },
            { v: "critico", l: "Risco: crítico" },
          ]} />
          <FilterSelect label="Conversão" value={conv} onChange={(v) => setConv(v as FConv)} options={[
            { v: "todas", l: "Conversão: todas" },
            { v: "alta", l: "Conversão: alta" },
            { v: "baixa", l: "Conversão: baixa" },
          ]} />
          <FilterSelect label="Status" value={statusOp} onChange={(v) => setStatusOp(v as FStatus)} options={[
            { v: "todos", l: "Status: todos" },
            { v: "sem-login", l: "Sem login recente" },
            { v: "negligenciando", l: "Negligenciando leads" },
            { v: "cadencia", l: "Cadência atrasada" },
            { v: "parado", l: "Pipeline parado" },
          ]} />
          <FilterSelect label="Plano" value={plano} onChange={(v) => setPlano(v as FPlano)} options={[
            { v: "todos", l: "Plano: todos" },
            { v: "Pro", l: "Plano: Pro" },
            { v: "Free", l: "Plano: Free" },
          ]} />
          <FilterSelect label="Região" value={regiao} onChange={(v) => setRegiao(v)} options={[
            { v: "todas", l: "Região: todas" },
            ...regioes.map((r) => ({ v: r, l: `Região: ${r}` })),
          ]} />
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar corretor…"
            className="bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Tabela operacional */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface">
      {/* Barra de ações em massa */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2 shadow-sm">
          <span className="ml-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{selectedIds.size}</span> selecionado(s)
          </span>
          <button onClick={clearSelection} className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-surface">
            Limpar
          </button>
          <span className="mx-1 h-4 w-px bg-border" />
          <BulkBtn icon={<Send className="h-3.5 w-3.5" />} onClick={() => bulkAction("Alerta operacional enviado")}>
            Enviar alerta operacional
          </BulkBtn>
          <BulkBtn icon={<Activity className="h-3.5 w-3.5" />} onClick={() => bulkAction("Cadência padrão atualizada")}>
            Alterar cadência padrão
          </BulkBtn>
          <BulkBtn icon={<CalendarClock className="h-3.5 w-3.5" />} onClick={() => bulkAction("Acompanhamento agendado")}>
            Agendar acompanhamento
          </BulkBtn>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <BulkBtn icon={<PauseCircle className="h-3.5 w-3.5" />} onClick={() => bulkAction("Distribuição de leads Ubroker pausada")}>
                    Pausar distribuição de leads da plataforma
                  </BulkBtn>
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                Não bloqueia o corretor — apenas interrompe a entrada de novos leads Ubroker até a normalização operacional.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* Tabela operacional */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface">
              <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="w-10 px-3 py-3">
                  <Checkbox
                    checked={filtered.length > 0 && filtered.every((x) => selectedIds.has(x.u.id))}
                    onCheckedChange={(v) => {
                      if (v) setSelectedIds(new Set(filtered.map((x) => x.u.id)));
                      else clearSelection();
                    }}
                    aria-label="Selecionar todos"
                  />
                </th>
                <th className="px-4 py-3">Corretor</th>
                <th className="px-4 py-3">Plano</th>
                <th className="px-4 py-3">Região</th>
                <th className="px-4 py-3 text-right">Leads</th>
                <th className="px-4 py-3">Origem</th>
                <th className="px-4 py-3">Execução</th>
                <th className="px-4 py-3 text-right">Conversão</th>
                <th className="px-4 py-3 text-right">Negligência</th>
                <th className="px-4 py-3 text-right">Receita</th>
                <th className="px-4 py-3">Risco</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((x) => {
                const origem = getOrigemLeads(x.u);
                return (
                <tr
                  key={x.u.id}
                  onClick={() => setSelected(x.u)}
                  className={cn(
                    "cursor-pointer hover:bg-surface/60",
                    selectedIds.has(x.u.id) && "bg-surface/50",
                  )}
                >
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(x.u.id)}
                      onCheckedChange={() => toggleSelect(x.u.id)}
                      aria-label={`Selecionar ${x.u.nome}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={x.u.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                      <div>
                        <div className="font-medium">{x.u.nome}</div>
                        <div className="text-xs text-muted-foreground">{x.u.creci}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-xs",
                      x.u.plano === "Pro" ? "bg-warm/15 text-warm" : "bg-surface text-muted-foreground",
                    )}>{x.u.plano}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{x.regiao}</td>
                  <td className="px-4 py-3 text-right num">{x.leads}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5 text-[11px] leading-tight">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-1.5 py-0.5 text-blue-700">
                        Plataforma <span className="num">{origem.plataforma}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-surface px-1.5 py-0.5 text-muted-foreground">
                        Própria <span className="num">{origem.propria}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={cn("rounded-md px-1.5 py-0.5 text-xs num", tonExecucao(x.exec))}>
                        {x.exec}%
                      </span>
                      <div className="h-1 w-14 overflow-hidden rounded-full bg-surface">
                        <div className={cn("h-full", tonExecBar(x.exec))} style={{ width: `${x.exec}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className={cn("px-4 py-3 text-right num", tonConversao(x.conv))}>{x.conv}%</td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn(
                      "inline-flex items-center gap-1 num",
                      x.neg > 10 ? "text-red-700" : x.neg > 5 ? "text-amber-700" : "text-muted-foreground",
                    )}>
                      {x.neg > 10 && <AlertTriangle className="h-3 w-3" />}
                      {x.neg}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right num">{formatBRL(x.u.receita)}</td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs", tonRisco(x.risco))}>
                      {labelRisco(x.risco)}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-surface hover:text-foreground" title="Alterar plano">
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                      <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-700" title="Bloquear">
                        <Ban className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );})}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Nenhum corretor corresponde aos filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer operacional do corretor */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
          {selected && <BrokerDrawer broker={selected} onClose={() => setSelected(null)} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "default" | "muted" | "danger";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={cn(
        "mt-1 text-xl font-medium num",
        tone === "danger" ? "text-red-700" : "text-foreground",
      )}>
        {value}
      </div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}

function AlertChip({
  color,
  label,
  onClick,
}: {
  color: "red" | "amber" | "yellow" | "emerald";
  label: string;
  onClick?: () => void;
}) {
  const dot =
    color === "red" ? "bg-red-500" :
    color === "amber" ? "bg-amber-500" :
    color === "yellow" ? "bg-yellow-500" :
    "bg-emerald-500";
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-foreground transition hover:bg-surface/70"
    >
      <span className={cn("h-2 w-2 rounded-full", dot)} />
      {label}
    </button>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-full border border-border bg-card px-3 py-1 text-xs text-foreground outline-none transition hover:border-foreground/30"
    >
      {options.map((o) => (
        <option key={o.v} value={o.v}>{o.l}</option>
      ))}
    </select>
  );
}

function BrokerDrawer({ broker, onClose }: { broker: AdminBroker; onClose: () => void }) {
  const exec = getExecucao(broker);
  const convPct = getConversao(broker);
  const neg = getNegligencia(broker);
  const dias = getDiasSemLogin(broker);
  const risco = getRiscoOperacional(broker);
  const score = getScoreIA(broker);
  const leads = getLeadsAtivos(broker);
  const fin = corretorRisco[broker.nome];

  return (
    <div>
      <SheetHeader className="space-y-3">
        <div className="flex items-start gap-3">
          <img src={broker.avatar} alt="" className="h-14 w-14 rounded-full object-cover" />
          <div className="min-w-0 flex-1">
            <SheetTitle className="font-display text-xl">{broker.nome}</SheetTitle>
            <div className="mt-1 text-xs text-muted-foreground">
              {broker.creci} · {broker.plano} · {getRegiao(broker)} · {broker.status}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className={cn("rounded-full px-2 py-0.5 text-xs", tonRisco(risco))}>
                {labelRisco(risco)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-xs text-muted-foreground">
                <Brain className="h-3 w-3" /> Score {score}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-surface">
            <X className="h-4 w-4" />
          </button>
        </div>
      </SheetHeader>

      <Tabs defaultValue="resumo" className="mt-6">
        <TabsList className="flex w-full flex-wrap gap-1 bg-surface">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="operacao">Operação</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="cadencias">Cadências</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="mt-4">
          <Grid2>
            <Mini label="Leads ativos" value={leads.toString()} />
            <Mini label="Vendas no mês" value={rng(broker.id, 11, 0, 6).toString()} />
            <Mini label="Conversão" value={`${convPct}%`} />
            <Mini label="Receita gerada" value={formatBRL(broker.receita)} />
            <Mini label="Score operacional" value={score.toString()} />
            <Mini label="Execução" value={`${exec}%`} />
            <Mini label="Negligência" value={neg.toString()} />
            <Mini label="Dias sem login" value={dias.toString()} />
          </Grid2>
        </TabsContent>

        <TabsContent value="operacao" className="mt-4">
          <Grid2>
            <Mini label="Visitas agendadas" value={rng(broker.id, 21, 0, 6).toString()} />
            <Mini label="Propostas abertas" value={rng(broker.id, 22, 0, 5).toString()} />
            <Mini label="Tarefas atrasadas" value={rng(broker.id, 23, 0, 12).toString()} />
            <Mini label="Leads em risco" value={Math.round(neg * 0.6).toString()} />
          </Grid2>
          <div className="mt-4 rounded-lg border border-border p-3">
            <div className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Pipeline operacional</div>
            <div className="space-y-1.5 text-sm">
              {["Novo", "Qualificado", "Visita", "Proposta", "Fechado"].map((s, i) => (
                <div key={s} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{s}</span>
                  <span className="num">{rng(broker.id, 30 + i, 0, leads / 2 + 4)}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          <Grid2>
            <Mini label="Conversão" value={`${convPct}%`} />
            <Mini label="Tempo médio resposta" value={`${rng(broker.id, 41, 8, 180)}min`} />
            <Mini label="Follow-ups realizados" value={rng(broker.id, 42, 12, 240).toString()} />
            <Mini label="Consistência" value={`${rng(broker.id, 43, 40, 98)}%`} />
            <Mini label="Ranking interno" value={`#${rng(broker.id, 44, 1, 120)}`} />
            <Mini label="Score IA" value={score.toString()} />
          </Grid2>
        </TabsContent>

        <TabsContent value="cadencias" className="mt-4">
          <Grid2>
            <Mini label="Cadências ativas" value={rng(broker.id, 51, 1, 8).toString()} />
            <Mini label="Taxa de conclusão" value={`${exec}%`} />
            <Mini label="Tarefas ignoradas" value={rng(broker.id, 52, 0, 18).toString()} />
            <Mini label="Gargalos detectados" value={rng(broker.id, 53, 0, 4).toString()} />
          </Grid2>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface">
            <div className={cn("h-full", tonExecBar(exec))} style={{ width: `${exec}%` }} />
          </div>
        </TabsContent>

        <TabsContent value="financeiro" className="mt-4">
          <Grid2>
            <Mini label="Comissão gerada" value={formatBRL(broker.receita)} />
            <Mini label="Fee plataforma" value={formatBRL(Math.round(broker.receita * 0.06))} />
            <Mini label="MRR SaaS" value={broker.plano === "Pro" ? "R$ 240" : "R$ 0"} />
            <Mini label="Inadimplência" value={fin ? `${fin.pctAtraso}%` : "—"} />
            <Mini label="Repasses pendentes" value={fin ? formatBRL(fin.totalAberto) : "R$ 0"} />
            <Mini label="Plano" value={broker.plano} />
          </Grid2>
        </TabsContent>

        <TabsContent value="auditoria" className="mt-4">
          <ul className="space-y-2 text-sm">
            {[
              { dot: "bg-amber-500", t: "Alteração crítica em política de comissão", d: "12/05" },
              { dot: "bg-red-500", t: "Lead perdido após 14 dias sem interação", d: "08/05" },
              { dot: "bg-slate-400", t: "Bloqueio temporário revertido por superadmin", d: "02/05" },
              { dot: "bg-amber-500", t: "Disputa aberta por parceria #PR-118", d: "29/04" },
              { dot: "bg-slate-400", t: "Login realizado de novo dispositivo", d: "27/04" },
            ].map((e, i) => (
              <li key={i} className="flex items-start gap-3 rounded-lg border border-border p-3">
                <span className={cn("mt-1.5 h-2 w-2 rounded-full", e.dot)} />
                <div className="flex-1">
                  <div className="text-foreground">{e.t}</div>
                  <div className="text-xs text-muted-foreground">{e.d}</div>
                </div>
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-base font-medium num text-foreground">{value}</div>
    </div>
  );
}
