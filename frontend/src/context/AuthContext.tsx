import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { authApi } from "@/api/authApi"
import { usersApi } from "@/api/usersApi"
import { clearToken, getToken, setToken } from "@/lib/token"
import type { LoginRequest, UserResponse } from "@/types"

interface AuthContextValue {
  user: UserResponse | null
  isLoggedIn: boolean
  isLoading: boolean
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  setUser: (user: UserResponse) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadUser = useCallback(async () => {
    if (!getToken()) {
      setUserState(null)
      setIsLoading(false)
      return
    }
    try {
      const me = await usersApi.me()
      setUserState(me)
    } catch {
      clearToken()
      setUserState(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadUser()
  }, [loadUser])

  const login = useCallback(
    async (credentials: LoginRequest) => {
      const { access_token } = await authApi.login(credentials)
      setToken(access_token)
      const me = await usersApi.me()
      setUserState(me)
    },
    [],
  )

  const logout = useCallback(() => {
    clearToken()
    setUserState(null)
  }, [])

  const refreshUser = useCallback(async () => {
    await loadUser()
  }, [loadUser])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoggedIn: !!user,
      isLoading,
      login,
      logout,
      refreshUser,
      setUser: setUserState,
    }),
    [user, isLoading, login, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
