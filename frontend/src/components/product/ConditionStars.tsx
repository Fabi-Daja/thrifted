import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConditionStarsProps {
  rating: number
  showLabel?: boolean
  className?: string
}

const labels: Record<number, string> = {
  1: "I përdorur",
  2: "Pranueshëm",
  3: "I mirë",
  4: "Shumë i mirë",
  5: "Si i ri",
}

export function ConditionStars({ rating, showLabel = true, className }: ConditionStarsProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-0.5" aria-label={`Gjendja: ${rating} nga 5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              "size-4",
              i <= rating ? "fill-primary text-primary" : "fill-border text-border",
            )}
          />
        ))}
      </div>
      {showLabel && <span className="text-sm text-textSecondary">{labels[rating]}</span>}
    </div>
  )
}
