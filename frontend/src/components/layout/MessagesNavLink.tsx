import { Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useConversations } from "@/hooks/useConversations";

export function MessagesNavLink() {
  const { isLoggedIn } = useAuth();
  const { data: conversations } = useConversations(isLoggedIn);

  if (!isLoggedIn) return null;

  const unreadCount = (conversations ?? []).reduce((sum, c) => sum + c.unread_count, 0);

  return (
    <Link
      to="/messages"
      className="relative flex size-9 items-center justify-center rounded-full text-textSecondary transition-colors hover:bg-background hover:text-textPrimary"
      aria-label="Mesazhet"
    >
      <MessageCircle className="size-5" aria-hidden="true" />
      {unreadCount > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-none text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
