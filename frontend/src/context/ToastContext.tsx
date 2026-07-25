import { createContext, useCallback, useContext, useState, type ReactNode } from "react"
import { CheckCircle2, XCircle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastType = "success" | "error" | "info"

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  notify: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let counter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const notify = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = ++counter
      setToasts((prev) => [...prev, { id, message, type }])
      window.setTimeout(() => remove(id), 4000)
    },
    [remove],
  )

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
        role="region"
        aria-label="Njoftime"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onClose={() => remove(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastCard({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const icon = {
    success: <CheckCircle2 className="size-5 text-success" />,
    error: <XCircle className="size-5 text-danger" />,
    info: <Info className="size-5 text-primary" />,
  }[toast.type]

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-lg border bg-surface px-4 py-3 shadow-cardHover",
        toast.type === "success" && "border-success/30",
        toast.type === "error" && "border-danger/30",
        toast.type === "info" && "border-border",
      )}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <p className="flex-1 text-sm text-textPrimary">{toast.message}</p>
      <button
        onClick={onClose}
        className="shrink-0 rounded p-0.5 text-textSecondary transition-colors hover:text-textPrimary"
        aria-label="Mbyll njoftimin"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}
