import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Flame,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Send,
  Snowflake,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  COMISSAO_RATE,
  formatBRL,
  getLeadOps,
  leads,
  type Lead,
  type LeadEtapa,
  type LeadOps,
  type LeadOrigin,
  type LeadStatus,
  type ProximaAcaoTipo,
} from "@/data/mock";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/app/leads")({
  component: LeadsPage,
});

const statusColor: Record<LeadStatus, string> = {
  Novo: "bg-slate-100 text-slate-700",
  Qualificado: "bg-blue-50 text-blue-700",
  Visita: "bg-orange-50 text-orange-800",
  Proposta: "bg-violet-50 text-violet-800",
  Fechado: "bg-emerald-50 text-emerald-800",
  Perdido: "bg-red-50 text-red-700",
};

const etapaColor: Record<string, string> = {
  Novo: "bg-slate-100 text-slate-700",
  "Tentativa de contato": "bg-amber-50 text-amber-800",
  Contatado: "bg-sky-50 text-sky-800",
  Qualificado: "bg-blue-50 text-blue-700",
  Atendimento: "bg-indigo-50 text-indigo-800",
  Visita: "bg-orange-50 text-orange-800",
  Proposta: "bg-violet-50 text-violet-800",
  Venda: "bg-emerald-50 text-emerald-800",
  Perdido: "bg-red-50 text-red-700",
};

const tempMeta = {
  quente: { label: "Quente", chip: "bg-red-50 text-red-700 border border-red-100", icon: <Flame className="h-3 w-3" /> },
  morno: { label: "Morno", chip: "bg-amber-50 text-amber-800 border border-amber-100", icon: <Zap className="h-3 w-3" /> },
  frio: { label: "Frio", chip: "bg-sky-50 text-sky-700 border border-sky-100", icon: <Snowflake className="h-3 w-3" /> },
} as const;

function getComissao(v: number) {
  return v * COMISSAO_RATE;
}

function isOrigemQualificada(o: LeadOrigin) {
  return o === "Indicação" || o === "Marketplace";
}

const TIPOS = ["cobertura", "casa", "apartamento", "studio", "loft", "sala", "terreno"];
const REGIOES = ["Icaraí", "Santa Rosa", "São Francisco", "Charitas", "Ingá", "Itacoatiara", "Camboinhas", "Niterói", "Itaipu", "Pendotiba", "Piratininga"];

function inferTipo(s: string) {
  const l = s.toLowerCase();
  const h = TIPOS.find((t) => l.includes(t));
  return h ? h.charAt(0).toUpperCase() + h.slice(1) : "Imóvel residencial";
}
function inferRegiao(s: string) {
  const h = REGIOES.filter((r) => s.includes(r));
  return h.length ? h.slice(0, 2).join(" · ") : "Niterói / RJ";
}

// --- prioridade ---
function getPrioridadeScore(ops: LeadOps): number {
  if (ops.proximaAcao.status === "atrasado") return 100;
  if (ops.temperatura === "quente") return 80;
  if (ops.etapa === "Novo" && ops.proximaAcao.status === "hoje") return 70;
  if (ops.visitas?.some((v) => v.data.toLowerCase().startsWith("hoje"))) return 65;
  if (ops.etapa === "Proposta") return 60;
  if (ops.temperatura === "morno") return 40;
  return 10;
}
function getPrioridadeBorder(ops: LeadOps): string {
  if (ops.proximaAcao.status === "atrasado") return "border-l-red-500";
  if (ops.temperatura === "quente") return "border-l-orange-400";
  if (ops.etapa === "Novo") return "border-l-sky-400";
  if (ops.proximaAcao.status === "hoje" || ops.proximaAcao.status === "proximo") return "border-l-emerald-400";
  return "border-l-slate-200";
}

const badgeComercialMap = {
  manual: { label: "Meu lead", tone: "bg-slate-100 text-slate-700 border-slate-200" },
  plataforma: { label: "Lead da Plataforma", tone: "bg-blue-50 text-blue-700 border-blue-100" },
  ia: { label: "Lead via IA", tone: "bg-violet-50 text-violet-800 border-violet-100" },
  parceria: { label: "Lead de Parceria", tone: "bg-amber-50 text-amber-800 border-amber-100" },
} as const;

