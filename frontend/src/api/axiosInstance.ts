import axios, { type AxiosError } from "axios"
import { clearToken, getToken } from "@/lib/token"

// Backend-i i ka te gjitha rruget nen prefiksin /api (faza-6, Nginx routing).
// Ne SSR (loaders qe xhirojne brenda procesit Node, jo browser) VITE_API_URL
// mund te jete relative (p.sh. "/api" pas Nginx) - kjo s'ka kuptim per axios
// ne Node (s'ka "faqe" kundrejt te ciles te zgjerohet), prandaj server-i
// perdor gjithmone nje URL absolute drejt backend-it (API_INTERNAL_URL,
// runtime env - jo VITE_*, qe eshte build-time), tipikisht http://backend:8000/api
// brenda rrjetit te docker-compose.
const baseURL =
  typeof window === "undefined"
    ? process.env.API_INTERNAL_URL || "http://127.0.0.1:8000/api"
    : import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api"

// Do not set a global Content-Type so FormData uploads get the correct boundary.
export const axiosInstance = axios.create({
  baseURL,
})

// Attach the Bearer token to every request automatically.
axiosInstance.interceptors.request.use((config) => {
  const token = getToken()
  // Ensure headers object exists so we can safely assign Authorization.
  config.headers = config.headers ?? {}
  if (token) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - assign onto headers object
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
