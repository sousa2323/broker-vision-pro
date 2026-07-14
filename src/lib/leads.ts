import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/auth";
import { timeAgo } from "@/lib/format";

export const LEAD_STATUSES = [
  "Novo",
  "Qualificado",
  "Visita",
  "Proposta",
  "Fechado",
  "Perdido",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_ORIGINS = ["Instagram", "WhatsApp", "Marketplace", "Indicação", "Outro"] as const;
export type LeadOrigin = (typeof LEAD_ORIGINS)[number];

export type LeadEvent = { data: string; tipo: string; texto: string; created_at: string };

export type Lead = {
  id: string;
  broker_id: string;
  nome: string;
  email: string;
  telefone: string;
  origem: LeadOrigin;
  origemDetalhe?: string;
  interesse: string;
  status: LeadStatus;
  orcamento: number;
  motivoPerda?: string;
  lastInteractionAt: string;
  /** derivado de last_interaction_at, ex.: "há 2h" */
  ultimaInteracao: string;
  historico: LeadEvent[];
};

export type LeadInput = {
  nome: string;
  email?: string;
  telefone?: string;
  origem: LeadOrigin;
  origemDetalhe?: string;
  interesse?: string;
  status?: LeadStatus;
  orcamento?: number;
};

type LeadRow = {
  id: string;
  broker_id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  origem: LeadOrigin;
  origem_detalhe: string | null;
  interesse: string | null;
  status: LeadStatus;
  orcamento: number;
  motivo_perda: string | null;
  last_interaction_at: string;
};

type EventRow = {
  id: string;
  lead_id: string;
  tipo: string;
  texto: string | null;
  created_at: string;
};

function mapLead(row: LeadRow, events: EventRow[]): Lead {
  return {
    id: row.id,
    broker_id: row.broker_id,
    nome: row.nome,
    email: row.email ?? "",
    telefone: row.telefone ?? "",
    origem: row.origem,
    origemDetalhe: row.origem_detalhe ?? undefined,
    interesse: row.interesse ?? "",
    status: row.status,
    orcamento: Number(row.orcamento) || 0,
    motivoPerda: row.motivo_perda ?? undefined,
    lastInteractionAt: row.last_interaction_at,
    ultimaInteracao: timeAgo(row.last_interaction_at),
    historico: events
      .filter((e) => e.lead_id === row.id)
      .map((e) => ({
        data: timeAgo(e.created_at),
        tipo: e.tipo,
        texto: e.texto ?? "",
        created_at: e.created_at,
      })),
  };
}

export async function listLeads(): Promise<Lead[]> {
  const { data: rows, error } = await supabase
    .from("leads")
    .select("*")
    .order("last_interaction_at", { ascending: false });
  if (error) {
    console.error("Falha ao listar leads:", error.message);
    return [];
  }
  const leadRows = (rows ?? []) as LeadRow[];
  if (leadRows.length === 0) return [];

  const { data: eventRows } = await supabase
    .from("lead_events")
    .select("*")
    .in(
      "lead_id",
      leadRows.map((l) => l.id),
    )
    .order("created_at", { ascending: false });

  return leadRows.map((r) => mapLead(r, (eventRows ?? []) as EventRow[]));
}

export async function createLead(brokerId: string, input: LeadInput): Promise<Lead | null> {
  const { data, error } = await supabase
    .from("leads")
    .insert({
      broker_id: brokerId,
      nome: input.nome,
      email: input.email || null,
      telefone: input.telefone || null,
      origem: input.origem,
      origem_detalhe: input.origemDetalhe || null,
      interesse: input.interesse || null,
      status: input.status ?? "Novo",
      orcamento: input.orcamento ?? 0,
    })
    .select()
    .single();
  if (error) {
    console.error("Falha ao criar lead:", error.message);
    return null;
  }
  return mapLead(data as LeadRow, []);
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus,
  motivoPerda?: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("leads")
    .update({
      status,
      motivo_perda: motivoPerda ?? null,
      last_interaction_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    console.error("Falha ao atualizar lead:", error.message);
    return false;
  }
  return true;
}

/** Registra uma interação e atualiza o last_interaction_at do lead. */
export async function addLeadEvent(
  brokerId: string,
  leadId: string,
  tipo: string,
  texto: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("lead_events")
    .insert({ broker_id: brokerId, lead_id: leadId, tipo, texto });
  if (error) {
    console.error("Falha ao registrar interação:", error.message);
    return false;
  }
  await supabase
    .from("leads")
    .update({ last_interaction_at: new Date().toISOString() })
    .eq("id", leadId);
  return true;
}

/** Lista reativa dos leads do corretor logado. */
export function useLeads() {
  const { session } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = session?.user.id;

  const refetch = useCallback(async () => {
    if (!userId) {
      setLeads([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLeads(await listLeads());
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { leads, loading, refetch };
}
