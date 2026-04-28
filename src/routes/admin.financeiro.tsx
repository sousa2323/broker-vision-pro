import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Eye, Pencil } from "lucide-react";
import { cobrancas, vendasDetalhadas, conciliacoes } from "@/data/admin-mock";
import { formatBRL } from "@/data/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/financeiro")({
  component: FinanceiroPage,
});

type Tab = "cobrancas" | "vendas" | "conciliacao";
type StatusCobranca = "Todos" | "Pendente" | "Faturado" | "Pago" | "Atrasado";

function FinanceiroPage() {
  const [tab, setTab] = useState<Tab>("cobrancas");
  const [filtro, setFiltro] = useState<StatusCobranca>("Todos");

  const cobrancasFiltradas = filtro === "Todos" ? cobrancas : cobrancas.filter((c) => c.status === filtro);

  const totalAtraso = cobrancas.filter((c) => c.status === "Atrasado").reduce((a, b) => a + b.valor, 0);
  const totalRecebido = cobrancas.filter((c) => c.status === "Pago").reduce((a, b) => a + b.valor, 0);
  const totalPendente = cobrancas.filter((c) => c.status === "Pendente" || c.status === "Faturado").reduce((a, b) => a + b.valor, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Financeiro</h1>
        <p className="mt-1 text-sm text-muted-foreground">Cobranças, detalhamento de vendas e conciliação.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <KPI label="Recebido no mês" value={formatBRL(totalRecebido)} tone="green" />
        <KPI label="A receber" value={formatBRL(totalPendente)} tone="default" />
        <KPI label="Em atraso" value={formatBRL(totalAtraso)} tone="red" />
      </section>

      <div className="flex items-center gap-1 border-b border-border">
        <TabBtn active={tab === "cobrancas"} onClick={() => setTab("cobrancas")}>Cobranças</TabBtn>
        <TabBtn active={tab === "vendas"} onClick={() => setTab("vendas")}>Detalhamento de vendas</TabBtn>
        <TabBtn active={tab === "conciliacao"} onClick={() => setTab("conciliacao")}>Conciliação</TabBtn>
      </div>

      {tab === "cobrancas" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(["Todos", "Pendente", "Faturado", "Pago", "Atrasado"] as StatusCobranca[]).map((s) => (
              <button
                key={s}
                onClick={() => setFiltro(s)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition",
                  filtro === s ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-surface">
                <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Corretor</th>
                  <th className="px-4 py-3">Origem</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3">Vencimento</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cobrancasFiltradas.map((c) => (
                  <tr key={c.id} className="hover:bg-surface/60">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.id}</td>
                    <td className="px-4 py-3">{c.corretor}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.origem}</td>
                    <td className="px-4 py-3 text-right num">{formatBRL(c.valor)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.vencimento}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-surface hover:text-foreground" title="Marcar como pago">
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                        <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-surface hover:text-foreground" title="Editar">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-surface hover:text-foreground" title="Ver origem">
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "vendas" && (
        <div className="space-y-4">
          {vendasDetalhadas.map((v) => (
            <div key={v.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">{v.id}</div>
                  <div className="mt-1 font-display text-lg">{v.imovel}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Valor da venda</div>
                  <div className="num font-display text-xl">{formatBRL(v.valor)}</div>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Comissão total</div>
                  <div className="num font-display text-lg text-emerald-700">{formatBRL(v.comissaoTotal)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">% da venda</div>
                  <div className="num font-display text-lg">{((v.comissaoTotal / v.valor) * 100).toFixed(1)}%</div>
                </div>
              </div>
              <div className="mt-5">
                <div className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Divisão</div>
                <div className="space-y-2">
                  {v.splits.map((s, i) => {
                    const pct = (s.valor / v.comissaoTotal) * 100;
                    const cor = s.tipo === "Fee Ubroker" ? "bg-warm" : s.tipo === "Captador" ? "bg-navy" : "bg-blue-500";
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between text-xs">
                          <span>{s.nome} <span className="text-muted-foreground">· {s.tipo}</span></span>
                          <span className="num font-medium">{formatBRL(s.valor)} <span className="text-muted-foreground">({pct.toFixed(0)}%)</span></span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface">
                          <div className={`h-full ${cor}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "conciliacao" && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-surface">
              <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Venda</th>
                <th className="px-4 py-3">Corretor</th>
                <th className="px-4 py-3 text-right">Esperado</th>
                <th className="px-4 py-3 text-right">Recebido</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {conciliacoes.map((c) => (
                <tr key={c.id} className={cn(c.status === "Divergente" && "bg-red-50/50")}>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.id}</td>
                  <td className="px-4 py-3 font-mono text-xs">{c.venda}</td>
                  <td className="px-4 py-3">{c.corretor}</td>
                  <td className="px-4 py-3 text-right num">{formatBRL(c.esperado)}</td>
                  <td className={cn("px-4 py-3 text-right num", c.status === "Divergente" && "text-red-700 font-medium")}>{formatBRL(c.recebido)}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-xs",
                      c.status === "Confirmada" && "bg-emerald-50 text-emerald-700",
                      c.status === "Pendente" && "bg-amber-50 text-amber-700",
                      c.status === "Divergente" && "bg-red-50 text-red-700",
                    )}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "border-b-2 px-4 py-2.5 text-sm transition",
        active ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function KPI({ label, value, tone }: { label: string; value: string; tone: "green" | "red" | "default" }) {
  const cls = tone === "green" ? "text-emerald-700" : tone === "red" ? "text-red-700" : "";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={cn("mt-2 num font-display text-2xl", cls)}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: "Pendente" | "Faturado" | "Pago" | "Atrasado" }) {
  const map = {
    Pendente: "bg-amber-50 text-amber-700",
    Faturado: "bg-blue-50 text-blue-700",
    Pago: "bg-emerald-50 text-emerald-700",
    Atrasado: "bg-red-50 text-red-700",
  };
  return <span className={cn("rounded-full px-2 py-0.5 text-xs", map[status])}>{status}</span>;
}
