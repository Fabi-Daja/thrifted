import axios, { type AxiosError } from "axios"
import { clearToken, getToken } from "@/lib/token"

const baseURL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

export const axiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Attach the Bearer token to every request automatically.
axiosInstance.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// On 401 the token is stale/invalid — clear it so the app treats the user as guest.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearToken()
    }
    return Promise.reject(error)
  },
)

export interface ApiErrorShape {
  detail?: string | { msg: string }[]
}

export function extractApiError(error: unknown, fallback = "Ndodhi një gabim. Provo përsëri."): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorShape | undefined
    if (data?.detail) {
      if (typeof data.detail === "string") return data.detail
      if (Array.isArray(data.detail) && data.detail[0]?.msg) return data.detail[0].msg
    }
    if (error.response?.status === 401) return "Duhet të kyçesh për të vazhduar."
    if (error.response?.status === 403) return "Nuk ke të drejta për këtë veprim."
    if (error.response?.status === 404) return "Nuk u gjet."
  }
  return fallback
}
