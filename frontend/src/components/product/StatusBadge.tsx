import { cn } from "@/lib/utils"
import type { ProductStatus } from "@/types"

interface StatusBadgeProps {
  status: ProductStatus
  className?: string
}

const config: Record<ProductStatus, { label: string; classes: string }> = {
  active: { label: "Aktiv", classes: "bg-success/15 text-success" },
  sold: { label: "I shitur", classes: "bg-textSecondary/15 text-textSecondary" },
  archived: { label: "I arkivuar", classes: "bg-danger/15 text-danger" },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, classes } = config[status]
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
        classes,
        className,
      )}
    >
      {label}
    </span>
  )
}
