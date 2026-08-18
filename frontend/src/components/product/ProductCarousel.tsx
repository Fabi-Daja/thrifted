import { useState } from "react"
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ProductImage } from "@/types"

interface ProductCarouselProps {
  images: ProductImage[]
  title: string
}

function Placeholder() {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-2 text-textSecondary/50">
      <ImageOff className="size-12" aria-hidden="true" />
      <span className="text-sm">pa foto</span>
    </div>
  )
}

export function ProductCarousel({ images, title }: ProductCarouselProps) {
  const [active, setActive] = useState(0)
  const [failed, setFailed] = useState<Set<string>>(new Set())
  const hasImages = images.length > 0
  const current = hasImages ? images[active].url : undefined
  const currentFailed = !current || failed.has(current)

  const go = (dir: number) => {
    setActive((prev) => (prev + dir + images.length) % images.length)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-border bg-background">
        {currentFailed ? (
          <Placeholder />
        ) : (
          <img
            src={current}
            alt={title}
            onError={() => setFailed((s) => new Set(s).add(current))}
            className="size-full object-cover"
          />
        )}
        {images.length > 1 && !currentFailed && (
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
              {failed.has(img.url) ? (
                <div className="flex size-full items-center justify-center bg-background text-textSecondary/50">
                  <ImageOff className="size-5" aria-hidden="true" />
                </div>
              ) : (
                <img
                  src={img.url}
                  alt=""
                  onError={() => setFailed((s) => new Set(s).add(img.url))}
                  className="size-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
