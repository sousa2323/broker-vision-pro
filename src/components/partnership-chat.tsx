import { useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";
import type { PartnershipMessage } from "@/lib/partnerships";

const sugestoes = ["Enviar proposta", "Confirmar visita", "Aguardando retorno"];

export function PartnershipChat({
  messages,
  loading,
  currentUserId,
  partnerName,
  onSend,
  messagesMaxHeight = 240,
  messagesClassName,
  autoFocus,
}: {
  messages: PartnershipMessage[];
  loading: boolean;
  currentUserId?: string;
  partnerName: string;
  onSend: (text: string) => Promise<boolean>;
  messagesMaxHeight?: number | null;
  messagesClassName?: string;
  autoFocus?: boolean;
}) {
  const [valor, setValor] = useState("");
  const [sending, setSending] = useState(false);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const lastMessageId = messages[messages.length - 1]?.id;

  useEffect(() => {
    if (loading) return;
    const frame = window.requestAnimationFrame(() => {
      const messagesEl = messagesRef.current;
      if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [lastMessageId, loading]);

  async function send() {
    const t = valor.trim();
    if (!t || sending) return;
    setSending(true);
    const ok = await onSend(t);
    setSending(false);
    if (ok) setValor("");
  }

  return (
    <>
      <div
        ref={messagesRef}
        className={cn(
          "partnership-chat-scroll mt-4 flex-1 space-y-2 overflow-y-auto pr-2",
          messagesClassName,
        )}
        style={messagesMaxHeight == null ? undefined : { maxHeight: messagesMaxHeight }}
      >
        {loading ? (
          <div className="grid h-full place-items-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length ? (
          messages.map((m) => {
            const mine = m.sender_id === currentUserId;
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                    mine ? "bg-navy text-navy-foreground" : "border border-border bg-background",
                  )}
                >
                  <div>{m.body}</div>
                  <div
                    className={cn(
                      "mt-1 text-[10px]",
                      mine ? "text-white/60" : "text-muted-foreground",
                    )}
                  >
                    {mine ? "Você" : partnerName.split(" ")[0]} · {timeAgo(m.created_at)}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="grid place-items-center py-8 text-center text-xs text-muted-foreground">
            Inicie a conversa com seu parceiro.
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
        {sugestoes.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setValor(s)}
            className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground transition hover:border-orange-300 hover:text-orange-600"
          >
            {s}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Input
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="Escrever mensagem..."
          autoFocus={autoFocus}
          onKeyDown={(e) => {
            if (e.key === "Enter") void send();
          }}
        />
        <Button onClick={() => void send()} disabled={!valor.trim() || sending}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
}
