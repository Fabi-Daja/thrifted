import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { RouteError } from "@/components/layout/RouteError";
import { RouteNotFound } from "@/components/layout/RouteNotFound";
import { Avatar } from "@/components/user/Avatar";
import { UserProfileSkeleton } from "@/components/user/UserProfileSkeleton";
import { ProductGrid } from "@/components/product/ProductGrid";
import { RatingDisplay } from "@/components/user/RatingDisplay";
import { Button } from "@/components/forms/Button";
import { usersApi } from "@/api/usersApi";
import { useProducts } from "@/hooks/useProducts";
import { useUserReviews } from "@/hooks/useReviews";
import { useToggleFollow } from "@/hooks/useFollow";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { extractApiError } from "@/api/axiosInstance";
import { cn, formatRelativeDate } from "@/lib/utils";

export const Route = createFileRoute("/users/$id")({
  loader: async ({ params, context }) => {
    const user = await context.queryClient.ensureQueryData({
      queryKey: ["users", params.id],
      queryFn: () => usersApi.getById(params.id),
    });
    return user;
  },
  head: ({ loaderData }) => {
    const name = loaderData?.full_name ?? loaderData?.username ?? "Përdorues";
    return {
      meta: [
        { title: `${name} — Thrifted` },
        { name: "description", content: `Shiko profilin dhe produktet e ${name} në Thrifted.` },
        { property: "og:title", content: name },
        { property: "og:description", content: `Shiko profilin dhe produktet e ${name} në Thrifted.` },
      ],
    };
  },
  errorComponent: ({ error, reset }) => <RouteError error={error} reset={reset} />,
  notFoundComponent: RouteNotFound,
  component: UserProfilePage,
});

// Profili publik i shitesit, sipas Thrifted-dizajni.pptx (slide 14): avatar,
// emri, vleresim + qytet, skeda per Produktet/Te shitura/Vleresime, Ndiq +
// numra Followers/Following (backend: POST/DELETE /users/{id}/follow,
// implementuar 2026-09-01 - shih docs/faza/faza-1-...md). Skeda "Te
// preferuarat" mbetet e hequr: useFavorites() merr vetem favoritet e VETE
// userit aktual, jo te nje profili publik tjeter - do te ishte skede fiktive.
const TABS = ["Produktet", "Të shitura", "Vlerësime"] as const;
type Tab = (typeof TABS)[number];

function UserProfilePage() {
  const { id } = Route.useParams();
  const [tab, setTab] = useState<Tab>("Produktet");
  const { user: viewer } = useAuth();
  const { notify } = useToast();
  const { data: user, isLoading } = useQuery({
    queryKey: ["users", id],
    queryFn: () => usersApi.getById(id),
  });
  const { data: products } = useProducts({ owner_id: id });
  const { data: reviews } = useUserReviews(id);
  const toggleFollow = useToggleFollow(id);

  const active = useMemo(() => (products ?? []).filter((p) => p.status === "active"), [products]);
  const sold = useMemo(() => (products ?? []).filter((p) => p.status === "sold"), [products]);

  if (isLoading) {
    return (
      <PageContainer>
        <UserProfileSkeleton />
      </PageContainer>
    );
  }
  if (!user)
    return (
      <PageContainer>
        <p className="text-textSecondary">Përdoruesi nuk u gjet.</p>
      </PageContainer>
    );

  const name = user.full_name ?? user.username;
  const isOwnProfile = viewer?.id === user.id;

  const handleToggleFollow = () => {
    toggleFollow.mutate(user.is_following === true, {
      onError: (err) => notify(extractApiError(err), "error"),
    });
  };

  return (
    <PageContainer className="flex flex-col gap-8">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <Avatar src={user.profile_photo_url} name={name} size="xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-4xl font-semibold text-textPrimary">{name}</h1>
            {!isOwnProfile && viewer && (
              <Button
                variant={user.is_following ? "outline" : "primary"}
                size="sm"
                loading={toggleFollow.isPending}
                onClick={handleToggleFollow}
              >
                {user.is_following ? "Duke ndjekur" : "Ndiq"}
              </Button>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-textSecondary">
            <RatingDisplay value={user.rating_avg} count={user.rating_count} />
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden="true" />
              {user.location || "Nuk është vendosur"}
            </span>
            <span>Anëtar që nga {formatRelativeDate(user.created_at)}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-3 text-sm">
            <span>
              <span className="font-semibold text-textPrimary">{user.followers_count}</span>{" "}
              <span className="text-textSecondary">Ndjekës</span>
            </span>
            <span>
              <span className="font-semibold text-textPrimary">{user.following_count}</span>{" "}
              <span className="text-textSecondary">Ndjek</span>
            </span>
          </div>
          {user.bio && <p className="mt-2 max-w-xl text-sm text-textSecondary">{user.bio}</p>}
        </div>
      </div>

      <div>
        <div className="mb-6 flex gap-6 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "border-b-2 pb-3 text-sm font-medium transition-colors",
                tab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-textSecondary hover:text-textPrimary",
              )}
            >
              {t}
              {t === "Vlerësime" && reviews?.length ? ` (${reviews.length})` : null}
            </button>
          ))}
        </div>

        {tab === "Produktet" && (
          <ProductGrid products={active} emptyMessage="Nuk u gjet asnjë produkt. Provoni të ndryshoni filtrat." />
        )}
        {tab === "Të shitura" && (
          <ProductGrid products={sold} emptyMessage="Nuk u gjet asnjë produkt. Provoni të ndryshoni filtrat." />
        )}
        {tab === "Vlerësime" &&
          (!reviews || reviews.length === 0 ? (
            <p className="py-8 text-sm text-textSecondary">Ky përdorues s'ka marrë ende asnjë vlerësim.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {reviews.map((r) => (
                <li key={r.id} className="rounded border border-border bg-surface p-4">
                  <div className="flex items-center justify-between gap-2">
                    <RatingDisplay value={r.rating} />
                    <span className="text-xs text-textSecondary">{formatRelativeDate(r.created_at)}</span>
                  </div>
                  {r.comment && <p className="mt-2 text-sm text-textSecondary">{r.comment}</p>}
                </li>
              ))}
            </ul>
          ))}
      </div>
    </PageContainer>
  );
}
