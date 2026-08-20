import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/feedback/LoadingSpinner";
import {
  useNotifications,
  useUnreadNotificationsCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/useNotifications";
import { cn, formatRelativeDate } from "@/lib/utils";
import type { NotificationResponse } from "@/types";

export function NotificationBell() {
  const { isLoggedIn } = useAuth();
  const [open, setOpen] = useState(false);

  const { data: unread } = useUnreadNotificationsCount(isLoggedIn);
  const { data: notifications } = useNotifications(isLoggedIn && open);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  if (!isLoggedIn) return null;

  const count = unread?.count ?? 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex size-9 items-center justify-center rounded-full text-textSecondary transition-colors hover:bg-background hover:text-textPrimary"
        aria-label="Njoftimet"
        aria-expanded={open}
      >
        <Bell className="size-5" aria-hidden="true" />
        {count > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-none text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 top-12 z-20 w-80 max-w-[90vw] overflow-hidden rounded-lg border border-border bg-surface shadow-cardHover">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <span className="text-sm font-medium text-textPrimary">Njoftimet</span>
              {count > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="text-xs text-primary transition-colors hover:underline"
                >
                  Shëno të gjitha si lexuar
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {!notifications ? (
                <div className="flex justify-center py-6">
                  <LoadingSpinner />
                </div>
              ) : notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-textSecondary">Ende s'ke njoftime.</p>
              ) : (
                notifications.map((n) => (
                  <NotificationRow
                    key={n.id}
                    notification={n}
                    onOpen={() => {
                      if (!n.is_read) markRead.mutate(n.id);
                      setOpen(false);
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function NotificationRow({
  notification,
  onOpen,
}: {
  notification: NotificationResponse;
  onOpen: () => void;
}) {
  // Njoftimi që shitësi merr kur dikush bën ofertë — hap direkt modalin e
  // ofertave te faqja e produktit, në vend që ta lërë ta gjejë vetë.
  const opensOffersModal = notification.type === "bid_created";

  const content = (
    <div
      className={cn(
        "flex flex-col gap-0.5 px-4 py-3 text-sm transition-colors hover:bg-background",
        !notification.is_read && "bg-primary/5",
      )}
    >
      <p className="text-textPrimary">{notification.message}</p>
      <span className="text-xs text-textSecondary">{formatRelativeDate(notification.created_at)}</span>
    </div>
  );

  if (!notification.product_id) return content;

  return (
    <Link
      to="/products/$id"
      params={{ id: notification.product_id }}
      search={opensOffersModal ? { offers: true } : {}}
      onClick={onOpen}
    >
      {content}
    </Link>
  );
}
