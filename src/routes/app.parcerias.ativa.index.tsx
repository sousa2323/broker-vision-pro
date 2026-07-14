import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Handshake, Loader2, ShieldCheck } from "lucide-react";
import { useDirectory } from "@/lib/directory";
import { timeAgo } from "@/lib/format";
import { usePartnershipConversations, usePartnershipRequests } from "@/lib/partnerships";

export const Route = createFileRoute("/app/parcerias/ativa/")({
  component: ActivePartnerships,
  head: () => ({
    meta: [
      { title: "Parcerias ativas — Ubroker" },
      {
        name: "description",
        content: "Acompanhamento das parcerias ativas entre corretores.",
      },
    ],
  }),
});

function ActivePartnerships() {
  const { requests, loading, currentUserId } = usePartnershipRequests();
  const { conversations } = usePartnershipConversations();
  const { brokers } = useDirectory();
  const brokersById = useMemo(() => new Map(brokers.map((b) => [b.id, b])), [brokers]);
  const accepted = requests.filter((request) => request.status === "accepted");
  const propertyNameByPartnership = useMemo(
    () => new Map(conversations.map((c) => [c.partnership_id, c.property_nome])),
    [conversations],
  );

  return (
    <div className="space-y-8">
      <Link
        to="/app/parcerias"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para parcerias
      </Link>

      {loading ? (
        <div className="grid place-items-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : accepted.length ? (
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Parcerias ativas
            </div>
            <h1 className="mt-2 font-display text-2xl">Suas operações em andamento</h1>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {accepted.map((request) => {
              const partnerId =
                request.sender_id === currentUserId ? request.receiver_id : request.sender_id;
              const partner = brokersById.get(partnerId);
              return (
                <Link
                  key={request.id}
                  to="/app/parcerias/ativa/$id"
                  params={{ id: request.id }}
                  className="flex items-center justify-between rounded-2xl border border-border bg-card p-5 transition hover:border-brand/40 hover:shadow-sm"
                >
                  <div>
                    <div className="font-medium">
                      Parceria com {partner?.full_name ?? "corretor parceiro"}
                      {propertyNameByPartnership.has(request.id)
                        ? ` · ${propertyNameByPartnership.get(request.id)}`
                        : ""}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Aceita {timeAgo(request.responded_at ?? request.created_at)} · abrir workspace
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-border bg-card py-24 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-surface text-muted-foreground">
            <Handshake className="h-7 w-7" />
          </div>
          <div className="font-display text-lg">Nenhuma parceria ativa</div>
          <p className="max-w-sm text-sm text-muted-foreground">
            Quando você fechar uma parceria com outro corretor, o acompanhamento da operação
            aparecerá aqui.
          </p>
          <Link
            to="/app/parcerias"
            className="mt-1 inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm text-navy-foreground"
          >
            <Handshake className="h-4 w-4" /> Explorar corretores
          </Link>
        </div>
      )}
    </div>
  );
}
