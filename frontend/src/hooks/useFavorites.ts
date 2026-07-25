import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { favoritesApi } from "@/api/favoritesApi"
import { useAuth } from "@/context/AuthContext"

export const favoriteKeys = {
  all: ["favorites"] as const,
}

export function useFavorites() {
  const { isLoggedIn } = useAuth()
  return useQuery({
    queryKey: favoriteKeys.all,
    queryFn: () => favoritesApi.list(),
    enabled: isLoggedIn,
  })
}

export function useToggleFavorite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, isFavorite }: { productId: string; isFavorite: boolean }) =>
      isFavorite ? favoritesApi.remove(productId) : favoritesApi.add(productId),
    onSuccess: () => qc.invalidateQueries({ queryKey: favoriteKeys.all }),
  })
}
