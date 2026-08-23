from pydantic import BaseModel, Field


class EstimatePriceRequest(BaseModel):
    category: str = Field(..., description="Kategoria e artikullit (p.sh. 'xhinse', 'kepuce').")
    brand: str | None = None
    condition_rating: int | None = Field(None, ge=1, le=5)


class EstimatePriceResponse(BaseModel):
    """Kontrata (input/output) mbetet e njejte mes Fazes A (comps-based, aktuale)
    dhe Fazes B (regression mbi Orders reale, planifikuar) - shih §5.4 te
    docs/faza/faza-5-ai-features.md. `price_min`/`price_max` jane None kur s'ka
    mjaftueshem shpallje te ngjashme per nje vleresim te bazuar ne te dhena."""
    price_min: float | None
    price_max: float | None
    confidence_score: str
    sample_size: int
    note: str
