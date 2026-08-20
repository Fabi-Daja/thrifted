import { axiosInstance } from "./axiosInstance"
import type {
  LoginRequest,
  LoginResponse,
  MessageResponse,
  RegisterRequest,
  UserResponse,
} from "@/types"

export const authApi = {
  register: (data: RegisterRequest) =>
    axiosInstance.post<UserResponse>("/auth/register", data).then((r) => r.data),

  login: (data: LoginRequest) =>
    axiosInstance.post<LoginResponse>("/auth/login", data).then((r) => r.data),

  verifyEmail: (token: string) =>
    axiosInstance
      .get<MessageResponse>("/auth/verify-email", { params: { token } })
      .then((r) => r.data),

  resendVerification: (email: string) =>
    axiosInstance.post<MessageResponse>("/auth/resend-verification", { email }).then((r) => r.data),

  forgotPassword: (email: string) =>
    axiosInstance.post<MessageResponse>("/auth/forgot-password", { email }).then((r) => r.data),

  resetPassword: (token: string, new_password: string) =>
    axiosInstance
      .post<MessageResponse>("/auth/reset-password", { token, new_password })
      .then((r) => r.data),

  changePassword: (old_password: string, new_password: string) =>
    axiosInstance
      .post<MessageResponse>("/auth/change-password", { old_password, new_password })
      .then((r) => r.data),
}
