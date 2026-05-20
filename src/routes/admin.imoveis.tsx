import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  properties,
  leads as leadsBase,
  formatBRL,
  formatBRLcompact,
  type Property,
} from "@/data/mock";
import { adminBrokers, type AdminBroker } from "@/data/admin-mock";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { MoreHorizontal, Search, Sparkles, Check, X as XIcon } from "lucide-react";

export const Route = createFileRoute("/admin/imoveis")({
  component: ImoveisAdmin,
});

// ============ Helpers determinísticos ============

function seedFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

type Origem = "Plataforma" | "Próprio" | "Proprietário" | "Construtora" | "Parceiro";
type Demanda = "Alta" | "Média" | "Baixa";
type MarketplaceStatus = "Publicado" | "Oculto" | "Pendente" | "Bloqueado";
type ImovelStatus = "Ativo" | "Vendido" | "Suspenso" | "Removido";
type Risco = "saudavel" | "atencao" | "critico";

const activeBrokers = adminBrokers.filter((b) => b.status === "Ativo");

function getCorretor(p: Property): AdminBroker {
  return activeBrokers[seedFromId(p.id) % activeBrokers.length];
}

function getOrigem(p: Property): Origem {
  if (p.marketplace) {
    const opts: Origem[] = ["Plataforma", "Plataforma", "Construtora", "Parceiro"];
    return opts[seedFromId(p.id) % opts.length];
  }
  const opts: Origem[] = ["Próprio", "Próprio", "Próprio", "Proprietário", "Parceiro"];
  return opts[seedFromId(p.id + "x") % opts.length];
}

function getStatus(p: Property): ImovelStatus {
  const s = seedFromId(p.id) % 20;
  if (s < 14) return "Ativo";
  if (s < 17) return "Vendido";
  if (s < 19) return "Suspenso";
  return "Removido";
}

function getDiasAtualizacao(p: Property): number {
  return 1 + (seedFromId(p.id + "atu") % 80);
}

function getLeads(p: Property): { total: number; semana: number } {
  const total = seedFromId(p.id + "ld") % 30;
  const semana = total === 0 ? 0 : seedFromId(p.id + "sm") % Math.max(1, Math.floor(total / 3) + 1);
  return { total, semana };
}

function getConversao(p: Property, leadsTotal: number): number {
  if (leadsTotal === 0) return 0;
  return 5 + (seedFromId(p.id + "cv") % 30);
}

function getDemanda(p: Property, leadsTotal: number): Demanda {
  const score = leadsTotal * 2 + (seedFromId(p.id + "dm") % 20);
  if (score > 35) return "Alta";
  if (score > 15) return "Média";
  return "Baixa";
}

function getMarketplaceStatus(p: Property): MarketplaceStatus {
  if (!p.marketplace) {
    return seedFromId(p.id) % 5 === 0 ? "Bloqueado" : "Oculto";
  }
  const s = seedFromId(p.id + "mk") % 12;
  if (s < 8) return "Publicado";
  if (s < 10) return "Pendente";
  if (s < 11) return "Oculto";
  return "Bloqueado";
}

function getMidia(p: Property): { fotos: number; qualidadePct: number; completo: boolean } {
  const fotos = 4 + (seedFromId(p.id + "mf") % 18);
  const qualidadePct = 40 + (seedFromId(p.id + "mq") % 60);
  const completo = fotos >= 10 && qualidadePct >= 70;
  return { fotos, qualidadePct, completo };
}

function getRisco(
  dias: number,
  demanda: Demanda,
  leadsTotal: number,
  midiaCompleta: boolean,
  mkt: MarketplaceStatus,
): { nivel: Risco; motivos: string[] } {
  const motivos: string[] = [];
  if (dias > 30) motivos.push(`Sem atualização há ${dias} dias`);
  if (demanda === "Baixa" && leadsTotal === 0) motivos.push("Sem leads e demanda baixa");
  if (!midiaCompleta) motivos.push("Mídia/anúncio incompleto");
  if (mkt === "Bloqueado") motivos.push("Marketplace bloqueado");
  if (mkt === "Pendente") motivos.push("Publicação pendente no marketplace");
  let nivel: Risco = "saudavel";
  if (motivos.length === 1) nivel = "atencao";
  if (motivos.length >= 2) nivel = "critico";
  return { nivel, motivos };
}

function getScoreImovel(leadsTotal: number, conversao: number, dias: number): number {
  const base = leadsTotal * 3 + conversao * 2 - Math.floor(dias / 4);
  return Math.max(0, Math.min(100, base));
}

function getTipoImovel(nome: string): string {
  const n = nome.toLowerCase();
  if (n.includes("cobertura")) return "Cobertura";
  if (n.includes("casa")) return "Casa";
  if (n.includes("apart")) return "Apartamento";
  if (n.includes("studio") || n.includes("stúdio")) return "Studio";
  if (n.includes("sala") || n.includes("comerc")) return "Comercial";
  if (n.includes("terreno") || n.includes("lote")) return "Terreno";
  return "Outro";
}

// ============ Camada de inteligência ============

type AcaoKey =
  | "fotos" | "suspender" | "atendimento" | "priorizar"
  | "atualizar" | "reativar" | "nenhuma";

