import { useCallback, useEffect, useId, useState } from "react";
import { useSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { Property } from "@/lib/properties";

export type PartnershipStatus = "pending" | "accepted" | "declined";

export type PartnershipRequest = {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  partnership_type: string;
  notes: string | null;
  status: PartnershipStatus;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PartnershipMessage = {
  id: string;
  partnership_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export async function createPartnershipRequest(input: {
  receiverId: string;
  message: string;
  partnershipType: string;
  notes?: string;
}): Promise<{ request: PartnershipRequest | null; error: string | null }> {
  const { data: authData } = await supabase.auth.getUser();
  const senderId = authData.user?.id;
  if (!senderId) return { request: null, error: "Sua sessão expirou. Entre novamente." };

  const { data, error } = await supabase
    .from("partnership_requests")
    .insert({
      sender_id: senderId,
      receiver_id: input.receiverId,
      message: input.message.trim(),
      partnership_type: input.partnershipType,
      notes: input.notes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    const duplicate = error.code === "23505";
    return {
      request: null,
      error: duplicate
        ? "Já existe uma solicitação pendente para este corretor."
        : "Não foi possível enviar a solicitação. Tente novamente.",
    };
  }
  return { request: data as PartnershipRequest, error: null };
}

export async function respondToPartnershipRequest(
  requestId: string,
  response: "accepted" | "declined",
): Promise<string | null> {
  const { error } = await supabase.rpc("respond_to_partnership_request", {
    request_id: requestId,
    response,
  });
  return error ? "Não foi possível responder à solicitação. Tente novamente." : null;
}

export function usePartnershipRequests() {
  const { session } = useSession();
  const instanceId = useId().replace(/:/g, "");
  const userId = session?.user.id;
  const [requests, setRequests] = useState<PartnershipRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setRequests([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("partnership_requests")
      .select("*")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false });
    if (error) console.error("Falha ao carregar solicitações de parceria:", error.message);
    setRequests((data ?? []) as PartnershipRequest[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void refresh();
    if (!userId) return;
    const channel = supabase
      .channel(`partnership-requests-${userId}-${instanceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "partnership_requests" },
        () => void refresh(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [instanceId, refresh, userId]);

  return { requests, loading, refresh, currentUserId: userId };
}

export async function listPartnershipProperties(requestId: string): Promise<Property[]> {
  const { data, error } = await supabase.rpc("list_partnership_properties", {
    request_id: requestId,
  });
  if (error) {
    console.error("Falha ao carregar imóveis da parceria:", error.message);
    return [];
  }
  return (data ?? []) as Property[];
}

export async function sendPartnershipMessage(
  partnershipId: string,
  body: string,
): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return "Sua sessão expirou. Entre novamente.";
  const { error } = await supabase.from("partnership_messages").insert({
    partnership_id: partnershipId,
    sender_id: data.user.id,
    body: body.trim(),
  });
  return error ? "Não foi possível enviar a mensagem." : null;
}

export type PartnershipConversation = {
  partnership_id: string;
  partner_id: string;
  last_message_body: string | null;
  last_message_at: string | null;
  last_message_sender_id: string | null;
  unread_count: number;
};

export async function markPartnershipRead(partnershipId: string): Promise<void> {
  const { error } = await supabase.rpc("mark_partnership_read", {
    p_partnership_id: partnershipId,
  });
  if (error) console.error("Falha ao marcar chat como lido:", error.message);
}

export function usePartnershipConversations() {
  const { session } = useSession();
  const instanceId = useId().replace(/:/g, "");
  const userId = session?.user.id;
  const [conversations, setConversations] = useState<PartnershipConversation[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setConversations([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.rpc("list_partnership_conversations");
    if (error) console.error("Falha ao carregar conversas de parceria:", error.message);
    setConversations(
      ((data ?? []) as PartnershipConversation[]).map((row) => ({
        ...row,
        unread_count: Number(row.unread_count ?? 0),
      })),
    );
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void refresh();
    if (!userId) return;
    const channel = supabase
      .channel(`partnership-conversations-${userId}-${instanceId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "partnership_messages" },
        () => void refresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "partnership_chat_reads",
          filter: `user_id=eq.${userId}`,
        },
        () => void refresh(),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "partnership_requests" },
        () => void refresh(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [instanceId, refresh, userId]);

  return { conversations, loading, refresh, currentUserId: userId };
}

export function usePartnershipMessages(partnershipId: string) {
  const instanceId = useId().replace(/:/g, "");
  const [messages, setMessages] = useState<PartnershipMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("partnership_messages")
      .select("*")
      .eq("partnership_id", partnershipId)
      .order("created_at", { ascending: true });
    if (error) console.error("Falha ao carregar chat da parceria:", error.message);
    setMessages((data ?? []) as PartnershipMessage[]);
    setLoading(false);
  }, [partnershipId]);

  useEffect(() => {
    void refresh();
    const channel = supabase
      .channel(`partnership-chat-${partnershipId}-${instanceId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "partnership_messages",
          filter: `partnership_id=eq.${partnershipId}`,
        },
        () => void refresh(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [instanceId, partnershipId, refresh]);

  return { messages, loading, refresh };
}
