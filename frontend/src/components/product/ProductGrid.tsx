import { PackageOpen } from "lucide-react"
import { ProductCard } from "./ProductCard"
import { ProductGridSkeleton } from "./ProductCardSkeleton"
import type { ProductResponse } from "@/types"

interface ProductGridProps {
  products: ProductResponse[]
  loading?: boolean
  favoriteIds?: Set<string>
  onToggleFavorite?: (product: ProductResponse) => void
  emptyMessage?: string
}

export function ProductGrid({
  products,
  loading,
  favoriteIds,
  onToggleFavorite,
  emptyMessage = "Nuk u gjet asnjë produkt.",
}: ProductGridProps) {
  if (loading) return <ProductGridSkeleton count={8} />

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-surface/60 py-20 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <PackageOpen className="size-6" aria-hidden="true" />
        </div>
        <p className="text-textSecondary">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product, i) => (
        <div
          key={product.id}
          className="animate-fade-in"
          style={{ animationDelay: `${Math.min(i, 8) * 40}ms`, animationFillMode: "backwards" }}
        >
          <ProductCard
            product={product}
            isFavorite={favoriteIds?.has(product.id)}
            onToggleFavorite={onToggleFavorite}
            showFavorite={!!onToggleFavorite}
          />
        </div>
      ))}
    </div>
  )
}
