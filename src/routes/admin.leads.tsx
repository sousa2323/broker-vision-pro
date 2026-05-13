import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { leads as leadsBase, formatBRL, formatBRLcompact, type Lead, type LeadStatus } from "@/data/mock";
import { adminBrokers, corretorRisco, type AdminBroker } from "@/data/admin-mock";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreHorizontal, Search } from "lucide-react";

export const Route = createFileRoute("/admin/leads")({
  component: LeadsAdmin,
});

// ============ Helpers determinísticos ============

function seedFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

type OrigemAdmin = "IA" | "Inbox" | "Marketplace" | "Indicação";
type TipoLead = "Plataforma" | "Próprio";
type Risco = "saudavel" | "atencao" | "critico";

function getOrigemAdmin(l: Lead): OrigemAdmin {
  if (l.origem === "Marketplace") return "Marketplace";
  if (l.origem === "Indicação") return "Indicação";
  if (l.origem === "WhatsApp" || l.origem === "Instagram") return "Inbox";
  return "IA";
}

function getTipoLead(l: Lead): TipoLead {
  const o = getOrigemAdmin(l);
  if (o === "Marketplace" || o === "IA") return "Plataforma";
  // 1 em cada 5 do Inbox/Indicação considerada plataforma (campanha paga)
  return seedFromId(l.id) % 5 === 0 ? "Plataforma" : "Próprio";
}

const activeBrokers = adminBrokers.filter((b) => b.status === "Ativo");
function getCorretor(l: Lead): AdminBroker {
  return activeBrokers[seedFromId(l.id) % activeBrokers.length];
}

const SLA_HORAS: Record<LeadStatus, number> = {
  Novo: 2,
  Qualificado: 24,
  Visita: 12,
  Proposta: 48,
  Fechado: 9999,
  Perdido: 9999,
};

function getTempoParado(l: Lead): { horas: number; label: string } {
  const ui = l.ultimaInteracao;
  let horas = 12;
  if (ui.includes("min")) horas = 0.5;
  else if (ui.includes("h")) horas = parseInt(ui.replace(/\D/g, ""), 10) || 2;
  else if (ui.includes("ontem")) horas = 24;
  else if (ui.includes("d")) horas = (parseInt(ui.replace(/\D/g, ""), 10) || 1) * 24;
  else horas = 36;
  // Adiciona variação determinística
  horas += (seedFromId(l.id) % 18);
  const label =
    horas < 1 ? "<1h" : horas < 24 ? `${Math.round(horas)}h` : `${Math.round(horas / 24)}d`;
  return { horas, label };
}

function getSLA(l: Lead): { quebrado: boolean; restante: string; sobra: number } {
  const { horas } = getTempoParado(l);
  const limite = SLA_HORAS[l.status];
  const sobra = limite - horas;
  if (l.status === "Fechado" || l.status === "Perdido") {
    return { quebrado: false, restante: "—", sobra: 0 };
  }
  if (sobra >= 0) return { quebrado: false, restante: `${Math.round(sobra)}h restante`, sobra };
  return { quebrado: true, restante: `+${Math.round(-sobra)}h`, sobra };
}

function getScore(l: Lead): number {
  const { horas } = getTempoParado(l);
  const sla = getSLA(l);
  const stageBonus: Record<LeadStatus, number> = {
    Novo: 0,
    Qualificado: 8,
    Visita: 14,
    Proposta: 18,
    Fechado: 25,
    Perdido: -10,
  };
  const corretor = getCorretor(l);
  const risco = corretorRisco[corretor.nome]?.pctAtraso ?? 10;
  let score = 100 - Math.min(50, horas * 0.6) - (sla.quebrado ? 20 : 0) - risco * 0.3 + stageBonus[l.status];
  score = Math.max(5, Math.min(100, Math.round(score)));
  return score;
}

function getRisco(l: Lead): Risco {
  const score = getScore(l);
  const sla = getSLA(l);
  if (l.status === "Fechado") return "saudavel";
  if (l.status === "Perdido") return "critico";
  if (score >= 70 && !sla.quebrado) return "saudavel";
  if (score < 40 || (sla.quebrado && sla.sobra < -24)) return "critico";
  return "atencao";
}

