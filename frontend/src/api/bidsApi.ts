import { axiosInstance } from "./axiosInstance"
import type { BidResponse, CreateBidRequest, CheckoutSessionResponse } from "@/types"

export const bidsApi = {
  create: (productId: string, data: CreateBidRequest) =>
    axiosInstance.post<BidResponse>(`/products/${productId}/bids`, data).then((r) => r.data),

  listForProduct: (productId: string) =>
    axiosInstance.get<BidResponse[]>(`/products/${productId}/bids`).then((r) => r.data),

  mine: () => axiosInstance.get<BidResponse[]>(`/users/me/bids`).then((r) => r.data),

  accept: (bidId: string) =>
    axiosInstance.patch<BidResponse>(`/bids/${bidId}/accept`).then((r) => r.data),

  reject: (bidId: string) =>
    axiosInstance.patch<BidResponse>(`/bids/${bidId}/reject`).then((r) => r.data),

  remove: (bidId: string) => axiosInstance.delete(`/bids/${bidId}`).then((r) => r.data),

  // Nis pagesën reale me Stripe për një ofertë që shitësi e ka pranuar tashmë.
  checkout: (bidId: string) =>
    axiosInstance
      .post<CheckoutSessionResponse>(`/bids/${bidId}/checkout-session`)
      .then((r) => r.data),
}
