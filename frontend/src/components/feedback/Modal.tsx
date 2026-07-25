import { useEffect, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: "sm" | "md" | "lg"
}

export function Modal({ open, onClose, title, children, size = "md" }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  if (!open) return null

  const sizes = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg" }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-textPrimary/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative w-full rounded-lg border border-border bg-surface shadow-cardHover",
          sizes[size],
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          {title && <h2 className="text-lg font-semibold text-textPrimary">{title}</h2>}
          <button
            onClick={onClose}
            className="ml-auto rounded p-1 text-textSecondary transition-colors hover:bg-background hover:text-textPrimary"
            aria-label="Mbyll"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
