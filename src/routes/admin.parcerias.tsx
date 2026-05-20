import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Eye,
  FileText,
  Flag,
  GitBranch,
  HandCoins,
  Handshake,
  MapPin,
  PauseCircle,
  Search,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { adminParcerias } from "@/data/admin-mock";
import { formatBRL, formatBRLcompact } from "@/data/mock";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/parcerias")({
  component: ParceriasAdmin,
});

// ============ Helpers determinísticos ============

function seed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
const rnd = (s: string, mod: number) => seed(s) % mod;

type StatusBase = "Ativa" | "Finalizada" | "Cancelada";
type Saude = "saudavel" | "atencao" | "critica" | "expansao" | "inativa";
type Recip = "alta" | "media" | "baixa" | "unilateral";

type Relacao = {
  id: string;
  a: string;
  b: string;
  regiao: string;
  perfil: string;
  ticket: number;
  compat: number; // 0–100
  leadsCompart: number;
  leadsA_B: number;
  leadsB_A: number;
  conversao: number; // %
  receita: number;
  tempoResposta: number; // h
  vgv: number;
  operacoes: number;
  recip: Recip;
  saude: Saude;
  statusBase: StatusBase;
  origem: "Captação" | "Distribuição" | "Match IA" | "Indicação";
  tipoImovel: "Residencial" | "Comercial" | "Luxo" | "Lançamento";
  desde: string;
  comissaoTotal: number;
};

const REGIOES = ["Niterói/RJ", "São Paulo/SP", "Rio/RJ", "Maricá/RJ", "Curitiba/PR"];
const PERFIS = ["Alto padrão", "Médio-alto", "Investidor", "Primeira moradia"];
const TIPOS: Relacao["tipoImovel"][] = ["Residencial", "Comercial", "Luxo", "Lançamento"];
const ORIGENS: Relacao["origem"][] = ["Captação", "Distribuição", "Match IA", "Indicação"];

