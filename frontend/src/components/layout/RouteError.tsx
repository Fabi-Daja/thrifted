import { useRouter } from "@tanstack/react-router";

interface RouteErrorProps {
  error: Error;
  reset: () => void;
}

export function RouteError({ error, reset }: RouteErrorProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-xl font-semibold text-textPrimary">Diçka shkoi keq</h1>
      <p className="text-sm text-textSecondary">{error.message || "Provo përsëri ose kthehu në ballinë."}</p>
      <div className="mt-2 flex gap-2">
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-surface hover:bg-primary-hover"
        >
          Provo përsëri
        </button>
        <a
          href="/"
          className="rounded border border-border bg-surface px-4 py-2 text-sm text-textPrimary hover:bg-background"
        >
          Ballina
        </a>
      </div>
    </div>
  );
}
