import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { ProductCard } from "./ProductCard"
import { LoadingSpinner } from "@/components/feedback/LoadingSpinner"
import type { ProductResponse } from "@/types"

interface ProductRowProps {
  title: string
  products: ProductResponse[]
  isLoading?: boolean
  viewAllHref?: string
}

export function ProductRow({ title, products, isLoading, viewAllHref }: ProductRowProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-sans text-2xl font-semibold text-textPrimary">{title}</h2>
        {viewAllHref && (
          <Link
            to={viewAllHref}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
          >
            Shiko të gjitha
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="py-12">
          <LoadingSpinner />
        </div>
      ) : products.length === 0 ? (
        <p className="py-8 text-textSecondary">Nuk ka produkte për të shfaqur.</p>
      ) : (
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
          {products.slice(0, 12).map((product) => (
            <div key={product.id} className="w-40 shrink-0 snap-start sm:w-48">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