function buildRelacoes(): Relacao[] {
  // Agrupa por par (captador↔parceiro) somando comissões e operações
  const map = new Map<string, { a: string; b: string; ops: typeof adminParcerias; comissao: number }>();
  for (const p of adminParcerias) {
    const [a, b] = [p.captador, p.parceiro].sort();
    const k = `${a}__${b}`;
    if (!map.has(k)) map.set(k, { a, b, ops: [], comissao: 0 });
    const it = map.get(k)!;
    it.ops.push(p);
    it.comissao += p.comissao;
  }
  // Garante massa visual mínima — adiciona pares sintéticos
  const synth: Array<[string, string]> = [
    ["Carla Fontes", "Joana Maciel"],
    ["Marcos Iglesias", "Beatriz Lemos"],
    ["Tiago Sá", "Rafael Couto"],
    ["Denise Molinaro", "Pedro Verissimo"],
    ["Ramon Capone", "Beatriz Lemos"],
    ["Aldemar Souza", "Carla Fontes"],
    ["Alessandra Freixo", "Marcos Iglesias"],
  ];
  for (const [a, b] of synth) {
    const [x, y] = [a, b].sort();
    const k = `${x}__${y}`;
    if (!map.has(k)) map.set(k, { a: x, b: y, ops: [], comissao: 0 });
  }

  return Array.from(map.entries()).map(([k, v], idx) => {
    const s = seed(k);
    const compat = 55 + (s % 45);
    const leadsA_B = 2 + (rnd(k + "ab", 18));
    const leadsB_A = (rnd(k + "ba", 22));
    const leadsCompart = leadsA_B + leadsB_A;
    const conversao = 4 + (rnd(k + "cv", 38));
    const tempoResposta = 1 + (rnd(k + "tr", 24));
    const ticket = 380_000 + (rnd(k + "tk", 26) * 95_000);
    const vgv = ticket * (1 + (rnd(k + "vg", 6)));
    const receita = v.comissao + (rnd(k + "rc", 180) * 1_200);
    const operacoes = v.ops.length + (rnd(k + "op", 6));

    // reciprocidade
    const ratio = Math.min(leadsA_B, leadsB_A) / Math.max(1, Math.max(leadsA_B, leadsB_A));
    let recip: Recip;
    if (leadsB_A === 0 || leadsA_B === 0) recip = "unilateral";
    else if (ratio > 0.75) recip = "alta";
    else if (ratio > 0.45) recip = "media";
    else recip = "baixa";

    // saúde
    let saude: Saude;
    const hasFin = v.ops.some((o) => o.status === "Finalizada");
    const hasCanc = v.ops.some((o) => o.status === "Cancelada");
    if (hasCanc && conversao < 12) saude = "critica";
    else if (conversao >= 28 && recip !== "unilateral") saude = "expansao";
    else if (operacoes === 0) saude = "inativa";
    else if (tempoResposta > 18 || conversao < 14) saude = "atencao";
    else saude = "saudavel";
    if (hasFin && saude === "inativa") saude = "saudavel";

    const statusBase: StatusBase =
      v.ops.find((o) => o.status === "Ativa") ? "Ativa" :
      v.ops.find((o) => o.status === "Finalizada") ? "Finalizada" :
      v.ops.find((o) => o.status === "Cancelada") ? "Cancelada" : "Ativa";

    return {
      id: `R-${1000 + idx}`,
      a: v.a,
      b: v.b,
      regiao: REGIOES[s % REGIOES.length],
      perfil: PERFIS[(s >> 3) % PERFIS.length],
      ticket,
      compat,
      leadsCompart,
      leadsA_B,
      leadsB_A,
      conversao,
      receita,
      tempoResposta,
      vgv,
      operacoes,
      recip,
      saude,
      statusBase,
      origem: ORIGENS[(s >> 5) % ORIGENS.length],
      tipoImovel: TIPOS[(s >> 7) % TIPOS.length],
      desde: `${1 + (s % 28)}/0${1 + ((s >> 2) % 9)}`,
      comissaoTotal: v.comissao,
    };
  });
}

const SAUDE_LABEL: Record<Saude, string> = {
  saudavel: "Saudável",
  atencao: "Atenção",
  critica: "Crítica",
  expansao: "Em expansão",
  inativa: "Inativa",
};
const RECIP_LABEL: Record<Recip, string> = {
  alta: "Alta reciprocidade",
  media: "Média reciprocidade",
  baixa: "Baixa reciprocidade",
  unilateral: "Relação unilateral",
};

