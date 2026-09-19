import { RecommendationCard } from "./RecommendationCard";
import { ProductCardSkeleton } from "./ProductCardSkeleton";
import type { RecommendationResult } from "@/types";

interface RecommendationsRowProps {
  title: string;
  products: RecommendationResult[];
  isLoading?: boolean;
}

// Rresht i ngjashëm me ProductRow, por për RecommendationResult (§5.5) - jo
// ripërdorim direkt i ProductRow sepse ai kërkon ProductResponse të plotë
// (shih RecommendationCard). Kthen `null` kur s'ka rezultate (jo mesazh bosh) -
// e QËLLIMSHME, sepse për vizitorë të palogum (endpoint-i kërkon auth) rreshti
// s'duhet të shfaqet fare në faqen kryesore, jo të shfaqet bosh.
export function RecommendationsRow({ title, products, isLoading }: RecommendationsRowProps) {
  if (!isLoading && products.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-3xl font-semibold text-textPrimary">{title}</h2>

      {isLoading ? (
        <div className="-mx-4 flex gap-4 overflow-hidden px-4 pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-40 shrink-0 sm:w-48">
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      ) : (
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
          {products.map((product) => (
            <div key={product.id} className="w-40 shrink-0 snap-start sm:w-48 animate-fade-in">
              <RecommendationCard product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