function getRegiao(l: Lead): string {
  return getCorretor(l).cidade;
}

function getProximaAcao(l: Lead): string {
  const tipo = getTipoLead(l);
  const sla = getSLA(l);
  const risco = getRisco(l);
  const score = getScore(l);
  const corretor = getCorretor(l);
  const pctAtraso = corretorRisco[corretor.nome]?.pctAtraso ?? 0;

  if (l.status === "Fechado" || l.status === "Perdido") return "Sem ação necessária";
  if (sla.quebrado && tipo === "Plataforma") return "Cobrar follow-up";
  if (risco === "critico" && tipo === "Plataforma") return "Redistribuir lead";
  if (l.status === "Visita" && seedFromId(l.id) % 3 === 0) return "Confirmar visita";
  if (l.status === "Proposta" && sla.sobra < -12) return "Revisar proposta";
  if (score < 35 && pctAtraso > 50) return "Verificar risco de bypass";
  if (l.status === "Proposta" && score >= 60) return "Acompanhar negociação";
  return "Sem ação necessária";
}

// ============ Estilos auxiliares ============

const tonRisco: Record<Risco, string> = {
  saudavel: "text-emerald-700 bg-emerald-50",
  atencao: "text-amber-700 bg-amber-50",
  critico: "text-red-700 bg-red-50",
};

function tonScore(score: number): string {
  if (score >= 70) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (score >= 40) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-red-700 bg-red-50 border-red-200";
}

const labelRisco: Record<Risco, string> = {
  saudavel: "Saudável",
  atencao: "Atenção",
  critico: "Crítico",
};

// ============ Tipo de lead enriquecido ============

type LeadView = Lead & {
  corretor: AdminBroker;
  origemAdmin: OrigemAdmin;
  tipo: TipoLead;
  tempoParado: { horas: number; label: string };
  sla: { quebrado: boolean; restante: string; sobra: number };
  score: number;
  risco: Risco;
  regiao: string;
  proximaAcao: string;
};

function enrich(l: Lead): LeadView {
  return {
    ...l,
    corretor: getCorretor(l),
    origemAdmin: getOrigemAdmin(l),
    tipo: getTipoLead(l),
    tempoParado: getTempoParado(l),
    sla: getSLA(l),
    score: getScore(l),
    risco: getRisco(l),
    regiao: getRegiao(l),
    proximaAcao: getProximaAcao(l),
  };
}

// ============ Filtros ============

type AlertaKey = null | "sla72" | "propostasMilhao" | "visitasNaoConfirmadas" | "bypass" | "execucaoBaixa";

type Filtros = {
  origem: string;
  regiao: string;
  corretor: string;
  etapa: string;
  risco: string;
  sla: string;
  tipo: string;
  scoreFx: string;
  vgvFx: string;
};

const filtrosVazios: Filtros = {
  origem: "all",
  regiao: "all",
  corretor: "all",
  etapa: "all",
  risco: "all",
  sla: "all",
  tipo: "all",
  scoreFx: "all",
  vgvFx: "all",
};

// ============ Componente ============

