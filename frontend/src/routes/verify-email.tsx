import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { LoadingSpinner } from "@/components/feedback/LoadingSpinner";
import { authApi } from "@/api/authApi";
import { extractApiError } from "@/api/axiosInstance";
import { CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/verify-email")({
  validateSearch: (s: Record<string, unknown>) => ({ token: (s.token as string) || undefined }),
  head: () => ({
    meta: [
      { title: "Verifikim email-i — Thrifted" },
      { name: "description", content: "Verifiko adresën e email-it për të aktivizuar llogarinë tënde Thrifted." },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { token } = useSearch({ from: "/verify-email" });
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("Mungon token-i i verifikimit.");
      return;
    }
    authApi
      .verifyEmail(token)
      .then(() => {
        setState("success");
        setMessage("Email-i u verifikua. Tani mund të kyçesh.");
      })
      .catch((e) => {
        setState("error");
        setMessage(extractApiError(e, "Verifikimi dështoi."));
      });
  }, [token]);

  return (
    <PageContainer narrow className="max-w-md">
      <div className="rounded-lg border border-border bg-surface p-6 text-center shadow-card">
        {state === "loading" && <LoadingSpinner label="Duke verifikuar…" />}
        {state === "success" && (
          <>
            <CheckCircle2 className="mx-auto mb-3 size-10 text-success" />
            <h1 className="mb-2 text-xl font-semibold text-textPrimary">Verifikim i suksesshëm</h1>
            <p className="text-sm text-textSecondary">{message}</p>
            <Link to="/login" className="mt-6 inline-block rounded bg-primary px-5 py-2.5 text-sm font-medium text-surface hover:bg-primary-hover">
              Vazhdo në hyrje
            </Link>
          </>
        )}
        {state === "error" && (
          <>
            <XCircle className="mx-auto mb-3 size-10 text-danger" />
            <h1 className="mb-2 text-xl font-semibold text-textPrimary">Nuk mundëm t'i verifikojmë</h1>
            <p className="text-sm text-textSecondary">{message}</p>
            <Link to="/login" className="mt-6 inline-block text-sm text-primary hover:text-primary-hover">
              Kthehu te hyrja
            </Link>
          </>
        )}
      </div>
    </PageContainer>
  );
}
