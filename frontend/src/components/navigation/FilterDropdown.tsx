import { useState } from "react"
import { SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/forms/Button"
import { SelectDropdown } from "@/components/forms/SelectDropdown"
import { PriceRangeInput } from "@/components/forms/PriceRangeInput"
import { Modal } from "@/components/feedback/Modal"
import { CATEGORIES, CONDITION_OPTIONS, SIZES } from "@/lib/constants"
import type { ProductFilters } from "@/types"

interface FilterDropdownProps {
  filters: ProductFilters
  onApply: (filters: ProductFilters) => void
}

export function FilterDropdown({ filters, onApply }: FilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<ProductFilters>(filters)

  const activeCount = [
    filters.category,
    filters.brand,
    filters.size,
    filters.condition_rating,
    filters.price_min,
    filters.price_max,
  ].filter((v) => v !== undefined && v !== "").length

  const handleOpen = () => {
    setDraft(filters)
    setOpen(true)
  }

  const apply = () => {
    onApply(draft)
    setOpen(false)
  }

  const reset = () => {
    const cleared: ProductFilters = { q: filters.q, sort: filters.sort }
    setDraft(cleared)
    onApply(cleared)
    setOpen(false)
  }

  return (
    <>
      <Button variant="outline" onClick={handleOpen} className="gap-2">
        <SlidersHorizontal className="size-4" />
        Filtra
        {activeCount > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs text-surface">
            {activeCount}
          </span>
        )}
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Filtra" size="md">
        <div className="flex flex-col gap-4">
          <SelectDropdown
            label="Kategoria"
            placeholder="Të gjitha"
            options={CATEGORIES}
            value={draft.category ?? ""}
            onChange={(e) => setDraft({ ...draft, category: e.target.value || undefined })}
          />
          <SelectDropdown
            label="Masa"
            placeholder="Të gjitha"
            options={SIZES}
            value={draft.size ?? ""}
            onChange={(e) => setDraft({ ...draft, size: e.target.value || undefined })}
          />
          <SelectDropdown
            label="Gjendja"
            options={CONDITION_OPTIONS}
            value={draft.condition_rating ? String(draft.condition_rating) : ""}
            onChange={(e) =>
              setDraft({
                ...draft,
                condition_rating: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
          <PriceRangeInput
            min={draft.price_min}
            max={draft.price_max}
            onChange={({ min, max }) => setDraft({ ...draft, price_min: min, price_max: max })}
          />
        </div>
        <div className="mt-6 flex justify-between gap-3">
          <Button variant="ghost" onClick={reset}>
            Pastro
          </Button>
          <Button onClick={apply}>Apliko filtrat</Button>
        </div>
      </Modal>
    </>
  )
}
