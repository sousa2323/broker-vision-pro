import type { Property, PropertyStatus } from "@/lib/properties";
export { PROPERTY_STATUSES as STATUSES } from "@/lib/properties";
export type { PropertyStatus as Status } from "@/lib/properties";

export const STATUS_STYLES: Record<PropertyStatus, string> = {
  Ativo: "bg-emerald-100 text-emerald-700",
  "Em negociação": "bg-amber-100 text-amber-700",
  Vendido: "bg-sky-100 text-sky-700",
  Inativo: "bg-slate-200 text-slate-600",
  Excluído: "bg-rose-100 text-rose-700",
};

export const getComissao = (valor: number) => valor * 0.03;
export const isAltaDemanda = (p: Property) => p.valor >= 1_500_000 || p.destaque;
