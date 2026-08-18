import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-semibold text-textPrimary">Thrifted</p>
          <p className="mt-1 max-w-xs text-sm text-textSecondary">
            Tregu i modes second-hand me shpirt. Jep rrobave një jetë të re.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-textSecondary">
          <Link to="/search" className="transition-colors hover:text-textPrimary">Marketi</Link>
          <Link to="/create-product" className="transition-colors hover:text-textPrimary">Shit</Link>
          <Link to="/about" className="transition-colors hover:text-textPrimary">Rreth nesh</Link>
          <Link to="/help" className="transition-colors hover:text-textPrimary">Ndihmë</Link>
        </nav>
      </div>
      <div className="border-t border-border py-4">
        <p className="text-center text-xs text-textSecondary">
          © {new Date().getFullYear()} Thrifted. Të gjitha të drejtat e rezervuara.
        </p>
      </div>
    </footer>
  );
}
