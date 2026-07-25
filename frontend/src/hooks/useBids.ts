import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { bidsApi } from "@/api/bidsApi"
import { productKeys } from "./useProducts"

export const bidKeys = {
  forProduct: (productId: string) => ["bids", "product", productId] as const,
  mine: ["bids", "mine"] as const,
}

export function useProductBids(productId: string, enabled: boolean) {
  return useQuery({
    queryKey: bidKeys.forProduct(productId),
    queryFn: () => bidsApi.listForProduct(productId),
    enabled,
  })
}

export function useCreateBid(productId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (amount: number) => bidsApi.create(productId, { amount }),
    onSuccess: () => qc.invalidateQueries({ queryKey: bidKeys.forProduct(productId) }),
  })
}

export function useBidAction(productId: string) {
  const qc = useQueryClient()
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: bidKeys.forProduct(productId) })
    qc.invalidateQueries({ queryKey: productKeys.detail(productId) })
  }
  const accept = useMutation({
    mutationFn: (bidId: string) => bidsApi.accept(bidId),
    onSuccess: invalidate,
  })
  const reject = useMutation({
    mutationFn: (bidId: string) => bidsApi.reject(bidId),
    onSuccess: invalidate,
  })
  return { accept, reject }
}
