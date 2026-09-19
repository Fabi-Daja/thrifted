import { Link } from "@tanstack/react-router";
import { CATEGORIES } from "@/lib/constants";

// Rreshti i dyte i navigimit (nen header-in kryesor), i pranishem ne çdo
// ekran te Thrifted-dizajni.pptx. Deck-u origjinal (thriftalflows.md) sugjeron
// mega-menu dy-nivelesh (gjini > lloj artikulli), por fusha `category` e
// backend-it eshte nje enum i sheshte (womens/mens/shoes/bags/accessories/kids)
// - pa nivel gjinie te ndare. Kater prej gjashte vlerave jane tashme
// gjini-specifike (Rroba femra/meshkuj/femije), kesisoj rreshti perdor
// direkt CATEGORIES ekzistuese si tabe te sheshta, jo mega-menu fiktiv mbi
// te dhena qe s'ekzistojne.
export function CategoryNav() {
  return (
    <nav
      aria-label="Kategoritë"
      className="border-b border-border bg-surface"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 sm:px-6">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.value}
            to="/search"
            search={{ category: cat.value }}
            className="shrink-0 whitespace-nowrap px-3 py-2.5 text-sm text-textSecondary transition-colors hover:text-primary [&.active]:text-primary"
            activeOptions={{ includeSearch: true }}
          >
            {cat.label}
          </Link>
        ))}
        <Link
          to="/about"
          className="ml-auto hidden shrink-0 whitespace-nowrap px-3 py-2.5 text-sm text-textSecondary transition-colors hover:text-primary sm:inline-block"
        >
          Rreth Nesh
        </Link>
      </div>
    </nav>
  );
}
