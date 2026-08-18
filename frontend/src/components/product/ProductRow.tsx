import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { ProductCardSkeleton } from "./ProductCardSkeleton";
import type { ProductResponse } from "@/types";

interface ProductRowProps {
  title: string;
  products: ProductResponse[];
  isLoading?: boolean;
  viewAllTo?: string;
  viewAllSearch?: Record<string, string>;
}

export function ProductRow({
  title,
  products,
  isLoading,
  viewAllTo,
  viewAllSearch,
}: ProductRowProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-sans text-2xl font-semibold text-textPrimary">{title}</h2>
        {viewAllTo && (
          <Link
            to={viewAllTo}
            search={viewAllSearch}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
          >
            Shiko të gjitha
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="-mx-4 flex gap-4 overflow-hidden px-4 pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-40 shrink-0 sm:w-48">
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="py-8 text-textSecondary">Nuk ka produkte për të shfaqur.</p>
      ) : (
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
          {products.slice(0, 12).map((product) => (
            <div key={product.id} className="w-40 shrink-0 snap-start sm:w-48 animate-fade-in">
              <ProductCard product={product} showFavorite={false} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
