import { createFileRoute } from "@tanstack/react-router";
import { Copy, Share2, Sparkles, TrendingUp, Gift, CheckCircle2, Users } from "lucide-react";
import { toast } from "sonner";
import { formatBRL } from "@/lib/format";
import { useReferrals } from "@/lib/referrals";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/indicacoes")({
  component: ReferralsPage,
});

const MENSALIDADE = 149;
const MRR_PRO = 120;

function ReferralsPage() {
  const { link, referred, mrrTotal, ativos } = useReferrals();
  const referralLink = link ?? "Gerando seu link…";

  function copyLink() {
    if (!link) return;
    navigator.clipboard
      .writeText(referralLink)
      .then(() => toast.success("Link copiado!"))
      .catch(() => toast.error("Não foi possível copiar o link"));
  }

  const totalIndicados = referred.length;
  const conversaoPct = totalIndicados > 0 ? Math.round((ativos / totalIndicados) * 100) : 0;
  const coberturaPct = Math.min(100, Math.round((mrrTotal / MENSALIDADE) * 100));
  const faltam = Math.max(0, MENSALIDADE - mrrTotal);
  const metaProxima = mrrTotal + 3 * MRR_PRO;
  const progressoMeta = metaProxima > 0 ? Math.round((mrrTotal / metaProxima) * 100) : 0;

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
          Indique corretores e ganhe sobre as
          <br />
          assinaturas das ferramentas.
        </h2>
        <p className="mt-3 max-w-xl text-white/70">
          Indique corretores para a Ubroker e ganhe sobre as assinaturas das ferramentas. Você
          recebe <span className="text-warm">recorrência</span> sobre cada assinatura ativa.
        </p>

        <div className="mt-8 flex flex-col gap-3 rounded-xl bg-white/10 p-4 backdrop-blur sm:flex-row sm:items-center">
          <div className="flex-1 truncate font-mono text-sm">{referralLink}</div>
          <div className="flex gap-2">
            <button
              onClick={copyLink}
              disabled={!link}
              className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm text-ink disabled:opacity-60"
            >
              <Copy className="h-4 w-4" /> Copiar link
            </button>
            <button
              onClick={() => {
                if (link && navigator.share) navigator.share({ url: referralLink }).catch(() => {});
                else copyLink();
              }}
              className="inline-flex items-center gap-2 rounded-md bg-warm px-4 py-2 text-sm text-warm-foreground"
            >
              <Share2 className="h-4 w-4" /> Compartilhar
            </button>
          </div>
        </div>
      </div>

      {/* Resumo de performance */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Stat label="Indicados ativos" value={`${ativos}`} />
        <Stat label="Receita recorrente mensal" value={`${formatBRL(mrrTotal)}/mês`} />
        <Stat label="Total de indicados" value={`${totalIndicados}`} />
        <Stat
          label="Conversão"
          value={`${ativos} de ${totalIndicados}`}
          hint={`${conversaoPct}% convertidos`}
        />
      </div>

      {/* Bloco de incentivo */}
      <div className="rounded-2xl border border-orange-200 border-l-4 border-l-warm bg-orange-50/60 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-warm/15 p-2 text-warm">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-lg text-ink">
                {faltam > 0
                  ? `Você está a ${formatBRL(faltam)} de não pagar nada pelo sistema.`
                  : "Suas indicações já cobrem toda a sua mensalidade!"}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                Suas indicações já cobriram{" "}
                <span className="font-medium text-warm">{coberturaPct}%</span> da sua mensalidade.
              </div>
              <div className="mt-3 max-w-md">
                <Progress value={coberturaPct} className="h-2 bg-orange-100" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Como funciona */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Modelo</div>
        </div>
        <div className="font-display text-xl text-ink">Como funciona</div>
        <ol className="mt-5 space-y-4">
          {[
            "Você compartilha seu link com outros corretores.",
            "O corretor indicado entra na Ubroker pelo seu link.",
            "Se ele assinar o plano Pro, você ganha recorrência.",
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
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Indicados</div>
            <div className="font-display text-lg">Sua rede</div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" /> {totalIndicados} no total
          </div>
        </div>
        {totalIndicados === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Você ainda não indicou nenhum corretor. Compartilhe seu link acima para começar a gerar
            receita recorrente.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-5 py-3">Corretor</th>
                  <th className="px-5 py-3">Plano</th>
                  <th className="px-5 py-3 text-right">Receita</th>
                  <th className="px-5 py-3">Situação</th>
                </tr>
              </thead>
              <tbody>
                {referred.map((r) => {
                  const gerando = r.mrr > 0;
                  return (
                    <tr key={r.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3">
                        <div className="font-medium">{r.nome}</div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            r.plano === "Pro" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {r.plano}
                        </span>
                      </td>
                      <td className="num px-5 py-3 text-right font-medium">
                        {gerando ? `${formatBRL(r.mrr)}/mês` : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={
                            gerando
                              ? "inline-flex items-center gap-1 text-xs text-emerald-700"
                              : "inline-flex items-center gap-1 text-xs text-amber-700"
                          }
                        >
                          {gerando && <CheckCircle2 className="h-3.5 w-3.5" />}
                          {gerando ? "Gerando receita" : "Aguardando conversão"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Potencial de crescimento */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> Potencial de crescimento
        </div>
        <div className="mt-2 font-display text-xl text-ink">
          Se você ativar mais 3 corretores Pro, pode gerar {formatBRL(metaProxima)}/mês em recorrência.
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Ganho atual</div>
            <div className="num mt-1 font-display text-2xl text-ink">
              {formatBRL(mrrTotal)}
              <span className="text-base text-muted-foreground">/mês</span>
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Meta próxima</div>
            <div className="num mt-1 font-display text-2xl text-emerald-700">
              {formatBRL(metaProxima)}
              <span className="text-base text-muted-foreground">/mês</span>
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
