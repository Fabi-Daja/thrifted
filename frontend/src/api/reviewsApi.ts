import { axiosInstance } from "./axiosInstance"
import type { ReviewCreateRequest, ReviewResponse } from "@/types"

export const reviewsApi = {
  create: (orderId: string, data: ReviewCreateRequest) =>
    axiosInstance.post<ReviewResponse>(`/orders/${orderId}/reviews`, data).then((r) => r.data),

  listForUser: (userId: string) =>
    axiosInstance.get<ReviewResponse[]>(`/users/${userId}/reviews`).then((r) => r.data),
}
