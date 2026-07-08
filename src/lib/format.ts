// Formatação de valores (antes vinha de @/data/mock).

export const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const formatBRLcompact = (n: number) => {
  if (n >= 1_000_000)
    return `R$ ${(n / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}mi`;
  if (n >= 1_000)
    return `R$ ${(n / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}k`;
  return formatBRL(n);
};

/** "há 2h", "ontem", "há 3d" a partir de um timestamp. */
export function timeAgo(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const days = Math.floor(h / 24);
  if (days === 1) return "ontem";
  if (days < 7) return `há ${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `há ${weeks}sem`;
  const months = Math.floor(days / 30);
  return `há ${months}mês`;
}
