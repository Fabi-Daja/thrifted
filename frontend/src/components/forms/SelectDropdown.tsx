import { forwardRef, useId, type SelectHTMLAttributes } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SelectOption {
  label: string
  value: string
}

interface SelectDropdownProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

export const SelectDropdown = forwardRef<HTMLSelectElement, SelectDropdownProps>(
  ({ label, error, options, placeholder, className, id, ...props }, ref) => {
    const generatedId = useId()
    const selectId = id ?? generatedId
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-textPrimary">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "w-full appearance-none rounded border border-border bg-surface px-3 py-2.5 pr-9 text-sm text-textPrimary transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
              error && "border-danger",
              className,
            )}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-textSecondary" />
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    )
  },
)
SelectDropdown.displayName = "SelectDropdown"
