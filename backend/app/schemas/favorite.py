from pydantic import BaseModel
from datetime import datetime
from app.schemas.product import ProductResponse


class FavoriteResponse(BaseModel):
    product: ProductResponse
    added_at: datetime

    class Config:
        from_attributes = True