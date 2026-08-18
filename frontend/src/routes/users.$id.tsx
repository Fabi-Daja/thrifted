import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/layout/PageContainer";
import { RouteError } from "@/components/layout/RouteError";
import { RouteNotFound } from "@/components/layout/RouteNotFound";
import { UserBadge } from "@/components/user/UserBadge";
import { UserProfileSkeleton } from "@/components/user/UserProfileSkeleton";
import { ProductGrid } from "@/components/product/ProductGrid";
import { usersApi } from "@/api/usersApi";
import { useProducts } from "@/hooks/useProducts";
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
    </PageContainer>
  );
}
