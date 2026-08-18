import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Avatar } from "@/components/user/Avatar";
import { RatingDisplay } from "@/components/user/RatingDisplay";
import { Tabs, type TabItem } from "@/components/navigation/Tabs";
import { ProductGrid } from "@/components/product/ProductGrid";
import { LoadingSpinner } from "@/components/feedback/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { useProducts } from "@/hooks/useProducts";
import { useFavorites, useToggleFavorite } from "@/hooks/useFavorites";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/api/usersApi";
import { formatPrice, formatRelativeDate } from "@/lib/utils";

export const Route = createFileRoute("/me")({
  head: () => ({
    meta: [
      { title: "Profili im — Thrifted" },
      { name: "description", content: "Menaxho produktet, favoritet dhe ofertat e tua në Thrifted." },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <MePage />
    </ProtectedRoute>
  ),
});

type TabKey = "listings" | "purchases" | "sales" | "favorites" | "bids";

function MePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabKey>("listings");

  const { data: myListings } = useProducts({ owner_id: user?.id });

  const { data: favorites } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const favoriteIds = new Set((favorites ?? []).map((f) => f.product.id));

  const { data: myBids } = useQuery({
    queryKey: ["users", "me", "bids"],
    queryFn: () => usersApi.myBids(),
    enabled: !!user,
  });

  if (!user) return <LoadingSpinner fullPage />;

  const tabs: TabItem[] = [
    { key: "listings", label: "Produktet", count: (myListings ?? []).length },
    { key: "purchases", label: "Blerjet" },
    { key: "sales", label: "Shitjet" },
    { key: "favorites", label: "Favoritet", count: favorites?.length },
    { key: "bids", label: "Ofertat", count: myBids?.length },
  ];

  return (
    <PageContainer className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-4 rounded-lg border border-border bg-surface p-6 shadow-card sm:flex-row sm:items-center">
        <Avatar src={user.profile_photo_url} name={user.full_name ?? user.username} size="xl" />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-textPrimary">{user.full_name ?? user.username}</h1>
          <p className="text-sm text-textSecondary">@{user.username}</p>
          <div className="mt-2">
            <RatingDisplay value={user.rating_avg} count={user.rating_count} />
          </div>
          {user.bio && <p className="mt-3 max-w-2xl text-sm text-textSecondary">{user.bio}</p>}
        </div>
        <Link
          to="/create-product"
          className="inline-flex items-center justify-center rounded bg-primary px-5 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-primary-hover"
        >
          Shit një produkt të ri
        </Link>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={(k) => setTab(k as TabKey)} />

      <div>
        {tab === "listings" && (
          <ProductGrid products={myListings ?? []} emptyMessage="Ende s'ke publikuar produkte." />
        )}
        {tab === "purchases" && (
          <EmptyState text="Blerjet e tua do të shfaqen këtu." />
        )}
        {tab === "sales" && (
          <EmptyState text="Shitjet e tua do të shfaqen këtu." />
        )}
        {tab === "favorites" && (
          <ProductGrid
            products={(favorites ?? []).map((f) => f.product)}
            emptyMessage="Ende s'ke ruajtur asnjë produkt."
            favoriteIds={favoriteIds}
            onToggleFavorite={(p) =>
              toggleFavorite.mutate({ productId: p.id, isFavorite: favoriteIds.has(p.id) })
            }
          />
        )}
        {tab === "bids" && (
          <div className="flex flex-col gap-2">
            {!myBids ? (
              <LoadingSpinner />
            ) : myBids.length === 0 ? (
              <EmptyState text="Ende s'ke bërë oferta." />
            ) : (
              myBids.map((b) => (
                <Link
                  key={b.id}
                  to="/products/$id"
                  params={{ id: b.product_id }}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface p-4 hover:border-primary/40"
                >
                  <div>
                    <p className="font-medium text-textPrimary">Oferta: {formatPrice(b.amount)}</p>
                    <p className="text-xs text-textSecondary">
                      {formatRelativeDate(b.created_at)} · {b.status}
                    </p>
                  </div>
                  <span className="text-sm text-primary">Shiko produktin →</span>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="py-16 text-center text-sm text-textSecondary">{text}</p>;
}
