import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Sparkles,
  Bot,
  User,
  Pause,
  Play,
  Settings2,
  UserCheck,
  MessageCircle,
  Clock,
  TrendingUp,
  Wifi,
  QrCode,
  Target,
  ArrowRight,
} from "lucide-react";
import { aiConversations } from "@/data/mock";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export const Route = createFileRoute("/app/ia")({
  component: AIPage,
});

const TONS = ["Consultivo", "Premium", "Direto"] as const;
const OBJETIVOS = ["Qualificar leads", "Agendar visitas", "Enviar imóveis"] as const;
const AUTONOMIAS = ["Total", "Assistido", "Apenas triagem"] as const;

const TRANSFERIR = [
  { id: "qualificacao", label: "Após qualificação completa" },
  { id: "pediu", label: "Quando o cliente pedir explicitamente" },
  { id: "compra", label: "Quando detectar intenção de compra" },
];
const PARAR = [
  { id: "sem-resposta", label: "Lead sem resposta há 24h" },
  { id: "fora-horario", label: "Fora do horário comercial" },
  { id: "sem-evolucao", label: "Mais de 10 mensagens sem evolução" },
];

const intencoes: Record<string, { intencao: string; cor: string; proxima: string }> = {
  "AI-1": { intencao: "Compra ativa", cor: "bg-emerald-100 text-emerald-700", proxima: "Enviar 3 opções de apto em Icaraí até 14h" },
  "AI-2": { intencao: "Pronta para visita", cor: "bg-blue-100 text-blue-700", proxima: "Confirmar visita sábado 10h com Renata" },
  "AI-3": { intencao: "Investimento — pesquisa", cor: "bg-amber-100 text-amber-800", proxima: "Enviar relatório de rentabilidade Itacoatiara" },
};

// QR Code mock — pseudo-pattern fixo
const QR_BITS = (() => {
  const seed = "ubroker-ia-qr-2025";
  const arr: boolean[] = [];
  for (let i = 0; i < 144; i++) {
    const c = seed.charCodeAt(i % seed.length);
    arr.push(((c * (i + 7)) % 5) < 2);
  }
  // cantos típicos de QR
  [0, 1, 12, 13, 132, 133].forEach(() => {});
  return arr;
})();

