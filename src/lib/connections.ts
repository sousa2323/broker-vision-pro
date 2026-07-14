import { useCallback, useEffect, useId, useState } from "react";
import { useSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export type ConnectionStatus = "pending" | "accepted" | "declined";

export type BrokerConnection = {
  id: string;
  requester_id: string;
  target_id: string;
  message: string;
  status: ConnectionStatus;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function createConnectionRequest(input: {
  targetId: string;
  message: string;
}): Promise<{ connection: BrokerConnection | null; error: string | null }> {
  const { data: authData } = await supabase.auth.getUser();
  const requesterId = authData.user?.id;
  if (!requesterId) return { connection: null, error: "Sua sessão expirou. Entre novamente." };

  const { data, error } = await supabase
    .from("broker_connections")
    .insert({
      requester_id: requesterId,
      target_id: input.targetId,
      message: input.message.trim(),
    })
    .select()
    .single();

  if (error) {
    const duplicate = error.code === "23505";
    return {
      connection: null,
      error: duplicate
        ? "Já existe uma solicitação de conexão com este corretor."
        : "Não foi possível enviar a solicitação. Tente novamente.",
    };
  }
  return { connection: data as BrokerConnection, error: null };
}

export async function respondToConnectionRequest(
  requestId: string,
  response: "accepted" | "declined",
): Promise<string | null> {
  const { error } = await supabase.rpc("respond_to_connection_request", {
    request_id: requestId,
    response,
  });
  return error ? "Não foi possível responder à solicitação. Tente novamente." : null;
}

export function useConnections() {
  const { session } = useSession();
  const instanceId = useId().replace(/:/g, "");
  const userId = session?.user.id;
  const [connections, setConnections] = useState<BrokerConnection[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setConnections([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("broker_connections")
      .select("*")
      .or(`requester_id.eq.${userId},target_id.eq.${userId}`)
      .order("created_at", { ascending: false });
    if (error) console.error("Falha ao carregar conexões:", error.message);
    setConnections((data ?? []) as BrokerConnection[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void refresh();
    if (!userId) return;
    const channel = supabase
      .channel(`broker-connections-${userId}-${instanceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "broker_connections" },
        () => void refresh(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [instanceId, refresh, userId]);

  return { connections, loading, refresh, currentUserId: userId };
}
