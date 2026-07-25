import { PackageOpen } from "lucide-react"
import { ProductCard } from "./ProductCard"
import { LoadingSpinner } from "@/components/feedback/LoadingSpinner"
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
  if (loading) return <LoadingSpinner fullPage />

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <PackageOpen className="size-10 text-textSecondary/60" />
        <p className="text-textSecondary">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isFavorite={favoriteIds?.has(product.id)}
          onToggleFavorite={onToggleFavorite}
          showFavorite={!!onToggleFavorite}
        />
      ))}
    </div>
  )
}
