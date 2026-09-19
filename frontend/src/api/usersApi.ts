import { axiosInstance } from "./axiosInstance"
import type {
  UpdateUserRequest,
  UserResponse,
  BidResponse,
  OrderDetailResponse,
  RecommendationResult,
} from "@/types"

export const usersApi = {
  me: () => axiosInstance.get<UserResponse>("/users/me").then((r) => r.data),

  updateMe: (data: UpdateUserRequest) =>
    axiosInstance.patch<UserResponse>("/users/me", data).then((r) => r.data),

  getById: (userId: string) =>
    axiosInstance.get<UserResponse>(`/users/${userId}`).then((r) => r.data),

  myBids: () => axiosInstance.get<BidResponse[]>("/users/me/bids").then((r) => r.data),

  myPurchases: () => axiosInstance.get<OrderDetailResponse[]>("/users/me/purchases").then((r) => r.data),

  mySales: () => axiosInstance.get<OrderDetailResponse[]>("/users/me/sales").then((r) => r.data),

  // §5.5 - kërkon auth (401 për guest), content-based mbi historinë e userit,
  // fallback "trending"/më të rejat te backend-i kur useri s'ka histori ende.
  myRecommendations: (limit?: number) =>
    axiosInstance
      .get<RecommendationResult[]>(`/users/me/recommendations${limit ? `?limit=${limit}` : ""}`)
      .then((r) => r.data),

  uploadAvatar: (file: File) => {
    const form = new FormData()
    form.append("file", file)
    return axiosInstance.post<UserResponse>("/users/me/avatar", form).then((r) => r.data)
  },

  // Idempotente ne backend (POST/DELETE /users/{id}/follow) - dy klikime
  // "Ndiq" njëpasnjëshëm s'krijojnë gabim, kthejnë gjithmonë profilin e
  // përditësuar (followers_count/is_following).
  follow: (userId: string) =>
    axiosInstance.post<UserResponse>(`/users/${userId}/follow`).then((r) => r.data),

  unfollow: (userId: string) =>
    axiosInstance.delete<UserResponse>(`/users/${userId}/follow`).then((r) => r.data),

  // Verifikim numri telefoni (backend: routers/users.py, app/core/sms.py).
  // send-code eshte idempotent-ish - mund te thirret perseri per te
  // ndryshuar numrin, por i nenshtrohet cooldown-it (429) nese thirret
  // shpesh - shih PHONE_CODE_RESEND_COOLDOWN_SECONDS.
  sendPhoneCode: (phoneNumber: string) =>
    axiosInstance
      .post<UserResponse>("/users/me/phone/send-code", { phone_number: phoneNumber })
      .then((r) => r.data),

  verifyPhoneCode: (code: string) =>
    axiosInstance.post<UserResponse>("/users/me/phone/verify", { code }).then((r) => r.data),
}
