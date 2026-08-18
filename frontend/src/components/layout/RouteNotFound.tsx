import { Link } from "@tanstack/react-router";

export function RouteNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-6xl font-bold text-textPrimary">404</h1>
      <p className="text-textSecondary">Faqja që kërkove nuk ekziston.</p>
      <Link
        to="/"
        className="mt-2 rounded bg-primary px-5 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-primary-hover"
      >
        Kthehu në ballinë
      </Link>
    </div>
  );
}