function getInsightsImovel(i: {
  demanda: Demanda; conversao: number; dias: number;
  midia: { completo: boolean; qualidadePct: number };
  leadsInfo: { total: number; semana: number };
  marketplaceStatus: MarketplaceStatus; destaque?: boolean;
}): string[] {
  const out: string[] = [];
  if (i.demanda === "Alta" && i.conversao < 10) out.push("Alta demanda com baixa conversão");
  if (!i.midia.completo) out.push("Anúncio com mídia insuficiente");
  if (i.dias > 45 && i.destaque) out.push("Imóvel premium sem atualização recente");
  if (i.leadsInfo.total > 10 && i.conversao >= 20) out.push("Boa taxa de resposta operacional");
  if (i.leadsInfo.total === 0 && i.dias > 30) out.push("Sem leads há mais de 30 dias");
  if (i.demanda === "Alta" && i.leadsInfo.semana === 0) out.push("Procura alta, atendimento parado esta semana");
  return out.slice(0, 3);
}

function getScoresMarketplace(i: {
  midia: { qualidadePct: number; completo: boolean; fotos: number };
  leadsInfo: { total: number; semana: number };
  conversao: number; dias: number;
}): { seo: number; midia: number; atendimento: number; conversao: number } {
  const seo = Math.max(20, Math.min(100, i.midia.qualidadePct - (i.dias > 30 ? 15 : 0)));
  const midia = Math.max(10, Math.min(100, i.midia.qualidadePct + (i.midia.fotos >= 10 ? 10 : -10)));
  const atendimento = Math.max(10, Math.min(100, 40 + i.leadsInfo.semana * 8));
  const conversao = Math.max(0, Math.min(100, i.conversao * 4));
  return { seo, midia, atendimento, conversao };
}

function getAcaoRecomendada(i: {
  midia: { completo: boolean }; risco: Risco; marketplaceStatus: MarketplaceStatus;
  demanda: Demanda; conversao: number; dias: number; leadsInfo: { total: number };
  origem: Origem;
}): { key: AcaoKey; titulo: string; racional: string } {
  if (!i.midia.completo)
    return { key: "fotos", titulo: "Solicitar novas fotos", racional: "Mídia incompleta está reduzindo CTR no marketplace." };
  if (i.risco === "critico" && i.marketplaceStatus !== "Bloqueado" && i.origem !== "Próprio")
    return { key: "suspender", titulo: "Suspender marketplace", racional: "Risco crítico combinado a baixo desempenho operacional." };
  if (i.demanda === "Alta" && i.conversao < 8)
    return { key: "atendimento", titulo: "Reforçar atendimento dos leads", racional: "Procura alta sem conversão correspondente." };
  if (i.demanda === "Alta" && i.marketplaceStatus !== "Publicado" && i.origem !== "Próprio")
    return { key: "priorizar", titulo: "Priorizar no marketplace", racional: "Imóvel com tração que ainda não está em vitrine." };
  if (i.dias > 30)
    return { key: "atualizar", titulo: "Atualizar descrição e preço", racional: "Anúncio sem manutenção há mais de 30 dias." };
  if (i.leadsInfo.total === 0 && i.dias > 45)
    return { key: "reativar", titulo: "Reativar anúncio", racional: "Sem leads e sem atualização — perdendo relevância." };
  return { key: "nenhuma", titulo: "Sem ação prioritária", racional: "Imóvel operando dentro do esperado." };
}

function getPrevisaoPerformance(i: {
  demanda: Demanda; conversao: number; leadsInfo: { total: number };
}): { label: string; tone: "emerald" | "amber" | "red" | "neutral" } {
  if (i.demanda === "Alta" && i.conversao >= 15) return { label: "Potencial alto de conversão", tone: "emerald" };
  if (i.demanda === "Alta") return { label: "Alta disputa no marketplace", tone: "amber" };
  if (i.demanda === "Baixa" && i.leadsInfo.total < 3) return { label: "Baixa competitividade na região", tone: "neutral" };
  return { label: "Desempenho dentro da média", tone: "neutral" };
}

function getOperacaoImovel(p: Property, leadsTotal: number, demanda: Demanda, conversao: number): {
  leads: number; visitas: number; propostas: number; negligenciados: number; leitura: string;
} {
  const s = seedFromId(p.id + "op");
  const visitas = Math.max(0, Math.floor(leadsTotal / 4) + (s % 4));
  const propostas = Math.max(0, Math.floor(leadsTotal / 8));
  const negligenciados = leadsTotal === 0 ? 0 : 1 + (s % 3);
  const leitura =
    demanda === "Alta" && propostas === 0
      ? "Alta procura com baixa evolução para visita."
      : conversao >= 20
        ? "Conversão acima da média da região."
        : "Leads avançando normalmente no funil.";
  return { leads: leadsTotal, visitas, propostas, negligenciados, leitura };
}

function getSaudeImovel(i: {
  dias: number; conversao: number; demanda: Demanda;
  midia: { completo: boolean }; leadsInfo: { total: number; semana: number };
}): { nivel: Risco; pontos: { label: string; ok: boolean }[] } {
  const pontos = [
    { label: "Atualização recente", ok: i.dias <= 30 },
    { label: "Conversão saudável", ok: i.conversao >= 10 },
    { label: "Demanda compatível", ok: i.demanda !== "Baixa" },
    { label: "Qualidade do anúncio", ok: i.midia.completo },
    { label: "Resposta operacional", ok: i.leadsInfo.semana > 0 || i.leadsInfo.total === 0 },
    { label: "Sem leads negligenciados", ok: i.leadsInfo.total === 0 || i.leadsInfo.semana > 0 },
  ];
  const falhas = pontos.filter((p) => !p.ok).length;
  const nivel: Risco = falhas === 0 ? "saudavel" : falhas <= 2 ? "atencao" : "critico";
  return { nivel, pontos };
}

