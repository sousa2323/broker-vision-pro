import type { Property } from "@/data/mock";

export const STATUSES = ["Ativo", "Em negociação", "Vendido", "Inativo", "Excluído"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_STYLES: Record<Status, string> = {
  "Ativo": "bg-emerald-100 text-emerald-700",
  "Em negociação": "bg-amber-100 text-amber-700",
  "Vendido": "bg-sky-100 text-sky-700",
  "Inativo": "bg-slate-200 text-slate-600",
  "Excluído": "bg-rose-100 text-rose-700",
};

export const INITIAL_STATUS: Record<string, Status> = {
  "IM-002": "Em negociação",
  "IM-005": "Inativo",
};

// deterministic pseudo-random from id
export function seed(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

export const getInteressados = (id: string) => 6 + (seed(id) % 19); // 6..24
export const getVisitas = (id: string) => 1 + (seed(id + "v") % 8); // 1..8
export const getPropostas = (id: string) => seed(id + "p") % 4; // 0..3
export const getComissao = (valor: number) => valor * 0.03;
export const isAltaDemanda = (p: Property) =>
  p.valor >= 1_500_000 || getInteressados(p.id) >= 18 || getVisitas(p.id) >= 6;
