import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { formatBRL } from "@/data/mock";

export const Route = createFileRoute("/app/pipeline")({
  component: PipelinePage,
});

type Card = { id: string; cliente: string; imovel: string; valor: number; dias: number; tag?: string };
const stages: { id: string; cards: Card[]; color: string }[] = [
  {
    id: "Novo", color: "bg-slate-200",
    cards: [
      { id: "P-1", cliente: "Felipe Goulart", imovel: "Apto 2 suítes Icaraí", valor: 1_400_000, dias: 0, tag: "IA qualificando" },
      { id: "P-2", cliente: "Renata Couto", imovel: "Apto 2 quartos Santa Rosa", valor: 550_000, dias: 1 },
      { id: "P-3", cliente: "Tatiana Reis", imovel: "Apto 2 quartos Ingá", valor: 620_000, dias: 1 },
      { id: "P-4", cliente: "Vanessa Ribeiro", imovel: "Loft Centro", valor: 690_000, dias: 1 },
      { id: "P-5", cliente: "Marcelo Pinheiro", imovel: "2 unidades temporada", valor: 1_200_000, dias: 0 },
      { id: "P-6", cliente: "Bruno Tavares (recompra)", imovel: "Apto 1 quarto Icaraí", valor: 480_000, dias: 2 },
    ],
  },
  {
    id: "Qualificado", color: "bg-blue-200",
    cards: [
      { id: "P-7", cliente: "João Mendes", imovel: "Apto 3 quartos Icaraí", valor: 1_000_000, dias: 3, tag: "Score 87" },
      { id: "P-8", cliente: "Ana Beatriz Souza", imovel: "Apto reformar Ingá", valor: 950_000, dias: 4 },
      { id: "P-9", cliente: "Patrícia Lemos", imovel: "Apto 3 quartos São Francisco", valor: 1_100_000, dias: 2 },
      { id: "P-10", cliente: "Larissa Moura", imovel: "Apto 3 quartos Pendotiba", valor: 720_000, dias: 5 },
      { id: "P-11", cliente: "Sr. Aristides Coelho", imovel: "Permuta + Apto Icaraí", valor: 900_000, dias: 6 },
    ],
  },
  {
    id: "Visita", color: "bg-amber-200",
    cards: [
      { id: "P-12", cliente: "Camila Andrade", imovel: "Cobertura Marine Building", valor: 1_590_000, dias: 4, tag: "Sábado 10h" },
      { id: "P-13", cliente: "Eduardo Bastos", imovel: "Sala 1208 Centro Empresarial", valor: 820_000, dias: 2 },
      { id: "P-14", cliente: "Família Okamura", imovel: "Casa Camboinhas Beach", valor: 3_450_000, dias: 7 },
      { id: "P-15", cliente: "Família Castilho", imovel: "Casa Piratininga Sul", valor: 2_790_000, dias: 3 },
    ],
  },
  {
    id: "Proposta", color: "bg-violet-200",
    cards: [
      { id: "P-16", cliente: "Roberto e Lúcia Tavares", imovel: "Casa Itaipu", valor: 1_150_000, dias: 1, tag: "Aguarda decisão" },
      { id: "P-17", cliente: "Gustavo e Helena", imovel: "Apto Charitas", valor: 1_420_000, dias: 2 },
      { id: "P-18", cliente: "Dr. Carlos Andrade", imovel: "Cobertura Jardim Icaraí", valor: 4_000_000, dias: 0, tag: "À vista" },
    ],
  },
  {
    id: "Fechado", color: "bg-emerald-200",
    cards: [
      { id: "P-19", cliente: "Sofia Caldas", imovel: "Cobertura Linear Icaraí", valor: 2_100_000, dias: 12, tag: "Comissão R$ 84.6k" },
      { id: "P-20", cliente: "Igor Mascarenhas", imovel: "Studio São Francisco", valor: 380_000, dias: 8, tag: "Comissão R$ 11.4k" },
    ],
  },
];

function PipelinePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl">Pipeline</h1>
          <p className="text-sm text-muted-foreground">{stages.reduce((s, c) => s + c.cards.length, 0)} oportunidades · VGV {formatBRL(stages.flatMap(s => s.cards).reduce((a, b) => a + b.valor, 0))}</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-navy px-3 py-2 text-sm text-navy-foreground">
          <Plus className="h-4 w-4" /> Nova oportunidade
        </button>
      </div>
      <div className="grid auto-cols-[280px] grid-flow-col gap-4 overflow-x-auto pb-4 lg:auto-cols-[1fr] lg:grid-flow-row lg:grid-cols-5">
        {stages.map((s) => (
          <div key={s.id} className="rounded-2xl bg-card p-3">
            <div className="flex items-center justify-between px-2 pb-3">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
                <span className="font-medium">{s.id}</span>
                <span className="text-xs text-muted-foreground">({s.cards.length})</span>
              </div>
              <span className="num text-xs text-muted-foreground">
                {(s.cards.reduce((a, b) => a + b.valor, 0) / 1_000_000).toFixed(1)}mi
              </span>
            </div>
            <ul className="space-y-2">
              {s.cards.map((c) => (
                <li key={c.id} className="rounded-xl border border-border bg-background p-3 shadow-sm hover:shadow-md transition">
                  <div className="text-sm font-medium">{c.cliente}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{c.imovel}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="num text-sm font-semibold">{formatBRL(c.valor)}</span>
                    <span className="text-[10px] text-muted-foreground">{c.dias}d</span>
                  </div>
                  {c.tag && (
                    <div className="mt-2 inline-block rounded-full bg-brand/10 px-2 py-0.5 text-[10px] text-brand">{c.tag}</div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