function saudeDot(s: Saude): string {
  return s === "saudavel" ? "bg-emerald-500"
    : s === "expansao" ? "bg-sky-500"
    : s === "atencao" ? "bg-amber-500"
    : s === "critica" ? "bg-red-500"
    : "bg-muted-foreground/40";
}
function recipTone(r: Recip): string {
  return r === "alta" ? "text-emerald-700 bg-emerald-50"
    : r === "media" ? "text-sky-700 bg-sky-50"
    : r === "baixa" ? "text-amber-700 bg-amber-50"
    : "text-muted-foreground bg-surface";
}
function compatTone(c: number): string {
  if (c >= 85) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (c >= 70) return "border-sky-200 bg-sky-50 text-sky-700";
  if (c >= 55) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-border bg-surface text-muted-foreground";
}
function initials(name: string): string {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

// ============ Componente ============

function ParceriasAdmin() {
  const relacoes = useMemo(() => buildRelacoes(), []);
  const [q, setQ] = useState("");
  const [regiao, setRegiao] = useState<string>("all");
  const [saude, setSaude] = useState<string>("all");
  const [recip, setRecip] = useState<string>("all");
  const [tipo, setTipo] = useState<string>("all");
  const [statusF, setStatusF] = useState<string>("all");
  const [origemF, setOrigemF] = useState<string>("all");
  const [compatMin, setCompatMin] = useState<string>("all");
  const [convMin, setConvMin] = useState<string>("all");
  const [ticketF, setTicketF] = useState<string>("all");
  const [selecionada, setSelecionada] = useState<Relacao | null>(null);
  const [alertFiltro, setAlertFiltro] = useState<string | null>(null);

  const filtradas = useMemo(() => {
    return relacoes.filter((r) => {
      if (q) {
        const s = q.toLowerCase();
        if (!`${r.a} ${r.b} ${r.regiao} ${r.id}`.toLowerCase().includes(s)) return false;
      }
      if (regiao !== "all" && r.regiao !== regiao) return false;
      if (saude !== "all" && r.saude !== saude) return false;
      if (recip !== "all" && r.recip !== recip) return false;
      if (tipo !== "all" && r.tipoImovel !== tipo) return false;
      if (statusF !== "all" && r.statusBase !== statusF) return false;
      if (origemF !== "all" && r.origem !== origemF) return false;
      if (compatMin !== "all" && r.compat < Number(compatMin)) return false;
      if (convMin !== "all" && r.conversao < Number(convMin)) return false;
      if (ticketF === "high" && r.ticket < 900_000) return false;
      if (ticketF === "mid" && (r.ticket < 500_000 || r.ticket >= 900_000)) return false;
      if (ticketF === "low" && r.ticket >= 500_000) return false;
      if (alertFiltro === "sem-retorno" && r.tempoResposta < 18) return false;
      if (alertFiltro === "baixa-recip" && r.recip !== "baixa" && r.recip !== "unilateral") return false;
      if (alertFiltro === "alta-conv" && r.conversao < 30) return false;
      if (alertFiltro === "risco" && r.saude !== "critica") return false;
      return true;
    });
  }, [relacoes, q, regiao, saude, recip, tipo, statusF, origemF, compatMin, convMin, ticketF, alertFiltro]);

  // KPIs estratégicos
  const kpis = useMemo(() => {
    const ativas = relacoes.filter((r) => r.statusBase === "Ativa").length;
    const matchAlto = relacoes.filter((r) => r.compat >= 85).length;
    const convMedia = Math.round(
      relacoes.reduce((s, r) => s + r.conversao, 0) / Math.max(1, relacoes.length),
    );
    const receita = relacoes.reduce((s, r) => s + r.receita, 0);
    const risco = relacoes.filter((r) => r.saude === "critica" || r.saude === "atencao").length;
    const leads = relacoes.reduce((s, r) => s + r.leadsCompart, 0);
    const colaborativos = new Map<string, number>();
    for (const r of relacoes) {
      colaborativos.set(r.a, (colaborativos.get(r.a) ?? 0) + r.operacoes);
      colaborativos.set(r.b, (colaborativos.get(r.b) ?? 0) + r.operacoes);
    }
    const top = [...colaborativos.entries()].sort((x, y) => y[1] - x[1])[0];
    return { ativas, matchAlto, convMedia, receita, risco, leads, top };
  }, [relacoes]);

  const alertas = useMemo(() => ([
    { key: "sem-retorno", n: relacoes.reduce((s, r) => s + (r.tempoResposta > 18 ? r.leadsCompart : 0), 0), label: "leads compartilhados sem retorno", tone: "amber" },
    { key: "baixa-recip", n: relacoes.filter((r) => r.recip === "baixa" || r.recip === "unilateral").length, label: "parcerias com baixa reciprocidade", tone: "amber" },
    { key: "alta-conv", n: relacoes.filter((r) => r.conversao >= 30).length, label: "conexões acima de 30% de conversão", tone: "emerald" },
    { key: "risco", n: relacoes.filter((r) => r.saude === "critica").length, label: "conflitos operacionais identificados", tone: "red" },
    { key: "match", n: relacoes.filter((r) => r.compat >= 85 && r.operacoes === 0).length, label: "oportunidades sem parceiro compatível", tone: "sky" },
  ]), [relacoes]);

  return (
    <TooltipProvider delayDuration={120}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl">Parcerias</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Central operacional da colaboração entre corretores da rede.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Activity className="h-3.5 w-3.5" />
            Rede viva · supervisão em tempo real
          </div>
        </div>

        {/* KPIs */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          <KpiCard icon={<Handshake className="h-3.5 w-3.5" />} label="Parcerias ativas" value={kpis.ativas} hint="conexões operacionais" trend="up" delta="+8%" />
          <KpiCard icon={<Sparkles className="h-3.5 w-3.5" />} label="Match alto" value={kpis.matchAlto} hint="compatibilidade ≥ 85%" trend="up" delta="+5" />
          <KpiCard icon={<TrendingUp className="h-3.5 w-3.5" />} label="Conversão compartilhada" value={`${kpis.convMedia}%`} hint="média da rede" trend="up" delta="+2,1pp" />
          <KpiCard icon={<HandCoins className="h-3.5 w-3.5" />} label="Receita compartilhada" value={formatBRLcompact(kpis.receita)} hint="acumulado 90d" trend="up" delta="+14%" />
          <KpiCard icon={<AlertTriangle className="h-3.5 w-3.5" />} label="Parcerias em risco" value={kpis.risco} hint="atenção e críticas" trend="down" delta="-2" tone="amber" />
          <KpiCard icon={<Users className="h-3.5 w-3.5" />} label="Leads compartilhados" value={kpis.leads} hint="volume operacional" trend="up" delta="+22" />
          <KpiCard icon={<Star className="h-3.5 w-3.5" />} label="Mais colaborativo" value={kpis.top ? (kpis.top[0].split(" ")[0]) : "—"} hint={kpis.top ? `${kpis.top[1]} operações` : "—"} trend="flat" />
        </section>

        {/* Alertas operacionais */}
        <section className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface/60 px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Sinais da rede
          </span>
          {alertas.map((a) => (
            <button
              key={a.key}
              onClick={() => setAlertFiltro(alertFiltro === a.key ? null : a.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                alertFiltro === a.key ? "border-foreground/30 bg-background" : "border-border bg-background/40 hover:bg-background",
                a.tone === "amber" && "text-amber-700",
                a.tone === "red" && "text-red-700",
                a.tone === "emerald" && "text-emerald-700",
                a.tone === "sky" && "text-sky-700",
              )}
            >
              <span className="num font-semibold">{a.n}</span>
              <span className="text-muted-foreground">{a.label}</span>
            </button>
          ))}
          {alertFiltro && (
            <button onClick={() => setAlertFiltro(null)} className="ml-auto text-[11px] text-muted-foreground hover:text-foreground">
              limpar
            </button>
          )}
        </section>

        {/* Filtros */}
        <section className="flex flex-wrap items-center gap-2">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar relação, corretor, região…" className="h-8 pl-8 text-xs" />
          </div>
          <FilterSelect value={regiao} setValue={setRegiao} placeholder="Região" options={REGIOES} />
          <FilterSelect value={compatMin} setValue={setCompatMin} placeholder="Compatibilidade" options={[["70","≥ 70%"],["80","≥ 80%"],["90","≥ 90%"]]} />
          <FilterSelect value={convMin} setValue={setConvMin} placeholder="Conversão" options={[["15","≥ 15%"],["25","≥ 25%"],["35","≥ 35%"]]} />
          <FilterSelect value={saude} setValue={setSaude} placeholder="Saúde" options={[["saudavel","Saudável"],["expansao","Em expansão"],["atencao","Atenção"],["critica","Crítica"],["inativa","Inativa"]]} />
          <FilterSelect value={recip} setValue={setRecip} placeholder="Reciprocidade" options={[["alta","Alta"],["media","Média"],["baixa","Baixa"],["unilateral","Unilateral"]]} />
          <FilterSelect value={tipo} setValue={setTipo} placeholder="Tipo de imóvel" options={TIPOS} />
          <FilterSelect value={statusF} setValue={setStatusF} placeholder="Status" options={["Ativa","Finalizada","Cancelada"]} />
          <FilterSelect value={origemF} setValue={setOrigemF} placeholder="Origem" options={ORIGENS} />
          <FilterSelect value={ticketF} setValue={setTicketF} placeholder="Ticket/VGV" options={[["high","Alto (≥ 900k)"],["mid","Médio"],["low","Baixo (< 500k)"]]} />
          <span className="ml-auto text-[11px] text-muted-foreground">
            {filtradas.length} de {relacoes.length} relações
          </span>
        </section>

        {/* Tabela */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-surface">
              <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3">Relação</th>
                <th className="px-4 py-3">Região</th>
                <th className="px-4 py-3">Compat.</th>
                <th className="px-4 py-3 text-right">Leads</th>
                <th className="px-4 py-3 text-right">Conv.</th>
                <th className="px-4 py-3 text-right">Receita</th>
                <th className="px-4 py-3">Reciprocidade</th>
                <th className="px-4 py-3">Saúde</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtradas.map((r) => (
                <tr key={r.id} className="cursor-pointer hover:bg-surface/60" onClick={() => setSelecionada(r)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <PairAvatars a={r.a} b={r.b} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 truncate text-[13px] font-medium">
                          <span className="truncate">{r.a}</span>
                          <ArrowLeftRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                          <span className="truncate">{r.b}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {r.operacoes} ops · desde {r.desde} · {r.origem}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-muted-foreground">{r.regiao}</td>
                  <td className="px-4 py-3">
                    <CompatBadge c={r.compat} />
                  </td>
                  <td className="px-4 py-3 text-right num text-[12px]">{r.leadsCompart}</td>
                  <td className="px-4 py-3 text-right num text-[12px]">{r.conversao}%</td>
                  <td className="px-4 py-3 text-right num text-[12px]">{formatBRLcompact(r.receita)}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]", recipTone(r.recip))}>
                      <ArrowLeftRight className="h-3 w-3" />
                      {RECIP_LABEL[r.recip].replace(" reciprocidade","")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center gap-1.5 text-[12px]">
                          <span className={cn("h-2 w-2 rounded-full", saudeDot(r.saude))} />
                          {SAUDE_LABEL[r.saude]}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        Resposta {r.tempoResposta}h · conv {r.conversao}% · {r.operacoes} ops
                      </TooltipContent>
                    </Tooltip>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[11px]",
                      r.statusBase === "Ativa" && "bg-amber-50 text-amber-700",
                      r.statusBase === "Finalizada" && "bg-emerald-50 text-emerald-700",
                      r.statusBase === "Cancelada" && "bg-red-50 text-red-700",
                    )}>{r.statusBase}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <IconBtn title="Ver operações" onClick={() => setSelecionada(r)}><Eye className="h-3.5 w-3.5" /></IconBtn>
                      <IconBtn title="Ver contrato" onClick={() => toast.info(`Contrato ${r.id}`)}><FileText className="h-3.5 w-3.5" /></IconBtn>
                      <IconBtn title="Pipeline compartilhado" onClick={() => setSelecionada(r)}><GitBranch className="h-3.5 w-3.5" /></IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
              {filtradas.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-sm text-muted-foreground">Nenhuma relação encontrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RelacaoDrawer relacao={selecionada} onClose={() => setSelecionada(null)} />
    </TooltipProvider>
  );
}

// ============ Subcomponentes ============

function KpiCard({
  icon, label, value, hint, trend, delta, tone = "default",
}: {
  icon: React.ReactNode; label: string; value: React.ReactNode; hint?: string;
  trend?: "up" | "down" | "flat"; delta?: string; tone?: "default" | "amber";
}) {
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : null;
  const trendCls = trend === "up" ? "text-emerald-700" : trend === "down" ? "text-amber-700" : "text-muted-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        <span className={cn(tone === "amber" ? "text-amber-700" : "text-foreground/60")}>{icon}</span>
        {label}
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="num font-display text-xl leading-none">{value}</div>
        {delta && (
          <div className={cn("flex items-center gap-0.5 text-[11px]", trendCls)}>
            {TrendIcon && <TrendIcon className="h-3 w-3" />}
            {delta}
          </div>
        )}
      </div>
      {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function FilterSelect({
  value, setValue, placeholder, options,
}: {
  value: string; setValue: (v: string) => void; placeholder: string;
  options: ReadonlyArray<string | readonly [string, string]>;
}) {
  return (
    <Select value={value} onValueChange={setValue}>
      <SelectTrigger className="h-8 w-auto min-w-[120px] text-xs">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {options.map((o) => {
          const [v, l] = Array.isArray(o) ? o : [o, o];
          return <SelectItem key={v} value={v}>{l}</SelectItem>;
        })}
      </SelectContent>
    </Select>
  );
}

function CompatBadge({ c }: { c: number }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] num", compatTone(c))}>
      <Sparkles className="h-3 w-3" />
      {c}%
    </span>
  );
}

function PairAvatars({ a, b }: { a: string; b: string }) {
  return (
    <div className="flex -space-x-1.5">
      <Avatar name={a} />
      <Avatar name={b} />
    </div>
  );
}
function Avatar({ name }: { name: string }) {
  const h = seed(name) % 360;
  return (
    <span
      className="grid h-7 w-7 place-items-center rounded-full border border-background text-[10px] font-semibold text-foreground/80"
      style={{ background: `hsl(${h} 60% 92%)` }}
      title={name}
    >
      {initials(name)}
    </span>
  );
}

function IconBtn({ children, title, onClick }: { children: React.ReactNode; title: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-surface hover:text-foreground"
    >
      {children}
    </button>
  );
}

// ============ Drawer ============

function RelacaoDrawer({ relacao, onClose }: { relacao: Relacao | null; onClose: () => void }) {
  return (
    <Sheet open={!!relacao} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full max-w-[680px] overflow-y-auto p-0 sm:max-w-[680px]">
        {relacao && <DrawerBody r={relacao} />}
      </SheetContent>
    </Sheet>
  );
}

function DrawerBody({ r }: { r: Relacao }) {
  return (
    <>
      <SheetHeader className="space-y-3 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3">
          <PairAvatars a={r.a} b={r.b} />
          <div className="min-w-0">
            <SheetTitle className="flex items-center gap-2 text-base">
              <span className="truncate">{r.a}</span>
              <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="truncate">{r.b}</span>
            </SheetTitle>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {r.id} · {r.regiao} · ativa desde {r.desde}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CompatBadge c={r.compat} />
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]", recipTone(r.recip))}>
            <ArrowLeftRight className="h-3 w-3" /> {RECIP_LABEL[r.recip]}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2 py-0.5 text-[11px]">
            <span className={cn("h-2 w-2 rounded-full", saudeDot(r.saude))} />
            {SAUDE_LABEL[r.saude]}
          </span>
          <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] num">Conv {r.conversao}%</span>
          <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] num">{formatBRL(r.receita)}</span>
        </div>

        {/* AI insight */}
        <div className="rounded-xl border border-border bg-surface/60 p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Leitura da relação
          </div>
          <div className="mt-1 text-sm font-medium">{leituraRelacao(r)}</div>
          <div className="mt-0.5 text-[12px] text-muted-foreground">{racionalRelacao(r)}</div>
        </div>
      </SheetHeader>

      <Tabs defaultValue="resumo" className="px-6 py-4">
        <TabsList className="h-8">
          <TabsTrigger value="resumo" className="text-xs">Resumo</TabsTrigger>
          <TabsTrigger value="ops" className="text-xs">Operações</TabsTrigger>
          <TabsTrigger value="perf" className="text-xs">Performance</TabsTrigger>
          <TabsTrigger value="fin" className="text-xs">Financeiro</TabsTrigger>
          <TabsTrigger value="aud" className="text-xs">Auditoria</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="space-y-4 pt-4">
          <Grid>
            <Field label="Compatibilidade" value={`${r.compat}%`} />
            <Field label="Região compartilhada" value={r.regiao} />
            <Field label="Ticket médio" value={formatBRL(r.ticket)} />
            <Field label="Perfil predominante" value={r.perfil} />
            <Field label="Histórico operacional" value={`${r.operacoes} operações`} />
            <Field label="Tempo médio de parceria" value={`${3 + (seed(r.id) % 14)} meses`} />
          </Grid>
          <Block title="Reciprocidade operacional">
            <ReciprocidadeBar r={r} />
          </Block>
        </TabsContent>

        <TabsContent value="ops" className="space-y-3 pt-4">
          <div className="grid grid-cols-4 gap-2">
            <Mini label="Compartilhados" value={r.leadsCompart} />
            <Mini label="Em andamento" value={Math.max(1, Math.floor(r.leadsCompart * 0.4))} />
            <Mini label="Em proposta" value={Math.max(0, Math.floor(r.leadsCompart * 0.15))} />
            <Mini label="Convertidos" value={Math.max(0, Math.floor(r.leadsCompart * (r.conversao / 100)))} />
          </div>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead className="bg-surface text-[10px] uppercase tracking-widest text-muted-foreground">
                <tr><th className="px-3 py-2 text-left">Imóvel</th><th className="px-3 py-2">Etapa</th><th className="px-3 py-2">Responsável</th><th className="px-3 py-2 text-right">Resultado</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {opsExemplo(r).map((o, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2">{o.imovel}</td>
                    <td className="px-3 py-2 text-muted-foreground">{o.etapa}</td>
                    <td className="px-3 py-2 text-muted-foreground">{o.resp}</td>
                    <td className="px-3 py-2 text-right num">{o.resultado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="perf" className="space-y-3 pt-4">
          <Grid>
            <Field label="Conversão" value={`${r.conversao}%`} />
            <Field label="Tempo médio de resposta" value={`${r.tempoResposta}h`} />
            <Field label="VGV compartilhado" value={formatBRLcompact(r.vgv)} />
            <Field label="Taxa de fechamento" value={`${Math.min(100, Math.round(r.conversao * 0.6))}%`} />
            <Field label="Velocidade operacional" value={r.tempoResposta < 6 ? "Alta" : r.tempoResposta < 18 ? "Média" : "Baixa"} />
            <Field label="Operações concluídas" value={r.operacoes} />
          </Grid>
        </TabsContent>

        <TabsContent value="fin" className="space-y-3 pt-4">
          <Grid>
            <Field label="Receitas compartilhadas" value={formatBRL(r.receita)} />
            <Field label="Comissão histórica" value={formatBRL(r.comissaoTotal)} />
            <Field label="Split operacional" value="50 / 50" />
            <Field label="Volume movimentado" value={formatBRLcompact(r.vgv)} />
          </Grid>
        </TabsContent>

        <TabsContent value="aud" className="space-y-2 pt-4">
          {auditoria(r).map((e, i) => (
            <div key={i} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 text-xs">
              <div>
                <div className="font-medium">{e.titulo}</div>
                <div className="text-[11px] text-muted-foreground">{e.detalhe}</div>
              </div>
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">{e.data}</span>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Ações */}
      <div className="sticky bottom-0 flex flex-wrap gap-2 border-t border-border bg-background/95 px-6 py-3 backdrop-blur">
        <Button size="sm" onClick={() => toast.success("Parceria priorizada")}><Star className="h-3.5 w-3.5" /> Priorizar</Button>
        <Button size="sm" variant="outline" onClick={() => toast.warning("Risco sinalizado")}><Flag className="h-3.5 w-3.5" /> Sinalizar risco</Button>
        <Button size="sm" variant="outline" onClick={() => toast.info("Acompanhamento ativo")}><Activity className="h-3.5 w-3.5" /> Acompanhar</Button>
        <Button size="sm" variant="outline" onClick={() => toast.info("Operações abertas")}><GitBranch className="h-3.5 w-3.5" /> Ver operações</Button>
        <Button size="sm" variant="outline" onClick={() => toast.info("Contrato aberto")}><FileText className="h-3.5 w-3.5" /> Contrato</Button>
        <Button size="sm" variant="ghost" className="ml-auto text-muted-foreground" onClick={() => toast.warning("Parceria suspensa")}>
          <PauseCircle className="h-3.5 w-3.5" /> Suspender
        </Button>
      </div>
    </>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm">{value}</div>
    </div>
  );
}
function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}
function Mini({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface/60 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 num text-sm font-medium">{value}</div>
    </div>
  );
}
function ReciprocidadeBar({ r }: { r: Relacao }) {
  const total = Math.max(1, r.leadsA_B + r.leadsB_A);
  const pa = Math.round((r.leadsA_B / total) * 100);
  const pb = 100 - pa;
  return (
    <div>
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>{r.a} → {r.b}: <span className="num text-foreground">{r.leadsA_B}</span></span>
        <span>{r.b} → {r.a}: <span className="num text-foreground">{r.leadsB_A}</span></span>
      </div>
      <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-surface">
        <div className="bg-sky-500" style={{ width: `${pa}%` }} />
        <div className="bg-emerald-500" style={{ width: `${pb}%` }} />
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">{RECIP_LABEL[r.recip]} — equilíbrio operacional {pa}/{pb}.</div>
    </div>
  );
}

// ============ Conteúdo derivado ============

function leituraRelacao(r: Relacao): string {
  if (r.saude === "expansao") return "Parceria em expansão — alta conversão e reciprocidade saudável.";
  if (r.saude === "critica") return "Parceria com sinais críticos — exige acompanhamento imediato.";
  if (r.recip === "unilateral") return "Relação unilateral — fluxo de leads concentrado em um lado.";
  if (r.conversao >= 25) return "Conexão de alta performance comercial.";
  if (r.tempoResposta > 18) return "Velocidade operacional abaixo do esperado.";
  return "Parceria estável dentro dos padrões da rede.";
}
function racionalRelacao(r: Relacao): string {
  const partes: string[] = [];
  if (r.compat >= 85) partes.push("alta compatibilidade de perfil");
  if (r.recip === "alta") partes.push("reciprocidade equilibrada");
  if (r.recip === "baixa" || r.recip === "unilateral") partes.push("desequilíbrio no fluxo de leads");
  if (r.tempoResposta > 18) partes.push(`resposta média de ${r.tempoResposta}h`);
  if (r.conversao >= 30) partes.push("conversão acima da média da rede");
  return partes.length ? partes.join(" · ") : "Sem sinais relevantes nas últimas semanas.";
}
function opsExemplo(r: Relacao) {
  const base = [
    { imovel: "Cobertura Linear · Icaraí", etapa: "Proposta", resp: r.a, resultado: "Em análise" },
    { imovel: "Apto Charitas · 3q", etapa: "Visita", resp: r.b, resultado: "Agendada" },
    { imovel: "Casa Camboinhas Beach", etapa: "Fechamento", resp: r.a, resultado: "Aprovada" },
    { imovel: "Sala Centro Empresarial", etapa: "Lead", resp: r.b, resultado: "Qualificando" },
  ];
  return base.slice(0, 2 + (seed(r.id) % 3));
}
function auditoria(r: Relacao) {
  return [
    { titulo: "Parceria registrada", detalhe: `Origem: ${r.origem}`, data: `${r.desde}` },
    { titulo: "Redistribuição de lead", detalhe: `${r.b} assumiu atendimento de lead premium`, data: "12/05" },
    { titulo: "Comissão compartilhada liquidada", detalhe: formatBRL(r.comissaoTotal || 12_400), data: "03/05" },
    ...(r.saude === "critica" ? [{ titulo: "Conflito sinalizado", detalhe: "Divergência sobre atribuição de lead", data: "28/04" }] : []),
  ];
}
