import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

function pageRange(current: number, total: number): (number | "…")[] {
  const pages: (number | "…")[] = []
  const push = (n: number | "…") => pages.push(n)
  const window = 1

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - window && i <= current + window)) {
      push(i)
    } else if (pages[pages.length - 1] !== "…") {
      push("…")
    }
  }
  return pages
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null
  const pages = pageRange(page, totalPages)

  return (
    <nav className="flex items-center justify-center gap-1.5" aria-label="Faqet">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Faqja e mëparshme"
        className="flex size-9 items-center justify-center rounded border border-border bg-surface text-textPrimary transition-colors hover:bg-background disabled:opacity-40"
      >
        <ChevronLeft className="size-4" />
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-2 text-textSecondary">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              "flex size-9 items-center justify-center rounded border text-sm font-medium transition-colors",
              p === page
                ? "border-primary bg-primary text-surface"
                : "border-border bg-surface text-textPrimary hover:bg-background",
            )}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Faqja tjetër"
        className="flex size-9 items-center justify-center rounded border border-border bg-surface text-textPrimary transition-colors hover:bg-background disabled:opacity-40"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  )
}
