import { useEffect, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/feedback/LoadingSpinner";

/**
 * Client-side auth gate. Wrap protected page bodies with <ProtectedRoute>.
 * Preserves the original URL as ?redirect_to= so /login can send the user back.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoggedIn, isLoading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname + s.location.searchStr });

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      navigate({
        to: "/login",
        search: { redirect_to: pathname },
        replace: true,
      });
    }
  }, [isLoading, isLoggedIn, navigate, pathname]);

  if (isLoading || !isLoggedIn) return <LoadingSpinner fullPage />;
  return <>{children}</>;
}
