import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingInputProps {
  value: number
  onChange: (value: number) => void
  className?: string
}

export function StarRatingInput({ value, onChange, className }: StarRatingInputProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const active = hovered ?? value

  return (
    <div className={cn("flex items-center gap-1", className)} role="radiogroup" aria-label="Vlerëso 1-5 yje">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} yje`}
          onClick={() => onChange(i)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
          className="rounded p-0.5 transition-transform hover:scale-110"
        >
          <Star className={cn("size-7", i <= active ? "fill-primary text-primary" : "fill-border text-border")} />
        </button>
      ))}
    </div>
  )
}
