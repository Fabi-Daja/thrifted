import { TextInput } from "./TextInput"

interface PriceRangeInputProps {
  min?: number
  max?: number
  onChange: (range: { min?: number; max?: number }) => void
}

export function PriceRangeInput({ min, max, onChange }: PriceRangeInputProps) {
  const parse = (v: string) => (v === "" ? undefined : Number(v))
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-textPrimary">Çmimi (€)</span>
      <div className="flex items-center gap-2">
        <TextInput
          type="number"
          min={0}
          placeholder="Min"
          value={min ?? ""}
          onChange={(e) => onChange({ min: parse(e.target.value), max })}
          aria-label="Çmimi minimal"
        />
        <span className="text-textSecondary">–</span>
        <TextInput
          type="number"
          min={0}
          placeholder="Max"
          value={max ?? ""}
          onChange={(e) => onChange({ min, max: parse(e.target.value) })}
          aria-label="Çmimi maksimal"
        />
      </div>
    </div>
  )
}