const tonRisco: Record<Risco, string> = {
  saudavel: "bg-emerald-50 text-emerald-700",
  atencao: "bg-amber-50 text-amber-700",
  critico: "bg-red-50 text-red-700",
};
const dotRisco: Record<Risco, string> = {
  saudavel: "bg-emerald-500",
  atencao: "bg-amber-500",
  critico: "bg-red-500",
};
const labelRisco: Record<Risco, string> = {
  saudavel: "Saudável",
  atencao: "Atenção",
  critico: "Crítico",
};

const tonDemanda: Record<Demanda, string> = {
  Alta: "bg-emerald-50 text-emerald-700",
  Média: "bg-blue-50 text-blue-700",
  Baixa: "bg-muted text-muted-foreground",
};

const tonMarketplace: Record<MarketplaceStatus, string> = {
  Publicado: "bg-emerald-50 text-emerald-700",
  Oculto: "bg-muted text-muted-foreground",
  Pendente: "bg-amber-50 text-amber-700",
  Bloqueado: "bg-red-50 text-red-700",
};

const tonStatus: Record<ImovelStatus, string> = {
  Ativo: "bg-emerald-50 text-emerald-700",
  Vendido: "bg-blue-50 text-blue-700",
  Suspenso: "bg-amber-50 text-amber-700",
  Removido: "bg-red-50 text-red-700",
};

const tonOrigem: Record<Origem, string> = {
  Plataforma: "bg-blue-100 text-blue-800",
  Próprio: "bg-muted text-muted-foreground",
  Proprietário: "bg-surface text-foreground",
  Construtora: "bg-amber-50 text-amber-700",
  Parceiro: "bg-purple-50 text-purple-700",
};

// ============ View model ============

type ImovelView = Property & {
  corretor: AdminBroker;
  origem: Origem;
  status: ImovelStatus;
  dias: number;
  leadsInfo: { total: number; semana: number };
  conversao: number;
  demanda: Demanda;
  marketplaceStatus: MarketplaceStatus;
  midia: { fotos: number; qualidadePct: number; completo: boolean };
  risco: Risco;
  motivosRisco: string[];
  scoreImovel: number;
  tipo: string;
  precoAlterado: boolean;
};

type FiltrosState = {
  regiao: string;
  tipo: string;
  status: string;
  marketplace: string;
  demanda: string;
  atualizacao: string;
  risco: string;
  vgvFx: string;
  corretor: string;
};

const filtrosVazios: FiltrosState = {
  regiao: "all",
  tipo: "all",
  status: "all",
  marketplace: "all",
  demanda: "all",
  atualizacao: "all",
  risco: "all",
  vgvFx: "all",
  corretor: "all",
};

type AlertaKey =
  | "semAtualizacao"
  | "altaDemandaSemAtendimento"
  | "premiumSemFotos"
  | "semLeads45"
  | "precoBrusco";

