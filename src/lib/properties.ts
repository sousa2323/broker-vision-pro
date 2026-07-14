import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/auth";

export const PROPERTY_STATUSES = [
  "Ativo",
  "Em negociação",
  "Vendido",
  "Inativo",
  "Excluído",
] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

export type Property = {
  id: string;
  broker_id: string;
  nome: string;
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  valor: number;
  quartos: number;
  suites: number;
  vagas: number;
  area: number;
  descricao: string | null;
  destaque: boolean;
  marketplace: boolean;
  foto: string | null;
  fotos: string[];
  video: string | null;
  status: PropertyStatus;
  created_at: string;
  updated_at: string;
};

export type PropertyInput = Omit<Property, "id" | "broker_id" | "created_at" | "updated_at">;

export const EMPTY_PROPERTY: PropertyInput = {
  nome: "",
  endereco: "",
  bairro: "",
  cidade: "",
  valor: 0,
  quartos: 0,
  suites: 0,
  vagas: 0,
  area: 0,
  descricao: "",
  destaque: false,
  marketplace: false,
  foto: "",
  fotos: [],
  video: null,
  status: "Ativo",
};

/**
 * Sobe uma foto ou vídeo do imóvel para o bucket `property-media`, na pasta
 * do próprio usuário (`{userId}/{folder}/{uuid}.{ext}`). Requer sessão ativa.
 * Nome de arquivo único ⇒ sem cache-buster. Retorna a URL pública ou null.
 */
export async function uploadPropertyMedia(
  userId: string,
  folder: string,
  file: File,
): Promise<string | null> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("property-media").upload(path, file, {
    upsert: false,
    contentType: file.type,
  });
  if (error) {
    console.error("Falha ao enviar mídia do imóvel:", error.message);
    return null;
  }
  const { data } = supabase.storage.from("property-media").getPublicUrl(path);
  return data.publicUrl;
}

export async function listProperties(): Promise<Property[]> {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Falha ao listar imóveis:", error.message);
    return [];
  }
  return (data ?? []) as Property[];
}

export async function getProperty(id: string): Promise<Property | null> {
  const { data, error } = await supabase.from("properties").select("*").eq("id", id).maybeSingle();
  if (error) {
    console.error("Falha ao carregar imóvel:", error.message);
    return null;
  }
  return (data as Property) ?? null;
}

export async function createProperty(
  brokerId: string,
  input: PropertyInput,
): Promise<Property | null> {
  const { data, error } = await supabase
    .from("properties")
    .insert({ ...input, broker_id: brokerId })
    .select()
    .single();
  if (error) {
    console.error("Falha ao criar imóvel:", error.message);
    return null;
  }
  return data as Property;
}

export async function updateProperty(
  id: string,
  patch: Partial<PropertyInput>,
): Promise<Property | null> {
  const { data, error } = await supabase
    .from("properties")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    console.error("Falha ao atualizar imóvel:", error.message);
    return null;
  }
  return data as Property;
}

export async function deleteProperty(id: string): Promise<boolean> {
  const { error } = await supabase.from("properties").delete().eq("id", id);
  if (error) {
    console.error("Falha ao excluir imóvel:", error.message);
    return false;
  }
  return true;
}

/** Lista reativa dos imóveis do corretor logado. */
export function useProperties() {
  const { session } = useSession();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = session?.user.id;

  const refetch = useCallback(async () => {
    if (!userId) {
      setProperties([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setProperties(await listProperties());
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { properties, loading, refetch };
}
