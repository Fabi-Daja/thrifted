import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { notificationsApi } from "@/api/notificationsApi"

export const notificationKeys = {
  list: ["notifications", "list"] as const,
  unreadCount: ["notifications", "unread-count"] as const,
}

// Njoftimet vijnë kryesisht live nëpërmjet WebSocket (RealtimeContext); ky poll
// mbetet vetëm si rrjet mbrojtës nëse lidhja WS bie ose faqja hapet nga një
// njoftim i marrë ndërkohë që tab-i ishte i mbyllur.
const POLL_INTERVAL = 60_000

export function useNotifications(enabled: boolean) {
  return useQuery({
    queryKey: notificationKeys.list,
    queryFn: () => notificationsApi.list(),
    enabled,
    refetchInterval: enabled ? POLL_INTERVAL : false,
  })
}

export function useUnreadNotificationsCount(enabled: boolean) {
  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: () => notificationsApi.unreadCount(),
    enabled,
    refetchInterval: enabled ? POLL_INTERVAL : false,
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.list })
      qc.invalidateQueries({ queryKey: notificationKeys.unreadCount })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.list })
      qc.invalidateQueries({ queryKey: notificationKeys.unreadCount })
    },
  })
}
