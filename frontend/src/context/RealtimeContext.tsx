import { createContext, useContext, useEffect, useRef, type ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "./AuthContext"
import { getToken } from "@/lib/token"
import { notificationKeys } from "@/hooks/useNotifications"
import { conversationKeys } from "@/hooks/useConversations"
import type { RealtimeEvent } from "@/types"

const RealtimeContext = createContext<null>(null)

function getWsUrl(): string {
  // Backend-i i ka te gjitha rruget (perfshi /ws) nen prefiksin /api (faza-6, Nginx routing)
  const apiBase: string = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api"
  // WebSocket() kerkon URL absolute me skeme ws/wss - nese VITE_API_URL eshte
  // relative (p.sh. "/api", pas Nginx-it), e zgjerojme me origin-in e faqes.
  // (thirret vetem brenda useEffect, pra window ekziston gjithmone ketu)
  const absoluteBase = apiBase.startsWith("http") ? apiBase : `${window.location.origin}${apiBase}`
  return absoluteBase.replace(/^http/, "ws") + "/ws"
}

const MAX_RETRY_DELAY = 15_000

/**
 * Një lidhje e vetme WebSocket për gjithë sesionin - server-i e përdor për të
 * shtyrë njoftime dhe mesazhe chat në kohë reale (shih backend/app/core/ws_manager.py).
 * Shkrimet vazhdojnë të bëhen me REST; kjo lidhje shërben vetëm si kanal push.
 * Rilidhet automatikisht me backoff eksponencial nëse bie.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth()
  const qc = useQueryClient()
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!isLoggedIn) return
    const token = getToken()
    if (!token) return

    let cancelled = false
    let retryDelay = 1000
    let retryTimer: ReturnType<typeof setTimeout> | undefined

    const connect = () => {
      if (cancelled) return

      const ws = new WebSocket(`${getWsUrl()}?token=${encodeURIComponent(token)}`)
      wsRef.current = ws

      ws.onopen = () => {
        retryDelay = 1000
      }

      ws.onmessage = (event) => {
        let data: RealtimeEvent
        try {
          data = JSON.parse(event.data)
        } catch {
          return
        }

        if (data.event === "notification") {
          qc.invalidateQueries({ queryKey: notificationKeys.list })
          qc.invalidateQueries({ queryKey: notificationKeys.unreadCount })
        } else if (data.event === "message") {
          qc.invalidateQueries({ queryKey: conversationKeys.list })
          qc.invalidateQueries({ queryKey: conversationKeys.messages(data.message.conversation_id) })
        }
      }

      ws.onclose = () => {
        wsRef.current = null
        if (cancelled) return
        retryTimer = setTimeout(connect, retryDelay)
        retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY)
      }

      ws.onerror = () => {
        ws.close()
      }
    }

    connect()

    return () => {
      cancelled = true
      if (retryTimer) clearTimeout(retryTimer)
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [isLoggedIn, qc])

  return <RealtimeContext.Provider value={null}>{children}</RealtimeContext.Provider>
}

export function useRealtime() {
  return useContext(RealtimeContext)
}
