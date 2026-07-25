import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat("sq-AL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.round(diffMs / 60000)
  const diffHours = Math.round(diffMs / 3600000)
  const diffDays = Math.round(diffMs / 86400000)

  if (diffMin < 1) return "tani"
  if (diffMin < 60) return `${diffMin} min më parë`
  if (diffHours < 24) return `${diffHours} orë më parë`
  if (diffDays < 30) return `${diffDays} ditë më parë`

  return date.toLocaleDateString("sq-AL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}
