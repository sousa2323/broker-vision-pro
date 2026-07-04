import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { z } from "zod";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Schemas do cadastro (uma etapa = um schema)
// ---------------------------------------------------------------------------

export const step1Schema = z
  .object({
    fullName: z.string().min(3, "Informe seu nome completo"),
    email: z.string().email("E-mail inválido"),
    phone: z.string().min(10, "Informe um telefone válido com DDD"),
    // Política de senha do projeto Supabase: minúscula, maiúscula, número e símbolo
    password: z
      .string()
      .min(8, "Mínimo de 8 caracteres")
      .regex(/[a-z]/, "Inclua ao menos uma letra minúscula")
      .regex(/[A-Z]/, "Inclua ao menos uma letra maiúscula")
      .regex(/[0-9]/, "Inclua ao menos um número")
      .regex(/[^a-zA-Z0-9]/, "Inclua ao menos um símbolo (ex.: !@#$)"),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((v) => v === true, {
      message: "É necessário aceitar os Termos de Uso e a Política de Privacidade",
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não coincidem",
  });

export const step2Schema = z.object({
  creci: z.string().min(4, "Informe seu CRECI"),
  avatarUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  bio: z.string().max(600, "Máximo de 600 caracteres").optional(),
  regions: z.array(z.string()).min(1, "Adicione ao menos uma região de atuação"),
  propertyTypes: z.array(z.string()).min(1, "Selecione ao menos um tipo de imóvel"),
  specialties: z.array(z.string()).min(1, "Selecione ao menos uma especialidade"),
  ticketRange: z.string().min(1, "Selecione a faixa de ticket"),
});

export const step3Schema = z.object({
  channels: z.object({
    whatsapp: z.boolean(),
    instagram: z.boolean(),
    email: z.boolean(),
  }),
  availability: z.string().min(1, "Selecione sua disponibilidade"),
  leadLimit: z
    .number({ required_error: "Informe um número", invalid_type_error: "Informe um número" })
    .int("Informe um número inteiro")
    .min(1, "Mínimo de 1 lead")
    .max(500, "Máximo de 500 leads"),
  plan: z.enum(["Free", "Pro"]),
});

export type Step1Values = z.infer<typeof step1Schema>;
export type Step2Values = z.infer<typeof step2Schema>;
export type Step3Values = z.infer<typeof step3Schema>;
export type SignupPayload = Step1Values & Step2Values & Step3Values;

// ---------------------------------------------------------------------------
// Perfil (broker_profiles)
// ---------------------------------------------------------------------------

export type BrokerProfile = {
  id: string;
  full_name: string;
  phone: string;
  creci: string;
  avatar_url: string | null;
  bio: string | null;
  regions: string[];
  property_types: string[];
  specialties: string[];
  ticket_range: string | null;
  channels: { whatsapp: boolean; instagram: boolean; email: boolean };
  availability: string | null;
  lead_limit: number | null;
  plan: "Free" | "Pro";
};

/** Monta a linha de broker_profiles a partir do payload do cadastro. */
function profileRowFromPayload(
  userId: string,
  p: Omit<SignupPayload, "password" | "confirmPassword">,
) {
  return {
    id: userId,
    full_name: p.fullName,
    phone: p.phone,
    creci: p.creci,
    avatar_url: p.avatarUrl || null,
    bio: p.bio || null,
    regions: p.regions,
    property_types: p.propertyTypes,
    specialties: p.specialties,
    ticket_range: p.ticketRange,
    channels: p.channels,
    availability: p.availability,
    lead_limit: p.leadLimit,
    plan: p.plan,
    terms_accepted_at: new Date().toISOString(),
  };
}

export type SignUpResult =
  | { status: "complete" } // sessão criada + perfil salvo → pode ir para /app
  | { status: "confirm-email" } // confirmação de e-mail pendente
  | { status: "error"; message: string };

/**
 * Faz upload do avatar do corretor para o bucket `avatars`, na pasta do
 * próprio usuário (path `{userId}/avatar.{ext}`). Requer sessão ativa.
 * Retorna a URL pública ou null em caso de falha.
 */
export async function uploadAvatar(userId: string, file: File): Promise<string | null> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/avatar.${ext}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) {
    console.error("Falha ao enviar avatar:", error.message);
    return null;
  }
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  // cache-buster para refletir troca de foto na mesma URL
  return `${data.publicUrl}?v=${Date.now()}`;
}

