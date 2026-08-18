import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { SearchBar } from "@/components/navigation/SearchBar";
import { FilterDropdown } from "@/components/navigation/FilterDropdown";
import { SelectDropdown } from "@/components/forms/SelectDropdown";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Pagination } from "@/components/navigation/Pagination";
import { SORT_OPTIONS, PAGE_SIZE, CATEGORIES, SIZES, CONDITION_OPTIONS } from "@/lib/constants";
import { useProducts } from "@/hooks/useProducts";
import { useFavorites, useToggleFavorite } from "@/hooks/useFavorites";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import type { ProductFilters, ProductResponse } from "@/types";

type SearchParams = Partial<ProductFilters> & { page?: number };

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>): SearchParams => {
    const num = (v: unknown) => (v === undefined || v === "" ? undefined : Number(v));
    return {
      q: (s.q as string) || undefined,
      category: (s.category as string) || undefined,
      brand: (s.brand as string) || undefined,
      size: (s.size as string) || undefined,
      condition_rating: num(s.condition_rating),
      price_min: num(s.price_min),
      price_max: num(s.price_max),
      sort: (s.sort as ProductFilters["sort"]) || undefined,
      page: num(s.page) ?? 1,
    };
  },
  head: () => ({
    meta: [
      { title: "Marketi — Thrifted" },
      { name: "description", content: "Shfleto rroba të përdorura, këpucë dhe aksesorë. Filtra për kategori, masë, gjendje dhe çmim." },
      { property: "og:title", content: "Marketi — Thrifted" },
      { property: "og:description", content: "Shfleto rroba të përdorura, këpucë dhe aksesorë." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const search = useSearch({ from: "/search" });
  const navigate = useNavigate({ from: "/search" });
  const { isLoggedIn } = useAuth();
  const { notify } = useToast();

  const filters: ProductFilters = useMemo(() => {
    const { page: _p, ...rest } = search;
    return rest;
  }, [search]);

  const page = search.page ?? 1;
  const { data, isLoading } = useProducts(filters);
  const { data: favorites } = useFavorites();
  const toggleFavorite = useToggleFavorite();

  const favoriteIds = useMemo(
    () => new Set((favorites ?? []).map((f) => f.product.id)),
    [favorites],
  );

  // Client-side pagination since backend returns list.
  const total = data?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paged = (data ?? []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hasActiveFilters =
    !!search.q ||
    !!search.category ||
    !!search.brand ||
    !!search.size ||
    !!search.condition_rating ||
    !!search.price_min ||
    !!search.price_max;

  useEffect(() => {
    if (page > totalPages) {
      navigate({ search: (s: SearchParams) => ({ ...s, page: 1 }), replace: true });
    }
  }, [page, totalPages, navigate]);

  const updateSearch = (patch: SearchParams) => {
    navigate({ search: (s: SearchParams) => ({ ...s, ...patch, page: 1 }), replace: true });
  };

  const handleToggleFavorite = (product: ProductResponse) => {
    if (!isLoggedIn) {
      notify("Duhet të kyçesh për të ruajtur favoritet.", "info");
      return;
    }
    toggleFavorite.mutate({ productId: product.id, isFavorite: favoriteIds.has(product.id) });
  };

  return (
    <PageContainer className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold text-textPrimary">Marketi</h1>
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchBar
            defaultValue={search.q ?? ""}
            onSearch={(q) => updateSearch({ q: q || undefined })}
          />
          <div className="flex gap-2">
            <FilterDropdown filters={filters} onApply={(f) => updateSearch(f)} />
            <SelectDropdown
              options={SORT_OPTIONS}
              value={search.sort ?? "newest"}
              onChange={(e) => updateSearch({ sort: e.target.value as ProductFilters["sort"] })}
              className="min-w-40"
              aria-label="Rendit sipas"
            />
          </div>
        </div>
        <ActiveFilters search={search} onChange={updateSearch} />
        <p className="text-sm text-textSecondary">
          {isLoading ? "Duke kërkuar…" : total === 1 ? "1 rezultat" : `${total} rezultate`}
        </p>
      </div>

      <ProductGrid
        products={paged}
        loading={isLoading}
        favoriteIds={favoriteIds}
        onToggleFavorite={handleToggleFavorite}
        emptyMessage={
          hasActiveFilters
            ? "Nuk u gjet asnjë produkt me këto filtra. Pastro filtrat dhe provo përsëri."
            : "Nuk u gjet asnjë produkt në marketplace."
        }
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        onChange={(p) => navigate({ search: (s: SearchParams) => ({ ...s, page: p }) })}
      />
    </PageContainer>
  );
}

function ActiveFilters({
  search,
  onChange,
}: {
  search: SearchParams;
  onChange: (patch: SearchParams) => void;
}) {
  const chips: { key: keyof ProductFilters; label: string; value: string | number | undefined }[] = [
    { key: "q", label: "Kërkim", value: search.q },
    { key: "category", label: "Kategoria", value: CATEGORIES.find((c) => c.value === search.category)?.label ?? search.category },
    { key: "brand", label: "Marka", value: search.brand },
    { key: "size", label: "Masa", value: SIZES.find((s) => s.value === search.size)?.label ?? search.size },
    {
      key: "condition_rating",
      label: "Gjendja",
      value: CONDITION_OPTIONS.find((c) => c.value === String(search.condition_rating))?.label ?? search.condition_rating,
    },
    { key: "price_min", label: "Çmimi min", value: search.price_min },
    { key: "price_max", label: "Çmimi max", value: search.price_max },
  ];

  const visible = chips.filter((c) => c.value !== undefined && c.value !== "");
  if (visible.length === 0) return null;

  const remove = (key: keyof ProductFilters) => {
    onChange({ [key]: undefined } as SearchParams);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-textSecondary">Aktiv:</span>
      {visible.map((chip) => (
        <button
          key={chip.key}
          onClick={() => remove(chip.key)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-textPrimary transition-colors hover:bg-background"
          aria-label={`Hiq filtrin ${chip.label}`}
        >
          <span className="text-textSecondary">{chip.label}:</span>
          <span className="font-medium">{chip.value}</span>
          <X className="size-3.5 text-textSecondary" aria-hidden="true" />
        </button>
      ))}
      <button
        onClick={() =>
          onChange({
            q: undefined,
            category: undefined,
            brand: undefined,
            size: undefined,
            condition_rating: undefined,
            price_min: undefined,
            price_max: undefined,
          })
        }
        className="text-xs text-primary hover:text-primary-hover"
      >
        Pastro të gjitha
      </button>
    </div>
  );
}