function ImoveisAdmin() {
  const all: ImovelView[] = useMemo(
    () =>
      properties.map((p) => {
        const corretor = getCorretor(p);
        const origem = getOrigem(p);
        const status = getStatus(p);
        const dias = getDiasAtualizacao(p);
        const leadsInfo = getLeads(p);
        const conversao = getConversao(p, leadsInfo.total);
        const demanda = getDemanda(p, leadsInfo.total);
        const marketplaceStatus = getMarketplaceStatus(p);
        const midia = getMidia(p);
        const { nivel: risco, motivos: motivosRisco } = getRisco(
          dias,
          demanda,
          leadsInfo.total,
          midia.completo,
          marketplaceStatus,
        );
        const scoreImovel = getScoreImovel(leadsInfo.total, conversao, dias);
        const precoAlterado = seedFromId(p.id + "pr") % 11 === 0;
        return {
          ...p,
          corretor,
          origem,
          status,
          dias,
          leadsInfo,
          conversao,
          demanda,
          marketplaceStatus,
          midia,
          risco,
          motivosRisco,
          scoreImovel,
          tipo: getTipoImovel(p.nome),
          precoAlterado,
        };
      }),
    [],
  );

  const kpis = useMemo(() => {
    const ativos = all.filter((i) => i.status === "Ativo").length;
    const altaDemanda = all.filter((i) => i.demanda === "Alta").length;
    const semAtualizacao = all.filter((i) => i.dias > 30).length;
    const semLeads = all.filter((i) => i.leadsInfo.total === 0 && i.status === "Ativo").length;
    const vendasMes = all.filter((i) => i.status === "Vendido").length;
    const vgvAtivo = all.filter((i) => i.status === "Ativo").reduce((s, i) => s + i.valor, 0);
    const emRisco = all.filter((i) => i.risco !== "saudavel").length;
    return { ativos, altaDemanda, semAtualizacao, semLeads, vendasMes, vgvAtivo, emRisco };
  }, [all]);

  const alertas = useMemo(() => {
    return {
      semAtualizacao: all.filter((i) => i.dias > 30).length,
      altaDemandaSemAtendimento: all.filter(
        (i) => i.demanda === "Alta" && i.origem === "Plataforma" && i.leadsInfo.semana === 0,
      ).length,
      premiumSemFotos: all.filter((i) => i.destaque && !i.midia.completo).length,
      semLeads45: all.filter((i) => i.leadsInfo.total === 0 && i.dias > 45).length,
      precoBrusco: all.filter((i) => i.precoAlterado).length,
    };
  }, [all]);

  const [busca, setBusca] = useState("");
  const [filtros, setFiltros] = useState<FiltrosState>(filtrosVazios);
  const [alerta, setAlerta] = useState<AlertaKey | null>(null);
  const [selecionado, setSelecionado] = useState<ImovelView | null>(null);
  const [suspenderOpen, setSuspenderOpen] = useState(false);
  const [solicitarOpen, setSolicitarOpen] = useState(false);
  const [observacao, setObservacao] = useState("");

  const lista = useMemo(() => {
    return all.filter((i) => {
      if (busca) {
        const q = busca.toLowerCase();
        if (
          !i.nome.toLowerCase().includes(q) &&
          !i.corretor.nome.toLowerCase().includes(q) &&
          !i.bairro.toLowerCase().includes(q) &&
          !i.cidade.toLowerCase().includes(q) &&
          !i.id.toLowerCase().includes(q)
        )
          return false;
      }
      if (filtros.regiao !== "all" && i.cidade !== filtros.regiao) return false;
      if (filtros.tipo !== "all" && i.tipo !== filtros.tipo) return false;
      if (filtros.status !== "all" && i.status !== filtros.status) return false;
      if (filtros.marketplace !== "all" && i.marketplaceStatus !== filtros.marketplace) return false;
      if (filtros.demanda !== "all" && i.demanda !== filtros.demanda) return false;
      if (filtros.atualizacao === "rec" && i.dias > 14) return false;
      if (filtros.atualizacao === "30" && i.dias <= 30) return false;
      if (filtros.atualizacao === "60" && i.dias <= 60) return false;
      if (filtros.risco !== "all" && i.risco !== filtros.risco) return false;
      if (filtros.corretor !== "all" && i.corretor.id !== filtros.corretor) return false;
      if (filtros.vgvFx === "ate500" && i.valor >= 500_000) return false;
      if (filtros.vgvFx === "500a1m" && (i.valor < 500_000 || i.valor >= 1_000_000)) return false;
      if (filtros.vgvFx === "1ma3m" && (i.valor < 1_000_000 || i.valor >= 3_000_000)) return false;
      if (filtros.vgvFx === "3m+" && i.valor < 3_000_000) return false;

      if (alerta === "semAtualizacao" && i.dias <= 30) return false;
      if (
        alerta === "altaDemandaSemAtendimento" &&
        !(i.demanda === "Alta" && i.origem === "Plataforma" && i.leadsInfo.semana === 0)
      )
        return false;
      if (alerta === "premiumSemFotos" && !(i.destaque && !i.midia.completo)) return false;
      if (alerta === "semLeads45" && !(i.leadsInfo.total === 0 && i.dias > 45)) return false;
      if (alerta === "precoBrusco" && !i.precoAlterado) return false;
      return true;
    });
  }, [all, busca, filtros, alerta]);

  const filtrosAtivos =
    Object.values(filtros).some((v) => v !== "all") || busca.length > 0 || alerta !== null;

  const regioesUnicas = Array.from(new Set(all.map((i) => i.cidade))).sort();
  const tiposUnicos = Array.from(new Set(all.map((i) => i.tipo))).sort();

  const aplicarAlerta = (k: AlertaKey) => setAlerta(alerta === k ? null : k);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Imóveis</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Central operacional do inventário — supervisão da saúde dos ativos da rede.
        </p>
      </div>

      {/* Camada 1 — KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <KpiCard label="Imóveis ativos" value={kpis.ativos} hint="Publicados na rede" delta="+12" tone="emerald" />
        <KpiCard label="Alta demanda" value={kpis.altaDemanda} hint="Alta geração de leads" delta="+6" tone="emerald" />
        <KpiCard label="Sem atualização" value={kpis.semAtualizacao} hint="Há mais de 30 dias" delta="+4" tone="amber" />
        <KpiCard label="Sem leads" value={kpis.semLeads} hint="Baixa tração comercial" delta="+9" tone="amber" />
        <KpiCard label="Vendas do mês" value={kpis.vendasMes} hint="Imóveis convertidos" delta="+3" tone="emerald" />
        <KpiCard label="VGV ativo da rede" value={formatBRLcompact(kpis.vgvAtivo)} hint="Estoque ativo" delta="+R$ 8M" tone="emerald" />
        <KpiCard label="Em risco" value={kpis.emRisco} hint="Problemas operacionais" delta="+2" tone="red" />
      </div>

      {/* Camada 2 — Alertas */}
      <div className="flex flex-wrap gap-2">
        <AlertaPill cor="yellow" ativo={alerta === "semAtualizacao"} onClick={() => aplicarAlerta("semAtualizacao")}>
          {alertas.semAtualizacao} imóveis sem atualização há mais de 30 dias
        </AlertaPill>
        <AlertaPill cor="red" ativo={alerta === "altaDemandaSemAtendimento"} onClick={() => aplicarAlerta("altaDemandaSemAtendimento")}>
          {alertas.altaDemandaSemAtendimento} marketplace com alta demanda sem atendimento
        </AlertaPill>
        <AlertaPill cor="yellow" ativo={alerta === "premiumSemFotos"} onClick={() => aplicarAlerta("premiumSemFotos")}>
          {alertas.premiumSemFotos} anúncios premium sem fotos completas
        </AlertaPill>
        <AlertaPill cor="amber" ativo={alerta === "semLeads45"} onClick={() => aplicarAlerta("semLeads45")}>
          {alertas.semLeads45} imóveis sem leads há mais de 45 dias
        </AlertaPill>
        <AlertaPill cor="red" ativo={alerta === "precoBrusco"} onClick={() => aplicarAlerta("precoBrusco")}>
          {alertas.precoBrusco} imóveis com alteração brusca de preço
        </AlertaPill>
      </div>

      {/* Camada 3 — Filtros */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar imóvel, corretor, bairro ou código"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FiltroSelect placeholder="Região" value={filtros.regiao} onChange={(v) => setFiltros({ ...filtros, regiao: v })}
            options={[{ v: "all", l: "Todas as regiões" }, ...regioesUnicas.map((r) => ({ v: r, l: r }))]} />
          <FiltroSelect placeholder="Tipo" value={filtros.tipo} onChange={(v) => setFiltros({ ...filtros, tipo: v })}
            options={[{ v: "all", l: "Todos os tipos" }, ...tiposUnicos.map((t) => ({ v: t, l: t }))]} />
          <FiltroSelect placeholder="Status" value={filtros.status} onChange={(v) => setFiltros({ ...filtros, status: v })} options={[
            { v: "all", l: "Todos status" }, { v: "Ativo", l: "Ativo" }, { v: "Vendido", l: "Vendido" }, { v: "Suspenso", l: "Suspenso" }, { v: "Removido", l: "Removido" },
          ]} />
          <FiltroSelect placeholder="Marketplace" value={filtros.marketplace} onChange={(v) => setFiltros({ ...filtros, marketplace: v })} options={[
            { v: "all", l: "Marketplace: todos" }, { v: "Publicado", l: "Publicado" }, { v: "Oculto", l: "Oculto" }, { v: "Pendente", l: "Pendente" }, { v: "Bloqueado", l: "Bloqueado" },
          ]} />
          <FiltroSelect placeholder="Demanda" value={filtros.demanda} onChange={(v) => setFiltros({ ...filtros, demanda: v })} options={[
            { v: "all", l: "Demanda: todas" }, { v: "Alta", l: "Alta" }, { v: "Média", l: "Média" }, { v: "Baixa", l: "Baixa" },
          ]} />
          <FiltroSelect placeholder="Atualização" value={filtros.atualizacao} onChange={(v) => setFiltros({ ...filtros, atualizacao: v })} options={[
            { v: "all", l: "Atualização: todas" }, { v: "rec", l: "Recente (≤14d)" }, { v: "30", l: "> 30 dias" }, { v: "60", l: "> 60 dias" },
          ]} />
          <FiltroSelect placeholder="Risco" value={filtros.risco} onChange={(v) => setFiltros({ ...filtros, risco: v })} options={[
            { v: "all", l: "Todos riscos" }, { v: "saudavel", l: "Saudável" }, { v: "atencao", l: "Atenção" }, { v: "critico", l: "Crítico" },
          ]} />
          <FiltroSelect placeholder="VGV" value={filtros.vgvFx} onChange={(v) => setFiltros({ ...filtros, vgvFx: v })} options={[
            { v: "all", l: "VGV: todos" }, { v: "ate500", l: "Até R$ 500k" }, { v: "500a1m", l: "R$ 500k–1M" }, { v: "1ma3m", l: "R$ 1M–3M" }, { v: "3m+", l: "Acima de R$ 3M" },
          ]} />
          <FiltroSelect placeholder="Corretor" value={filtros.corretor} onChange={(v) => setFiltros({ ...filtros, corretor: v })}
            options={[{ v: "all", l: "Todos corretores" }, ...activeBrokers.map((b) => ({ v: b.id, l: b.nome }))]} />
          {filtrosAtivos && (
            <button
              onClick={() => { setFiltros(filtrosVazios); setBusca(""); setAlerta(null); }}
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Limpar filtros
            </button>
          )}
          <span className="ml-auto text-xs text-muted-foreground">{lista.length} imóveis</span>
        </div>
      </div>

      {/* Camada 4 — Tabela */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface">
              <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-3">Imóvel</th>
                <th className="px-3 py-3">Corretor</th>
                <th className="px-3 py-3">Origem</th>
                <th className="px-3 py-3">Leads</th>
                <th className="px-3 py-3">Conversão</th>
                <th className="px-3 py-3">Atualização</th>
                <th className="px-3 py-3">Demanda</th>
                <th className="px-3 py-3">Marketplace</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Risco</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lista.map((i) => {
                const invasivasBloqueadas = i.origem === "Próprio";
                return (
                  <tr
                    key={i.id}
                    onClick={() => setSelecionado(i)}
                    className="cursor-pointer hover:bg-surface/60"
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <img src={i.foto} alt="" className="h-10 w-14 rounded-md object-cover" />
                        <div className="min-w-0">
                          <div className="font-medium leading-tight">{i.nome}</div>
                          <div className="font-mono text-[10px] text-muted-foreground">
                            {i.id} · {i.area}m² · {i.bairro}
                          </div>
                          {(() => {
                            const ins = getInsightsImovel(i)[0];
                            return ins ? (
                              <div className="mt-0.5 flex items-center gap-1 text-[10px] italic text-muted-foreground">
                                <Sparkles className="h-2.5 w-2.5" /> {ins}
                              </div>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      <div>{i.corretor.nome.split(" ").slice(0, 2).join(" ")}</div>
                      <div className="text-[10px] text-muted-foreground">{i.cidade}</div>
                    </td>
                    <td className="px-3 py-3">
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className={cn("rounded-full px-2 py-0.5 text-[11px]", tonOrigem[i.origem])}>
                              {i.origem}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs text-xs">
                            {i.origem === "Plataforma" || i.origem === "Construtora" || i.origem === "Parceiro"
                              ? "Ativo de marketplace da plataforma — admin pode priorizar ou suspender."
                              : "Imóvel pertence operacionalmente ao corretor. Admin apenas supervisiona."}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      <div className="font-medium">{i.leadsInfo.total}</div>
                      <div className="text-[10px] text-muted-foreground">{i.leadsInfo.semana} esta semana</div>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="num">{i.conversao}%</span>
                        <div className="h-1 w-12 rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-1 rounded-full",
                              i.conversao >= 20 ? "bg-emerald-500" : i.conversao >= 10 ? "bg-amber-500" : "bg-red-500",
                            )}
                            style={{ width: `${Math.min(100, i.conversao * 3)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[11px]",
                        i.dias > 60 ? "bg-red-50 text-red-700" :
                        i.dias > 30 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700",
                      )}>
                        há {i.dias}d
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px]", tonDemanda[i.demanda])}>{i.demanda}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px]", tonMarketplace[i.marketplaceStatus])}>
                        {i.marketplaceStatus}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px]", tonStatus[i.status])}>{i.status}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]", tonRisco[i.risco])}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", dotRisco[i.risco])} />
                        {labelRisco[i.risco]}
                      </span>
                    </td>
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onClick={() => setSelecionado(i)}>Ver operação</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSelecionado(i)}>Ver leads vinculados</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSelecionado(i)}>Ver histórico</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toast.success("Risco sinalizado para revisão da governança")}>
                            Sinalizar risco
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={invasivasBloqueadas}
                            onClick={() => { setSelecionado(i); setSuspenderOpen(true); }}
                          >
                            Suspender anúncio
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={invasivasBloqueadas}
                            onClick={() => toast.success("Anúncio priorizado no marketplace")}
                          >
                            Priorizar no marketplace
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
              {lista.length === 0 && (
                <tr><td colSpan={11} className="px-3 py-12 text-center text-sm text-muted-foreground">Nenhum imóvel corresponde aos filtros atuais.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      <ImovelDrawer
        imovel={selecionado}
        onClose={() => setSelecionado(null)}
        onSuspender={() => setSuspenderOpen(true)}
        onSolicitar={() => setSolicitarOpen(true)}
      />

      {/* Suspender marketplace */}
      <AlertDialog open={suspenderOpen} onOpenChange={setSuspenderOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspender anúncio do marketplace</AlertDialogTitle>
            <AlertDialogDescription>
              {selecionado && (
                <>
                  O anúncio <strong>{selecionado.nome}</strong> será removido temporariamente da vitrine pública. O corretor continua com acesso operacional ao imóvel.
                  <br /><br />
                  Apenas ativos da plataforma podem ser suspensos pela administração. Imóveis próprios são preservados.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setSuspenderOpen(false); toast.success("Anúncio suspenso no marketplace"); }}>
              Confirmar suspensão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Solicitar atualização */}
      <Dialog open={solicitarOpen} onOpenChange={setSolicitarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar atualização ao corretor</DialogTitle>
            <DialogDescription>
              Mensagem enviada ao responsável pelo imóvel. Registrada na auditoria.
            </DialogDescription>
          </DialogHeader>
          <Textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Ex.: anúncio sem atualização há mais de 30 dias, verificar preço e fotos." rows={4} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSolicitarOpen(false)}>Cancelar</Button>
            <Button onClick={() => { setSolicitarOpen(false); setObservacao(""); toast.success("Solicitação enviada ao corretor"); }}>
              Enviar solicitação
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

function ImovelDrawer({
  imovel, onClose, onSuspender, onSolicitar,
}: { imovel: ImovelView | null; onClose: () => void; onSuspender: () => void; onSolicitar: () => void }) {
  if (!imovel) return null;
  const invasivasBloqueadas = imovel.origem === "Próprio";

  // Leads vinculados (heurística por bairro/cidade)
  const leadsVinculados = leadsBase
    .filter((l) => {
      const t = l.interesse.toLowerCase();
      return t.includes(imovel.bairro.toLowerCase()) || t.includes(imovel.cidade.toLowerCase());
    })
    .slice(0, 6);

  const visualizacoes = 120 + (seedFromId(imovel.id + "vw") % 1800);
  const visitas = Math.floor(imovel.leadsInfo.total / 3) + (seedFromId(imovel.id + "vi") % 4);
  const propostas = Math.max(0, Math.floor(imovel.leadsInfo.total / 6));
  const tempoMedioVenda = 28 + (seedFromId(imovel.id + "tv") % 70);

  const leituraPerformance =
    imovel.demanda === "Alta" && imovel.conversao < 10
      ? "Alta demanda com baixa conversão — revisar atendimento e cadência."
      : imovel.conversao >= 20
        ? "Conversão acima da média da região."
        : "Performance dentro da média da região.";

  const leituraResumo =
    imovel.dias > 30
      ? `Imóvel com ${imovel.demanda === "Alta" ? "alta procura" : "demanda " + imovel.demanda.toLowerCase()} em ${imovel.bairro}. Sem atualização há ${imovel.dias} dias.`
      : `Imóvel com ${imovel.demanda === "Alta" ? "alta procura" : "demanda " + imovel.demanda.toLowerCase()} em ${imovel.bairro}. Atualização recente, fluxo operacional normal.`;

  const canais = imovel.marketplaceStatus === "Publicado"
    ? ["Ubroker Marketplace", "Portal de parceiros", "Vitrine pública"]
    : imovel.marketplaceStatus === "Oculto" ? ["—"]
    : imovel.marketplaceStatus === "Pendente" ? ["Pendente de aprovação"]
    : ["Bloqueado pela governança"];

  const qualidadeAnuncio: { label: string; tone: "emerald" | "amber" | "red" } =
    imovel.midia.completo && imovel.destaque ? { label: "Anúncio premium", tone: "emerald" }
    : !imovel.midia.completo ? { label: "Anúncio incompleto", tone: "amber" }
    : { label: "Mídia suficiente", tone: "emerald" };

  const atualizacoes = [
    { data: "Há 2 dias", evento: "Republicação", detalhe: "Anúncio reapresentado ao marketplace" },
    { data: `Há ${Math.min(imovel.dias, 10)} dias`, evento: "Troca de fotos", detalhe: "5 imagens substituídas" },
    { data: `Há ${imovel.dias} dias`, evento: "Última atualização", detalhe: "Edição de descrição" },
    ...(imovel.precoAlterado ? [{ data: "Há 4 dias", evento: "Alteração de preço", detalhe: "Variação > 8% sinalizada pela IA" }] : []),
  ];

  const auditoria = [
    { data: "Hoje", autor: imovel.corretor.nome, acao: "Atualizou descrição do imóvel" },
    ...(imovel.precoAlterado ? [{ data: "Há 4 dias", autor: imovel.corretor.nome, acao: "Alterou preço do imóvel" }] : []),
    ...(imovel.marketplaceStatus === "Bloqueado" ? [{ data: "Há 7 dias", autor: "Admin", acao: "Suspendeu anúncio no marketplace" }] : []),
    { data: "Há 14 dias", autor: imovel.corretor.nome, acao: "Publicou o imóvel na rede" },
  ];

  // Camada de inteligência
  const acao = getAcaoRecomendada(imovel);
  const saude = getSaudeImovel(imovel);
  const scores = getScoresMarketplace(imovel);
  const previsao = getPrevisaoPerformance(imovel);
  const operacao = getOperacaoImovel(imovel, imovel.leadsInfo.total, imovel.demanda, imovel.conversao);
  const insights = getInsightsImovel(imovel);
  const temVideo = seedFromId(imovel.id + "vd") % 3 === 0;
  const descricaoCompleta = imovel.midia.qualidadePct >= 60;
  const indicadores = [
    { label: "Qualidade das fotos", ok: imovel.midia.qualidadePct >= 70 },
    { label: "Quantidade ideal de fotos (≥10)", ok: imovel.midia.fotos >= 10 },
    { label: "Vídeo do imóvel", ok: temVideo },
    { label: "Descrição completa", ok: descricaoCompleta },
    { label: "Atualização recente (≤30d)", ok: imovel.dias <= 30 },
    { label: "Destaque premium ativo", ok: !!imovel.destaque },
  ];
  const leituraMkt =
    !imovel.midia.completo && imovel.leadsInfo.total > 5
      ? "Boa geração de leads, porém anúncio com baixa qualidade visual."
      : !descricaoCompleta
        ? "Descrição incompleta impactando performance no marketplace."
        : imovel.demanda === "Alta"
          ? "Imóvel acima da média de procura da região."
          : "Anúncio saudável dentro do padrão da rede.";
  // Leads quick stats
  const leadEmRisco = Math.max(0, Math.floor(imovel.leadsInfo.total * 0.18));
  const leadSemResposta = Math.max(0, Math.floor(imovel.leadsInfo.total * 0.22));
  const leadEmProposta = operacao.propostas;
  const leadConvertidos = Math.max(0, Math.floor(imovel.leadsInfo.total * (imovel.conversao / 100)));

  return (
    <Sheet open={!!imovel} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <div className="flex items-start gap-3">
            <img src={imovel.foto} alt="" className="h-16 w-24 rounded-md object-cover" />
            <div className="min-w-0">
              <SheetTitle className="text-lg leading-tight">{imovel.nome}</SheetTitle>
              <div className="mt-1 font-mono text-[11px] text-muted-foreground">{imovel.id} · {imovel.bairro} · {imovel.cidade}</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-3">
            <span className={cn("rounded-full px-2 py-0.5 text-[11px]", tonOrigem[imovel.origem])}>{imovel.origem}</span>
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]", tonRisco[imovel.risco])}>
              <span className={cn("h-1.5 w-1.5 rounded-full", dotRisco[imovel.risco])} />
              {labelRisco[imovel.risco]}
            </span>
            <span className={cn("rounded-full px-2 py-0.5 text-[11px]", tonDemanda[imovel.demanda])}>Demanda {imovel.demanda}</span>
            <span className={cn("rounded-full px-2 py-0.5 text-[11px]", tonStatus[imovel.status])}>{imovel.status}</span>
            <span className={cn("rounded-full px-2 py-0.5 text-[11px]", tonMarketplace[imovel.marketplaceStatus])}>{imovel.marketplaceStatus}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">VGV {formatBRLcompact(imovel.valor)}</span>
          </div>
        </SheetHeader>

        <Tabs defaultValue="resumo" className="mt-6">
          <TabsList className="flex w-full flex-wrap h-auto">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="atualizacoes">Atualizações</TabsTrigger>
            <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="mt-4 space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Info label="Corretor responsável" value={imovel.corretor.nome} sub={`${imovel.corretor.plano} · ${imovel.corretor.cidade}`} />
              <Info label="Origem" value={imovel.origem} />
              <Info label="VGV" value={formatBRL(imovel.valor)} />
              <Info label="Score do imóvel" value={String(imovel.scoreImovel)} />
              <Info label="Status" value={imovel.status} />
              <Info label="Demanda" value={imovel.demanda} />
              <Info label="Leads gerados" value={String(imovel.leadsInfo.total)} sub={`${imovel.leadsInfo.semana} esta semana`} />
              <Info label="Conversão" value={`${imovel.conversao}%`} />
              <Info label="Tempo anunciado" value={`${imovel.dias} dias`} />
              <Info label="Tipo" value={imovel.tipo} sub={`${imovel.area}m² · ${imovel.quartos}q`} />
            </div>
            <div className="rounded-lg bg-surface p-3 text-xs text-muted-foreground">{leituraResumo}</div>
          </TabsContent>

          <TabsContent value="leads" className="mt-4">
            {leadsVinculados.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-6 text-center text-xs text-muted-foreground">
                Nenhum lead vinculado identificado nesta região.
              </div>
            ) : (
              <ul className="space-y-2">
                {leadsVinculados.map((l) => (
                  <li key={l.id} className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{l.nome}</div>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{l.status}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">{l.id} · {l.origem} · {l.ultimaInteracao}</div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 text-xs">
              <Link to="/admin/leads" className="text-foreground underline-offset-2 hover:underline">Ver todos no painel de leads →</Link>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Mini label="Visualizações" value={String(visualizacoes)} />
              <Mini label="Leads" value={String(imovel.leadsInfo.total)} />
              <Mini label="Visitas" value={String(visitas)} />
              <Mini label="Propostas" value={String(propostas)} />
              <Mini label="Conversão" value={`${imovel.conversao}%`} />
              <Mini label="Tempo médio de venda" value={`${tempoMedioVenda}d`} />
            </div>
            <div className="rounded-lg bg-surface p-3 text-xs text-muted-foreground">{leituraPerformance}</div>
          </TabsContent>

          <TabsContent value="marketplace" className="mt-4 space-y-3 text-sm">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Canais publicados</div>
              <ul className="mt-2 space-y-1 text-xs">
                {canais.map((c, i) => <li key={i} className="rounded-md border border-border bg-card px-3 py-1.5">{c}</li>)}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Mini label="Fotos" value={String(imovel.midia.fotos)} />
              <Mini label="Qualidade" value={`${imovel.midia.qualidadePct}%`} />
              <Mini label="SEO/descritivo" value={imovel.midia.qualidadePct > 60 ? "Ok" : "Revisar"} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Score de mídia</div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className={cn(
                    "h-2 rounded-full",
                    imovel.midia.qualidadePct >= 70 ? "bg-emerald-500" : imovel.midia.qualidadePct >= 50 ? "bg-amber-500" : "bg-red-500",
                  )}
                  style={{ width: `${imovel.midia.qualidadePct}%` }}
                />
              </div>
            </div>
            <div>
              <span className={cn(
                "rounded-full px-2 py-0.5 text-[11px]",
                qualidadeAnuncio.tone === "emerald" ? "bg-emerald-50 text-emerald-700" :
                qualidadeAnuncio.tone === "amber" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700",
              )}>
                {qualidadeAnuncio.label}
              </span>
            </div>
          </TabsContent>

          <TabsContent value="atualizacoes" className="mt-4">
            <ol className="relative space-y-4 border-l border-border pl-5 text-sm">
              {atualizacoes.map((a, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[26px] mt-1 h-2 w-2 rounded-full bg-foreground" />
                  <div className="text-[11px] text-muted-foreground">{a.data} · {a.evento}</div>
                  <div>{a.detalhe}</div>
                </li>
              ))}
            </ol>
          </TabsContent>

          <TabsContent value="auditoria" className="mt-4">
            <ul className="space-y-2 text-sm">
              {auditoria.map((a, i) => (
                <li key={i} className="rounded-lg border border-border bg-card px-3 py-2">
                  <div className="text-[11px] text-muted-foreground">{a.data} · {a.autor}</div>
                  <div>{a.acao}</div>
                </li>
              ))}
            </ul>
            {imovel.motivosRisco.length > 0 && (
              <div className="mt-4 rounded-lg border border-border bg-card p-3 text-sm">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Motivos do risco operacional</div>
                <ul className="space-y-1 text-xs">
                  {imovel.motivosRisco.map((m, i) => <li key={i}>• {m}</li>)}
                </ul>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/leads">Ver leads vinculados</Link>
          </Button>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    size="sm"
                    disabled={invasivasBloqueadas}
                    onClick={() => toast.success("Anúncio priorizado no marketplace")}
                  >
                    Priorizar anúncio
                  </Button>
                </span>
              </TooltipTrigger>
              {invasivasBloqueadas && (
                <TooltipContent className="text-xs">Imóvel próprio do corretor — supervisão apenas.</TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <Button variant="outline" size="sm" onClick={onSolicitar}>Solicitar atualização</Button>
          <Button variant="ghost" size="sm" onClick={() => toast.success("Risco sinalizado para revisão da governança")}>
            Sinalizar risco
          </Button>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={invasivasBloqueadas}
                    onClick={onSuspender}
                  >
                    Suspender marketplace
                  </Button>
                </span>
              </TooltipTrigger>
              {invasivasBloqueadas && (
                <TooltipContent className="text-xs">Imóvel próprio do corretor — supervisão apenas.</TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
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
