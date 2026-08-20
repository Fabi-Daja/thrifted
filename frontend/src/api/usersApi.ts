import { axiosInstance } from "./axiosInstance"
import type { UpdateUserRequest, UserResponse, BidResponse, OrderDetailResponse } from "@/types"

export const usersApi = {
  me: () => axiosInstance.get<UserResponse>("/users/me").then((r) => r.data),

  updateMe: (data: UpdateUserRequest) =>
    axiosInstance.patch<UserResponse>("/users/me", data).then((r) => r.data),

  getById: (userId: string) =>
    axiosInstance.get<UserResponse>(`/users/${userId}`).then((r) => r.data),

  myBids: () => axiosInstance.get<BidResponse[]>("/users/me/bids").then((r) => r.data),

  myPurchases: () => axiosInstance.get<OrderDetailResponse[]>("/users/me/purchases").then((r) => r.data),

  mySales: () => axiosInstance.get<OrderDetailResponse[]>("/users/me/sales").then((r) => r.data),

  uploadAvatar: (file: File) => {
    const form = new FormData()
    form.append("file", file)
    return axiosInstance.post<UserResponse>("/users/me/avatar", form).then((r) => r.data)
  },
}