function getProximaAcaoIcon(tipo: ProximaAcaoTipo) {
  switch (tipo) {
    case "ligar":
      return <Phone className="h-3.5 w-3.5" />;
    case "whatsapp":
      return <MessageCircle className="h-3.5 w-3.5" />;
    case "confirmar-visita":
      return <Calendar className="h-3.5 w-3.5" />;
    case "enviar-imoveis":
      return <Send className="h-3.5 w-3.5" />;
    default:
      return <Clock className="h-3.5 w-3.5" />;
  }
}

const proxStatusChip: Record<string, string> = {
  hoje: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  atrasado: "bg-red-50 text-red-700 border border-red-100",
  proximo: "bg-slate-100 text-slate-700 border border-slate-200",
  concluido: "bg-muted text-muted-foreground border border-border",
};

type FiltroRapido = "Todos" | "Hoje" | "Atrasados" | "Sem contato" | "Quentes" | "Visitas" | "Proposta" | "Perdidos";
const FILTROS: FiltroRapido[] = ["Todos", "Hoje", "Atrasados", "Sem contato", "Quentes", "Visitas", "Proposta", "Perdidos"];

function matchFiltro(l: Lead, ops: LeadOps, f: FiltroRapido): boolean {
  switch (f) {
    case "Todos":
      return true;
    case "Hoje":
      return ops.proximaAcao.status === "hoje";
    case "Atrasados":
      return ops.proximaAcao.status === "atrasado";
    case "Sem contato":
      return ops.etapa === "Novo" || ops.etapa === "Tentativa de contato";
    case "Quentes":
      return ops.temperatura === "quente";
    case "Visitas":
      return !!ops.visitas?.length || ops.etapa === "Visita";
    case "Proposta":
      return ops.etapa === "Proposta" || l.status === "Proposta";
    case "Perdidos":
      return l.status === "Perdido" || ops.etapa === "Perdido";
  }
}

const SCRIPTS = [
  { titulo: "Primeiro contato", texto: "Olá {nome}, aqui é o Ramon, da Ubroker. Recebi seu interesse e separei algumas opções alinhadas com o seu perfil. Posso te ligar em 10 min para entender melhor o que procura?" },
  { titulo: "Reativação", texto: "Oi {nome}, tudo bem? Surgiram opções novas que combinam com o que conversamos. Faz sentido reabrirmos a busca?" },
  { titulo: "Confirmação de visita", texto: "Oi {nome}, passando para confirmar nossa visita hoje. Endereço e horário combinados seguem firmes. Posso confirmar?" },
  { titulo: "Pós-visita", texto: "{nome}, obrigado pelo tempo de hoje. Resumindo: pontos fortes do imóvel + os pontos de atenção. Quais foram suas impressões?" },
  { titulo: "Proposta", texto: "{nome}, segue a proposta formal conforme alinhamos. Validade de 48h. Qualquer ajuste me avise para reformularmos com o vendedor." },
];

