import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { productsApi } from "@/api/productsApi"
import type {
  CreateProductRequest,
  ProductFilters,
  UpdateProductRequest,
} from "@/types"

export const productKeys = {
  all: ["products"] as const,
  list: (filters?: ProductFilters) => ["products", "list", filters ?? {}] as const,
  detail: (id: string) => ["products", "detail", id] as const,
}

export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => productsApi.list(filters),
  })
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: productKeys.detail(id ?? ""),
    queryFn: () => productsApi.getById(id as string),
    enabled: !!id,
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateProductRequest) => productsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  })
}

export function useUpdateProduct(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateProductRequest) => productsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.detail(id) })
      qc.invalidateQueries({ queryKey: productKeys.all })
    },
  })
}

export function useUploadImages(productId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (files: File[]) => productsApi.uploadImages(productId, files),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.detail(productId) }),
  })
}

// Krijon sesionin e pagesës me Stripe dhe kthen { checkout_url }. Ridrejtimi
// te Stripe bëhet nga vetë kompononti (window.location.href), jo këtu.
export function useCheckoutProduct() {
  return useMutation({
    mutationFn: (productId: string) => productsApi.checkout(productId),
  })
}
