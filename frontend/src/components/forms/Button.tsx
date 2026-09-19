import { forwardRef, type ButtonHTMLAttributes } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger"
type Size = "sm" | "md" | "lg"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

// Sistemi Classical: aksenti perdoret si vije + tekst, jo si mbushje e
// plote - asnje buton ne dizajn (Thrifted-dizajni.pptx) s'ka sfond te
// mbushur me ngjyre. "secondary" mbetet i vetmi variant i mbushur, per
// raste te rralla kur duhet peshe maksimale vizuale.
const variants: Record<Variant, string> = {
  primary:
    "border border-primary text-primary bg-transparent hover:border-primary-hover hover:text-primary-hover hover:bg-primary/5",
  secondary: "bg-textPrimary text-surface hover:bg-textPrimary/90",
  outline: "border border-border bg-surface text-textPrimary hover:border-primary hover:text-primary",
  ghost: "text-textPrimary hover:bg-background",
  danger: "border border-danger text-danger bg-transparent hover:bg-danger/5",
}

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", loading, fullWidth, className, children, disabled, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {children}
      </button>
    )
  },
)
Button.displayName = "Button"