function AIPage() {
  const [active, setActive] = useState(aiConversations[0].id);
  const [iaAtiva, setIaAtiva] = useState(true);
  const [tom, setTom] = useState<(typeof TONS)[number]>("Consultivo");
  const [objetivo, setObjetivo] = useState<(typeof OBJETIVOS)[number]>("Qualificar leads");
  const [autonomia, setAutonomia] = useState<(typeof AUTONOMIAS)[number]>("Assistido");
  const [transferir, setTransferir] = useState<Set<string>>(new Set(["qualificacao", "pediu"]));
  const [parar, setParar] = useState<Set<string>>(new Set(["sem-resposta", "fora-horario"]));

  const conv = aiConversations.find((c) => c.id === active)!;
  const intel = intencoes[conv.id];
  const ultimasMsgs = useMemo(() => conv.mensagens.slice(-4), [conv]);

  const toggleSet = (set: Set<string>, setter: (s: Set<string>) => void, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-brand" /> Central de controle
          </div>
          <h1 className="mt-1 font-display text-3xl">IA Assistente</h1>
          <p className="text-sm text-muted-foreground">
            Configure, monitore e entenda o desempenho do seu atendente virtual.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setIaAtiva((v) => !v);
              toast.success(iaAtiva ? "IA pausada" : "IA reativada");
            }}
          >
            {iaAtiva ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {iaAtiva ? "Pausar IA" : "Ativar IA"}
          </Button>
          <Button
            variant="outline"
            onClick={() => document.getElementById("comportamento")?.scrollIntoView({ behavior: "smooth" })}
          >
            <Settings2 className="h-4 w-4" /> Editar comportamento
          </Button>
          <Button
            className="bg-navy text-navy-foreground hover:bg-navy/90"
            onClick={() => toast.success("Você assumiu a conversa")}
          >
            <UserCheck className="h-4 w-4" /> Assumir conversa
          </Button>
        </div>
      </header>

      {/* 1. Status da IA */}
      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Status</div>
            <span
              className={cn(
                "inline-flex h-2.5 w-2.5 rounded-full",
                iaAtiva ? "animate-pulse bg-emerald-500" : "bg-muted-foreground/40",
              )}
            />
          </div>
          <div className="mt-2 font-display text-xl">{iaAtiva ? "IA ativa" : "IA pausada"}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {iaAtiva ? "Atendendo leads automaticamente · 24/7" : "Nenhuma resposta automática no momento"}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Canal</div>
            <MessageCircle className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 font-display text-xl">WhatsApp conectado</div>
          <div className="mt-1 text-xs text-muted-foreground">+55 21 9 9999-0000 · sessão ativa</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Tempo médio resposta</div>
            <Clock className="h-4 w-4 text-brand" />
          </div>
          <div className="mt-2 font-display text-xl num">12s</div>
          <div className="mt-1 text-xs text-muted-foreground">Últimas 24h · 96% das conversas</div>
        </div>
      </section>

      {/* 2. Performance */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> Performance
            </div>
            <div className="font-display text-lg">Últimos 30 dias</div>
          </div>
          <div className="text-xs text-muted-foreground">Comparado ao mês anterior</div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Leads atendidos", v: "32", delta: "+18%" },
            { label: "Leads qualificados", v: "18", delta: "+24%" },
            { label: "Visitas geradas", v: "9", delta: "+12%" },
            { label: "Taxa de resposta", v: "96%", delta: "+3 pts" },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-border bg-background p-4">
              <div className="text-xs text-muted-foreground">{m.label}</div>
              <div className="mt-1 flex items-baseline gap-2">
                <div className="font-display text-3xl num">{m.v}</div>
                <span className="text-xs font-medium text-emerald-600 num">{m.delta}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Configuração + Conexão */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        {/* Configuração */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <Settings2 className="h-3.5 w-3.5 text-brand" /> Configuração da IA
            </div>
            <div className="font-display text-lg">Como sua IA conversa com os leads</div>
          </div>

          <ConfigRow
            label="Tom de voz"
            options={TONS as readonly string[]}
            value={tom}
            onChange={(v) => {
              setTom(v as typeof tom);
              toast.success("Configuração atualizada");
            }}
          />
          <ConfigRow
            label="Objetivo da IA"
            options={OBJETIVOS as readonly string[]}
            value={objetivo}
            onChange={(v) => {
              setObjetivo(v as typeof objetivo);
              toast.success("Configuração atualizada");
            }}
          />
          <ConfigRow
            label="Nível de autonomia"
            options={AUTONOMIAS as readonly string[]}
            value={autonomia}
            onChange={(v) => {
              setAutonomia(v as typeof autonomia);
              toast.success("Configuração atualizada");
            }}
          />
          <p className="mt-4 text-xs text-muted-foreground">
            <Target className="mr-1 inline h-3 w-3" />
            Mudanças entram em vigor nas próximas conversas iniciadas pela IA.
          </p>
        </div>

        {/* Conexão WhatsApp */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                <Wifi className="h-3.5 w-3.5 text-emerald-600" /> Conexão
              </div>
              <div className="font-display text-lg">WhatsApp</div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Conectado
            </span>
          </div>

          <div className="mx-auto grid w-fit grid-cols-12 gap-px rounded-lg border border-border bg-background p-3">
            {QR_BITS.map((on, i) => (
              <span
                key={i}
                className={cn("h-2.5 w-2.5", on ? "bg-foreground" : "bg-background")}
              />
            ))}
          </div>

          <div className="mt-4 space-y-1 text-center text-xs text-muted-foreground">
            <div className="font-medium text-foreground">+55 21 9 9999-0000</div>
            <div>Sessão ativa há 14 dias · sincronizado</div>
          </div>

          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={() => toast.success("Reconectando ao WhatsApp…")}
          >
            <QrCode className="h-4 w-4" /> Reconectar
          </Button>
        </div>
      </section>

      {/* 4. Comportamento */}
      <section id="comportamento" className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Bot className="h-3.5 w-3.5 text-brand" /> Comportamento
          </div>
          <div className="font-display text-lg">Quando a IA age e quando ela para</div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <div className="mb-3 text-sm font-medium">Quando transferir para humano</div>
            <div className="space-y-2.5">
              {TRANSFERIR.map((opt) => (
                <label
                  key={opt.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-sm hover:bg-surface"
                >
                  <Checkbox
                    checked={transferir.has(opt.id)}
                    onCheckedChange={() => toggleSet(transferir, setTransferir, opt.id)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 text-sm font-medium">Quando parar de responder</div>
            <div className="space-y-2.5">
              {PARAR.map((opt) => (
                <label
                  key={opt.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-sm hover:bg-surface"
                >
                  <Checkbox
                    checked={parar.has(opt.id)}
                    onCheckedChange={() => toggleSet(parar, setParar, opt.id)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Exemplo de atendimento */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-brand" /> Exemplo de atendimento
              </div>
              <div className="font-display text-base">Veja como a IA conduz uma conversa real</div>
            </div>
            <div className="flex gap-1.5">
              {aiConversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActive(c.id)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition",
                    active === c.id
                      ? "border-navy bg-navy text-navy-foreground"
                      : "border-border bg-background hover:bg-surface",
                  )}
                >
                  {c.leadName.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 p-5">
            {ultimasMsgs.map((m, i) => (
              <div key={i} className={cn("flex gap-2", m.from === "ai" ? "justify-end" : "justify-start")}>
                {m.from === "lead" && (
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-surface">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                    m.from === "ai" ? "bg-navy text-navy-foreground" : "bg-surface",
                  )}
                >
                  {m.text}
                </div>
                {m.from === "ai" && (
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-brand text-brand-foreground">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-border p-4">
            <div className="text-[11px] text-muted-foreground">
              Pré-visualização · sem envio de mensagens
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.message("Abrindo conversa completa…")}
            >
              Ver conversa completa <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Inteligência extraída */}
        <aside className="rounded-2xl border border-border bg-card p-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Inteligência extraída</div>
          <div className="mt-1 font-display text-lg">{conv.leadName}</div>

          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted-foreground">Score de qualificação</span>
              <span className="num font-display text-2xl">{conv.score}<span className="text-sm text-muted-foreground">/100</span></span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface">
              <div
                className={cn(
                  "h-full rounded-full",
                  conv.score >= 75 ? "bg-emerald-500" : conv.score >= 50 ? "bg-amber-500" : "bg-orange-500",
                )}
                style={{ width: `${conv.score}%` }}
              />
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xs text-muted-foreground">Intenção detectada</div>
            <span className={cn("mt-1.5 inline-flex rounded-full px-2.5 py-1 text-xs font-medium", intel.cor)}>
              {intel.intencao}
            </span>
          </div>

          <div className="mt-4 rounded-xl border-l-4 border-l-orange-400 bg-orange-50/60 p-3">
            <div className="text-[11px] uppercase tracking-widest text-orange-700">Próxima ação sugerida</div>
            <div className="mt-1 text-sm font-medium text-foreground">{intel.proxima}</div>
          </div>

          <div className="mt-5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Dados extraídos</div>
            <dl className="mt-2 space-y-2 text-sm">
              {Object.entries(conv.extracted).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-border pb-1.5">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </section>
    </div>
  );
}

function ConfigRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="border-b border-border py-3 last:border-0">
      <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = opt === value;
          return (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
                active
                  ? "border-navy bg-navy text-navy-foreground"
                  : "border-border bg-background text-foreground hover:bg-surface",
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
