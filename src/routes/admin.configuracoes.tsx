import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Save } from "lucide-react";

export const Route = createFileRoute("/admin/configuracoes")({
  component: ConfigAdmin,
});

function ConfigAdmin() {
  const [s, setS] = useState({
    comissaoPadrao: 6,
    feeParceria: 10,
    feeLeadProprio: 8,
    indicacaoN1: 20,
    indicacaoN2: 10,
    indicacaoN3: 5,
    mensalidadePro: 600,
  });

  const set = <K extends keyof typeof s>(k: K, v: number) => setS((p) => ({ ...p, [k]: v }));

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">Regras globais de negócio da plataforma.</p>
      </div>

      <Card title="Comissão e fees">
        <Field label="Comissão padrão sobre venda" sub="Aplicada quando o corretor não define comissão própria.">
          <Pct value={s.comissaoPadrao} onChange={(v) => set("comissaoPadrao", v)} />
        </Field>
        <Field label="Fee Ubroker — parceria" sub="Cobrado sobre comissões de vendas em parceria.">
          <Pct value={s.feeParceria} onChange={(v) => set("feeParceria", v)} />
        </Field>
        <Field label="Fee Ubroker — lead próprio" sub="Cobrado quando o lead foi gerado pela plataforma.">
          <Pct value={s.feeLeadProprio} onChange={(v) => set("feeLeadProprio", v)} />
        </Field>
      </Card>

      <Card title="Regras de indicação (trinível)">
        <Field label="Nível 1 (indicação direta)" sub="% do MRR do indicado pago ao indicador.">
          <Pct value={s.indicacaoN1} onChange={(v) => set("indicacaoN1", v)} />
        </Field>
        <Field label="Nível 2" sub="% do MRR de indicados de indicados.">
          <Pct value={s.indicacaoN2} onChange={(v) => set("indicacaoN2", v)} />
        </Field>
        <Field label="Nível 3" sub="% do MRR no terceiro nível da rede.">
          <Pct value={s.indicacaoN3} onChange={(v) => set("indicacaoN3", v)} />
        </Field>
      </Card>

      <Card title="Plano e mensalidade">
        <Field label="Mensalidade do plano Pro" sub="Valor mensal cobrado dos corretores Pro.">
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">R$</span>
            <input
              type="number"
              value={s.mensalidadePro}
              onChange={(e) => set("mensalidadePro", Number(e.target.value))}
              className="w-24 rounded-md border border-border bg-card px-2 py-1 text-right text-sm num"
            />
          </div>
        </Field>
      </Card>

      <div className="flex justify-end">
        <button className="inline-flex items-center gap-2 rounded-full bg-warm px-5 py-2.5 text-sm font-medium text-warm-foreground transition hover:brightness-110">
          <Save className="h-4 w-4" /> Salvar alterações
        </button>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</div>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}

function Field({ label, sub, children }: { label: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Pct({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-16 rounded-md border border-border bg-card px-2 py-1 text-right text-sm num"
      />
      <span className="text-sm text-muted-foreground">%</span>
    </div>
  );
}
