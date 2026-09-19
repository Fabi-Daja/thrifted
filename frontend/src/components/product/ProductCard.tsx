import { Link } from "@tanstack/react-router";
import { Heart, ImageOff } from "lucide-react";
import { useState } from "react";
import { cn, formatPrice } from "@/lib/utils";
import { SellingTypeBadge } from "./SellingTypeBadge";
import type { ProductResponse } from "@/types";

interface ProductCardProps {
  product: ProductResponse;
  isFavorite?: boolean;
  onToggleFavorite?: (product: ProductResponse) => void;
  showFavorite?: boolean;
}

export function ProductCard({
  product,
  isFavorite,
  onToggleFavorite,
  showFavorite = true,
}: ProductCardProps) {
  const cover = product.images?.[0]?.url;
  const [imageError, setImageError] = useState(false);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded border border-border bg-surface transition-colors hover:border-primary/50">
      <Link to="/products/$id" params={{ id: product.id }} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-background">
          {cover && !imageError ? (
            <img
              src={cover}
              alt={product.title}
              loading="lazy"
              onError={() => setImageError(true)}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-2 text-textSecondary/50">
              <ImageOff className="size-8" aria-hidden="true" />
              <span className="text-xs">pa foto</span>
            </div>
          )}
        </div>
      </Link>

      {showFavorite && onToggleFavorite && (
        <button
          onClick={() => onToggleFavorite(product)}
          aria-label={isFavorite ? "Hiq nga favoritet" : "Shto te favoritet"}
          aria-pressed={isFavorite}
          className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full border border-border bg-surface/90 text-textSecondary backdrop-blur transition-colors hover:text-primary"
        >
          <Heart className={cn("size-4", isFavorite && "fill-danger text-danger")} />
        </button>
      )}

      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link to="/products/$id" params={{ id: product.id }}>
          <h3 className="truncate text-sm font-medium text-textPrimary">{product.title}</h3>
        </Link>
        <p className="truncate text-xs text-textSecondary">
          {[product.brand, product.size].filter(Boolean).join(" · ") || "—"}
        </p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="font-display text-lg font-semibold text-textPrimary">
            {formatPrice(product.price)}
          </span>
          <SellingTypeBadge type={product.selling_type} />
        </div>
      </div>
    </div>
  );
}
