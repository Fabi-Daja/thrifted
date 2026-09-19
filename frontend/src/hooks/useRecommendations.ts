import { useQuery } from "@tanstack/react-query"
import { usersApi } from "@/api/usersApi"
import { useAuth } from "@/context/AuthContext"

export const recommendationsKeys = {
  all: ["recommendations"] as const,
}

// §5.5 (faza-5-ai-features.md) - personalizuar, endpoint-i kërkon auth (401 për
// guest), prandaj `enabled: isLoggedIn` - s'ka kuptim ta thërrasim për vizitor
// të palogum (do të dështonte gjithsesi).
export function useRecommendations(limit?: number) {
  const { isLoggedIn } = useAuth()
  return useQuery({
    queryKey: [...recommendationsKeys.all, limit ?? null],
    queryFn: () => usersApi.myRecommendations(limit),
    enabled: isLoggedIn,
  })
}
