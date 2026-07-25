import { axiosInstance } from "./axiosInstance"
import type { UpdateUserRequest, UserResponse, BidResponse } from "@/types"

export const usersApi = {
  me: () => axiosInstance.get<UserResponse>("/users/me").then((r) => r.data),

  updateMe: (data: UpdateUserRequest) =>
    axiosInstance.patch<UserResponse>("/users/me", data).then((r) => r.data),

  getById: (userId: string) =>
    axiosInstance.get<UserResponse>(`/users/${userId}`).then((r) => r.data),

  myBids: () => axiosInstance.get<BidResponse[]>("/users/me/bids").then((r) => r.data),
}
