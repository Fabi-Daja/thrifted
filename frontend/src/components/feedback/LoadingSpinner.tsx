import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  className?: string
  label?: string
  fullPage?: boolean
}

export function LoadingSpinner({ className, label = "Duke ngarkuar…", fullPage }: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center justify-center gap-2 text-textSecondary",
        fullPage && "min-h-[50vh]",
        className,
      )}
    >
      <Loader2 className="size-5 animate-spin text-primary" />
      <span className="text-sm">{label}</span>
    </div>
  )
}
