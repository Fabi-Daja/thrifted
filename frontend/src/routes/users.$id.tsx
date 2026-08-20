import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/layout/PageContainer";
import { RouteError } from "@/components/layout/RouteError";
import { RouteNotFound } from "@/components/layout/RouteNotFound";
import { UserBadge } from "@/components/user/UserBadge";
import { UserProfileSkeleton } from "@/components/user/UserProfileSkeleton";
import { ProductGrid } from "@/components/product/ProductGrid";
import { RatingDisplay } from "@/components/user/RatingDisplay";
import { usersApi } from "@/api/usersApi";
import { useProducts } from "@/hooks/useProducts";
import { useUserReviews } from "@/hooks/useReviews";
import { formatRelativeDate } from "@/lib/utils";

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

function UserProfilePage() {
  const { id } = Route.useParams();
  const { data: user, isLoading } = useQuery({
    queryKey: ["users", id],
    queryFn: () => usersApi.getById(id),
  });
  const { data: products } = useProducts({ owner_id: id });
  const { data: reviews } = useUserReviews(id);

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

  return (
    <PageContainer className="flex flex-col gap-8">
      <UserBadge user={user} linkToProfile={false} />
      {user.bio && (
        <p className="max-w-2xl text-sm text-textSecondary">{user.bio}</p>
      )}
      <p className="text-xs text-textSecondary">
        Anëtar që nga {formatRelativeDate(user.created_at)}
      </p>
      <div>
        <h2 className="mb-4 text-xl font-semibold text-textPrimary">
          Produktet e {user.full_name ?? user.username}
        </h2>
        <ProductGrid products={products ?? []} emptyMessage="Ky përdorues s'ka produkte aktive." />
      </div>
      <div>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-xl font-semibold text-textPrimary">Vlerësimet</h2>
          <RatingDisplay value={user.rating_avg} count={user.rating_count} />
        </div>
        {!reviews || reviews.length === 0 ? (
          <p className="text-sm text-textSecondary">Ky përdorues s'ka marrë ende asnjë vlerësim.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <RatingDisplay value={r.rating} />
                  <span className="text-xs text-textSecondary">{formatRelativeDate(r.created_at)}</span>
                </div>
                {r.comment && <p className="mt-2 text-sm text-textSecondary">{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageContainer>
  );
}
