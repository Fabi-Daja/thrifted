import { forwardRef, useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const fieldBase =
  "w-full rounded border border-border bg-surface px-3 py-2.5 text-sm text-textPrimary placeholder:text-textSecondary/70 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id ?? generatedId
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-textPrimary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          className={cn(fieldBase, error && "border-danger focus:border-danger focus:ring-danger/20", className)}
          {...props}
        />
        {error ? (
          <p className="text-xs text-danger">{error}</p>
        ) : hint ? (
          <p className="text-xs text-textSecondary">{hint}</p>
        ) : null}
      </div>
    )
  },
)
TextInput.displayName = "TextInput"

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id ?? generatedId
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-textPrimary">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(fieldBase, "min-h-24 resize-y", error && "border-danger", className)}
          {...props}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    )
  },
)
TextArea.displayName = "TextArea"
