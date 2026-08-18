import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronRight, Share2, ArrowRight } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { LoadingSpinner } from "@/components/feedback/LoadingSpinner";
import { RouteError } from "@/components/layout/RouteError";
import { RouteNotFound } from "@/components/layout/RouteNotFound";
import { ProductCarousel } from "@/components/product/ProductCarousel";
import { ProductDetailSkeleton } from "@/components/product/ProductDetailSkeleton";
import { ConditionStars } from "@/components/product/ConditionStars";
import { SellingTypeBadge } from "@/components/product/SellingTypeBadge";
import { StatusBadge } from "@/components/product/StatusBadge";
import { UserBadge } from "@/components/user/UserBadge";
import { Button } from "@/components/forms/Button";
import { TextInput } from "@/components/forms/TextInput";
import { Modal } from "@/components/feedback/Modal";
import { useProduct, useCheckoutProduct, productKeys } from "@/hooks/useProducts";
import {
  useCreateBid,
  useProductBids,
  useBidAction,
  useMyBids,
  useBidCheckout,
} from "@/hooks/useBids";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { formatPrice, formatRelativeDate } from "@/lib/utils";
import { extractApiError } from "@/api/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/api/usersApi";
import { productsApi } from "@/api/productsApi";

export const Route = createFileRoute("/products/$id")({
  validateSearch: (s: Record<string, unknown>) => ({
    checkout: s.checkout === "cancelled" ? ("cancelled" as const) : undefined,
  }),
  loader: async ({ params, context }) => {
    const product = await context.queryClient.ensureQueryData({
      queryKey: productKeys.detail(params.id),
      queryFn: () => productsApi.getById(params.id),
    });
    return product;
  },
  head: ({ loaderData }) => {
    const title = loaderData?.title ?? "Produkt";
    const description = loaderData?.description?.slice(0, 155) || `Blej ${title} në Thrifted.`;
    const imageUrl = loaderData?.images?.[0]?.url;
    const ogImage = imageUrl?.startsWith("https://") ? imageUrl : undefined;
    return {
      meta: [
        { title: `${title} — Thrifted` },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        ...(ogImage ? [{ property: "og:image", content: ogImage }] : []),
      ],
    };
  },
  errorComponent: ({ error, reset }) => <RouteError error={error} reset={reset} />,
  notFoundComponent: RouteNotFound,
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { id } = Route.useParams();
  const { checkout } = Route.useSearch();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const { notify } = useToast();

  useEffect(() => {
    if (checkout === "cancelled") {
      notify("Pagesa u anulua - nuk je ngarkuar.", "info");
      navigate({ to: "/products/$id", params: { id }, search: {}, replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkout]);

  const { data: product, isLoading, error } = useProduct(id);
  const { data: seller } = useQuery({
    queryKey: ["users", product?.owner_id],
    queryFn: () => usersApi.getById(product!.owner_id),
    enabled: !!product?.owner_id,
  });

  const isOwner = !!user && !!product && user.id === product.owner_id;
  const canBuy = product?.selling_type !== "offers_only" && product?.status === "active";
  const canBid = product && product.selling_type !== "fixed_price" && product.status === "active";

  const [bidOpen, setBidOpen] = useState(false);
  const [offersOpen, setOffersOpen] = useState(false);
  const [buying, setBuying] = useState(false);
  const [paying, setPaying] = useState(false);

  const checkoutMutation = useCheckoutProduct();
  const bidCheckoutMutation = useBidCheckout();
  const bidMutation = useCreateBid(id);
  const { data: bids } = useProductBids(id, isOwner && offersOpen);
  const { accept, reject } = useBidAction(id);
  const { data: myBids } = useMyBids(!isOwner && isLoggedIn);
  const myAcceptedBid = myBids?.find((b) => b.product_id === id && b.status === "accepted");
  const canPayBid = !!myAcceptedBid && product?.status === "reserved";

  const requireAuth = (nextAction: () => void) => {
    if (!isLoggedIn) {
      navigate({ to: "/login", search: { redirect_to: `/products/${id}` } });
      return;
    }
    nextAction();
  };

  // Ridrejton te faqja e pagesës e Stripe (Hosted Checkout). Porosia
  // finalizohet vetëm pasi kthehet nga Stripe te /checkout/success.
  const handleBuy = () => {
    requireAuth(async () => {
      setBuying(true);
      try {
        const { checkout_url } = await checkoutMutation.mutateAsync(id);
        window.location.href = checkout_url;
      } catch (e) {
        notify(extractApiError(e), "error");
        setBuying(false);
      }
    });
  };

  const handlePayBid = () => {
    if (!myAcceptedBid) return;
    requireAuth(async () => {
      setPaying(true);
      try {
        const { checkout_url } = await bidCheckoutMutation.mutateAsync(myAcceptedBid.id);
        window.location.href = checkout_url;
      } catch (e) {
        notify(extractApiError(e), "error");
        setPaying(false);
      }
    });
  };

  if (isLoading) {
    return (
      <PageContainer>
        <ProductDetailSkeleton />
      </PageContainer>
    );
  }
  if (error || !product) {
    return (
      <PageContainer>
        <p className="text-textSecondary">Produkti nuk u gjet.</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="grid gap-8 lg:grid-cols-2">
      <nav aria-label="Breadcrumb" className="col-span-full -mb-4">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-textSecondary">
          <li>
            <Link to="/" className="hover:text-textPrimary">
              Ballina
            </Link>
          </li>
          <li>
            <ChevronRight className="size-4" aria-hidden="true" />
          </li>
          <li>
            <Link to="/search" className="hover:text-textPrimary">
              Marketi
            </Link>
          </li>
          {product.category && (
            <>
              <li>
                <ChevronRight className="size-4" aria-hidden="true" />
              </li>
              <li>
                <Link
                  to="/search"
                  search={{ category: product.category }}
                  className="hover:text-textPrimary"
                >
                  {product.category}
                </Link>
              </li>
            </>
          )}
          <li>
            <ChevronRight className="size-4" aria-hidden="true" />
          </li>
          <li className="line-clamp-1 max-w-[12rem] text-textPrimary" aria-current="page">
            {product.title}
          </li>
        </ol>
      </nav>

      <ProductCarousel images={product.images ?? []} title={product.title} />

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <SellingTypeBadge type={product.selling_type} />
          <StatusBadge status={product.status} />
        </div>

        <div className="flex items-start justify-between gap-3">
          <h1 className="text-3xl font-semibold text-textPrimary">{product.title}</h1>
          <ShareButton title={product.title} />
        </div>
        <p className="text-3xl font-bold text-primary">{formatPrice(product.price)}</p>

        <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-surface p-4 text-sm">
          <InfoRow label="Marka" value={product.brand} />
          <InfoRow label="Masa" value={product.size} />
          <InfoRow label="Kategoria" value={product.category} />
          <InfoRow label="Ngjyra" value={product.color} />
          <div className="col-span-2">
            <p className="text-xs text-textSecondary">Gjendja</p>
            <ConditionStars rating={product.condition_rating} />
          </div>
        </div>

        {product.description && (
          <div>
            <h2 className="mb-1 text-sm font-medium text-textPrimary">Përshkrimi</h2>
            <p className="whitespace-pre-line text-sm text-textSecondary">{product.description}</p>
          </div>
        )}

        {isOwner ? (
          <div className="flex flex-col gap-2">
            <Button variant="outline" onClick={() => setOffersOpen(true)}>
              Shiko Ofertat
            </Button>
            <Link
              to="/products/$id/edit"
              params={{ id }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded bg-textPrimary px-5 text-sm font-medium text-surface transition-colors hover:bg-textPrimary/90"
            >
              Edito produktin
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {canBuy && (
              <Button onClick={handleBuy} loading={buying} fullWidth>
                Bli për {formatPrice(product.price)}
              </Button>
            )}
            {canBid && (
              <Button
                variant="outline"
                fullWidth
                onClick={() => requireAuth(() => setBidOpen(true))}
              >
                Bëj një ofertë
              </Button>
            )}
            {canPayBid && (
              <Button onClick={handlePayBid} loading={paying} fullWidth>
                Paguaj {formatPrice(myAcceptedBid!.amount)}
              </Button>
            )}
            {product.status !== "active" && !canPayBid && (
              <p className="text-sm text-textSecondary">Ky produkt nuk është më i disponueshëm.</p>
            )}
          </div>
        )}

        {seller && (
          <div className="mt-4">
            <h2 className="mb-2 text-sm font-medium text-textPrimary">Shitësi</h2>
            <Link
              to="/users/$id"
              params={{ id: seller.id }}
              className="group flex items-center justify-between rounded-lg border border-border bg-surface p-3 transition-colors hover:border-primary"
            >
              <UserBadge user={seller} />
              <ArrowRight
                className="size-4 text-textSecondary transition-colors group-hover:text-primary"
                aria-hidden="true"
              />
            </Link>
          </div>
        )}
      </div>

      <BidModal
        open={bidOpen}
        onClose={() => setBidOpen(false)}
        onSubmit={async (amount) => {
          try {
            await bidMutation.mutateAsync(amount);
            notify("Oferta u dërgua!", "success");
            setBidOpen(false);
          } catch (e) {
            notify(extractApiError(e), "error");
          }
        }}
        loading={bidMutation.isPending}
      />

      <Modal open={offersOpen} onClose={() => setOffersOpen(false)} title="Ofertat" size="lg">
        {!bids ? (
          <LoadingSpinner />
        ) : bids.length === 0 ? (
          <p className="text-sm text-textSecondary">Ende s'ka oferta për këtë produkt.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {bids.map((bid) => (
              <li key={bid.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-textPrimary">{formatPrice(bid.amount)}</p>
                  <p className="text-xs text-textSecondary">
                    {formatRelativeDate(bid.created_at)} · {bid.status}
                  </p>
                </div>
                {bid.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => accept.mutate(bid.id)}
                      loading={accept.isPending}
                    >
                      Prano
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => reject.mutate(bid.id)}
                      loading={reject.isPending}
                    >
                      Refuzo
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </PageContainer>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-textSecondary">{label}</p>
      <p className="text-textPrimary">{value ?? "—"}</p>
    </div>
  );
}

function BidModal({
  open,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => void;
  loading: boolean;
}) {
  const [amount, setAmount] = useState("");
  return (
    <Modal open={open} onClose={onClose} title="Bëj një ofertë" size="sm">
      <div className="flex flex-col gap-4">
        <TextInput
          label="Shuma (€)"
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="p.sh. 25"
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Anulo
          </Button>
          <Button
            onClick={() => {
              const n = Number(amount);
              if (!n || n <= 0) return;
              onSubmit(n);
            }}
            loading={loading}
          >
            Dërgo ofertën
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex shrink-0 items-center gap-1.5 rounded px-2 py-1 text-sm text-textSecondary transition-colors hover:bg-background hover:text-textPrimary"
      aria-label="Shpërndaje produktin"
      title={copied ? "Lidhja u kopjua" : "Shpërndaje"}
    >
      <Share2 className="size-4" aria-hidden="true" />
      <span className="hidden sm:inline">{copied ? "U kopjua" : "Shpërndaje"}</span>
    </button>
  );
}
