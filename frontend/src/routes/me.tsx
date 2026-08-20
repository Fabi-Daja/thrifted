import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Star } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Avatar } from "@/components/user/Avatar";
import { RatingDisplay } from "@/components/user/RatingDisplay";
import { StarRatingInput } from "@/components/user/StarRatingInput";
import { Tabs, type TabItem } from "@/components/navigation/Tabs";
import { ProductGrid } from "@/components/product/ProductGrid";
import { LoadingSpinner } from "@/components/feedback/LoadingSpinner";
import { Modal } from "@/components/feedback/Modal";
import { Button } from "@/components/forms/Button";
import { TextArea } from "@/components/forms/TextInput";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useProducts } from "@/hooks/useProducts";
import { useFavorites, useToggleFavorite } from "@/hooks/useFavorites";
import { useCreateReview } from "@/hooks/useReviews";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/api/usersApi";
import { formatPrice, formatRelativeDate } from "@/lib/utils";
import { extractApiError } from "@/api/axiosInstance";
import type { OrderDetailResponse } from "@/types";

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
  const { notify } = useToast();
  const [tab, setTab] = useState<TabKey>("listings");
  const [reviewOrder, setReviewOrder] = useState<OrderDetailResponse | null>(null);
  const createReview = useCreateReview();

  const { data: myListings } = useProducts({ owner_id: user?.id });

  const { data: favorites } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const favoriteIds = new Set((favorites ?? []).map((f) => f.product.id));

  const { data: myBids } = useQuery({
    queryKey: ["users", "me", "bids"],
    queryFn: () => usersApi.myBids(),
    enabled: !!user,
  });

  const { data: myPurchases } = useQuery({
    queryKey: ["users", "me", "purchases"],
    queryFn: () => usersApi.myPurchases(),
    enabled: !!user,
  });

  const { data: mySales } = useQuery({
    queryKey: ["users", "me", "sales"],
    queryFn: () => usersApi.mySales(),
    enabled: !!user,
  });

  if (!user) return <LoadingSpinner fullPage />;

  const tabs: TabItem[] = [
    { key: "listings", label: "Produktet", count: (myListings ?? []).length },
    { key: "purchases", label: "Blerjet", count: myPurchases?.length },
    { key: "sales", label: "Shitjet", count: mySales?.length },
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
        <div className="flex shrink-0 gap-2">
          <Link
            to="/settings"
            className="inline-flex items-center justify-center rounded border border-border px-5 py-2.5 text-sm font-medium text-textPrimary transition-colors hover:bg-background"
          >
            Konfigurimet
          </Link>
          <Link
            to="/create-product"
            className="inline-flex items-center justify-center rounded bg-primary px-5 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-primary-hover"
          >
            Shit një produkt të ri
          </Link>
        </div>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={(k) => setTab(k as TabKey)} />

      <div>
        {tab === "listings" && (
          <ProductGrid products={myListings ?? []} emptyMessage="Ende s'ke publikuar produkte." />
        )}
        {tab === "purchases" && (
          <div className="flex flex-col gap-2">
            {!myPurchases ? (
              <LoadingSpinner />
            ) : myPurchases.length === 0 ? (
              <EmptyState text="Ende s'ke blerë asgjë." />
            ) : (
              myPurchases.map((o) => (
                <OrderRow
                  key={o.id}
                  order={o}
                  counterpartyRole="Shitësi"
                  onReview={o.status === "completed" ? () => setReviewOrder(o) : undefined}
                />
              ))
            )}
          </div>
        )}
        {tab === "sales" && (
          <div className="flex flex-col gap-2">
            {!mySales ? (
              <LoadingSpinner />
            ) : mySales.length === 0 ? (
              <EmptyState text="Ende s'ke shitur asgjë." />
            ) : (
              mySales.map((o) => <OrderRow key={o.id} order={o} counterpartyRole="Blerësi" />)
            )}
          </div>
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

      <ReviewModal
        order={reviewOrder}
        onClose={() => setReviewOrder(null)}
        loading={createReview.isPending}
        onSubmit={async (rating, comment) => {
          if (!reviewOrder) return;
          try {
            await createReview.mutateAsync({ orderId: reviewOrder.id, data: { rating, comment } });
            notify("Faleminderit për vlerësimin!", "success");
            setReviewOrder(null);
          } catch (err) {
            notify(extractApiError(err), "error");
          }
        }}
      />
    </PageContainer>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="py-16 text-center text-sm text-textSecondary">{text}</p>;
}

const orderStatusLabel: Record<string, string> = {
  completed: "Përfunduar",
  refunded: "Rimbursuar",
};

function OrderRow({
  order,
  counterpartyRole,
  onReview,
}: {
  order: OrderDetailResponse;
  counterpartyRole: string;
  onReview?: () => void;
}) {
  const thumbnail = order.product.images?.[0]?.url;

  return (
    <Link
      to="/products/$id"
      params={{ id: order.product.id }}
      search={{}}
      className="flex items-center gap-4 rounded-lg border border-border bg-surface p-4 hover:border-primary/40"
    >
      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-background text-xs text-textSecondary">
        {thumbnail ? (
          <img src={thumbnail} alt={order.product.title} className="size-full object-cover" />
        ) : (
          "pa foto"
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-textPrimary">{order.product.title}</p>
        <p className="text-xs text-textSecondary">
          {counterpartyRole}: {order.counterparty.full_name ?? order.counterparty.username} ·{" "}
          {formatRelativeDate(order.created_at)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5 text-right">
        <p className="font-medium text-textPrimary">{formatPrice(Number(order.final_price))}</p>
        <p className="text-xs text-textSecondary">{orderStatusLabel[order.status] ?? order.status}</p>
        {order.has_review ? (
          <span className="flex items-center gap-1 text-xs text-textSecondary">
            <Star className="size-3.5 fill-primary text-primary" /> Vlerësuar
          </span>
        ) : (
          onReview && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onReview();
              }}
              className="rounded border border-primary px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
            >
              Lëre një vlerësim
            </button>
          )
        )}
      </div>
    </Link>
  );
}

function ReviewModal({
  order,
  onClose,
  onSubmit,
  loading,
}: {
  order: OrderDetailResponse | null;
  onClose: () => void;
  onSubmit: (rating: number, comment: string | undefined) => void;
  loading: boolean;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  return (
    <Modal
      open={!!order}
      onClose={() => {
        onClose();
        setRating(0);
        setComment("");
      }}
      title={order ? `Vlerëso ${order.counterparty.full_name ?? order.counterparty.username}` : undefined}
      size="sm"
    >
      {order && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-textSecondary">Si e vlerëson blerjen e "{order.product.title}"?</p>
          <StarRatingInput value={rating} onChange={setRating} />
          <TextArea
            label="Koment (opsional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Si ishte përvoja jote me këtë shitës?"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Anulo
            </Button>
            <Button
              onClick={() => {
                if (rating < 1) return;
                onSubmit(rating, comment.trim() || undefined);
              }}
              loading={loading}
              disabled={rating < 1}
            >
              Dërgo vlerësimin
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
