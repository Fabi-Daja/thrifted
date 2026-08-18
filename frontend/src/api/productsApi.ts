import { axiosInstance } from "./axiosInstance"
import type {
  CreateProductRequest,
  ProductFilters,
  ProductImage,
  ProductResponse,
  UpdateProductRequest,
  CheckoutSessionResponse,
} from "@/types"

function buildQuery(filters: ProductFilters = {}): string {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value))
    }
  })
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

export const productsApi = {
  list: (filters?: ProductFilters) =>
    axiosInstance.get<ProductResponse[]>(`/products${buildQuery(filters)}`).then((r) => r.data),

  getById: (id: string) =>
    axiosInstance.get<ProductResponse>(`/products/${id}`).then((r) => r.data),

  create: (data: CreateProductRequest) =>
    axiosInstance.post<ProductResponse>("/products", data).then((r) => r.data),

  update: (id: string, data: UpdateProductRequest) =>
    axiosInstance.patch<ProductResponse>(`/products/${id}`, data).then((r) => r.data),

  remove: (id: string) => axiosInstance.delete(`/products/${id}`).then((r) => r.data),

  archive: (id: string) =>
    axiosInstance.patch<ProductResponse>(`/products/${id}/archive`).then((r) => r.data),

  uploadImages: (productId: string, files: File[]) => {
    const form = new FormData()
    files.forEach((file) => form.append("files", file))
    return axiosInstance
      .post<ProductImage[]>(`/products/${productId}/images`, form)
      .then((r) => r.data)
  },

  deleteImages: (productId: string, imageIds: string[]) =>
    axiosInstance
      .delete(`/products/${productId}/images`, { data: { image_ids: imageIds } })
      .then((r) => r.data),

  // Nis pagesën reale me Stripe (hosted checkout); porosia krijohet vetëm
  // pasi pagesa konfirmohet nga Stripe, jo këtu.
  checkout: (productId: string) =>
    axiosInstance
      .post<CheckoutSessionResponse>(`/products/${productId}/checkout-session`)
      .then((r) => r.data),
}
