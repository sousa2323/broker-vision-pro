import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useBrokerProfile } from "@/lib/auth";

export type ReferredBroker = {
  id: string;
  nome: string;
  plano: "Free" | "Pro";
  avatar_url: string | null;
  /** MRR estimado que este indicado gera (Pro = 120, Free = 0). */
  mrr: number;
};

const PRO_MRR = 120;

export async function listReferred(brokerId: string): Promise<ReferredBroker[]> {
  const { data, error } = await supabase
    .from("broker_referrals")
    .select(
      "referred_id, profile:broker_public_profiles!broker_referrals_referred_id_fkey(full_name, plan, avatar_url)",
    )
    .eq("referrer_id", brokerId);
  if (error) {
    console.error("Falha ao listar indicações:", error.message);
    return [];
  }
  return (data ?? []).flatMap((referral) => {
    const profile = Array.isArray(referral.profile) ? referral.profile[0] : referral.profile;
    if (!profile) return [];
    const plan = (profile.plan as "Free" | "Pro") ?? "Free";
    return [
      {
        id: referral.referred_id as string,
        nome: profile.full_name as string,
        plano: plan,
        avatar_url: (profile.avatar_url as string | null) ?? null,
        mrr: plan === "Pro" ? PRO_MRR : 0,
      },
    ];
  });
}

/**
 * Dados reais da tela de Indicações: link de indicação (do perfil) e a
 * lista de corretores que se cadastraram com o slug do corretor logado.
 */
export function useReferrals() {
  const profile = useBrokerProfile();
  const [referred, setReferred] = useState<ReferredBroker[]>([]);
  const [loading, setLoading] = useState(true);
  const brokerId = profile?.id;

  useEffect(() => {
    if (!brokerId) return;
    let cancelled = false;
    setLoading(true);
    listReferred(brokerId).then((rows) => {
      if (!cancelled) {
        setReferred(rows);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [brokerId]);

  const slug = profile?.referral_slug ?? null;
  const origin = typeof window === "undefined" ? "https://ubroker.com.br" : window.location.origin;
  const link = slug ? `${origin}/r/${slug}` : null;
  const mrrTotal = referred.reduce((s, r) => s + r.mrr, 0);
  const ativos = referred.filter((r) => r.plano === "Pro").length;

  return { link, slug, referred, mrrTotal, ativos, loading };
}
