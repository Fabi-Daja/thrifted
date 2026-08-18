import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Baby,
  Footprints,
  Gem,
  Heart,
  Leaf,
  ShieldCheck,
  ShoppingBag,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { SearchBar } from "@/components/navigation/SearchBar";
import { ProductRow } from "@/components/product/ProductRow";
import { CATEGORIES } from "@/lib/constants";
import { useProducts } from "@/hooks/useProducts";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  womens: Heart,
  mens: Tag,
  shoes: Footprints,
  accessories: Gem,
  bags: ShoppingBag,
  kids: Baby,
};

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

function HomePage() {
  const navigate = useNavigate();
  const { data: newest, isLoading: loadingNewest } = useProducts({ sort: "newest" });
  const { data: deals, isLoading: loadingDeals } = useProducts({ sort: "price_asc" });

  const handleSearch = (q: string) => {
    navigate({ to: "/search", search: { q } });
  };

  return (
    <div className="flex flex-col">
      <section className="border-b border-border bg-surface">
        <PageContainer className="grid items-center gap-8 py-12 md:grid-cols-2 md:py-16">
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <Leaf className="size-4" aria-hidden="true" />
              Modë e qëndrueshme
            </span>
            <h1 className="text-balance text-4xl font-bold leading-tight text-textPrimary md:text-5xl">
              Blej dhe shit rroba të përdorura me stil
            </h1>
            <p className="max-w-md text-pretty leading-relaxed text-textSecondary">
              Zbulo copa unike të dorës së dytë, bëj oferta dhe jepi rrobave një jetë të re. Çmime të mira, cilësi e verifikuar.
            </p>
            <div className="max-w-md">
              <SearchBar onSearch={handleSearch} placeholder="Kërko marka, kategori, artikuj..." />
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/search"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-surface transition-colors hover:bg-primary-hover"
              >
                Shfleto të gjitha
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-6 py-3 font-medium text-textPrimary transition-colors hover:border-primary hover:text-primary"
              >
                Fillo të shesësh
              </Link>
            </div>
          </div>
          <div className="relative">
            <img
              src="/images/hero.png"
              alt="Koleksion i kuruar rrobash të përdorura në sfond bezhë"
              className="aspect-[4/3] w-full rounded-lg object-cover shadow-card"
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
              <div className="flex size-11 flex-none items-center justify-center rounded-full bg-primary/10 text-primary">
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
        <PageContainer className="py-10">
          <h2 className="mb-6 text-2xl font-semibold text-textPrimary">Kategoritë</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.value];
              return (
                <Link
                  key={cat.value}
                  to="/search"
                  search={{ category: cat.value }}
                  className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-6 text-center font-medium text-textPrimary shadow-card transition-colors hover:border-primary hover:text-primary"
                >
                  {Icon && <Icon className="size-6 text-primary" aria-hidden="true" />}
                  {cat.label}
                </Link>
              );
            })}
          </div>
        </PageContainer>
      </section>

      <section className="bg-background">
        <PageContainer className="py-6">
          <ProductRow
            title="Të shtuara së fundmi"
            products={newest ?? []}
            isLoading={loadingNewest}
            viewAllTo="/search"
            viewAllSearch={{ sort: "newest" }}
          />
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
