import { createFileRoute } from "@tanstack/react-router";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { earnings, formatBRL } from "@/data/mock";

export const Route = createFileRoute("/app/ganhos")({
  component: EarningsPage,
});

function EarningsPage() {
  const data = [
    { name: "Comissão de imóveis", value: earnings.comissao, color: "oklch(0.21 0.05 255)" },
    { name: "SaaS · Indicações", value: earnings.saas, color: "oklch(0.66 0.21 41)" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Ganhos</h1>
        <p className="text-sm text-muted-foreground">Outubro 2025</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-navy p-8 text-navy-foreground lg:col-span-2">
          <div className="text-xs uppercase tracking-widest text-white/60">Receita total</div>
          <div className="mt-3 num font-display text-6xl">{formatBRL(earnings.total)}</div>
          <div className="mt-6 grid grid-cols-2 gap-6 border-t border-white/10 pt-6 text-sm">
            <div>
              <div className="text-xs uppercase tracking-widest text-white/50">Comissão de imóveis</div>
              <div className="mt-1 num font-display text-2xl">{formatBRL(earnings.comissao)}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-white/50">SaaS · Indicações</div>
              <div className="mt-1 num font-display text-2xl">{formatBRL(earnings.saas)}</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Composição</div>
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
                <span className="num">{formatBRL(d.value)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Histórico</div>
            <div className="font-display text-lg">Transações recentes</div>
          </div>
          <button className="text-xs text-brand">Exportar</button>
        </div>
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
            {earnings.transactions.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3 text-muted-foreground">{t.data}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${t.tipo === "Comissão" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>{t.tipo}</span>
                </td>
                <td className="px-5 py-3">{t.descricao}</td>
                <td className="num px-5 py-3 text-right font-medium">{formatBRL(t.valor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
