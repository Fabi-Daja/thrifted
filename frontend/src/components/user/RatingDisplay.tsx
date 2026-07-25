import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface RatingDisplayProps {
  value: number
  count?: number
  className?: string
}

export function RatingDisplay({ value, count, className }: RatingDisplayProps) {
  const rounded = Math.round(value * 10) / 10
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Star className="size-4 fill-primary text-primary" />
      <span className="text-sm font-medium text-textPrimary">{rounded.toFixed(1)}</span>
      {count !== undefined && (
        <span className="text-sm text-textSecondary">
          ({count} {count === 1 ? "vlerësim" : "vlerësime"})
        </span>
      )}
    </div>
  )
}
