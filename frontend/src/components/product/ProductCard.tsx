import { Link } from "react-router-dom"
import { Heart } from "lucide-react"
import { cn, formatPrice } from "@/lib/utils"
import { SellingTypeBadge } from "./SellingTypeBadge"
import type { ProductResponse } from "@/types"

interface ProductCardProps {
  product: ProductResponse
  isFavorite?: boolean
  onToggleFavorite?: (product: ProductResponse) => void
  showFavorite?: boolean
}

export function ProductCard({
  product,
  isFavorite,
  onToggleFavorite,
  showFavorite = true,
}: ProductCardProps) {
  const cover = product.images?.[0]?.url

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-card transition-shadow hover:shadow-cardHover">
      <Link to={`/products/${product.id}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-background">
          {cover ? (
            <img
              src={cover || "/placeholder.svg"}
              alt={product.title}
              loading="lazy"
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <img
              src="/placeholder.svg?height=400&width=300"
              alt={product.title}
              className="size-full object-cover"
            />
          )}
        </div>
      </Link>

      {showFavorite && onToggleFavorite && (
        <button
          onClick={() => onToggleFavorite(product)}
          aria-label={isFavorite ? "Hiq nga favoritet" : "Shto te favoritet"}
          aria-pressed={isFavorite}
          className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-surface/90 text-textSecondary shadow-card backdrop-blur transition-colors hover:text-primary"
        >
          <Heart className={cn("size-4.5", isFavorite && "fill-danger text-danger")} />
        </button>
      )}

      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link to={`/products/${product.id}`}>
          <h3 className="truncate text-sm font-medium text-textPrimary">{product.title}</h3>
        </Link>
        <p className="truncate text-xs text-textSecondary">
          {[product.brand, product.size].filter(Boolean).join(" · ") || "—"}
        </p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="font-semibold text-textPrimary">{formatPrice(product.price)}</span>
          <SellingTypeBadge type={product.selling_type} />
        </div>
      </div>
    </div>
  )
}