function LeadsAdmin() {
  const all = useMemo(() => leadsBase.map(enrich), []);

  const [busca, setBusca] = useState("");
  const [filtros, setFiltros] = useState<Filtros>(filtrosVazios);
  const [alerta, setAlerta] = useState<AlertaKey>(null);
  const [selecionado, setSelecionado] = useState<LeadView | null>(null);
  const [redistribuirOpen, setRedistribuirOpen] = useState(false);
  const [observacaoOpen, setObservacaoOpen] = useState(false);
  const [observacao, setObservacao] = useState("");

  // KPIs
  const kpis = useMemo(() => {
    const ativos = all.filter((l) => l.tipo === "Plataforma" && l.status !== "Fechado" && l.status !== "Perdido");
    const emRisco = all.filter((l) => l.risco !== "saudavel" && l.status !== "Fechado");
    const negligenciados = all.filter((l) => l.tipo === "Plataforma" && l.sla.quebrado);
    const horasMedia = all.reduce((s, l) => s + l.tempoParado.horas, 0) / all.length;
    const platforma = all.filter((l) => l.tipo === "Plataforma");
    const fechados = platforma.filter((l) => l.status === "Fechado").length;
    const conversao = platforma.length ? Math.round((fechados / platforma.length) * 100) : 0;
    const vgvRisco = all.filter((l) => l.risco === "critico").reduce((s, l) => s + l.orcamento, 0);
    const propostas = all.filter((l) => l.status === "Proposta");
    return {
      ativos: ativos.length,
      emRisco: emRisco.length,
      negligenciados: negligenciados.length,
      tempoMedio: Math.round(horasMedia),
      conversao,
      vgvRisco,
      proximos: propostas.length,
      proximosVgv: propostas.reduce((s, l) => s + l.orcamento, 0),
    };
  }, [all]);

  // Alertas
  const alertas = useMemo(() => {
    const sla72 = all.filter((l) => l.tipo === "Plataforma" && l.sla.quebrado && l.tempoParado.horas > 72).length;
    const propostasMilhao = all.filter((l) => l.status === "Proposta" && l.orcamento >= 1_000_000 && l.sla.sobra < 0).length;
    const visitasNaoConfirmadas = all.filter((l) => l.status === "Visita" && l.proximaAcao === "Confirmar visita").length;
    const bypass = all.filter((l) => l.proximaAcao === "Verificar risco de bypass").length;
    const corretoresExecBaixa = new Set(
      all.filter((l) => (corretorRisco[l.corretor.nome]?.pctAtraso ?? 0) >= 60).map((l) => l.corretor.id),
    ).size;
    return { sla72, propostasMilhao, visitasNaoConfirmadas, bypass, execucaoBaixa: corretoresExecBaixa };
  }, [all]);

  // Lista filtrada
  const lista = useMemo(() => {
    return all.filter((l) => {
      if (busca) {
        const q = busca.toLowerCase();
        if (
          !l.nome.toLowerCase().includes(q) &&
          !l.corretor.nome.toLowerCase().includes(q) &&
          !l.regiao.toLowerCase().includes(q) &&
          !l.id.toLowerCase().includes(q)
        )
          return false;
      }
      if (filtros.origem !== "all" && l.origemAdmin !== filtros.origem) return false;
      if (filtros.regiao !== "all" && l.regiao !== filtros.regiao) return false;
      if (filtros.corretor !== "all" && l.corretor.id !== filtros.corretor) return false;
      if (filtros.etapa !== "all" && l.status !== filtros.etapa) return false;
      if (filtros.risco !== "all" && l.risco !== filtros.risco) return false;
      if (filtros.sla === "ok" && l.sla.quebrado) return false;
      if (filtros.sla === "quebrado" && !l.sla.quebrado) return false;
      if (filtros.tipo !== "all" && l.tipo !== filtros.tipo) return false;
      if (filtros.scoreFx === "exc" && l.score < 70) return false;
      if (filtros.scoreFx === "atn" && (l.score < 40 || l.score >= 70)) return false;
      if (filtros.scoreFx === "cri" && l.score >= 40) return false;
      if (filtros.vgvFx === "ate500" && l.orcamento >= 500_000) return false;
      if (filtros.vgvFx === "500a1m" && (l.orcamento < 500_000 || l.orcamento >= 1_000_000)) return false;
      if (filtros.vgvFx === "1ma3m" && (l.orcamento < 1_000_000 || l.orcamento >= 3_000_000)) return false;
      if (filtros.vgvFx === "3m+" && l.orcamento < 3_000_000) return false;

      // Alerta clicado
      if (alerta === "sla72" && !(l.tipo === "Plataforma" && l.sla.quebrado && l.tempoParado.horas > 72)) return false;
      if (alerta === "propostasMilhao" && !(l.status === "Proposta" && l.orcamento >= 1_000_000 && l.sla.sobra < 0)) return false;
      if (alerta === "visitasNaoConfirmadas" && !(l.status === "Visita" && l.proximaAcao === "Confirmar visita")) return false;
      if (alerta === "bypass" && l.proximaAcao !== "Verificar risco de bypass") return false;
      if (alerta === "execucaoBaixa" && (corretorRisco[l.corretor.nome]?.pctAtraso ?? 0) < 60) return false;
      return true;
    });
  }, [all, busca, filtros, alerta]);

  const filtrosAtivos =
    Object.entries(filtros).some(([, v]) => v !== "all") || busca.length > 0 || alerta !== null;

  const regioesUnicas = Array.from(new Set(all.map((l) => l.regiao))).sort();

  const aplicarAlerta = (key: AlertaKey) => setAlerta(alerta === key ? null : key);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Leads</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Central de visibilidade — supervisão estratégica das operações comerciais da rede.
        </p>
      </div>

      {/* Camada 1 — KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <KpiCard label="Leads ativos da plataforma" value={kpis.ativos} hint="Operações em andamento" delta="+8%" />
        <KpiCard label="Leads em risco" value={kpis.emRisco} hint="Sem interação acima do SLA" delta="+3" tone="amber" />
        <KpiCard label="Leads negligenciados" value={kpis.negligenciados} hint="Possível perda operacional" delta="+2" tone="red" />
        <KpiCard label="Tempo médio de resposta" value={`${kpis.tempoMedio}h`} hint="Média da rede" delta="-1h" tone="emerald" />
        <KpiCard label="Conversão da plataforma" value={`${kpis.conversao}%`} hint="Leads convertidos em venda" delta="+1.2pp" tone="emerald" />
        <KpiCard label="VGV em risco" value={formatBRLcompact(kpis.vgvRisco)} hint="Operações críticas" delta="+R$ 1,2M" tone="red" />
        <KpiCard label="Próximos fechamentos" value={kpis.proximos} hint={`Propostas · ${formatBRLcompact(kpis.proximosVgv)}`} delta="+1" tone="emerald" />
      </div>

      {/* Camada 2 — Alertas */}
      <div className="flex flex-wrap gap-2">
        <AlertaPill cor="red" ativo={alerta === "sla72"} onClick={() => aplicarAlerta("sla72")}>
          {alertas.sla72} leads da plataforma sem interação há mais de 72h
        </AlertaPill>
        <AlertaPill cor="amber" ativo={alerta === "propostasMilhao"} onClick={() => aplicarAlerta("propostasMilhao")}>
          {alertas.propostasMilhao} propostas acima de R$ 1M sem follow-up
        </AlertaPill>
        <AlertaPill cor="yellow" ativo={alerta === "visitasNaoConfirmadas"} onClick={() => aplicarAlerta("visitasNaoConfirmadas")}>
          {alertas.visitasNaoConfirmadas} visitas agendadas sem confirmação
        </AlertaPill>
        <AlertaPill cor="red" ativo={alerta === "bypass"} onClick={() => aplicarAlerta("bypass")}>
          {alertas.bypass} possíveis bypass identificados
        </AlertaPill>
        <AlertaPill cor="amber" ativo={alerta === "execucaoBaixa"} onClick={() => aplicarAlerta("execucaoBaixa")}>
          {alertas.execucaoBaixa} corretores com execução abaixo de 40%
        </AlertaPill>
      </div>

      {/* Camada 3 — Filtros */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar lead, corretor, região ou operação"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FiltroSelect placeholder="Origem" value={filtros.origem} onChange={(v) => setFiltros({ ...filtros, origem: v })} options={[
            { v: "all", l: "Todas as origens" }, { v: "IA", l: "IA" }, { v: "Inbox", l: "Inbox" }, { v: "Marketplace", l: "Marketplace" }, { v: "Indicação", l: "Indicação" },
          ]} />
          <FiltroSelect placeholder="Região" value={filtros.regiao} onChange={(v) => setFiltros({ ...filtros, regiao: v })} options={[{ v: "all", l: "Todas as regiões" }, ...regioesUnicas.map((r) => ({ v: r, l: r }))]} />
          <FiltroSelect placeholder="Corretor" value={filtros.corretor} onChange={(v) => setFiltros({ ...filtros, corretor: v })} options={[{ v: "all", l: "Todos corretores" }, ...activeBrokers.map((b) => ({ v: b.id, l: b.nome }))]} />
          <FiltroSelect placeholder="Etapa" value={filtros.etapa} onChange={(v) => setFiltros({ ...filtros, etapa: v })} options={[
            { v: "all", l: "Todas etapas" }, { v: "Novo", l: "Novo" }, { v: "Qualificado", l: "Qualificado" }, { v: "Visita", l: "Visita" }, { v: "Proposta", l: "Proposta" }, { v: "Fechado", l: "Fechado" }, { v: "Perdido", l: "Perdido" },
          ]} />
          <FiltroSelect placeholder="Risco" value={filtros.risco} onChange={(v) => setFiltros({ ...filtros, risco: v })} options={[
            { v: "all", l: "Todos riscos" }, { v: "saudavel", l: "Saudável" }, { v: "atencao", l: "Atenção" }, { v: "critico", l: "Crítico" },
          ]} />
          <FiltroSelect placeholder="SLA" value={filtros.sla} onChange={(v) => setFiltros({ ...filtros, sla: v })} options={[
            { v: "all", l: "SLA: todos" }, { v: "ok", l: "SLA Ok" }, { v: "quebrado", l: "SLA Quebrado" },
          ]} />
          <FiltroSelect placeholder="Tipo" value={filtros.tipo} onChange={(v) => setFiltros({ ...filtros, tipo: v })} options={[
            { v: "all", l: "Tipo: todos" }, { v: "Plataforma", l: "Plataforma" }, { v: "Próprio", l: "Próprio" },
          ]} />
          <FiltroSelect placeholder="Score" value={filtros.scoreFx} onChange={(v) => setFiltros({ ...filtros, scoreFx: v })} options={[
            { v: "all", l: "Score: todos" }, { v: "exc", l: "Excelente (70+)" }, { v: "atn", l: "Atenção (40–69)" }, { v: "cri", l: "Crítico (<40)" },
          ]} />
          <FiltroSelect placeholder="VGV" value={filtros.vgvFx} onChange={(v) => setFiltros({ ...filtros, vgvFx: v })} options={[
            { v: "all", l: "VGV: todos" }, { v: "ate500", l: "Até R$ 500k" }, { v: "500a1m", l: "R$ 500k–1M" }, { v: "1ma3m", l: "R$ 1M–3M" }, { v: "3m+", l: "Acima de R$ 3M" },
          ]} />
          {filtrosAtivos && (
            <button
              onClick={() => { setFiltros(filtrosVazios); setBusca(""); setAlerta(null); }}
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Limpar filtros
            </button>
          )}
          <span className="ml-auto text-xs text-muted-foreground">{lista.length} leads</span>
        </div>
      </div>

      {/* Camada 4 — Tabela */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface">
              <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-3">Lead</th>
                <th className="px-3 py-3">Corretor</th>
                <th className="px-3 py-3">Origem</th>
                <th className="px-3 py-3">Tipo</th>
                <th className="px-3 py-3">Etapa</th>
                <th className="px-3 py-3">Score</th>
                <th className="px-3 py-3">SLA</th>
                <th className="px-3 py-3">Última</th>
                <th className="px-3 py-3">Parado</th>
                <th className="px-3 py-3 text-right">VGV</th>
                <th className="px-3 py-3">Risco</th>
                <th className="px-3 py-3">Próxima ação</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lista.map((l) => (
                <tr
                  key={l.id}
                  onClick={() => setSelecionado(l)}
                  className="cursor-pointer hover:bg-surface/60"
                >
                  <td className="px-3 py-3">
                    <div className="font-medium">{l.nome}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{l.id}</div>
                  </td>
                  <td className="px-3 py-3 text-xs">
                    <div>{l.corretor.nome.split(" ").slice(0, 2).join(" ")}</div>
                    <div className="text-[10px] text-muted-foreground">{l.regiao}</div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700">{l.origemAdmin}</span>
                  </td>
                  <td className="px-3 py-3">
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[11px]",
                              l.tipo === "Plataforma" ? "bg-blue-100 text-blue-800" : "bg-muted text-muted-foreground",
                            )}
                          >
                            {l.tipo}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-xs">
                          {l.tipo === "Plataforma"
                            ? "Lead originado pela Ubroker. Pode ser redistribuído pela administração."
                            : "Lead trazido pelo corretor. Carteira própria — admin apenas supervisiona."}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </td>
                  <td className="px-3 py-3 text-xs">{l.status}</td>
                  <td className="px-3 py-3">
                    <span className={cn("rounded-md border px-2 py-0.5 text-[11px] font-medium", tonScore(l.score))}>
                      {l.score}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px]", l.sla.quebrado ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700")}>
                      {l.sla.quebrado ? `Quebrado ${l.sla.restante}` : l.sla.restante}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{l.ultimaInteracao}</td>
                  <td className="px-3 py-3 text-xs">{l.tempoParado.label}</td>
                  <td className="px-3 py-3 text-right num text-xs">{formatBRLcompact(l.orcamento)}</td>
                  <td className="px-3 py-3">
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]", tonRisco[l.risco])}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", l.risco === "saudavel" ? "bg-emerald-500" : l.risco === "atencao" ? "bg-amber-500" : "bg-red-500")} />
                      {labelRisco[l.risco]}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs">
                    <span className={cn(l.proximaAcao !== "Sem ação necessária" ? "font-medium text-foreground" : "text-muted-foreground")}>
                      {l.proximaAcao}
                    </span>
                  </td>
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => setSelecionado(l)}>Ver operação</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSelecionado(l)}>Ver timeline</DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/admin/usuarios">Ver corretor</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {l.tipo === "Plataforma" && (
                          <DropdownMenuItem onClick={() => { setSelecionado(l); setRedistribuirOpen(true); }}>
                            Redistribuir lead
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => { setSelecionado(l); setObservacaoOpen(true); }}>
                          Adicionar observação interna
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.success("Acompanhamento marcado para amanhã, 09h")}>
                          Marcar acompanhamento
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSelecionado(l)}>Abrir auditoria</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.success("Risco sinalizado para revisão da governança")}>
                          Sinalizar risco
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {lista.length === 0 && (
                <tr><td colSpan={13} className="px-3 py-12 text-center text-sm text-muted-foreground">Nenhum lead corresponde aos filtros atuais.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      <LeadDrawer
        lead={selecionado}
        onClose={() => setSelecionado(null)}
        onRedistribuir={() => setRedistribuirOpen(true)}
        onObservacao={() => setObservacaoOpen(true)}
      />

      {/* Redistribuir */}
      <AlertDialog open={redistribuirOpen} onOpenChange={setRedistribuirOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Redistribuir lead da plataforma</AlertDialogTitle>
            <AlertDialogDescription>
              {selecionado && (
                <>
                  O lead <strong>{selecionado.nome}</strong> será redirecionado a outro corretor apto da região <strong>{selecionado.regiao}</strong>. O corretor original perderá o acesso comercial a esta operação.
                  <br /><br />
                  Apenas leads originados pela plataforma podem ser redistribuídos. Carteira própria do corretor é sempre preservada.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setRedistribuirOpen(false); toast.success("Lead redistribuído com sucesso"); }}>
              Confirmar redistribuição
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Observação */}
      <Dialog open={observacaoOpen} onOpenChange={setObservacaoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Observação interna</DialogTitle>
            <DialogDescription>
              Visível apenas para administração e auditoria. Não notifica o corretor.
            </DialogDescription>
          </DialogHeader>
          <Textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Ex.: lead de alto valor, validar cadência manualmente." rows={4} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setObservacaoOpen(false)}>Cancelar</Button>
            <Button onClick={() => { setObservacaoOpen(false); setObservacao(""); toast.success("Observação registrada na auditoria"); }}>
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ Subcomponentes ============

function KpiCard({
  label, value, hint, delta, tone = "neutral",
}: { label: string; value: string | number; hint: string; delta?: string; tone?: "neutral" | "emerald" | "amber" | "red" }) {
  const tonClass =
    tone === "emerald" ? "text-emerald-700" :
    tone === "amber" ? "text-amber-700" :
    tone === "red" ? "text-red-700" : "text-muted-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-[22px] font-medium leading-tight">{value}</div>
      <div className="mt-1 flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground truncate">{hint}</span>
        {delta && <span className={cn("ml-2 shrink-0", tonClass)}>{delta}</span>}
      </div>
    </div>
  );
}

function AlertaPill({
  children, cor, ativo, onClick,
}: { children: React.ReactNode; cor: "red" | "amber" | "yellow"; ativo: boolean; onClick: () => void }) {
  const bg =
    cor === "red" ? "bg-red-50 text-red-700 border-red-100" :
    cor === "amber" ? "bg-amber-50 text-amber-700 border-amber-100" :
    "bg-yellow-50 text-yellow-700 border-yellow-100";
  const dot = cor === "red" ? "bg-red-500" : cor === "amber" ? "bg-amber-500" : "bg-yellow-500";
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition",
        bg,
        ativo ? "ring-2 ring-offset-1 ring-foreground/30" : "hover:opacity-80",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {children}
    </button>
  );
}

function FiltroSelect({
  placeholder, value, onChange, options,
}: { placeholder: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-auto min-w-[8rem] text-xs">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.v} value={o.v} className="text-xs">{o.l}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ============ Drawer ============

function LeadDrawer({
  lead, onClose, onRedistribuir, onObservacao,
}: { lead: LeadView | null; onClose: () => void; onRedistribuir: () => void; onObservacao: () => void }) {
  if (!lead) return null;
  const corretorRiscoData = corretorRisco[lead.corretor.nome];
  const execucao = corretorRiscoData ? Math.max(20, 100 - corretorRiscoData.pctAtraso) : 78;
  const conversaoCorretor = 18 + (seedFromId(lead.corretor.id) % 22);
  const slaCumprido = Math.max(40, 100 - (corretorRiscoData?.pctAtraso ?? 10) - 5);

  const cadenciaItens = [
    { etapa: "Contato inicial", ok: true },
    { etapa: "Qualificação", ok: lead.status !== "Novo" },
    { etapa: "Visita confirmada", ok: ["Visita", "Proposta", "Fechado"].includes(lead.status) },
    { etapa: "Proposta enviada", ok: ["Proposta", "Fechado"].includes(lead.status) },
    { etapa: "Follow-up pós-proposta", ok: lead.status === "Fechado" },
  ];

  const auditoria = [
    { data: "Hoje", evento: "Mudança de etapa", detalhe: `Avançou para ${lead.status}` },
    { data: "Ontem", evento: "Atribuição", detalhe: `Lead atribuído a ${lead.corretor.nome}` },
    ...(lead.proximaAcao === "Verificar risco de bypass"
      ? [{ data: "Há 2 dias", evento: "Suspeita de bypass", detalhe: "Sinal IA: corretor não registrou interação após visita." }]
      : []),
    ...(lead.sla.quebrado ? [{ data: "Há 1 dia", evento: "SLA quebrado", detalhe: "Notificação enviada à governança." }] : []),
  ];

  const fatoresRisco = [
    `Score atual: ${lead.score}`,
    `SLA: ${lead.sla.quebrado ? "quebrado" : "ok"} (${lead.sla.restante})`,
    `Tempo parado: ${lead.tempoParado.label}`,
    `Histórico do corretor: ${(corretorRiscoData?.pctAtraso ?? 0)}% atraso`,
  ];

  return (
    <Sheet open={!!lead} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="text-lg">{lead.nome}</SheetTitle>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="font-mono text-[11px] text-muted-foreground">{lead.id}</span>
            <span className={cn("rounded-full px-2 py-0.5 text-[11px]", lead.tipo === "Plataforma" ? "bg-blue-100 text-blue-800" : "bg-muted text-muted-foreground")}>{lead.tipo}</span>
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]", tonRisco[lead.risco])}>
              <span className={cn("h-1.5 w-1.5 rounded-full", lead.risco === "saudavel" ? "bg-emerald-500" : lead.risco === "atencao" ? "bg-amber-500" : "bg-red-500")} />
              {labelRisco[lead.risco]}
            </span>
            <span className={cn("rounded-md border px-2 py-0.5 text-[11px] font-medium", tonScore(lead.score))}>Score {lead.score}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{lead.status}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">VGV {formatBRLcompact(lead.orcamento)}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">Parado {lead.tempoParado.label}</span>
          </div>
        </SheetHeader>

        <Tabs defaultValue="resumo" className="mt-6">
          <TabsList className="flex w-full flex-wrap h-auto">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="cadencia">Cadência</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="risco">Risco</TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="mt-4 space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Info label="Origem" value={lead.origemAdmin} />
              <Info label="Tipo" value={lead.tipo} />
              <Info label="Responsável" value={lead.corretor.nome} sub={`${lead.corretor.plano} · ${lead.regiao}`} />
              <Info label="Score" value={String(lead.score)} />
              <Info label="Risco" value={labelRisco[lead.risco]} />
              <Info label="VGV" value={formatBRL(lead.orcamento)} />
              <Info label="Estágio" value={lead.status} />
              <Info label="Tempo parado" value={lead.tempoParado.label} />
              <Info label="Execução do corretor" value={`${execucao}%`} />
              <Info label="Conversão histórica" value={`${conversaoCorretor}%`} />
            </div>
            <div className="rounded-lg bg-surface p-3 text-xs text-muted-foreground">{lead.interesse}</div>
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <ol className="relative space-y-4 border-l border-border pl-5 text-sm">
              {lead.historico.map((h, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[26px] mt-1 h-2 w-2 rounded-full bg-foreground" />
                  <div className="text-[11px] text-muted-foreground">{h.data} · {h.tipo}</div>
                  <div>{h.texto}</div>
                </li>
              ))}
              {lead.sla.quebrado && (
                <li className="relative">
                  <span className="absolute -left-[26px] mt-1 h-2 w-2 rounded-full bg-red-500" />
                  <div className="text-[11px] text-red-700">SLA quebrado · {lead.sla.restante}</div>
                  <div>Notificação automática enviada à governança.</div>
                </li>
              )}
            </ol>
          </TabsContent>

          <TabsContent value="cadencia" className="mt-4">
            <ul className="space-y-2 text-sm">
              {cadenciaItens.map((c, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
                  <span>{c.etapa}</span>
                  <span className={cn("text-[11px]", c.ok ? "text-emerald-700" : "text-amber-700")}>
                    {c.ok ? "Cumprido" : "Pendente"}
                  </span>
                </li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="performance" className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Mini label="Execução" value={`${execucao}%`} />
              <Mini label="Conversão" value={`${conversaoCorretor}%`} />
              <Mini label="SLA cumprido" value={`${slaCumprido}%`} />
              <Mini label="Plano" value={lead.corretor.plano} />
            </div>
            <div className="text-xs">
              <Link to="/admin/usuarios" className="text-foreground underline-offset-2 hover:underline">Ver corretor →</Link>
            </div>
          </TabsContent>

          <TabsContent value="auditoria" className="mt-4">
            <ul className="space-y-2 text-sm">
              {auditoria.map((a, i) => (
                <li key={i} className="rounded-lg border border-border bg-card px-3 py-2">
                  <div className="text-[11px] text-muted-foreground">{a.data} · {a.evento}</div>
                  <div>{a.detalhe}</div>
                </li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="financeiro" className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Info label="VGV potencial" value={formatBRL(lead.orcamento)} />
              <Info label="Comissão estimada" value={formatBRL(Math.round(lead.orcamento * 0.03))} />
              <Info label="Status de cobrança" value={lead.status === "Fechado" ? "Faturado" : "Sem cobrança vinculada"} />
              <Info label="Origem da receita" value={lead.tipo === "Plataforma" ? "Ubroker (lead plataforma)" : "Carteira própria"} />
            </div>
          </TabsContent>

          <TabsContent value="risco" className="mt-4 space-y-3">
            <div className="rounded-lg border border-border bg-card p-3 text-sm">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Como o risco foi calculado</div>
              <ul className="space-y-1 text-xs">
                {fatoresRisco.map((f, i) => <li key={i}>• {f}</li>)}
              </ul>
            </div>
            <Button variant="outline" size="sm" onClick={() => toast.success("Risco sinalizado para revisão da governança")}>
              Sinalizar risco
            </Button>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-4">
          {lead.tipo === "Plataforma" && (
            <Button size="sm" onClick={onRedistribuir}>Redistribuir</Button>
          )}
          <Button variant="outline" size="sm" onClick={onObservacao}>Adicionar observação</Button>
          <Button variant="outline" size="sm" onClick={() => toast.success("Acompanhamento marcado para amanhã, 09h")}>Marcar acompanhamento</Button>
          <Button variant="ghost" size="sm" onClick={() => toast.success("Risco sinalizado para revisão da governança")}>Sinalizar risco</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Info({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-surface p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-base font-medium">{value}</div>
    </div>
  );
}
