from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from decimal import Decimal

from app.schemas.product import ProductResponse


class OrderRead(BaseModel):
    id: UUID
    product_id: UUID
    buyer_id: UUID
    seller_id: UUID
    final_price: Decimal
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class OrderCounterparty(BaseModel):
    """Pala tjetër e porosisë: shitësi (te blerjet e mia) ose blerësi (te shitjet e mia)."""
    id: UUID
    username: str
    full_name: str | None = None
    profile_photo_url: str | None = None

    class Config:
        from_attributes = True


class OrderDetailResponse(BaseModel):
    id: UUID
    final_price: Decimal
    status: str
    created_at: datetime
    product: ProductResponse
    counterparty: OrderCounterparty
    has_review: bool = False

    class Config:
        from_attributes = True