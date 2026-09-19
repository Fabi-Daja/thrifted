import { Link } from "@tanstack/react-router";
import { ImageOff } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { RecommendationResult } from "@/types";

// Karte kompakte per rreshtin "Rekomanduar për ty" (§5.5) - ndryshe nga
// components/product/ProductCard.tsx sepse GET /users/me/recommendations kthen
// vetem nje nenbashkesi fushash (njesoj si ChatProductCard per 5.1), jo
// ProductResponse te plote (s'ka `images[]`, `selling_type`, `size`, etj.).
export function RecommendationCard({ product }: { product: RecommendationResult }) {
  return (
    <Link
      to="/products/$id"
      params={{ id: product.id }}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-card transition-shadow hover:shadow-cardHover"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-background">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title ?? "Produkt"}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-textSecondary/50">
            <ImageOff className="size-8" aria-hidden="true" />
            <span className="text-xs">pa foto</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="truncate text-sm font-medium text-textPrimary">{product.title ?? "—"}</h3>
        <p className="truncate text-xs text-textSecondary">{product.brand ?? "—"}</p>
        {product.price != null && (
          <span className="mt-1 font-semibold text-textPrimary">{formatPrice(product.price)}</span>
        )}
      </div>
    </Link>
  );
}
