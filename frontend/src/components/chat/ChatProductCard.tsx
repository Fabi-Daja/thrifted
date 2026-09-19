import { Link } from "@tanstack/react-router";
import { ImageOff } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { AiChatProductCard } from "@/types";

// Karte kompakte produkti brenda nje mesazhi te AI chat-it (ndryshe nga
// components/product/ProductCard.tsx, qe kerkon ProductResponse te plote -
// ketu backend-i (schemas/chat.py ProductCard) kthen vetem nje nenbashkesi
// fushash, mbledhur nga rezultatet e tools gjate bisedes).
export function ChatProductCard({ product }: { product: AiChatProductCard }) {
  return (
    <Link
      to="/products/$id"
      params={{ id: product.id }}
      className="flex w-32 shrink-0 snap-start flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-card transition-all hover:-translate-y-0.5 hover:shadow-cardHover"
    >
      <div className="relative aspect-square overflow-hidden bg-background">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title ?? "Produkt"}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-textSecondary/50">
            <ImageOff className="size-6" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-0.5 p-2">
        <p className="truncate text-xs font-medium text-textPrimary">{product.title ?? "—"}</p>
        {product.price != null && (
          <p className="font-display text-sm font-semibold text-primary">{formatPrice(product.price)}</p>
        )}
      </div>
    </Link>
  );
}
