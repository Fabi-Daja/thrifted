import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Leaf, ShieldCheck, Tag } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductRow } from "@/components/product/ProductRow";
import { RecommendationsRow } from "@/components/product/RecommendationsRow";
import { useProducts } from "@/hooks/useProducts";
import { useRecommendations } from "@/hooks/useRecommendations";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Thrifted — Modë e dorës së dytë me shpirt" },
      { name: "description", content: "Blej dhe shit rroba të përdorura online. Zbulo copa unike, bëj oferta dhe jepi rrobave një jetë të re." },
      { property: "og:title", content: "Thrifted — Modë e dorës së dytë me shpirt" },
      { property: "og:description", content: "Tregu shqip për rroba second-hand: shfleto, ofero, shit." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: HomePage,
});

// Faqja kryesore - Variant A ("Hero editorial"), sipas Thrifted-dizajni.pptx
// (slide 7): titull i madh serif + foto sezonale mbajne premtimin e markes,
// "Shit tani" primar / "Meso si funksionon" sekondar, kater produkte te
// zgjedhura ("Ne mode") para rrjetit te plote. Zgjedhur mbi Variant B
// (zbulim nga kategoria) per fazen e lançimit - shih docs/faza/faza-2-*.md.
function HomePage() {
  const { data: newest, isLoading: loadingNewest } = useProducts({ sort: "newest" });
  const { data: deals, isLoading: loadingDeals } = useProducts({ sort: "price_asc" });
  const { data: recommendations, isLoading: loadingRecommendations } = useRecommendations(12);

  const featured = (newest ?? []).slice(0, 4);
  const rest = (newest ?? []).slice(4, 12);

  return (
    <div className="flex flex-col">
      <section className="border-b border-border bg-surface">
        <PageContainer className="grid items-center gap-10 py-14 md:grid-cols-2 md:py-20">
          <div className="flex flex-col gap-6">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-eyebrow">
              Marketplace peer-to-peer
            </span>
            <h1 className="font-display text-balance text-5xl font-semibold leading-[1.05] text-textPrimary md:text-6xl">
              Jepi jetë të dytë veshjeve që s'i vesh më
            </h1>
            <p className="max-w-md text-pretty leading-relaxed text-textSecondary">
              Blej dhe shit rroba, këpucë e aksesorë të përdorura — çdo blerje mbrohet, çdo shitje paguhet.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/create-product"
                className="inline-flex items-center gap-2 rounded border border-primary px-6 py-3 font-medium text-primary transition-colors hover:border-primary-hover hover:bg-primary/5 hover:text-primary-hover"
              >
                Shit tani
              </Link>
              <Link
                to="/help"
                className="inline-flex items-center gap-2 rounded border border-border px-6 py-3 font-medium text-textPrimary transition-colors hover:border-textPrimary/40"
              >
                Mëso si funksionon
              </Link>
            </div>
          </div>
          <div className="relative">
            <img
              src="/images/hero.png"
              alt="Koleksion i kuruar rrobash të përdorura, sezoni aktual"
              className="aspect-[4/3] w-full rounded object-cover"
            />
          </div>
        </PageContainer>
      </section>

      <section className="border-b border-border bg-background">
        <PageContainer className="grid gap-6 py-8 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Shitës të verifikuar", desc: "Vlerësime reale nga blerësit" },
            { icon: Tag, title: "Çmime të drejta", desc: "Bëj ofertën tënde dhe kurse" },
            { icon: Leaf, title: "Miqësore me mjedisin", desc: "Zgjat jetën e çdo cope" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3">
              <div className="flex size-11 flex-none items-center justify-center rounded-full border border-primary/30 text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="font-medium text-textPrimary">{title}</p>
                <p className="text-sm text-textSecondary">{desc}</p>
              </div>
            </div>
          ))}
        </PageContainer>
      </section>

      <section className="bg-background">
        <PageContainer className="py-8">
          <ProductRow title="Në modë" products={featured} isLoading={loadingNewest} />
        </PageContainer>
      </section>

      <section className="bg-background">
        <PageContainer className="py-6">
          <RecommendationsRow
            title="Rekomanduar për ty"
            products={recommendations ?? []}
            isLoading={loadingRecommendations}
          />
        </PageContainer>
      </section>

      <section className="bg-background">
        <PageContainer className="py-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-3xl font-semibold text-textPrimary">
              Njoftimet e reja
            </h2>
            <Link
              to="/search"
              search={{ sort: "newest" }}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
            >
              Shiko katalogun
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <ProductGrid products={rest} loading={loadingNewest} />
        </PageContainer>
      </section>

      <section className="bg-background">
        <PageContainer className="py-6 pb-12">
          <ProductRow
            title="Oferta të mira"
            products={deals ?? []}
            isLoading={loadingDeals}
            viewAllTo="/search"
            viewAllSearch={{ sort: "price_asc" }}
          />
        </PageContainer>
      </section>
    </div>
  );
}
