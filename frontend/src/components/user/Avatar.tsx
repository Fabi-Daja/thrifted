import { cn } from "@/lib/utils"

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizeMap = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-base",
  xl: "size-20 text-xl",
}

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const initials =
    (name ?? "")
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-background font-medium text-textSecondary",
        sizeMap[size],
        className,
      )}
    >
      {src ? (
        <img src={src || "/placeholder.svg"} alt={name ?? "Përdorues"} className="size-full object-cover" />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </div>
  )
}
