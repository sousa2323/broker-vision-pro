import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/auth";

/** Corretor no diretório da plataforma (view broker_directory, sem PII). */
export type DirectoryBroker = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  regions: string[];
  property_types: string[];
  specialties: string[];
  ticket_range: string | null;
  plan: "Free" | "Pro";
  referral_slug: string | null;
};

export async function getDirectoryBroker(id: string): Promise<DirectoryBroker | null> {
  const { data, error } = await supabase
    .from("broker_directory")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("Falha ao carregar corretor:", error.message);
    return null;
  }
  return (data as DirectoryBroker) ?? null;
}

export async function listDirectory(excludeId?: string): Promise<DirectoryBroker[]> {
  const { data, error } = await supabase
    .from("broker_directory")
    .select("*")
    .order("full_name", { ascending: true });
  if (error) {
    console.error("Falha ao carregar diretório de corretores:", error.message);
    return [];
  }
  const rows = (data ?? []) as DirectoryBroker[];
  return excludeId ? rows.filter((b) => b.id !== excludeId) : rows;
}

/** Diretório de outros corretores (exclui o corretor logado). */
export function useDirectory() {
  const { session } = useSession();
  const [brokers, setBrokers] = useState<DirectoryBroker[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = session?.user.id;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listDirectory(userId).then((rows) => {
      if (!cancelled) {
        setBrokers(rows);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { brokers, loading };
}