/**
 * Cria a conta no Supabase Auth. O payload completo do onboarding vai em
 * user_metadata — assim, se a confirmação de e-mail estiver ativa (sem sessão
 * no signUp), o perfil é criado no primeiro login via ensureProfile.
 * Se `avatarFile` for informado, o upload acontece após a sessão existir.
 */
export async function signUpBroker(
  payload: SignupPayload,
  avatarFile?: File | null,
): Promise<SignUpResult> {
  const { password, confirmPassword: _confirm, ...profile } = payload;

  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password,
    options: { data: { ...profile, termsAcceptedAt: new Date().toISOString() } },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { status: "error", message: "Este e-mail já possui uma conta. Faça login." };
    }
    return { status: "error", message: error.message };
  }

  // Supabase retorna user sem identities quando o e-mail já existe (com confirmação ON)
  if (data.user && data.user.identities?.length === 0) {
    return { status: "error", message: "Este e-mail já possui uma conta. Faça login." };
  }

  if (data.session && data.user) {
    // Com sessão ativa já podemos enviar o avatar para o Storage
    let avatarUrl = profile.avatarUrl || null;
    if (avatarFile) {
      avatarUrl = (await uploadAvatar(data.user.id, avatarFile)) ?? avatarUrl;
    }

    const { error: insertError } = await supabase
      .from("broker_profiles")
      .insert(profileRowFromPayload(data.user.id, { ...profile, avatarUrl: avatarUrl ?? "" }));
    if (insertError) {
      // Conta criada; o perfil será recriado via ensureProfile no próximo login
      console.error("Falha ao salvar perfil no cadastro:", insertError.message);
    }
    return { status: "complete" };
  }

  return { status: "confirm-email" };
}

/**
 * Garante que o corretor logado tem linha em broker_profiles.
 * Se não tiver (ex.: cadastro com confirmação de e-mail), cria a partir
 * de user_metadata. Retorna o perfil (ou null se não conseguir criar).
 */
export async function ensureProfile(session: Session): Promise<BrokerProfile | null> {
  const { data: existing } = await supabase
    .from("broker_profiles")
    .select("*")
    .eq("id", session.user.id)
    .maybeSingle();

  if (existing) return existing as BrokerProfile;

  const m = session.user.user_metadata ?? {};
  const row = {
    id: session.user.id,
    full_name: m.fullName ?? session.user.email ?? "Corretor",
    phone: m.phone ?? "",
    creci: m.creci ?? "",
    avatar_url: m.avatarUrl || null,
    bio: m.bio || null,
    regions: m.regions ?? [],
    property_types: m.propertyTypes ?? [],
    specialties: m.specialties ?? [],
    ticket_range: m.ticketRange ?? null,
    channels: m.channels ?? { whatsapp: false, instagram: false, email: false },
    availability: m.availability ?? null,
    lead_limit: m.leadLimit ?? null,
    plan: m.plan === "Pro" ? "Pro" : "Free",
    terms_accepted_at: m.termsAcceptedAt ?? new Date().toISOString(),
  };

  const { data: created, error } = await supabase
    .from("broker_profiles")
    .insert(row)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Falha ao criar perfil:", error.message);
    return null;
  }
  return created as BrokerProfile | null;
}

// ---------------------------------------------------------------------------
// Sessão
// ---------------------------------------------------------------------------

/** Sessão reativa do Supabase (client-side). */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, loading };
}

/**
 * Perfil do corretor logado (broker_profiles), com self-healing via
 * ensureProfile. Retorna null enquanto carrega ou sem sessão.
 */
export function useBrokerProfile() {
  const { session } = useSession();
  const [profile, setProfile] = useState<BrokerProfile | null>(null);
  const userId = session?.user.id;

  useEffect(() => {
    if (!session) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    ensureProfile(session).then((p) => {
      if (!cancelled) setProfile(p);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return profile;
}
