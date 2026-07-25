import type { SelectOption } from "@/components/forms/SelectDropdown"

export const CATEGORIES: SelectOption[] = [
  { label: "Rroba femra", value: "womens" },
  { label: "Rroba meshkuj", value: "mens" },
  { label: "Këpucë", value: "shoes" },
  { label: "Aksesorë", value: "accessories" },
  { label: "Çanta", value: "bags" },
  { label: "Fëmijë", value: "kids" },
]

export const SIZES: SelectOption[] = [
  { label: "XS", value: "XS" },
  { label: "S", value: "S" },
  { label: "M", value: "M" },
  { label: "L", value: "L" },
  { label: "XL", value: "XL" },
  { label: "XXL", value: "XXL" },
]

export const SORT_OPTIONS: SelectOption[] = [
  { label: "Më të rejat", value: "newest" },
  { label: "Çmimi: nga i ulëti", value: "price_asc" },
  { label: "Çmimi: nga i larti", value: "price_desc" },
]

export const CONDITION_OPTIONS: SelectOption[] = [
  { label: "Të gjitha", value: "" },
  { label: "5 - Si i ri", value: "5" },
  { label: "4 - Shumë i mirë", value: "4" },
  { label: "3 - I mirë", value: "3" },
  { label: "2 - Pranueshëm", value: "2" },
  { label: "1 - I përdorur", value: "1" },
]

export const SELLING_TYPE_OPTIONS: SelectOption[] = [
  { label: "Çmim fiks", value: "fixed_price" },
  { label: "Vetëm oferta", value: "offers_only" },
  { label: "Çmim fiks ose ofertë", value: "fixed_price_offers" },
]

export const PAGE_SIZE = 12
