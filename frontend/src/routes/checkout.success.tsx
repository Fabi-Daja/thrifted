import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { LoadingSpinner } from "@/components/feedback/LoadingSpinner";
import { paymentsApi } from "@/api/paymentsApi";
import { extractApiError } from "@/api/axiosInstance";
import { formatPrice } from "@/lib/utils";
import type { OrderResponse } from "@/types";

export const Route = createFileRoute("/checkout/success")({
  validateSearch: (s: Record<string, unknown>) => ({
    session_id: (s.session_id as string) || undefined,
  }),
  head: () => ({
    meta: [{ title: "Pagesa u konfirmua — Thrifted" }],
  }),
  component: CheckoutSuccessPage,
});

function CheckoutSuccessPage() {
  const { session_id } = useSearch({ from: "/checkout/success" });
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [order, setOrder] = useState<OrderResponse | null>(null);

  useEffect(() => {
    if (!session_id) {
      setState("error");
      setMessage("Mungon sesioni i pagesës.");
      return;
    }
    paymentsApi
      .confirmSession(session_id)
      .then((o) => {
        setOrder(o);
        setState("success");
      })
      .catch((e) => {
        setState("error");
        setMessage(extractApiError(e, "Nuk mundëm ta konfirmojmë pagesën."));
      });
  }, [session_id]);

  return (
    <PageContainer narrow className="max-w-md">
      <div className="rounded-lg border border-border bg-surface p-6 text-center shadow-card">
        {state === "loading" && <LoadingSpinner label="Duke konfirmuar pagesën…" />}
        {state === "success" && (
          <>
            <CheckCircle2 className="mx-auto mb-3 size-10 text-success" />
            <h1 className="mb-2 text-xl font-semibold text-textPrimary">
              Pagesa u krye me sukses!
            </h1>
            {order && (
              <p className="text-sm text-textSecondary">
                Ke paguar {formatPrice(order.final_price)}. Shitësi do të njoftohet për porosinë
                tënde.
              </p>
            )}
            <Link
              to="/me"
              className="mt-6 inline-block rounded bg-primary px-5 py-2.5 text-sm font-medium text-surface hover:bg-primary-hover"
            >
              Shiko profilin tim
            </Link>
          </>
        )}
        {state === "error" && (
          <>
            <XCircle className="mx-auto mb-3 size-10 text-danger" />
            <h1 className="mb-2 text-xl font-semibold text-textPrimary">Diçka shkoi keq</h1>
            <p className="text-sm text-textSecondary">{message}</p>
            <Link
              to="/"
              className="mt-6 inline-block text-sm text-primary hover:text-primary-hover"
            >
              Kthehu në ballinë
            </Link>
          </>
        )}
      </div>
    </PageContainer>
  );
}
