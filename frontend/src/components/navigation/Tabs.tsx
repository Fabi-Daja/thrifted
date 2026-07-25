import { cn } from "@/lib/utils"

export interface TabItem {
  key: string
  label: string
  count?: number
}

interface TabsProps {
  tabs: TabItem[]
  active: string
  onChange: (key: string) => void
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={active === tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            "-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors",
            active === tab.key
              ? "border-primary text-primary"
              : "border-transparent text-textSecondary hover:text-textPrimary",
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 text-xs text-textSecondary">({tab.count})</span>
          )}
        </button>
      ))}
    </div>
  )
}
