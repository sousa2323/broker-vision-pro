import { useEffect, useState } from "react";
import { ArrowLeft, MessageCircle, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PartnershipChat } from "@/components/partnership-chat";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";
import { useDirectory, type DirectoryBroker } from "@/lib/directory";
import {
  markPartnershipRead,
  sendPartnershipMessage,
  usePartnershipConversations,
  usePartnershipMessages,
  type PartnershipConversation,
} from "@/lib/partnerships";

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function PartnerAvatar({ partner, className }: { partner?: DirectoryBroker; className?: string }) {
  const name = partner?.full_name ?? "Corretor parceiro";
  return (
    <Avatar className={className}>
      {partner?.avatar_url ? (
        <AvatarImage src={partner.avatar_url} alt="" className="object-cover" />
      ) : null}
      <AvatarFallback>
        <span className="text-xs font-medium">{initials(name)}</span>
      </AvatarFallback>
    </Avatar>
  );
}

function ConversationRow({
  conversation,
  partner,
  currentUserId,
  onOpen,
}: {
  conversation: PartnershipConversation;
  partner?: DirectoryBroker;
  currentUserId?: string;
  onOpen: () => void;
}) {
  const name = partner?.full_name ?? "Corretor parceiro";
  const mine = conversation.last_message_sender_id === currentUserId;
  const preview = conversation.last_message_body
    ? `${mine ? "Você: " : ""}${conversation.last_message_body}`
    : "Inicie a conversa com seu parceiro.";
  const unread = conversation.unread_count > 0;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/60"
    >
      <PartnerAvatar partner={partner} className="h-10 w-10 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("truncate text-sm", unread ? "font-semibold" : "font-medium")}>
            {name}
          </span>
          {conversation.last_message_at ? (
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {timeAgo(conversation.last_message_at)}
            </span>
          ) : null}
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <span
            className={cn(
              "truncate text-xs",
              unread ? "font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            {preview}
          </span>
          {unread ? (
            <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-brand px-1.5 text-[10px] font-semibold text-white">
              {conversation.unread_count > 9 ? "9+" : conversation.unread_count}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function ChatView({
  partnershipId,
  partner,
  currentUserId,
  onBack,
}: {
  partnershipId: string;
  partner?: DirectoryBroker;
  currentUserId?: string;
  onBack: () => void;
}) {
  const { messages, loading, refresh } = usePartnershipMessages(partnershipId);
  const name = partner?.full_name ?? "Corretor parceiro";
  const lastMessageId = messages[messages.length - 1]?.id;

  // Ao abrir e a cada mensagem recebida com o chat visível, zera as não lidas.
  useEffect(() => {
    if (!loading) void markPartnershipRead(partnershipId);
  }, [partnershipId, loading, lastMessageId]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar para conversas"
          className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <PartnerAvatar partner={partner} className="h-8 w-8" />
        <span className="truncate text-sm font-medium">{name}</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">
        <PartnershipChat
          messages={messages}
          loading={loading}
          currentUserId={currentUserId}
          partnerName={name}
          messagesMaxHeight={null}
          messagesClassName="min-h-0"
          autoFocus
          onSend={async (texto) => {
            const error = await sendPartnershipMessage(partnershipId, texto);
            if (error) {
              toast.error(error);
              return false;
            }
            await refresh();
            return true;
          }}
        />
      </div>
    </div>
  );
}

/**
 * Balão flutuante de chat (estilo Messenger), montado no AppLayout.
 * Visível em todas as páginas /app/* quando há ao menos uma parceria aceita.
 */
export function PartnershipChatWidget() {
  const { conversations, loading, currentUserId } = usePartnershipConversations();
  const { brokers } = useDirectory();
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  if (loading && conversations.length === 0) return null;
  if (conversations.length === 0) return null;

  const totalUnread = conversations.reduce((total, c) => total + c.unread_count, 0);
  const active = conversations.find((c) => c.partnership_id === activeId);
  const partnerOf = (c: PartnershipConversation) => brokers.find((b) => b.id === c.partner_id);

  return (
    <>
      {open ? (
        <div className="fixed right-6 bottom-24 z-40 flex h-[min(560px,calc(100dvh-8rem))] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          {active ? (
            <ChatView
              partnershipId={active.partnership_id}
              partner={partnerOf(active)}
              currentUserId={currentUserId}
              onBack={() => setActiveId(null)}
            />
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <div className="text-xs tracking-widest text-muted-foreground uppercase">
                    Conversas de parceria
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    Chats vinculados às suas parcerias ativas.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar conversas"
                  className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="partnership-chat-scroll min-h-0 flex-1 divide-y divide-border overflow-y-auto">
                {conversations.map((conversation) => (
                  <ConversationRow
                    key={conversation.partnership_id}
                    conversation={conversation}
                    partner={partnerOf(conversation)}
                    currentUserId={currentUserId}
                    onOpen={() => setActiveId(conversation.partnership_id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "Fechar chat de parcerias" : "Abrir chat de parcerias"}
        className="fixed right-6 bottom-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-navy text-navy-foreground shadow-lg transition hover:scale-105"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && totalUnread > 0 ? (
          <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 text-[10px] font-semibold text-white">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        ) : null}
      </button>
    </>
  );
}
