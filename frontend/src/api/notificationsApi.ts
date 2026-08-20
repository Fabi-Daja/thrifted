import { axiosInstance } from "./axiosInstance"
import type { NotificationResponse, UnreadCountResponse } from "@/types"

export const notificationsApi = {
  list: () => axiosInstance.get<NotificationResponse[]>("/users/me/notifications").then((r) => r.data),

  unreadCount: () =>
    axiosInstance.get<UnreadCountResponse>("/users/me/notifications/unread-count").then((r) => r.data),

  markRead: (id: string) =>
    axiosInstance.patch<NotificationResponse>(`/notifications/${id}/read`).then((r) => r.data),

  markAllRead: () => axiosInstance.patch(`/users/me/notifications/read-all`).then((r) => r.data),
}
