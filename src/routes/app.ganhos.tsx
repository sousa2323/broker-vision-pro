import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { TrendingUp, Sparkles, Users, ArrowRight } from "lucide-react";
import { formatBRL, formatBRLcompact } from "@/lib/format";
import { useProperties } from "@/lib/properties";
import { useReferrals } from "@/lib/referrals";

export const Route = createFileRoute("/app/ganhos")({
  component: EarningsPage,
});

const COMISSAO_RATE = 0.03;
const MENSALIDADE = 149;

type Transacao = {
  id: string;
  data: string;
  ts: number;
  tipo: "Comissão" | "SaaS";
  descricao: string;
  contexto: string;
  valor: number;
};

function EarningsPage() {
  const { properties } = useProperties();
  const { referred, mrrTotal, ativos } = useReferrals();

  const { comissao, saas, total, transactions } = useMemo(() => {
    const vendas = properties.filter((p) => p.status === "Vendido");
    const comissao = vendas.reduce((s, p) => s + p.valor * COMISSAO_RATE, 0);
    const saas = mrrTotal;

    const txVendas: Transacao[] = vendas.map((p) => ({
      id: `venda-${p.id}`,
      data: new Date(p.updated_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }),
      ts: new Date(p.updated_at).getTime(),
      tipo: "Comissão",
      descricao: `Venda · ${p.nome}`,
      contexto: "Comissão de imóvel vendido (3%)",
      valor: p.valor * COMISSAO_RATE,
    }));
    const txIndicacoes: Transacao[] = referred
      .filter((r) => r.mrr > 0)
      .map((r) => ({
        id: `ind-${r.id}`,
        data: "Recorrente",
        ts: 0,
        tipo: "SaaS",
        descricao: `Recorrência de indicação · ${r.nome}`,
        contexto: "Indicação ativa no plano Pro",
        valor: r.mrr,
      }));

    const transactions = [...txVendas, ...txIndicacoes].sort((a, b) => b.ts - a.ts);
    return { comissao, saas, total: comissao + saas, transactions };
  }, [properties, referred, mrrTotal]);

  const pctComissao = total > 0 ? (comissao / total) * 100 : 0;
  const pctSaas = total > 0 ? (saas / total) * 100 : 0;
  const faltaMensalidade = Math.max(0, MENSALIDADE - saas);

  const now = new Date();
  const diaAtual = now.getDate();
  const estMes = diaAtual > 0 ? Math.round((total / diaAtual) * 30) : 0;
  const estAno = estMes * 12;

  const data = [
    { name: "Comissão de imóveis", value: comissao, color: "oklch(0.21 0.05 255)", pct: pctComissao },
    { name: "SaaS · Indicações", value: saas, color: "oklch(0.66 0.21 41)", pct: pctSaas },
  ];

  const mesLabel = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Ganhos</h1>
        <p className="text-sm capitalize text-muted-foreground">{mesLabel}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Receita total */}
        <div className="rounded-2xl bg-navy p-8 text-navy-foreground lg:col-span-2">
          <div>
            <div className="text-xs uppercase tracking-widest text-white/60">Receita total</div>
            <div className="mt-3 num font-display text-6xl">{formatBRL(total)}</div>
          </div>
          <p className="mt-2 text-sm text-white/70">
            Comissões de vendas somadas à recorrência das suas indicações.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-6 border-t border-white/10 pt-6 text-sm">
            <div>
              <div className="text-xs uppercase tracking-widest text-white/50">Comissão de imóveis</div>
              <div className="mt-1 num font-display text-2xl">{formatBRL(comissao)}</div>
              <div className="mt-2 text-xs text-white/60">
                {properties.filter((p) => p.status === "Vendido").length} imóveis vendidos
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-white/50">SaaS · Indicações</div>
              <div className="mt-1 num font-display text-2xl">{formatBRL(saas)}</div>
              <div className="mt-2 space-y-0.5 text-xs text-white/60">
                <div className="flex justify-between"><span>Indicados ativos</span><span className="text-white/80">{ativos}</span></div>
                <div className="flex justify-between"><span>Recorrência mensal</span><span className="num text-white/80">{formatBRL(mrrTotal)}/mês</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Composição */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Composição</div>
          {total === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Sem receita registrada ainda.
            </p>
          ) : (
            <>
              <div className="h-48">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={data} dataKey="value" innerRadius={50} outerRadius={75} paddingAngle={2}>
                      {data.map((d, i) => (<Cell key={i} fill={d.color} />))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-2 text-sm">
                {data.map((d) => (
                  <li key={d.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                      {d.name}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="num text-xs text-muted-foreground">
                        {d.pct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
                      </span>
                      <span className="num">{formatBRL(d.value)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Bloco de incentivo */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-border border-l-4 border-l-warm bg-orange-50/60 p-5 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-warm/15 p-2 text-warm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-lg text-foreground">
              Você já gerou <span className="num text-warm">{formatBRL(saas)}</span> com indicações
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {faltaMensalidade > 0 ? (
                <>Faltam <span className="num font-medium text-foreground">{formatBRL(faltaMensalidade)}</span> para cobrir sua mensalidade.</>
              ) : (
                <>Suas indicações já cobrem sua mensalidade. 🎉</>
              )}
            </p>
          </div>
        </div>
        <Link
          to="/app/indicacoes"
          className="inline-flex items-center gap-2 rounded-md bg-warm px-4 py-2 text-sm font-medium text-warm-foreground shadow-sm transition-colors hover:bg-warm/90"
        >
          <Users className="h-4 w-4" />
          Convidar corretores
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Projeção de ganhos */}
      {total > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Projeção de ganhos</div>
              <div className="font-display text-lg">Com base no ritmo atual</div>
            </div>
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Este mês (estimado)</div>
              <div className="mt-1 num font-display text-3xl">{formatBRL(estMes)}</div>
              <div className="mt-1 text-xs text-emerald-700">projetado a partir do desempenho parcial</div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Projeção anual</div>
              <div className="mt-1 num font-display text-3xl">{formatBRLcompact(estAno)}</div>
              <div className="mt-1 text-xs text-emerald-700">mantendo o ritmo atual</div>
            </div>
          </div>
        </div>
      )}

      {/* Histórico */}
      <div className="rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Histórico</div>
            <div className="font-display text-lg">Transações recentes</div>
          </div>
        </div>
        {transactions.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Nenhuma transação ainda. Registre uma venda em Imóveis ou convide corretores em Indicações.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-5 py-3">Data</th>
                <th className="px-5 py-3">Tipo</th>
                <th className="px-5 py-3">Descrição</th>
                <th className="px-5 py-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 text-muted-foreground">{t.data}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                        t.tipo === "Comissão" ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${t.tipo === "Comissão" ? "bg-blue-600" : "bg-orange-500"}`} />
                      {t.tipo}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div>{t.descricao}</div>
                    <div className="text-xs text-muted-foreground">{t.contexto}</div>
                  </td>
                  <td className="num px-5 py-3 text-right font-medium">{formatBRL(t.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
