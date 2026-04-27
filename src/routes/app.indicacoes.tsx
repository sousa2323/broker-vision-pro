import { createFileRoute } from "@tanstack/react-router";
import {
  Copy,
  Share2,
  Sparkles,
  TrendingUp,
  Gift,
  CheckCircle2,
  Users,
} from "lucide-react";
import { referrals, formatBRL } from "@/data/mock";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/indicacoes")({
  component: ReferralsPage,
});

type Indicado = {
  nome: string;
  agencia: string;
  dataEntrada: string;
  produto: "Combo IA + Inbox" | "IA Assistente" | "Inbox";
  status: "Ativo" | "Em teste" | "Cancelado";
  mrr: number;
  situacao: "Gerando receita" | "Aguardando conversão";
};

const indicadosCompletos: Indicado[] = [
  {
    nome: "Joana Maciel",
    agencia: "Maciel Imóveis",
    dataEntrada: "12/jul",
    produto: "Combo IA + Inbox",
    status: "Ativo",
    mrr: 120,
    situacao: "Gerando receita",
  },
  {
    nome: "Pedro Verissimo",
    agencia: "Verissimo & Co.",
    dataEntrada: "03/ago",
    produto: "IA Assistente",
    status: "Ativo",
    mrr: 120,
    situacao: "Gerando receita",
  },
  {
    nome: "Carla Fontes",
    agencia: "Fontes Boutique",
    dataEntrada: "21/ago",
    produto: "Combo IA + Inbox",
    status: "Ativo",
    mrr: 120,
    situacao: "Gerando receita",
  },
  {
    nome: "Tiago Sá",
    agencia: "TS Negócios",
    dataEntrada: "09/set",
    produto: "Combo IA + Inbox",
    status: "Ativo",
    mrr: 120,
    situacao: "Gerando receita",
  },
  {
    nome: "Carla Souza",
    agencia: "Souza Consultoria",
    dataEntrada: "02/out",
    produto: "Inbox",
    status: "Em teste",
    mrr: 0,
    situacao: "Aguardando conversão",
  },
];

