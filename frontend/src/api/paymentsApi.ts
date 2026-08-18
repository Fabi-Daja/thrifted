import { axiosInstance } from "./axiosInstance"
import type { OrderResponse } from "@/types"

export const paymentsApi = {
  // Thirret nga faqja e suksesit pas kthimit nga Stripe; finalizon porosinë
  // (idempotente - webhook-u i Stripe mund ta ketë bërë këtë tashmë).
  confirmSession: (sessionId: string) =>
    axiosInstance
      .get<OrderResponse>(`/payments/session/${sessionId}/confirm`)
      .then((r) => r.data),
}
