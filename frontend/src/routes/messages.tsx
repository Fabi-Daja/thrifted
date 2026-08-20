import { createFileRoute, Link } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/PageContainer";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { LoadingSpinner } from "@/components/feedback/LoadingSpinner";
import { Avatar } from "@/components/user/Avatar";
import { useAuth } from "@/context/AuthContext";
import { useConversations } from "@/hooks/useConversations";
import { formatRelativeDate } from "@/lib/utils";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Mesazhet — Thrifted" },
      { name: "description", content: "Bisedat e tua me blerës dhe shitës të tjerë në Thrifted." },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <MessagesListPage />
    </ProtectedRoute>
  ),
});

function MessagesListPage() {
  const { user } = useAuth();
  const { data: conversations } = useConversations(!!user);

  return (
    <PageContainer narrow className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-textPrimary">Mesazhet</h1>

      {!conversations ? (
        <LoadingSpinner />
      ) : conversations.length === 0 ? (
        <p className="py-16 text-center text-sm text-textSecondary">
          Ende s'ke asnjë bisedë. Nis një duke kontaktuar shitësin te faqja e një produkti.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {conversations.map((c) => (
            <Link
              key={c.id}
              to="/messages/$id"
              params={{ id: c.id }}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary/40"
            >
              <Avatar
                src={c.counterparty.profile_photo_url}
                name={c.counterparty.full_name ?? c.counterparty.username}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-medium text-textPrimary">
                    {c.counterparty.full_name ?? c.counterparty.username}
                  </p>
                  {c.last_message && (
                    <span className="shrink-0 text-xs text-textSecondary">
                      {formatRelativeDate(c.last_message.created_at)}
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-textSecondary">{c.product.title}</p>
                <p className="truncate text-sm text-textSecondary">
                  {c.last_message?.content ?? "Nuk ka ende mesazhe"}
                </p>
              </div>
              {c.unread_count > 0 && (
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-surface">
                  {c.unread_count}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