function LeadsPage() {
  const [selected, setSelected] = useState<Lead>(leads[0]);
  const [filtro, setFiltro] = useState<FiltroRapido>("Todos");
  const [busca, setBusca] = useState("");
  const [opOpen, setOpOpen] = useState(false);
  const [opTab, setOpTab] = useState("execucao");

  const opsMap = useMemo(() => {
    const m = new Map<string, LeadOps>();
    leads.forEach((l) => m.set(l.id, getLeadOps(l.id)));
    return m;
  }, []);

  const ordenados = useMemo(() => {
    return [...leads].sort((a, b) => getPrioridadeScore(opsMap.get(b.id)!) - getPrioridadeScore(opsMap.get(a.id)!));
  }, [opsMap]);

  const filtrados = useMemo(() => {
    return ordenados.filter((l) => {
      const ops = opsMap.get(l.id)!;
      if (!matchFiltro(l, ops, filtro)) return false;
      if (busca && !`${l.nome} ${l.id}`.toLowerCase().includes(busca.toLowerCase())) return false;
      return true;
    });
  }, [ordenados, opsMap, filtro, busca]);

  // KPIs do dia
  const kpis = useMemo(() => {
    let acoesHoje = 0,
      atrasadas = 0,
      semContato = 0,
      visitasHoje = 0,
      vgvQuentes = 0;
    leads.forEach((l) => {
      const ops = opsMap.get(l.id)!;
      if (ops.proximaAcao.status === "hoje") acoesHoje++;
      if (ops.proximaAcao.status === "atrasado") atrasadas++;
      if (ops.etapa === "Novo") semContato++;
      if (ops.visitas?.some((v) => v.data.toLowerCase().startsWith("hoje"))) visitasHoje++;
      if (ops.temperatura === "quente") vgvQuentes += l.orcamento;
    });
    return { acoesHoje, atrasadas, semContato, visitasHoje, vgvQuentes };
  }, [opsMap]);

  const selOps = opsMap.get(selected.id)!;
  const selBadge = badgeComercialMap[selOps.vinculo.origemComercial];

  const fakeAction = (msg: string) => () => toast.success(msg);

  const openOp = (tab = "execucao") => {
    setOpTab(tab);
    setOpOpen(true);
  };

  const avancarEtapa = () => {
    const ordem: LeadEtapa[] = ["Novo", "Tentativa de contato", "Contatado", "Qualificado", "Atendimento", "Visita", "Proposta", "Venda"];
    const i = ordem.indexOf(selOps.etapa);
    const next = ordem[Math.min(i + 1, ordem.length - 1)];
    selOps.etapa = next;
    toast.success(`Etapa avançada para "${next}"`);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl">Leads</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sua central diária de execução comercial. Veja o que fazer, quando fazer e quais oportunidades priorizar.
        </p>
      </header>

      {/* Execução de hoje */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <KpiCard accent="emerald" label="ações previstas" value={kpis.acoesHoje} sub="Ligações, WhatsApp e follow-ups." icon={<CheckCircle2 className="h-4 w-4" />} />
        <KpiCard accent="red" label="tarefas atrasadas" value={kpis.atrasadas} sub="Cadência fora do prazo." icon={<Clock className="h-4 w-4" />} />
        <KpiCard accent="sky" label="leads sem contato" value={kpis.semContato} sub="Aguardando primeira abordagem." icon={<Sparkles className="h-4 w-4" />} />
        <KpiCard accent="blue" label="visitas hoje" value={kpis.visitasHoje} sub="Atendimentos confirmados." icon={<Calendar className="h-4 w-4" />} />
        <KpiCard accent="amber" label="VGV em leads quentes" value={formatBRL(kpis.vgvQuentes)} sub="Potencial estimado prioritário." icon={<Flame className="h-4 w-4" />} compact />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
        <section className="rounded-2xl border border-border bg-card">
          {/* Filtros rápidos */}
          <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
            {FILTROS.map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition",
                  filtro === f ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-border p-4">
            <div className="flex flex-1 items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm text-muted-foreground">
              <Search className="h-4 w-4" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar lead por nome ou ID"
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fakeAction("Filtros avançados em breve")} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                <Filter className="h-4 w-4" /> Filtros
              </button>
              <button onClick={fakeAction("Novo lead criado")} className="inline-flex items-center gap-2 rounded-md bg-navy px-3 py-2 text-sm text-navy-foreground">
                <Plus className="h-4 w-4" /> Novo lead
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Origem</th>
                  <th className="px-4 py-3">Potencial</th>
                  <th className="px-4 py-3">Etapa</th>
                  <th className="px-4 py-3">Próxima ação</th>
                  <th className="px-4 py-3">Prazo</th>
                  <th className="px-4 py-3">Última interação</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((l) => {
                  const ops = opsMap.get(l.id)!;
                  const tm = tempMeta[ops.temperatura];
                  const bComercial = badgeComercialMap[ops.vinculo.origemComercial];
                  return (
                    <tr
                      key={l.id}
                      onClick={() => setSelected(l)}
                      className={cn(
                        "cursor-pointer border-b border-l-4 border-border transition hover:bg-surface",
                        getPrioridadeBorder(ops),
                        selected.id === l.id && "bg-surface",
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-full bg-surface text-xs font-medium">
                            {l.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{l.nome}</span>
                              <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium", tm.chip)}>
                                {tm.icon}
                                {tm.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{l.id}</span>
                              {ops.alertas?.[0] && <span className="text-[11px] text-red-600">· {ops.alertas[0]}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm">{l.origem}</span>
                          {l.origemDetalhe && l.origem === "Outro" && (
                            <span className="text-xs text-muted-foreground">{l.origemDetalhe}</span>
                          )}
                          <span className={cn("inline-flex w-fit rounded border px-1.5 py-0.5 text-[10px]", bComercial.tone)}>
                            {bComercial.label}
                          </span>
                        </div>
                      </td>
                      <td className="num px-4 py-3">
                        <div>{formatBRL(l.orcamento)}</div>
                        <div className="text-xs text-emerald-700">Comissão {formatBRL(getComissao(l.orcamento))}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs", etapaColor[ops.etapa] ?? "bg-muted")}>{ops.etapa}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="grid h-6 w-6 place-items-center rounded-full bg-surface text-muted-foreground">
                            {getProximaAcaoIcon(ops.proximaAcao.tipo)}
                          </span>
                          <div>
                            <div className="text-sm">{ops.proximaAcao.label}</div>
                            <span className={cn("inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium capitalize", proxStatusChip[ops.proximaAcao.status])}>
                              {ops.proximaAcao.status === "proximo" ? "Próximo" : ops.proximaAcao.status}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className={cn("px-4 py-3 text-xs", ops.proximaAcao.status === "atrasado" && "font-medium text-red-600")}>
                        {ops.proximaAcao.prazo}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        <div>{ops.ultimoCanal ?? "—"} · {l.ultimaInteracao}</div>
                        {ops.ultimoResumo && <div className="max-w-[180px] truncate">{ops.ultimoResumo}</div>}
                      </td>
                    </tr>
                  );
                })}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      Nenhum lead corresponde ao filtro atual.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Painel lateral */}
        <aside className="sticky top-24 h-fit space-y-4 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-muted-foreground">{selected.id}</div>
              <div className="font-display text-2xl">{selected.nome}</div>
              <div className="mt-1 flex items-center gap-2">
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", tempMeta[selOps.temperatura].chip)}>
                  {tempMeta[selOps.temperatura].icon}
                  {tempMeta[selOps.temperatura].label}
                </span>
                <span className={cn("rounded-full px-2 py-0.5 text-[11px]", etapaColor[selOps.etapa])}>{selOps.etapa}</span>
              </div>
            </div>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs", statusColor[selected.status])}>{selected.status}</span>
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div>{selected.email}</div>
            <div>{selected.telefone}</div>
          </div>

          {/* Próxima ação recomendada */}
          <div className="rounded-xl border border-brand/20 bg-brand/5 p-4">
            <div className="text-[11px] font-medium uppercase tracking-widest text-brand">Próxima ação recomendada</div>
            <div className="mt-1 text-base font-semibold">{selOps.proximaAcao.label}</div>
            {selOps.proximaAcao.motivo && <p className="mt-1 text-xs text-muted-foreground">{selOps.proximaAcao.motivo}</p>}
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className={cn("rounded px-1.5 py-0.5 font-medium", proxStatusChip[selOps.proximaAcao.status])}>
                {selOps.proximaAcao.prazo}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button onClick={fakeAction("Ligando…")} className="inline-flex items-center justify-center gap-1 rounded-md bg-navy px-2 py-2 text-xs text-navy-foreground">
                <Phone className="h-3.5 w-3.5" /> Ligar
              </button>
              <button onClick={fakeAction("Abrindo WhatsApp…")} className="inline-flex items-center justify-center gap-1 rounded-md border border-border bg-card px-2 py-2 text-xs">
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </button>
              <button onClick={fakeAction("Interação registrada")} className="inline-flex items-center justify-center gap-1 rounded-md border border-border bg-card px-2 py-2 text-xs">
                Registrar
              </button>
            </div>
          </div>

          {/* Ações rápidas */}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={fakeAction("Interação registrada")} className="rounded-md border border-border px-3 py-2 text-xs">Registrar interação</button>
            <button onClick={fakeAction("Visita agendada")} className="rounded-md border border-border px-3 py-2 text-xs">Agendar visita</button>
            <button onClick={avancarEtapa} className="rounded-md border border-border px-3 py-2 text-xs">Avançar etapa</button>
            <button onClick={fakeAction("Lead marcado como perdido")} className="rounded-md border border-border px-3 py-2 text-xs">Marcar perdido</button>
            <button onClick={() => openOp("execucao")} className="col-span-2 rounded-md bg-foreground px-3 py-2 text-xs text-background">
              Ver operação completa
            </button>
          </div>

          {/* Resumo rápido */}
          <div className="rounded-xl border border-border p-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Resumo rápido</div>
            <dl className="mt-2 space-y-1.5 text-sm">
              <Row label="Tipo de imóvel" value={selOps.qualificacao?.tipoImovel ?? inferTipo(selected.interesse)} />
              <Row label="Região" value={selOps.qualificacao?.regiao ?? inferRegiao(selected.interesse)} />
              <Row label="Orçamento" value={formatBRL(selected.orcamento)} mono />
              <Row label="Comissão estimada" value={formatBRL(getComissao(selected.orcamento))} mono />
            </dl>
          </div>

          {/* Origem */}
          <div className="rounded-xl bg-surface p-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Origem</div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
              <span>{selected.origem}{selected.origemDetalhe ? ` · ${selected.origemDetalhe}` : ""}</span>
              {isOrigemQualificada(selected.origem) && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-800">qualificada</span>
              )}
              <span className={cn("rounded border px-1.5 py-0.5 text-[10px]", selBadge.tone)}>{selBadge.label}</span>
            </div>
          </div>

          {/* Interesse */}
          <div className="rounded-xl border border-border p-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Interesse</div>
            <p className="mt-2 text-sm leading-relaxed">{selected.interesse}</p>
          </div>

          {/* Regras vinculadas */}
          <div className="rounded-xl border border-border p-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Regras vinculadas</div>
            <dl className="mt-2 space-y-1.5 text-sm">
              <Row label="Origem comercial" value={selBadge.label} />
              <Row label="Fee aplicável" value={selOps.vinculo.feeAplicavel ? "Sim" : "Não"} />
              {selOps.vinculo.contratoId && <Row label="Contrato" value={selOps.vinculo.contratoId} mono />}
              {selOps.vinculo.parceiro && <Row label="Parceiro" value={selOps.vinculo.parceiro} />}
              {selOps.vinculo.resumoVinculo && (
                <p className="pt-2 text-xs text-muted-foreground">{selOps.vinculo.resumoVinculo}</p>
              )}
            </dl>
          </div>

          {/* Histórico curto */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Histórico</div>
              <button onClick={() => openOp("historico")} className="text-[11px] font-medium text-brand">Ver tudo</button>
            </div>
            <ol className="space-y-3">
              {selected.historico.slice(0, 3).map((h, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <div className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", i === 0 ? "bg-brand ring-2 ring-brand/20" : "bg-muted-foreground/40")} />
                  <div>
                    <div className="text-xs text-muted-foreground">{h.data} · {h.tipo}</div>
                    <div className={cn(i === 0 && "font-medium")}>{h.texto}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>

      {/* Modal Operação do Lead */}
      <Dialog open={opOpen} onOpenChange={setOpOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Operação do Lead — {selected.nome}</DialogTitle>
          </DialogHeader>
          <Tabs value={opTab} onValueChange={setOpTab} className="mt-2">
            <TabsList className="flex w-full flex-wrap">
              <TabsTrigger value="execucao">Execução</TabsTrigger>
              <TabsTrigger value="cadencia">Cadência</TabsTrigger>
              <TabsTrigger value="interacoes">Interações</TabsTrigger>
              <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
              <TabsTrigger value="visitas">Visitas</TabsTrigger>
              <TabsTrigger value="qualificacao">Qualificação</TabsTrigger>
              <TabsTrigger value="scripts">Scripts</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="execucao" className="space-y-4 pt-4">
              <div className="rounded-lg border border-brand/20 bg-brand/5 p-4">
                <div className="text-xs uppercase tracking-widest text-brand">Próxima ação</div>
                <div className="mt-1 text-lg font-semibold">{selOps.proximaAcao.label}</div>
                <div className="text-xs text-muted-foreground">{selOps.proximaAcao.motivo}</div>
                <div className="mt-2 text-xs">{selOps.proximaAcao.prazo}</div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-border p-4">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">Tarefas de hoje</div>
                  <ul className="mt-2 space-y-1 text-sm">
                    {selOps.cadencia.filter((c) => c.status === "pendente").map((c, i) => (
                      <li key={i}>• {c.titulo}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-red-100 bg-red-50/50 p-4">
                  <div className="text-xs uppercase tracking-widest text-red-700">Atrasadas</div>
                  <ul className="mt-2 space-y-1 text-sm">
                    {selOps.cadencia.filter((c) => c.status === "atrasado").map((c, i) => (
                      <li key={i}>• {c.titulo}</li>
                    ))}
                    {selOps.cadencia.filter((c) => c.status === "atrasado").length === 0 && (
                      <li className="text-muted-foreground">Sem atrasos.</li>
                    )}
                  </ul>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={avancarEtapa} className="rounded-md bg-navy px-3 py-2 text-xs text-navy-foreground">Avançar etapa</button>
                <button onClick={fakeAction("Interação registrada")} className="rounded-md border border-border px-3 py-2 text-xs">Registrar interação</button>
              </div>
            </TabsContent>

            <TabsContent value="cadencia" className="space-y-3 pt-4">
              {selOps.cadencia.map((c, i) => (
                <div key={i} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Dia {c.dia}</div>
                    <div>{c.titulo}</div>
                  </div>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] capitalize", c.status === "concluido" ? "bg-emerald-50 text-emerald-700" : c.status === "atrasado" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-700")}>
                    {c.status}
                  </span>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="interacoes" className="space-y-3 pt-4">
              <ol className="space-y-3">
                {selected.historico.map((h, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" />
                    <div>
                      <div className="text-xs text-muted-foreground">{h.data} · {h.tipo}</div>
                      <div>{h.texto}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </TabsContent>

            <TabsContent value="whatsapp" className="space-y-3 pt-4">
              <div className="rounded-md border border-border p-3 text-sm">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Última mensagem</div>
                <div className="mt-1">{selOps.ultimoResumo ?? "Sem mensagens recentes."}</div>
              </div>
              <div className="rounded-md border border-emerald-200 bg-emerald-50/50 p-3 text-sm">
                <div className="text-[10px] uppercase tracking-widest text-emerald-700">Sugestão de mensagem</div>
                <p className="mt-1">
                  {SCRIPTS.find((s) => s.titulo.toLowerCase().includes(selOps.etapa.toLowerCase()))?.texto.replace("{nome}", selected.nome.split(" ")[0]) ??
                    SCRIPTS[0].texto.replace("{nome}", selected.nome.split(" ")[0])}
                </p>
                <button onClick={fakeAction("Mensagem enviada via WhatsApp")} className="mt-2 inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs text-white">
                  <Send className="h-3 w-3" /> Enviar mensagem sugerida
                </button>
              </div>
            </TabsContent>

            <TabsContent value="visitas" className="space-y-3 pt-4">
              {(selOps.visitas ?? []).map((v, i) => (
                <div key={i} className="rounded-md border border-border p-3 text-sm">
                  <div className="font-medium">{v.imovel}</div>
                  <div className="text-xs text-muted-foreground">{v.data} · {v.status}</div>
                  {v.feedback && <div className="mt-1 text-xs">Feedback: {v.feedback}</div>}
                </div>
              ))}
              {!selOps.visitas?.length && <div className="text-sm text-muted-foreground">Nenhuma visita registrada.</div>}
            </TabsContent>

            <TabsContent value="qualificacao" className="pt-4">
              <dl className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                {Object.entries(selOps.qualificacao ?? {}).map(([k, v]) => (
                  <div key={k} className="rounded-md border border-border p-3">
                    <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</dt>
                    <dd className="mt-1">{typeof v === "number" ? formatBRL(v) : String(v)}</dd>
                  </div>
                ))}
                {!selOps.qualificacao && <div className="text-muted-foreground">Sem qualificação registrada.</div>}
              </dl>
            </TabsContent>

            <TabsContent value="scripts" className="space-y-3 pt-4">
              {SCRIPTS.map((s) => (
                <div key={s.titulo} className="rounded-md border border-border p-3">
                  <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{s.titulo}</div>
                  <p className="mt-1 text-sm">{s.texto.replace("{nome}", selected.nome.split(" ")[0])}</p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="historico" className="pt-4">
              <ol className="space-y-3">
                {selected.historico.map((h, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" />
                    <div>
                      <div className="text-xs text-muted-foreground">{h.data} · {h.tipo}</div>
                      <div>{h.texto}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("text-right font-medium", mono && "num")}>{value}</dd>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon,
  accent,
  compact,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  accent: "emerald" | "red" | "sky" | "blue" | "amber";
  compact?: boolean;
}) {
  const tones: Record<string, string> = {
    emerald: "border-emerald-100",
    red: "border-red-200 bg-red-50/40",
    sky: "border-sky-100",
    blue: "border-blue-100",
    amber: "border-amber-200 bg-amber-50/40",
  };
  return (
    <div className={cn("rounded-xl border bg-card p-3", tones[accent])}>
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[10px] uppercase tracking-widest">{label}</span>
        {icon}
      </div>
      <div className={cn("mt-1 font-display", compact ? "text-xl" : "text-2xl")}>{value}</div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}