function ReferralsPage() {
  const mrrTotal = referrals.ativos.reduce((a, b) => a + b.mrr, 0);
  const mensalidade = 600;
  const totalAcumulado = mrrTotal * 4;
  const totalIndicados = 9;
  const ativos = referrals.ativos.length;
  const conversaoPct = Math.round((ativos / totalIndicados) * 100);
  const coberturaPct = Math.min(100, Math.round((mrrTotal / mensalidade) * 100));
  const faltam = Math.max(0, mensalidade - mrrTotal);
  const metaProxima = 840;
  const progressoMeta = Math.round((mrrTotal / metaProxima) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl text-ink">Indicações</h1>
        <p className="mt-1 text-muted-foreground">
          Transforme sua rede de corretores em receita recorrente.
        </p>
      </div>

      {/* Hero NAVY — link de indicação */}
      <div className="rounded-3xl bg-navy p-8 text-navy-foreground">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/60">
          <Sparkles className="h-3.5 w-3.5 text-warm" /> Programa de indicações
        </div>
        <h2 className="mt-4 font-display text-4xl leading-tight">
          Indique corretores e ganhe sobre as<br />assinaturas das ferramentas.
        </h2>
        <p className="mt-3 max-w-xl text-white/70">
          Indique corretores para a Ubroker e ganhe sobre as assinaturas das ferramentas.
          Você recebe <span className="text-warm">30% recorrentes</span> sobre cada assinatura ativa.
        </p>

        <div className="mt-8 flex flex-col gap-3 rounded-xl bg-white/10 p-4 backdrop-blur sm:flex-row sm:items-center">
          <div className="flex-1 truncate font-mono text-sm">{referrals.link}</div>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm text-ink">
              <Copy className="h-4 w-4" /> Copiar link
            </button>
            <button className="inline-flex items-center gap-2 rounded-md bg-warm px-4 py-2 text-sm text-warm-foreground">
              <Share2 className="h-4 w-4" /> Compartilhar
            </button>
          </div>
        </div>
      </div>

      {/* Resumo de performance — 4 cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Stat label="Indicados ativos" value={`${ativos}`} />
        <Stat label="Receita recorrente mensal" value={`${formatBRL(mrrTotal)}/mês`} />
        <Stat label="Total acumulado" value={formatBRL(totalAcumulado)} />
        <Stat
          label="Conversão"
          value={`${ativos} de ${totalIndicados}`}
          hint={`${conversaoPct}% convertidos`}
        />
      </div>

      {/* Bloco de incentivo — warm/orange */}
      <div className="rounded-2xl border border-orange-200 border-l-4 border-l-warm bg-orange-50/60 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-warm/15 p-2 text-warm">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-lg text-ink">
                Você está a {formatBRL(faltam)} de não pagar nada pelo sistema.
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                Suas indicações já cobriram <span className="font-medium text-warm">{coberturaPct}%</span> da sua mensalidade.
              </div>
              <div className="mt-3 max-w-md">
                <Progress value={coberturaPct} className="h-2 bg-orange-100" />
              </div>
            </div>
          </div>
          <Button className="bg-warm text-warm-foreground hover:bg-warm/90">
            Indicar mais corretores
          </Button>
        </div>
      </div>

      {/* Como funciona */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Modelo
          </div>
        </div>
        <div className="font-display text-xl text-ink">Como funciona</div>
        <ol className="mt-5 space-y-4">
          {[
            "Você compartilha seu link com outros corretores.",
            "O corretor indicado entra na Ubroker.",
            "Se ele contratar IA Assistente ou Inbox, você ganha recorrência.",
            "Se seus ganhos cobrirem sua mensalidade, você não paga nada.",
            "O valor que ultrapassar sua mensalidade pode ser recebido em dinheiro.",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-navy text-sm font-medium text-navy-foreground">
                {i + 1}
              </div>
              <div className="pt-0.5 text-sm text-ink">{step}</div>
            </li>
          ))}
        </ol>
      </div>

      {/* Lista de indicados */}
      <div className="rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Indicados
            </div>
            <div className="font-display text-lg">Sua rede ativa</div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" /> {indicadosCompletos.length} no total
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-5 py-3">Corretor</th>
                <th className="px-5 py-3">Entrada</th>
                <th className="px-5 py-3">Produto</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Receita</th>
                <th className="px-5 py-3">Situação</th>
              </tr>
            </thead>
            <tbody>
              {indicadosCompletos.map((r, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-5 py-3">
                    <div className="font-medium">{r.nome}</div>
                    <div className="text-xs text-muted-foreground">{r.agencia}</div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{r.dataEntrada}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs text-blue-800">
                      {r.produto}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <StatusChip status={r.status} />
                  </td>
                  <td className="num px-5 py-3 text-right font-medium">
                    {r.mrr > 0 ? `${formatBRL(r.mrr)}/mês` : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={
                        r.situacao === "Gerando receita"
                          ? "inline-flex items-center gap-1 text-xs text-emerald-700"
                          : "inline-flex items-center gap-1 text-xs text-amber-700"
                      }
                    >
                      {r.situacao === "Gerando receita" && (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      {r.situacao}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Potencial de crescimento */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> Potencial de crescimento
        </div>
        <div className="mt-2 font-display text-xl text-ink">
          Se você ativar mais 3 corretores, pode gerar {formatBRL(metaProxima)}/mês em recorrência.
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Ganho atual
            </div>
            <div className="num mt-1 font-display text-2xl text-ink">
              {formatBRL(mrrTotal)}<span className="text-base text-muted-foreground">/mês</span>
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Meta próxima
            </div>
            <div className="num mt-1 font-display text-2xl text-emerald-700">
              {formatBRL(metaProxima)}<span className="text-base text-muted-foreground">/mês</span>
            </div>
          </div>
        </div>
        <div className="mt-5">
          <Progress value={progressoMeta} className="h-2" />
          <div className="mt-2 text-xs text-muted-foreground">
            {progressoMeta}% do caminho até a próxima meta.
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="num mt-2 font-display text-2xl">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function StatusChip({ status }: { status: "Ativo" | "Em teste" | "Cancelado" }) {
  const map: Record<typeof status, string> = {
    Ativo: "bg-emerald-50 text-emerald-700",
    "Em teste": "bg-amber-50 text-amber-700",
    Cancelado: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${map[status]}`}>{status}</span>
  );
}
