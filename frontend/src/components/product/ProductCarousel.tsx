import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ProductImage } from "@/types"

interface ProductCarouselProps {
  images: ProductImage[]
  title: string
}

export function ProductCarousel({ images, title }: ProductCarouselProps) {
  const [active, setActive] = useState(0)
  const hasImages = images.length > 0
  const current = hasImages ? images[active].url : "/placeholder.svg?height=600&width=480"

  const go = (dir: number) => {
    setActive((prev) => (prev + dir + images.length) % images.length)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-border bg-background">
        <img src={current || "/placeholder.svg"} alt={title} className="size-full object-cover" />
        {images.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              aria-label="Foto e mëparshme"
              className="absolute left-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-textPrimary shadow-card backdrop-blur transition-colors hover:bg-surface"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Foto tjetër"
              className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-textPrimary shadow-card backdrop-blur transition-colors hover:bg-surface"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              aria-label={`Shiko foton ${i + 1}`}
              className={cn(
                "size-16 shrink-0 overflow-hidden rounded border-2 transition-colors",
                i === active ? "border-primary" : "border-border",
              )}
            >
              <img src={img.url || "/placeholder.svg"} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
