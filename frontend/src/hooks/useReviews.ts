import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { reviewsApi } from "@/api/reviewsApi"
import type { ReviewCreateRequest } from "@/types"

export const reviewKeys = {
  forUser: (userId: string) => ["reviews", "user", userId] as const,
}

export function useUserReviews(userId: string | undefined) {
  return useQuery({
    queryKey: reviewKeys.forUser(userId ?? ""),
    queryFn: () => reviewsApi.listForUser(userId as string),
    enabled: !!userId,
  })
}

export function useCreateReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: ReviewCreateRequest }) =>
      reviewsApi.create(orderId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users", "me", "purchases"] })
    },
  })
}
