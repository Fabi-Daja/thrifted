from pydantic import BaseModel


class ImageAnalysisResult(BaseModel):
    """Fushat e sugjeruara per formen 'Create Product' (US-50, §5.2). Te gjitha
    opsionale dhe TE MODIFIKUESHME nga useri - AI vetem parapopullon, s'garanton
    saktesi (vendim nga 00-dokumentacion-master.md). Kur foto eshte e paqarte ose
    ka me shume se nje artikull, fushat mbeten bosh (None) ne vend te nje hamendje
    te rrezikshme (kerkese eksplicite e checklist-it te 5.2)."""
    title: str | None = None
    category: str | None = None
    brand: str | None = None
    color: str | None = None
    condition_rating: int | None = None
    description: str | None = None
    price_suggestion_min: float | None = None
    price_suggestion_max: float | None = None
    confidence: str
    note: str
