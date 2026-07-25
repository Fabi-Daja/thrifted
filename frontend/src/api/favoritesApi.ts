import { axiosInstance } from "./axiosInstance"
import type { FavoriteItem, MessageResponse } from "@/types"

export const favoritesApi = {
  list: () => axiosInstance.get<FavoriteItem[]>("/favorites").then((r) => r.data),

  add: (productId: string) =>
    axiosInstance.post<MessageResponse>(`/favorites/${productId}`).then((r) => r.data),

  remove: (productId: string) =>
    axiosInstance.delete(`/favorites/${productId}`).then((r) => r.data),
}
