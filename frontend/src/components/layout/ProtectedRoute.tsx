import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { LoadingSpinner } from "@/components/feedback/LoadingSpinner"

export function ProtectedRoute() {
  const { isLoggedIn, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <LoadingSpinner fullPage />

  if (!isLoggedIn) {
    // Preserve where the user was heading so login can redirect them back (Flow 1).
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  return <Outlet />
}
