import { useState, type FormEvent } from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchBarProps {
  defaultValue?: string
  onSearch: (query: string) => void
  placeholder?: string
  className?: string
}

export function SearchBar({
  defaultValue = "",
  onSearch,
  placeholder = "Kërko produkte, marka…",
  className,
}: SearchBarProps) {
  const [value, setValue] = useState(defaultValue)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (e.nativeEvent instanceof KeyboardEvent && e.nativeEvent.isComposing) return
    onSearch(value.trim())
  }

  return (
    <form onSubmit={handleSubmit} className={cn("relative flex-1", className)} role="search">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-textSecondary" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Kërko"
        className="h-11 w-full rounded border border-border bg-surface pl-9 pr-3 text-sm text-textPrimary placeholder:text-textSecondary/70 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </form>
  )
}
