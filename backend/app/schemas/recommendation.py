from pydantic import BaseModel


class RecommendationResult(BaseModel):
    id: str
    title: str | None = None
    price: float | None = None
    category: str | None = None
    brand: str | None = None
    condition_rating: int | None = None
    image_url: str | None = None
