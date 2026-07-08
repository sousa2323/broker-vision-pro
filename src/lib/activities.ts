import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/auth";

export const ACTIVITY_TYPES = ["Ligação", "Visita", "Follow-up", "E-mail", "Reunião"] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export type Activity = {
  id: string;
  broker_id: string;
  lead_id: string | null;
  property_id: string | null;
  tipo: ActivityType;
  cliente: string;
  imovel?: string;
  nota: string;
  scheduledAt: string;
  /** rótulo de data amigável: "Hoje", "Amanhã", "Sex 28" */
  data: string;
  /** "09:30" */
  hora: string;
  done: boolean;
};

export type ActivityInput = {
  tipo: ActivityType;
  cliente: string;
  imovel?: string;
  nota?: string;
  scheduledAt: string;
  lead_id?: string | null;
  property_id?: string | null;
};

type ActivityRow = {
  id: string;
  broker_id: string;
  lead_id: string | null;
  property_id: string | null;
  tipo: ActivityType;
  cliente: string | null;
  imovel: string | null;
  nota: string | null;
  scheduled_at: string;
  done: boolean;
};

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function dateLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(d) - startOf(today)) / 86_400_000);
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Amanhã";
  if (diffDays === -1) return "Ontem";
  return `${DIAS[d.getDay()]} ${d.getDate()}`;
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function mapActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    broker_id: row.broker_id,
    lead_id: row.lead_id,
    property_id: row.property_id,
    tipo: row.tipo,
    cliente: row.cliente ?? "",
    imovel: row.imovel ?? undefined,
    nota: row.nota ?? "",
    scheduledAt: row.scheduled_at,
    data: dateLabel(row.scheduled_at),
    hora: timeLabel(row.scheduled_at),
    done: row.done,
  };
}

export async function listActivities(): Promise<Activity[]> {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .order("scheduled_at", { ascending: true });
  if (error) {
    console.error("Falha ao listar atividades:", error.message);
    return [];
  }
  return ((data ?? []) as ActivityRow[]).map(mapActivity);
}

export async function createActivity(
  brokerId: string,
  input: ActivityInput,
): Promise<Activity | null> {
  const { data, error } = await supabase
    .from("activities")
    .insert({
      broker_id: brokerId,
      lead_id: input.lead_id ?? null,
      property_id: input.property_id ?? null,
      tipo: input.tipo,
      cliente: input.cliente,
      imovel: input.imovel || null,
      nota: input.nota || null,
      scheduled_at: input.scheduledAt,
    })
    .select()
    .single();
  if (error) {
    console.error("Falha ao criar atividade:", error.message);
    return null;
  }
  return mapActivity(data as ActivityRow);
}

export async function setActivityDone(id: string, done: boolean): Promise<boolean> {
  const { error } = await supabase.from("activities").update({ done }).eq("id", id);
  if (error) {
    console.error("Falha ao atualizar atividade:", error.message);
    return false;
  }
  return true;
}

export async function deleteActivity(id: string): Promise<boolean> {
  const { error } = await supabase.from("activities").delete().eq("id", id);
  if (error) {
    console.error("Falha ao excluir atividade:", error.message);
    return false;
  }
  return true;
}

/** Lista reativa das atividades do corretor logado. */
export function useActivities() {
  const { session } = useSession();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = session?.user.id;

  const refetch = useCallback(async () => {
    if (!userId) {
      setActivities([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setActivities(await listActivities());
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { activities, loading, refetch };
}
