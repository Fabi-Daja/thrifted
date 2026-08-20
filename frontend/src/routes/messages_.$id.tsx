import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, Check, Send, X } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { LoadingSpinner } from "@/components/feedback/LoadingSpinner";
import { Avatar } from "@/components/user/Avatar";
import { Button } from "@/components/forms/Button";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { conversationKeys, useConversation, useConversationMessages, useSendMessage } from "@/hooks/useConversations";
import { useBidAction } from "@/hooks/useBids";
import { formatPrice, formatRelativeDate, cn } from "@/lib/utils";
import { extractApiError } from "@/api/axiosInstance";
import type { ChatMessageResponse } from "@/types";

export const Route = createFileRoute("/messages_/$id")({
  component: () => (
    <ProtectedRoute>
      <ConversationThreadPage />
    </ProtectedRoute>
  ),
});

function ConversationThreadPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const { notify } = useToast();
  const qc = useQueryClient();
  const { data: conversation } = useConversation(id);
  const { data: messages } = useConversationMessages(id);
  const sendMessage = useSendMessage(id);
  const { accept, reject } = useBidAction(conversation?.product.id ?? "");

  // Backend-i shton vetë një mesazh pasues kur oferta pranohet/refuzohet, dhe
  // WS e njofton palën tjetër - por moderatori (unë) duhet ta shohë menjëherë
  // te vetja, pa pritur round-trip-in e WebSocket-it.
  const refreshThread = () => qc.invalidateQueries({ queryKey: conversationKeys.messages(id) });

  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages?.length]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setText("");
    sendMessage.mutate(content, {
      onError: (err) => notify(extractApiError(err), "error"),
    });
  };

  if (!conversation || !messages) return <LoadingSpinner fullPage />;

  return (
    <PageContainer narrow className="flex h-[calc(100vh-9rem)] flex-col gap-0 py-0 sm:py-0">
      <div className="flex items-center gap-3 border-b border-border py-4">
        <Link to="/messages" className="rounded p-1.5 text-textSecondary hover:bg-background hover:text-textPrimary">
          <ArrowLeft className="size-5" />
        </Link>
        <Avatar
          src={conversation.counterparty.profile_photo_url}
          name={conversation.counterparty.full_name ?? conversation.counterparty.username}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-textPrimary">
            {conversation.counterparty.full_name ?? conversation.counterparty.username}
          </p>
          <Link
            to="/products/$id"
            params={{ id: conversation.product.id }}
            className="truncate text-xs text-primary hover:underline"
          >
            {conversation.product.title} · {formatPrice(conversation.product.price)}
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <p className="py-16 text-center text-sm text-textSecondary">
            Ende s'ka mesazhe - fillo bisedën!
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                isMine={m.sender_id === user?.id}
                canModerate={conversation.is_seller}
                onAccept={() => accept.mutate(m.bid!.id, { onSuccess: refreshThread })}
                onReject={() => reject.mutate(m.bid!.id, { onSuccess: refreshThread })}
                actionLoading={accept.isPending || reject.isPending}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form onSubmit={submit} className="flex items-center gap-2 border-t border-border py-4">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Shkruaj një mesazh…"
          className="flex-1 rounded border border-border bg-surface px-3 py-2.5 text-sm text-textPrimary placeholder:text-textSecondary/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <Button type="submit" disabled={!text.trim()} loading={sendMessage.isPending} aria-label="Dërgo">
          <Send className="size-4" />
        </Button>
      </form>
    </PageContainer>
  );
}

function MessageBubble({
  message,
  isMine,
  canModerate,
  onAccept,
  onReject,
  actionLoading,
}: {
  message: ChatMessageResponse;
  isMine: boolean;
  canModerate: boolean;
  onAccept: () => void;
  onReject: () => void;
  actionLoading: boolean;
}) {
  if (message.bid) {
    const statusLabel: Record<string, string> = {
      pending: "Në pritje",
      accepted: "Pranuar",
      rejected: "Refuzuar",
    };
    return (
      <div className={cn("flex flex-col gap-1", isMine ? "items-end" : "items-start")}>
        <div className="w-full max-w-xs rounded-lg border border-primary/30 bg-primary/5 p-3">
          <p className="text-sm text-textPrimary">{message.content}</p>
          <p className="mt-1 text-xs text-textSecondary">
            Oferta: {formatPrice(message.bid.amount)} · {statusLabel[message.bid.status] ?? message.bid.status}
          </p>
          {canModerate && message.bid.status === "pending" && (
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={onAccept} loading={actionLoading}>
                <Check className="size-3.5" /> Prano
              </Button>
              <Button size="sm" variant="outline" onClick={onReject} loading={actionLoading}>
                <X className="size-3.5" /> Refuzo
              </Button>
            </div>
          )}
        </div>
        <span className="text-xs text-textSecondary">{formatRelativeDate(message.created_at)}</span>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1", isMine ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-xs rounded-lg px-3 py-2 text-sm sm:max-w-sm",
          isMine ? "bg-primary text-surface" : "border border-border bg-surface text-textPrimary",
        )}
      >
        {message.content}
      </div>
      <span className="text-xs text-textSecondary">{formatRelativeDate(message.created_at)}</span>
    </div>
  );
}
