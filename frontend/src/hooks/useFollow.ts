import { useMutation, useQueryClient } from "@tanstack/react-query"
import { usersApi } from "@/api/usersApi"

// Follow/unfollow (backend: POST/DELETE /users/{id}/follow, idempotent).
// Pergjigja kthen direkt UserResponse-in e perditesuar (followers_count/
// is_following), kesisoj e vendosim ne cache pa refetch shtese.
export function useToggleFollow(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (isFollowing: boolean) =>
      isFollowing ? usersApi.unfollow(userId) : usersApi.follow(userId),
    onSuccess: (data) => {
      qc.setQueryData(["users", userId], data)
    },
  })
}
