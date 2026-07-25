import { cn } from "@/lib/utils"
import type { SellingType } from "@/types"

interface SellingTypeBadgeProps {
  type: SellingType
  className?: string
}

const config: Record<SellingType, { label: string; classes: string }> = {
  fixed_price: { label: "Çmim fiks", classes: "bg-background text-textSecondary" },
  offers_only: { label: "Vetëm oferta", classes: "bg-primary/10 text-primary" },
  fixed_price_offers: { label: "Çmim ose ofertë", classes: "bg-primary/10 text-primary" },
}

export function SellingTypeBadge({ type, className }: SellingTypeBadgeProps) {
  const { label, classes } = config[type]
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
